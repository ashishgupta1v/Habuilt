import sys
import json
from playwright.sync_api import sync_playwright

def verify_live_domain():
    print("Testing live Habuilt production domain: https://habuilt.com/ ...")
    ashish_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
            localStorage.setItem('habuilt_active_protocol_id_01JQ7M2X4V8K3P6R9T1W5Y7ZAB', 'archetype-ashish');
            localStorage.setItem('habuilt_active_protocol_id_ashish', 'archetype-ashish');
        """)

        response = page.goto("https://habuilt.com/", wait_until="domcontentloaded", timeout=25000)
        print(f"HTTP Status: {response.status}")
        assert response.status == 200, f"Expected 200, got {response.status}"

        page.wait_for_selector(".dashboard-flow", timeout=15000)
        page.wait_for_timeout(2000)

        title = page.title()
        print(f"Page Title: {title}")
        assert "Habuilt" in title, f"Title does not contain Habuilt: {title}"

        names = page.locator(".habit-grid__name").all_text_contents()
        print(f"Habit cards rendered: {len(names)}")
        print(f"Top 3 habits: {[n.strip() for n in names[:3]]}")

        content = page.content()
        assert "Fennel" in content, "Fennel seed water missing from DOM"
        assert "Surya Namaskar" in content, "Surya Namaskar missing from DOM"
        assert "Downward Dog" in content, "Downward Dog missing from DOM"
        print("PASS: Verified 3-Week Clinical Protocol on https://habuilt.com/!")

        page.screenshot(path="tests/screenshots/habuilt_live_ssl.png", full_page=False)
        print("Screenshot saved to tests/screenshots/habuilt_live_ssl.png")
        browser.close()

if __name__ == "__main__":
    verify_live_domain()
