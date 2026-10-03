from playwright.sync_api import sync_playwright
import json
import os

os.makedirs('tests/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=2,
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

    # 1. Today Tab
    page.screenshot(path='tests/screenshots/audit_v2_today.png')
    print('Today screenshot taken')

    # 2. Focus Tab
    focus_nav = page.locator(".mobile-bottom-nav__item:has-text('Focus')").first
    focus_nav.click()
    page.wait_for_timeout(500)
    page.screenshot(path='tests/screenshots/audit_v2_focus.png')
    print('Focus screenshot taken')

    # 3. Stats Tab
    stats_nav = page.locator(".mobile-bottom-nav__item:has-text('Stats')").first
    stats_nav.click()
    page.wait_for_timeout(500)
    page.screenshot(path='tests/screenshots/audit_v2_stats.png')
    print('Stats screenshot taken')

    # 4. Rewards Tab
    rewards_nav = page.locator(".mobile-bottom-nav__item:has-text('Rewards')").first
    rewards_nav.click()
    page.wait_for_timeout(500)
    page.screenshot(path='tests/screenshots/audit_v2_rewards.png')
    print('Rewards screenshot taken')

    browser.close()
