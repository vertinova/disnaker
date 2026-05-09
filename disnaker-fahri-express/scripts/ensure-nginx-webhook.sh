#!/usr/bin/env bash
set -euo pipefail

SITE_NAME="${NGINX_SITE:-disnaker.vertinova.id}"
WEBHOOK_UPSTREAM="${WEBHOOK_UPSTREAM:-http://127.0.0.1:9000}"
CONFIG_FILE="${NGINX_CONFIG_FILE:-}"

if [[ -z "$CONFIG_FILE" ]]; then
  for candidate in \
    "/etc/nginx/sites-available/${SITE_NAME}" \
    "/etc/nginx/sites-available/${SITE_NAME}.conf"
  do
    if [[ -f "$candidate" ]]; then
      CONFIG_FILE="$candidate"
      break
    fi
  done
fi

if [[ -z "$CONFIG_FILE" ]]; then
  CONFIG_FILE="/etc/nginx/sites-available/${SITE_NAME}"
  cp -f nginx-disnaker.conf "$CONFIG_FILE"
  ln -sfn "$CONFIG_FILE" "/etc/nginx/sites-enabled/${SITE_NAME}"
  echo "Installed new Nginx site at ${CONFIG_FILE}"
  exit 0
fi

if grep -Eq 'location[[:space:]]+/webhook' "$CONFIG_FILE"; then
  backup="${CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
  tmp="$(mktemp)"
  cp "$CONFIG_FILE" "$backup"

  block=$(cat <<EOF
    location /webhook {
        proxy_pass ${WEBHOOK_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

EOF
)

  awk -v block="$block" '
    BEGIN { in_block = 0; depth = 0; replaced = 0 }
    !replaced && $0 ~ /^[[:space:]]*location[[:space:]]+\/webhook[[:space:]]*\{/ {
      printf "%s", block
      in_block = 1
      opens = gsub(/\{/, "{")
      closes = gsub(/\}/, "}")
      depth = opens - closes
      if (depth <= 0) {
        in_block = 0
        replaced = 1
      }
      next
    }
    in_block {
      opens = gsub(/\{/, "{")
      closes = gsub(/\}/, "}")
      depth += opens - closes
      if (depth <= 0) {
        in_block = 0
        replaced = 1
      }
      next
    }
    { print }
    END {
      if (!replaced) {
        exit 2
      }
    }
  ' "$CONFIG_FILE" > "$tmp"

  mv "$tmp" "$CONFIG_FILE"
  echo "Updated webhook route in ${CONFIG_FILE}; backup: ${backup}"
  exit 0
fi

backup="${CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
tmp="$(mktemp)"
cp "$CONFIG_FILE" "$backup"

block=$(cat <<EOF
    location /webhook {
        proxy_pass ${WEBHOOK_UPSTREAM};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

EOF
)

awk -v block="$block" '
  BEGIN { inserted = 0 }
  !inserted && $0 ~ /^[[:space:]]*location[[:space:]]+\/[[:space:]]*\{/ {
    printf "%s", block
    inserted = 1
  }
  { print }
  END {
    if (!inserted) {
      exit 2
    }
  }
' "$CONFIG_FILE" > "$tmp"

mv "$tmp" "$CONFIG_FILE"
echo "Inserted webhook route into ${CONFIG_FILE}; backup: ${backup}"
