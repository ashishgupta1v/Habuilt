#!/usr/bin/env bash
set -e

# ==============================================================================
# Habuilt Server Deployment Script (Hostinger KVM 2 VPS)
# Target Directory: /var/www/Habuilt
# ==============================================================================

APP_DIR="/var/www/Habuilt"
BRANCH="${1:-HB-AG-01}"
SENTRY_ARG="${2:-}"

echo "=========================================================="
echo " Starting Habuilt Zero-Downtime Deployment: [${BRANCH}]"
echo " Time: $(date)"
echo "=========================================================="

cd "${APP_DIR}"

# 1. Update Git Repository
echo "--> Fetching and checking out branch: ${BRANCH}..."
git fetch origin "${BRANCH}"
git checkout -B "${BRANCH}" "origin/${BRANCH}" || git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"
git pull origin "${BRANCH}"

# 2. Environment Verification
if [ ! -f .env ]; then
    echo "--> .env not found, creating from .env.example..."
    cp .env.example .env
    php artisan key:generate --force
fi

# Optional Sentry DSN Configuration
if [ -n "$SENTRY_ARG" ]; then
    echo "--> Configuring live Sentry DSN in .env..."
    if grep -q "^SENTRY_LARAVEL_DSN=" .env; then
        sed -i "s|^SENTRY_LARAVEL_DSN=.*|SENTRY_LARAVEL_DSN=${SENTRY_ARG}|" .env
    else
        echo "SENTRY_LARAVEL_DSN=${SENTRY_ARG}" >> .env
    fi
fi

# The browser bundle must not receive a DSN. The tunnel reads the server value.
if grep -q "^VITE_SENTRY_DSN=" .env; then
    sed -i "s|^VITE_SENTRY_DSN=.*|VITE_SENTRY_DSN=|" .env
fi

# 3. Backend Dependencies
echo "--> Installing PHP composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# 4. Frontend Compilation
echo "--> Building frontend assets with Vite..."
npm ci --prefer-offline --no-audit
npm run build

# 5. Confirm the application database, then migrate.
# The probe prints set/empty and whether it changed an override. It does not print a URL.
echo "--> Confirming the application database host..."
php scripts/confirm-app-database.php

echo "--> Running database migrations..."
php artisan migrate --force

# 6. Optimize Caches
echo "--> Caching configuration, routes, and views..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Apply ledger owner policies only when a separate ledger URL is configured.
# Keep the command output to status tokens so a URL cannot land in the deploy log.
ledger_line="$(grep -E '^HABUILT_LEDGER_DATABASE_URL=' .env | head -n 1 || true)"
ledger_value="${ledger_line#HABUILT_LEDGER_DATABASE_URL=}"
ledger_value="${ledger_value#\"}"
ledger_value="${ledger_value%\"}"
ledger_value="${ledger_value#\'}"
ledger_value="${ledger_value%\'}"
if [ -n "${ledger_value}" ]; then
    echo "ledger_url=set"
    php artisan habuilt:secure-ledger > /tmp/habuilt-ledger.out 2>&1 || true
    grep -E 'target=|collapsed_groups=|conflicting_groups=|unique_index=|rls=|ledger_error=' /tmp/habuilt-ledger.out || echo "ledger_error=unreadable"
    rm -f /tmp/habuilt-ledger.out
else
    echo "ledger_url=empty"
fi
unset ledger_line ledger_value

# 7. File Ownership & Permissions
echo "--> Setting permissions for storage and bootstrap/cache..."
chown -R www-data:www-data storage bootstrap/cache public/build
chmod -R 775 storage bootstrap/cache

# 8. Configure PHP-FPM Pool
echo "--> Verifying PHP-FPM 8.3 pool configuration..."
if [ -f "${APP_DIR}/deploy/php/habuilt.conf" ]; then
    cp "${APP_DIR}/deploy/php/habuilt.conf" /etc/php/8.3/fpm/pool.d/habuilt.conf
    systemctl restart php8.3-fpm
fi

# 9. Configure Nginx Virtual Host
echo "--> Verifying Nginx configuration..."
if [ -f "${APP_DIR}/deploy/nginx/habuilt.conf" ]; then
    mkdir -p /etc/nginx/snippets
    cp "${APP_DIR}/deploy/nginx/security-headers.conf" /etc/nginx/snippets/habuilt-security-headers.conf
    cp "${APP_DIR}/deploy/nginx/habuilt.conf" /etc/nginx/sites-available/habuilt
    if [ ! -f /etc/nginx/sites-enabled/habuilt ]; then
        ln -s /etc/nginx/sites-available/habuilt /etc/nginx/sites-enabled/habuilt
    fi
    nginx -t
    systemctl reload nginx
fi

# 10. Configure and Restart Systemd Workers
echo "--> Registering systemd queue worker and scheduler timer..."
if [ -f "${APP_DIR}/deploy/systemd/habuilt-queue.service" ]; then
    cp "${APP_DIR}/deploy/systemd/habuilt-queue.service" /etc/systemd/system/habuilt-queue.service
    cp "${APP_DIR}/deploy/systemd/habuilt-schedule.service" /etc/systemd/system/habuilt-schedule.service
    cp "${APP_DIR}/deploy/systemd/habuilt-schedule.timer" /etc/systemd/system/habuilt-schedule.timer

    systemctl daemon-reload
    systemctl enable habuilt-queue.service
    systemctl restart habuilt-queue.service
    systemctl enable --now habuilt-schedule.timer
fi

# 11. Smoke check. A missing token must not download an account.
echo "--> Running local smoke checks on port 8005..."
sleep 2
LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8005/ || echo "000")
EXPORT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8005/api/account-export || echo "000")
MISSING_FILE=$(mktemp)
MISSING_STATUS=$(curl -s -o "${MISSING_FILE}" -w "%{http_code}" http://127.0.0.1:8005/missing-habuilt-page || echo "000")
if grep -q "Stack trace" "${MISSING_FILE}"; then
    rm -f "${MISSING_FILE}"
    echo "Missing page leaked a stack trace"
    exit 1
fi
rm -f "${MISSING_FILE}"

echo "=========================================================="
echo " smoke landing=${LANDING_STATUS} export=${EXPORT_STATUS} missing=${MISSING_STATUS}"
if [ "$LANDING_STATUS" != "200" ] || [ "$EXPORT_STATUS" != "401" ]; then
    echo " Smoke check failed"
    exit 1
fi
echo " DEPLOYMENT SUCCESSFUL"
echo "=========================================================="
