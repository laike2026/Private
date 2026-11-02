#!/usr/bin/env bash
# Update only this managed site from the public GitHub repository.
set -euo pipefail
[[ "$(id -u)" == 0 ]] || { echo 'Run as root.' >&2; exit 1; }
site='/srv/jinpinhui/site'
service='jinpinhui-site'
[[ -f "$site/.jinpinhui-managed" ]] || { echo 'Managed site is not installed.' >&2; exit 1; }
grep -q '^Description=Jinpin Hui website$' /etc/systemd/system/jinpinhui-site.service
exec 9>/run/jinpinhui-sync.lock
flock -n 9 || exit 0
temporary_dir="$(mktemp -d)"
trap 'rm -rf -- "$temporary_dir"' EXIT
curl -fsSL --connect-timeout 15 --max-time 60 --retry 2 \
  https://api.github.com/repos/laike2026/Private/commits/main -o "$temporary_dir/commit.json"
revision="$(node -e 'const fs=require("fs");const s=JSON.parse(fs.readFileSync(process.argv[1],"utf8")).sha;if(!/^[a-f0-9]{40}$/.test(s))process.exit(1);process.stdout.write(s)' "$temporary_dir/commit.json")"
[[ ! -f "$site/.github-revision" || "$(cat "$site/.github-revision")" != "$revision" ]] || exit 0
curl -fsSL --connect-timeout 15 --max-time 180 --retry 2 \
  "https://codeload.github.com/laike2026/Private/tar.gz/$revision" -o "$temporary_dir/source.tar.gz"
tar -xzf "$temporary_dir/source.tar.gz" -C "$temporary_dir"
source_dir="$temporary_dir/Private-$revision"
[[ -f "$source_dir/server.mjs" && -d "$source_dir/public" ]]
node --check "$source_dir/server.mjs"
backup="/srv/jinpinhui/backups/$(date -u +%Y%m%dT%H%M%SZ)-$revision"
install -d -m 700 /srv/jinpinhui/backups "$backup"
cp -a "$site/server.mjs" "$site/public" "$backup/"
cp -a "$site/data" "$backup/data"
rollback() {
  cp -a "$backup/server.mjs" "$site/server.mjs"
  cp -a "$backup/public/." "$site/public/"
  chown -R jinpinhui:jinpinhui "$site/public" "$site/server.mjs"
  systemctl restart "$service" || true
  echo "Update failed; restored source from $backup" >&2
}
trap 'rollback' ERR
install -m 644 "$source_dir/server.mjs" "$site/server.mjs"
cp -a "$source_dir/public/." "$site/public/"
chown -R jinpinhui:jinpinhui "$site/public" "$site/server.mjs"
systemctl restart "$service"
healthy=false
for attempt in 1 2 3 4 5; do
  if curl -fsS --max-time 5 http://127.0.0.1:4173/ -o /dev/null; then healthy=true; break; fi
  sleep 2
done
[[ "$healthy" == true ]]
printf '%s\n' "$revision" > "$site/.github-revision"
trap - ERR
echo "Deployed GitHub revision $revision; backup: $backup"
