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
    page.goto('http://localhost:4173/', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # 1. Today Dark Mode
    page.screenshot(path='tests/screenshots/audit_v3_today_dark.png')
    print('Today Dark screenshot taken')

    # 2. Stats Light Mode (matching user screenshot 2)
    stats_nav = page.locator(".mobile-bottom-nav__item:has-text('Stats')").first
    stats_nav.click()
    page.wait_for_timeout(500)
    
    # Toggle Light Mode
    tools_btn = page.locator(".mcb-btn--tools").first
    tools_btn.click()
    page.wait_for_timeout(300)
    
    light_btn = page.locator(".mcb-tool-item:has-text('Light Mode')").first
    if light_btn.count() > 0:
        light_btn.click()
        page.wait_for_timeout(500)

    page.screenshot(path='tests/screenshots/audit_v3_stats_light.png')
    print('Stats Light screenshot taken')

    browser.close()
