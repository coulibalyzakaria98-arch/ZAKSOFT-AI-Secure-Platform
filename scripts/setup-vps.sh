#!/bin/bash
# ZAKSOFT AI Secure Platform — VPS Setup (Ubuntu 22.04)
# Run as root: bash setup-vps.sh
set -e

REPO_URL="https://github.com/VOTRE_COMPTE/zaksoft-ai-secure-platform.git"
APP_DIR="/opt/zaksoft"

echo "=== ZAKSOFT VPS Setup ==="

# ── System update ──────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── Docker ────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker $SUDO_USER
fi

# ── Git ───────────────────────────────────────────────────────
apt-get install -y git

# ── Clone repo ────────────────────────────────────────────────
if [ -d "$APP_DIR" ]; then
  echo "$APP_DIR already exists — pulling latest..."
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

# ── Environment file ──────────────────────────────────────────
if [ ! -f "$APP_DIR/.env.prod" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env.prod"
  echo ""
  echo "⚠️  Edit $APP_DIR/.env.prod and set your passwords + API keys"
  echo "   Then run: cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d --build"
  echo ""
fi

# ── Firewall ─────────────────────────────────────────────────
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Nginx + Certbot (for HTTPS) ───────────────────────────────
apt-get install -y nginx certbot python3-certbot-nginx

echo ""
echo "✅ Setup complete!"
echo "Next:"
echo "  1. nano $APP_DIR/.env.prod"
echo "  2. cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d --build"
echo "  3. certbot --nginx -d yourdomain.com  (after pointing DNS)"
