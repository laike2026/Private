#!/usr/bin/env bash
# Enable scheduled server-side pulls without storing GitHub credentials.
set -euo pipefail
[[ "$(id -u)" == 0 ]] || { echo 'Run as root.' >&2; exit 1; }
[[ -f /srv/jinpinhui/site/.jinpinhui-managed ]]
for tool in curl tar node systemctl flock; do command -v "$tool" >/dev/null; done
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
for suffix in service timer; do
  file="/etc/systemd/system/jinpinhui-sync.$suffix"
  if [[ -e "$file" ]] && ! grep -q '^Description=Jinpin Hui GitHub sync' "$file"; then
    echo "Existing unit $file belongs to another service." >&2; exit 1
  fi
done
install -d -m 755 /usr/local/lib/jinpinhui
install -m 700 "$script_dir/sync-github.sh" /usr/local/lib/jinpinhui/sync-github.sh
cat > /etc/systemd/system/jinpinhui-sync.service <<'UNIT'
[Unit]
Description=Jinpin Hui GitHub sync
After=network-online.target
Wants=network-online.target
[Service]
Type=oneshot
ExecStart=/bin/bash /usr/local/lib/jinpinhui/sync-github.sh
TimeoutStartSec=300
UNIT
cat > /etc/systemd/system/jinpinhui-sync.timer <<'UNIT'
[Unit]
Description=Jinpin Hui GitHub sync timer
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Unit=jinpinhui-sync.service
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl start jinpinhui-sync.service
systemctl enable --now jinpinhui-sync.timer
systemctl is-active jinpinhui-sync.timer
