#!/usr/bin/env bash
# Build home-next and publish it to .65 as the static site of hoandat.com, by hand
# (every push to main also deploys through .github/workflows/deploy.yml).
#
#   SSH_TARGET=<host alias> [SSH_OPTS="-F ssh_config"] bash infra/deploy.sh
#
# Steps: gates + build locally; rsync infra/ (nginx file and the root scripts)
# to /var/www/hoandat-home/infra and the build to ci-incoming/<release-id>;
# install the nginx file when it changed (nginx -t before reload, the previous
# file kept as .prev); refresh the root-owned activate command the CI user
# runs; then switch with infra/activate-incoming.sh, the same switch CI uses
# (origin check, previous build restored on failure). The previous dist/ is
# kept as dist.prev for rollback:
#   ssh <target> 'cd /var/www/hoandat-home && rm -rf dist && mv dist.prev dist'
set -euo pipefail

: "${SSH_TARGET:?set SSH_TARGET to the ssh host alias of .65}"
read -r -a ssh_opts <<<"${SSH_OPTS:-}"
remote_dir=/var/www/hoandat-home
conf=/etc/nginx/conf.d/hoandat.com.conf

cd "$(dirname "$0")/.."

pnpm lint
pnpm typecheck
pnpm test
pnpm build

release_id="$(date -u +%Y%m%d-%H%M%S)-$(git rev-parse --short=12 HEAD)"
ssh "${ssh_opts[@]}" "$SSH_TARGET" "mkdir -p $remote_dir/ci-incoming/$release_id $remote_dir/infra" </dev/null
rsync -rlz --delete -e "ssh ${ssh_opts[*]}" dist/ "$SSH_TARGET:$remote_dir/ci-incoming/$release_id/"
rsync -rlz -e "ssh ${ssh_opts[*]}" infra/nginx infra/activate-incoming.sh infra/setup-deploy-user.sh "$SSH_TARGET:$remote_dir/infra/"

ssh "${ssh_opts[@]}" "$SSH_TARGET" bash -s <<EOF
set -euo pipefail
cd $remote_dir
chown -R root:root infra
install -m 755 -o root -g root infra/activate-incoming.sh /usr/local/sbin/hoandat-home-activate-incoming

if ! cmp -s infra/nginx/hoandat.com.conf $conf; then
	if [ -f $conf ]; then cp $conf $conf.prev; fi
	cp infra/nginx/hoandat.com.conf $conf
	if ! nginx -t; then
		if [ -f $conf.prev ]; then mv $conf.prev $conf; else rm -f $conf; fi
		echo "nginx -t failed: config restored, nothing reloaded" >&2
		exit 1
	fi
	systemctl reload nginx
	echo "nginx config installed and reloaded"
fi

bash infra/activate-incoming.sh $release_id
EOF
