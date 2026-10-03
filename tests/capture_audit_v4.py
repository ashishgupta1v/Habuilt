from playwright.sync_api import sync_playwright
import json
import os

os.makedirs('tests/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=3,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()
    ashish_user = {'id': 'ashish', 'email': 'ashishgupta1v@gmail.com', 'user_metadata': {'full_name': 'Ashish Gupta'}}
    page.add_init_script(f"""
        localStorage.setItem('habuilt_guest_mode', 'true');
        localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
    """)
    page.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 1. Today Dark Mode
    page.screenshot(path='tests/screenshots/audit_v4_today_dark.png')
    print('1. Today Dark screenshot taken')

    # 2. Stats Dark Mode
    stats_nav = page.locator(".mobile-bottom-nav__item:has-text('Stats')").first
    stats_nav.click()
    page.wait_for_timeout(500)
    page.screenshot(path='tests/screenshots/audit_v4_stats_dark.png')
    print('2. Stats Dark screenshot taken')

    # 3. Toggle to Light Mode via Tools bottom sheet
    tools_btn = page.locator(".mcb-btn--tools").first
    tools_btn.click()
    page.wait_for_timeout(300)
    
    light_btn = page.locator(".mcb-tool-item:has-text('Light Mode')").first
    if light_btn.count() > 0:
        light_btn.click()
        page.wait_for_timeout(500)

    # 4. Stats Light Mode
    page.screenshot(path='tests/screenshots/audit_v4_stats_light.png')
    print('3. Stats Light screenshot taken')

    # 5. Today Light Mode
    today_nav = page.locator(".mobile-bottom-nav__item:has-text('Today')").first
    today_nav.click()
    page.wait_for_timeout(500)
    page.screenshot(path='tests/screenshots/audit_v4_today_light.png')
    print('4. Today Light screenshot taken')

    browser.close()
