from playwright.sync_api import sync_playwright
import json
import os

os.makedirs('tests/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Compact mobile viewport (height 520)
    context = browser.new_context(
        viewport={'width': 390, 'height': 520},
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
    page.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    page.wait_for_timeout(1000)

    # Open Quick Actions
    tools_btn = page.locator(".mcb-btn--tools").first
    tools_btn.click()
    page.wait_for_timeout(500)

    sheet = page.locator('.mcb-tools-sheet').first
    metrics_before = sheet.evaluate("el => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop })")
    print(f'Compact Viewport Metrics Before Scroll: {metrics_before}')
    assert metrics_before['scrollHeight'] > metrics_before['clientHeight'], "Sheet must be scrollable on compact screen!"

    # Scroll down to bottom
    sheet.evaluate("el => el.scrollTop = el.scrollHeight")
    page.wait_for_timeout(500)

    metrics_after = sheet.evaluate("el => ({ scrollHeight: el.scrollHeight, clientHeight: el.clientHeight, scrollTop: el.scrollTop })")
    print(f'Compact Viewport Metrics After Scroll: {metrics_after}')
    assert metrics_after['scrollTop'] > 0, "Sheet did not scroll down!"

    page.screenshot(path='tests/screenshots/audit_tools_sheet_compact_scrolled.png')
    print('Compact screen scrolled screenshot captured!')

    browser.close()
