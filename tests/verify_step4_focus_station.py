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

def run_step4_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)

        print("\n--- 1. Testing Desktop Focus Station View (1440x900) ---")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(500)

        # Switch to Focus Station tab
        focus_tab_btn = page.locator(".hero-desktop-tab", has_text="Focus Station")
        focus_tab_btn.click()
        page.wait_for_timeout(500)

        station = page.locator(".card--focus-station")
        assert station.is_visible(), "DeepWorkStation should be visible"
        station_bbox = station.bounding_box()
        print(f"Focus Station Launcher Card: width={station_bbox['width']:.1f}px, height={station_bbox['height']:.1f}px, y={station_bbox['y']:.1f}px")

        # Test selecting a preset duration
        btn_50 = page.locator("#focus-dur-btn-50")
        assert btn_50.is_visible(), "50 min preset button should be visible"
        btn_50.click()
        page.wait_for_timeout(200)

        # Test selecting soundscape
        soundscape_binaural = page.locator(".focus-soundscape-card", has_text="40Hz Binaural")
        if soundscape_binaural.is_visible():
            soundscape_binaural.click()
            page.wait_for_timeout(200)

        # Save launcher state screenshot
        launcher_shot = os.path.join(SCREENSHOT_DIR, "step4_focus_launcher_desktop.png")
        page.screenshot(path=launcher_shot, full_page=False)
        print(f"Saved launcher desktop screenshot to: {launcher_shot}")

        # Test starting timer to measure Active Timer View
        start_btn = page.locator("#focus-btn-start")
        start_btn.click()
        page.wait_for_timeout(600)

        active_view = page.locator(".focus-station-active-view")
        assert active_view.is_visible(), "Active timer view should be visible"
        active_bbox = station.bounding_box()
        print(f"Focus Station Active Timer View: width={active_bbox['width']:.1f}px, height={active_bbox['height']:.1f}px, y={active_bbox['y']:.1f}px")

        # Check ring and clock
        clock = page.locator(".focus-station-clock")
        assert clock.is_visible(), "Clock should be visible"
        print(f"Active timer clock display: {clock.text_content()}")

        # Save active timer screenshot
        active_shot = os.path.join(SCREENSHOT_DIR, "step4_focus_active_desktop.png")
        page.screenshot(path=active_shot, full_page=False)
        print(f"Saved active timer desktop screenshot to: {active_shot}")

        # End timer early
        end_btn = page.locator("#focus-btn-stop")
        if end_btn.is_visible():
            end_btn.click()
            page.wait_for_timeout(400)

        # Mobile View (375x812)
        print("\n--- 2. Testing Mobile Focus Station View (375x812) ---")
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)

        mobile_station_bbox = station.bounding_box()
        print(f"Mobile Focus Station: width={mobile_station_bbox['width']:.1f}px, height={mobile_station_bbox['height']:.1f}px")

        mobile_shot = os.path.join(SCREENSHOT_DIR, "step4_focus_launcher_mobile.png")
        page.screenshot(path=mobile_shot, full_page=False)
        print(f"Saved mobile screenshot to: {mobile_shot}")

        browser.close()
        print("\n[SUCCESS] Step 4 measurements and screenshot verification completed!")

if __name__ == "__main__":
    run_step4_verification()
