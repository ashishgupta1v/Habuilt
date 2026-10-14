#!/usr/bin/env bash
set -e

# ==============================================================================
# Habuilt Server Deployment Script (Hostinger KVM 2 VPS)
# Target Directory: /var/www/Habuilt
# ==============================================================================

APP_DIR="/var/www/Habuilt"
BRANCH="${1:-HB-AG-01}"

echo "=========================================================="
echo " Starting Habuilt Zero-Downtime Deployment: [${BRANCH}]"
echo " Time: $(date)"
echo "=========================================================="

cd "${APP_DIR}"

# 1. Update Git Repository
echo "--> Fetching and checking out branch: ${BRANCH}..."
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git pull origin "${BRANCH}"

# 2. Environment Verification
if [ ! -f .env ]; then
    echo "--> .env not found, creating from .env.example..."
    cp .env.example .env
    php artisan key:generate --force
fi

# 3. Backend Dependencies
echo "--> Installing PHP composer dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction

# 4. Frontend Compilation
echo "--> Building frontend assets with Vite..."
npm ci --prefer-offline --no-audit
npm run build

# 5. Database Migrations (if DB configured)
echo "--> Running database migrations..."
php artisan migrate --force || echo "Warning: Migration skipped or failed (check DB credentials in .env)"

# 6. Optimize Caches
echo "--> Caching configuration, routes, and views..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

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

# 11. Health Check
echo "--> Running local HTTP health check on port 8005..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8005/ || echo "000")

echo "=========================================================="
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "302" ]; then
    echo " DEPLOYMENT SUCCESSFUL! HTTP Status: ${HTTP_STATUS}"
    echo " Live at: http://187.127.166.15:8005/"
else
    echo " Deployment completed. HTTP Status: ${HTTP_STATUS}"
fi
echo "=========================================================="
