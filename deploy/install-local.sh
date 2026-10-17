#!/usr/bin/env bash
# Install or update the site on a Tencent Cloud Linux CVM without changing Nginx.
# The site listens only on 127.0.0.1:4173 until a domain and reverse proxy are set.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo 'Please run this script as root.' >&2
  exit 1
fi

for tool in curl tar node systemctl useradd; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required command: $tool. No site files were changed." >&2
    exit 1
  fi
done

node_major="$(node -p "Number(process.versions.node.split('.')[0])")"
if [[ "$node_major" -lt 20 ]]; then
  echo "Node.js 20 or newer is required; found $(node --version). No site files were changed." >&2
  exit 1
fi

site_dir='/srv/jinpinhui/site'
unit_path='/etc/systemd/system/jinpinhui-site.service'
service_name='jinpinhui-site'
if [[ -d "$site_dir" && ! -f "$site_dir/.jinpinhui-managed" ]]; then
  if [[ -n "$(ls -A "$site_dir" 2>/dev/null)" ]]; then
    echo "The target directory $site_dir already contains another site. Stopping." >&2
    exit 1
  fi
fi
if [[ -e "$unit_path" ]] && ! grep -q '^Description=Jinpin Hui website$' "$unit_path"; then
  echo "The service name $service_name is already used by another app. Stopping." >&2
  exit 1
fi
if ! systemctl is-active --quiet "$service_name" && command -v ss >/dev/null 2>&1; then
  if ss -H -ltn '( sport = :4173 )' | grep -q .; then
    echo 'Port 4173 is already used by another service. Stopping.' >&2
    exit 1
  fi
fi

temporary_dir="$(mktemp -d)"
trap 'rm -rf -- "$temporary_dir"' EXIT
curl --fail --silent --show-error --location --retry 3 \
  'https://codeload.github.com/laike2026/Private/tar.gz/refs/heads/main' \
  --output "$temporary_dir/site.tar.gz"
tar -xzf "$temporary_dir/site.tar.gz" -C "$temporary_dir"
source_dir="$temporary_dir/Private-main"
if [[ ! -f "$source_dir/server.mjs" || ! -f "$source_dir/data/content.json" ]]; then
  echo 'Downloaded source is incomplete. No site files were changed.' >&2
  exit 1
fi

if ! id -u jinpinhui >/dev/null 2>&1; then
  useradd --system --shell /bin/false --home-dir /srv/jinpinhui jinpinhui
fi
mkdir -p "$site_dir/public" "$site_dir/deploy" "$site_dir/data"
install -m 644 "$source_dir/server.mjs" "$source_dir/package.json" \
  "$source_dir/README.md" "$source_dir/.gitignore" "$site_dir/"
cp -a "$source_dir/public/." "$site_dir/public/"
cp -a "$source_dir/deploy/." "$site_dir/deploy/"
if [[ ! -e "$site_dir/data/content.json" ]]; then
  install -m 644 "$source_dir/data/content.json" "$site_dir/data/content.json"
fi
touch "$site_dir/.jinpinhui-managed"
chown -R jinpinhui:jinpinhui "$site_dir"

node_path="$(command -v node)"
cat > "$unit_path" <<UNIT
[Unit]
Description=Jinpin Hui website
After=network.target

[Service]
Type=simple
User=jinpinhui
Group=jinpinhui
WorkingDirectory=$site_dir
Environment=HOST=127.0.0.1
Environment=PORT=4173
Environment=SITE_URL=http://127.0.0.1:4173
ExecStart=$node_path $site_dir/server.mjs
Restart=always
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
ReadWritePaths=$site_dir/data

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable "$service_name" >/dev/null
if ! systemctl restart "$service_name"; then
  journalctl -u "$service_name" -n 40 --no-pager >&2 || true
  exit 1
fi
sleep 2
status="$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:4173/ || true)"
if [[ "$status" != '200' ]]; then
  echo "The service started but its homepage returned HTTP $status." >&2
  journalctl -u "$service_name" -n 40 --no-pager >&2 || true
  exit 1
fi

echo 'Jinpin Hui website installed successfully.'
echo 'Local check: HTTP 200 at http://127.0.0.1:4173/'
echo 'The website is not exposed to the internet. Existing Nginx sites were not changed.'
