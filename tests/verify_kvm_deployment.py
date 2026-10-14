import sys
import json
from playwright.sync_api import sync_playwright

def verify_kvm():
    ashish_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # Set active protocol preference
        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
            localStorage.setItem('habuilt_active_protocol_id_01JQ7M2X4V8K3P6R9T1W5Y7ZAB', 'archetype-ashish');
            localStorage.setItem('habuilt_active_protocol_id_ashish', 'archetype-ashish');
        """)

        page.goto("http://187.127.166.15/", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_selector(".dashboard-flow", timeout=15000)
        page.wait_for_timeout(2000)

        names = page.locator(".habit-grid__name").all_text_contents()
        print(f"Total habit cards displayed: {len(names)}")
        print(f"First 5 habits: {[n.strip() for n in names[:5]]}")

        content = page.content()
        assert "Fennel" in content, "Fennel seed water missing from DOM"
        assert "Surya Namaskar" in content, "Surya Namaskar missing from DOM"
        assert "Downward Dog" in content, "Downward Dog missing from DOM"
        assert "Sukha Kriya" in content, "Sukha Kriya missing from DOM"
        print("ALL 3-WEEK CLINICAL PROTOCOL HABITS CONFIRMED ON LIVE SERVER!")

        page.screenshot(path="tests/screenshots/hostinger_kvm_live.png", full_page=False)
        print("Screenshot saved to tests/screenshots/hostinger_kvm_live.png")
        browser.close()

if __name__ == "__main__":
    verify_kvm()
