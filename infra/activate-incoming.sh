#!/bin/bash
# Switches hoandat.com to an uploaded build. Root-owned; installed as
# /usr/local/sbin/hoandat-home-activate-incoming by setup-deploy-user.sh (and
# refreshed by every manual deploy.sh), and the only command the CI user
# `hoandat-home-deploy` may run through sudo.
#   hoandat-home-activate-incoming <release-id>
# The build waits in /var/www/hoandat-home/ci-incoming/<id> (writable by the
# deploy user). It is moved out of the deploy user's reach before any check,
# must hold only plain files and directories with an index.html, then
# replaces dist/ (the previous one kept as dist.prev). The site is checked
# through the origin; on failure dist.prev comes back and the script exits 1.
# nginx is never touched here: its config changes only through deploy.sh.
set -euo pipefail
ROOT=/var/www/hoandat-home
ID="${1:?usage: hoandat-home-activate-incoming <release-id>}"
[[ "$ID" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{12}$ ]] || { echo "bad release id" >&2; exit 2; }
SRC="$ROOT/ci-incoming/$ID"
STAGE="$ROOT/staging"
[ -d "$SRC" ] && [ ! -L "$SRC" ] || { echo "incoming release $ID missing" >&2; exit 2; }

# Checks run only once the tree is root-owned in a root-only directory, so the
# deploy user cannot swap a checked file for a symlink in between.
install -d -m 700 -o root -g root "$STAGE"
rm -rf "${STAGE:?}/$ID"
mv "$SRC" "$STAGE/$ID"
chown -R root:root "$STAGE/$ID"
if [ -n "$(find "$STAGE/$ID" ! -type f ! -type d -print -quit)" ] || [ ! -f "$STAGE/$ID/index.html" ]; then
	rm -rf "${STAGE:?}/$ID"
	echo "incoming release $ID has links, special files or no index.html" >&2
	exit 2
fi
find "$STAGE/$ID" -type d -exec chmod 755 {} +
find "$STAGE/$ID" -type f -exec chmod 644 {} +
printf '%s\n' "$ID" >"$STAGE/$ID/RELEASE"

cd "$ROOT"
rm -rf dist.prev
if [ -d dist ]; then mv dist dist.prev; fi
mv "$STAGE/$ID" dist

check() {
	local code=""
	# Right after a switch nginx may still answer from a stale worker; give it a moment.
	for _ in 1 2 3 4 5; do
		code="$(curl -sk -o /dev/null -w '%{http_code}' --resolve hoandat.com:443:127.0.0.1 https://hoandat.com/)"
		[ "$code" = 200 ] && return 0
		sleep 1
	done
	echo "origin https://hoandat.com/ -> $code" >&2
	return 1
}

if ! check; then
	if [ -d dist.prev ]; then
		rm -rf dist
		mv dist.prev dist
		echo "release $ID failed the origin check: previous build restored" >&2
	fi
	exit 1
fi
echo "hoandat.com now serves $ID"
