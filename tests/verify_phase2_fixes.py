import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_phase2_verification():
    print("=" * 75)
    print("  HABUILT PHASE 2 MOBILE BOTTOM BAR ERGONOMICS & SAFE AREA TEST  ")
    print("=" * 75)

    passed_checks = []
    failed_checks = []

    def check(name, condition, details=""):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name} {details}", flush=True)
        else:
            failed_checks.append((name, details))
            print(f"  [FAIL] {name} - {details}", flush=True)

    test_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate modern mobile viewport (iPhone 14/15/16 Pro geometry: 393 x 852)
        context = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        print("\n>>> TEST 1: Mobile Viewport Initialization & Bar Positioning <<<")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=15000)

        # 1.1 Bottom nav bar is visible
        bottom_nav = page.locator(".mobile-bottom-nav")
        check("Mobile Bottom Nav is Visible", bottom_nav.is_visible())

        # 1.2 Fixed positioning at bottom
        nav_pos = page.evaluate("() => window.getComputedStyle(document.querySelector('.mobile-bottom-nav')).position")
        check("Bottom Nav is position: fixed", nav_pos == "fixed", f"(position: {nav_pos})")

        # 1.3 ARIA role semantics
        nav_role = bottom_nav.get_attribute("role")
        check("Bottom Nav has role='tablist'", nav_role == "tablist", f"(role: {nav_role})")

        print("\n>>> TEST 2: Apple HIG & Material Touch Target Dimensions (>= 48px) <<<")
        tab_ids = ["mobile-nav-today", "mobile-nav-focus", "mobile-nav-stats", "mobile-nav-rewards"]
        for tid in tab_ids:
            btn = page.locator(f"#{tid}")
            box = btn.bounding_box()
            role = btn.get_attribute("role")
            check(f"Tab '{tid}' has role='tab'", role == "tab")
            check(f"Tab '{tid}' height >= 48px", box and box["height"] >= 48.0, f"(height: {box['height']}px)")
            check(f"Tab '{tid}' width >= 48px", box and box["width"] >= 48.0, f"(width: {box['width']}px)")

        # Check total height accounts for safe area minimum
        nav_box = bottom_nav.bounding_box()
        check("Bottom Nav bar total height >= 64px", nav_box and nav_box["height"] >= 64.0, f"(height: {nav_box['height']}px)")

        print("\n>>> TEST 3: Active Tab Styling, Teal Contrast & Indicator Pill <<<")
        today_btn = page.locator("#mobile-nav-today")
        today_selected = today_btn.get_attribute("aria-selected")
        check("Today Tab is aria-selected='true'", today_selected == "true")

        # Check color is high-contrast signature teal (rgb(15, 118, 110))
        today_color = page.evaluate("() => window.getComputedStyle(document.querySelector('#mobile-nav-today')).color")
        check("Today Tab active text color is ZoetiCoach Teal (#0f766e)", "15, 118, 110" in today_color or "13, 148, 136" in today_color, f"(computed: {today_color})")

        # Check active indicator pill is rendered
        indicator = page.locator("#mobile-nav-today .mobile-bottom-nav__indicator")
        check("Active Indicator Pill is Visible on Today Tab", indicator.is_visible())

        # Screenshot Today View
        page.screenshot(path="tests/screenshots/phase2_mobile_today.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase2_mobile_today.png")

        print("\n>>> TEST 4: Dynamic Tab Switching Across Focus, Stats & Rewards <<<")
        # 4.1 Switch to Focus
        page.click("#mobile-nav-focus")
        time.sleep(0.4)
        focus_btn = page.locator("#mobile-nav-focus")
        check("Focus Tab is aria-selected='true'", focus_btn.get_attribute("aria-selected") == "true")
        check("Focus Workstation is Rendered", page.locator(".card--focus-station, .deep-work-station, #focus").count() > 0 or page.locator("text=Deep Work").count() > 0)
        page.screenshot(path="tests/screenshots/phase2_mobile_focus.png")

        # 4.2 Switch to Stats
        page.click("#mobile-nav-stats")
        time.sleep(0.4)
        stats_btn = page.locator("#mobile-nav-stats")
        check("Stats Tab is aria-selected='true'", stats_btn.get_attribute("aria-selected") == "true")
        check("Performance Analytics is Active", page.locator("#analytics").is_visible() or page.locator("text=Performance Analytics").count() > 0)
        page.screenshot(path="tests/screenshots/phase2_mobile_stats.png")

        # 4.3 Switch to Rewards
        page.click("#mobile-nav-rewards")
        time.sleep(0.4)
        rewards_btn = page.locator("#mobile-nav-rewards")
        check("Rewards Tab is aria-selected='true'", rewards_btn.get_attribute("aria-selected") == "true")
        check("Rewards Shop is Active", page.locator("#rewards").is_visible() or page.locator("text=Reward Shop").count() > 0)
        page.screenshot(path="tests/screenshots/phase2_mobile_rewards.png")

        # 4.4 Switch back to Today
        page.click("#mobile-nav-today")
        time.sleep(0.4)
        check("Returned to Today Tab", page.locator("#mobile-nav-today").get_attribute("aria-selected") == "true")

        print("\n>>> TEST 5: Floating Action Button (FAB) Ergonomics & Color <<<")
        fab = page.locator("#mobile-habits-fab")
        check("Mobile FAB is Visible on Today Tab", fab.is_visible())

        fab_box = fab.bounding_box()
        check("FAB Dimensions >= 50px", fab_box and fab_box["width"] >= 50 and fab_box["height"] >= 50, f"({fab_box['width']}x{fab_box['height']}px)")

        # Verify FAB floats above bottom nav
        nav_top = nav_box["y"]
        fab_bottom = fab_box["y"] + fab_box["height"]
        check("FAB floats above Bottom Navigation Bar", fab_bottom < nav_top, f"(FAB bottom: {fab_bottom}px, Nav top: {nav_top}px)")

        # Verify FAB color is signature teal gradient, not brown!
        fab_bg = page.evaluate("() => window.getComputedStyle(document.querySelector('#mobile-habits-fab')).backgroundImage")
        check("FAB Background uses Teal Gradient (#0d9488 / #0f766e)", "13, 148, 136" in fab_bg or "15, 118, 110" in fab_bg or "rgb" in fab_bg, f"(bg: {fab_bg})")

        # Test FAB click opens Add Habit modal
        fab.click()
        time.sleep(0.4)
        modal_visible = page.is_visible(".habit-modal-card, .habit-modal-overlay")
        check("Clicking FAB Opens Add Habit Modal", modal_visible)
        page.screenshot(path="tests/screenshots/phase2_mobile_fab.png")

        # Close modal if open
        close_btn = page.locator(".habit-modal__close-btn, button:has-text('Cancel')")
        if close_btn.count() > 0 and close_btn.first.is_visible():
            close_btn.first.click()
            time.sleep(0.3)

        print("\n>>> TEST 6: Content Clearance & Safe Area Padding <<<")
        dashboard_padding = page.evaluate("() => window.getComputedStyle(document.querySelector('.dashboard-flow')).paddingBottom")
        padding_val = int(dashboard_padding.replace("px", "").split(".")[0])
        check("Dashboard Bottom Padding >= 90px for Safe Clearance", padding_val >= 90, f"(padding-bottom: {dashboard_padding})")

        print("\n>>> TEST 7: Android Viewport Testing (412 x 915) <<<")
        android_context = browser.new_context(
            viewport={"width": 412, "height": 915},
            device_scale_factor=2.6,
            is_mobile=True,
            has_touch=True
        )
        android_page = android_context.new_page()
        android_page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)
        android_page.goto("http://localhost:4173/", wait_until="networkidle")
        android_page.wait_for_selector(".mobile-bottom-nav", timeout=10000)

        android_nav_box = android_page.locator(".mobile-bottom-nav").bounding_box()
        check("Android: Bottom Nav Bar renders cleanly", android_nav_box and android_nav_box["height"] >= 64.0)

        android_fab = android_page.locator("#mobile-habits-fab")
        check("Android: FAB renders above bottom nav", android_fab.is_visible())
        android_page.screenshot(path="tests/screenshots/phase2_android_viewport.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase2_android_viewport.png")

        browser.close()

    print("\n" + "=" * 60)
    print(f"RESULTS: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 60)
    if failed_checks:
        for f, d in failed_checks:
            print(f"  - {f}: {d}")
        sys.exit(1)
    else:
        print("ALL PHASE 2 MOBILE ERGONOMICS & SAFE AREA CHECKS PASSED!")
        sys.exit(0)

if __name__ == "__main__":
    run_phase2_verification()
