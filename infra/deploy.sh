#!/usr/bin/env bash
# Build home-next and publish it to .65 as the static site of hoandat.com.
#
#   SSH_TARGET=<host alias> [SSH_OPTS="-F ssh_config"] bash infra/deploy.sh
#
# Steps: gates + build locally, rsync dist/ and the nginx file to
# /var/www/hoandat-home, install the nginx file when it changed (nginx -t
# before reload, the previous file kept as .prev), then check the site through
# the origin. The previous dist/ is kept as dist.prev for rollback:
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

ssh "${ssh_opts[@]}" "$SSH_TARGET" "mkdir -p $remote_dir/incoming $remote_dir/infra" </dev/null
rsync -rlz --delete -e "ssh ${ssh_opts[*]}" dist/ "$SSH_TARGET:$remote_dir/incoming/"
rsync -rlz -e "ssh ${ssh_opts[*]}" infra/nginx/ "$SSH_TARGET:$remote_dir/infra/nginx/"

ssh "${ssh_opts[@]}" "$SSH_TARGET" bash -s <<EOF
set -euo pipefail
cd $remote_dir
chown -R root:root incoming infra
find incoming -type d -exec chmod 755 {} +
find incoming -type f -exec chmod 644 {} +
rm -rf dist.prev
if [ -d dist ]; then mv dist dist.prev; fi
mv incoming dist

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

# Right after a reload the old workers can still answer (421); give them a moment.
for attempt in 1 2 3 4 5; do
	code=\$(curl -sk -o /dev/null -w '%{http_code}' --resolve hoandat.com:443:127.0.0.1 https://hoandat.com/)
	[ "\$code" = 200 ] && break
	sleep 1
done
echo "origin https://hoandat.com/ -> \$code"
[ "\$code" = 200 ]
EOF
