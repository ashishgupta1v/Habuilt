import os
import sys
import json
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"C:\Users\ashis\.gemini\antigravity-ide\brain\36eaa7a1-e32b-421a-94d0-3e5580d6e994"

test_user = {
    "id": "ashish",
    "email": "ashishgupta1v@gmail.com",
    "user_metadata": {"full_name": "Ashish Gupta"}
}

def run_step3_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)

        print("\n--- 1. Testing Desktop Today View - HUD & Cockpit (1440x900) ---")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(1000)

        # ZoetiCoach HUD metrics
        hud = page.locator(".zoeticoach-hud")
        assert hud.is_visible(), "ZoetiCoach HUD should be visible"
        hud_bbox = hud.bounding_box()
        print(f"ZoetiCoach HUD height: {hud_bbox['height']:.1f}px")

        # Check HUD header, metrics grid, nudge banner
        hud_header = page.locator(".hud-header")
        assert hud_header.is_visible(), "HUD header should be visible"
        header_bbox = hud_header.bounding_box()
        print(f"HUD Header height: {header_bbox['height']:.1f}px")

        # Warrior Intelligence Cockpit metrics (Collapsed state by default)
        cockpit = page.locator(".card--warrior-intelligence")
        assert cockpit.is_visible(), "Warrior Intelligence Cockpit should be visible"
        cockpit_bbox = cockpit.bounding_box()
        print(f"Warrior Intelligence Cockpit (collapsed) height: {cockpit_bbox['height']:.1f}px")

        # Test expand / collapse of Cockpit
        cockpit_header = page.locator(".warrior-ai-header")
        cockpit_header.click()
        page.wait_for_timeout(400)
        cockpit_expanded_bbox = cockpit.bounding_box()
        print(f"Warrior Intelligence Cockpit (expanded) height: {cockpit_expanded_bbox['height']:.1f}px")
        assert cockpit_expanded_bbox['height'] > cockpit_bbox['height'], "Cockpit should expand on click"

        # Collapse it back
        cockpit_header.click()
        page.wait_for_timeout(400)

        # Take screenshot
        desktop_shot = os.path.join(SCREENSHOT_DIR, "step3_hud_cockpit_desktop.png")
        page.screenshot(path=desktop_shot, full_page=False)
        print(f"Saved desktop screenshot to: {desktop_shot}")

        # Check Mobile View (375x812)
        print("\n--- 2. Testing Mobile View (375x812) ---")
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)

        hud_mobile_bbox = hud.bounding_box()
        print(f"Mobile ZoetiCoach HUD height: {hud_mobile_bbox['height']:.1f}px")

        mobile_shot = os.path.join(SCREENSHOT_DIR, "step3_hud_cockpit_mobile.png")
        page.screenshot(path=mobile_shot, full_page=False)
        print(f"Saved mobile screenshot to: {mobile_shot}")

        browser.close()
        print("\n[SUCCESS] Step 3 measurements and screenshot verification completed!")

if __name__ == "__main__":
    run_step3_verification()
