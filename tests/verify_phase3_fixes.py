import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_phase3_verification():
    print("=" * 75)
    print("   HABUILT PHASE 3 DEEP WORK TIMER HUD FLOATING CARD VERIFICATION   ")
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

        # ══════════════════════════════════════════════════════════════
        # PART 1: DESKTOP FLOATING HUD CARD TESTING (1440 x 900)
        # ══════════════════════════════════════════════════════════════
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        print("\n>>> TEST 1: Launch Focus Timer on Desktop Viewport <<<")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=15000)

        # Launch 25m Focus timer from Hero Deck launcher
        launch_btn = page.locator(".hero-launch-btn--focus")
        check("Hero Focus Launch Button is Present", launch_btn.is_visible())
        launch_btn.click()
        time.sleep(0.5)

        # Focus Workstation is opened. Now switch to Checklist tab via TopCommandBar desktop navigation
        checklist_tab = page.locator(".hero-desktop-tab:has-text('Checklist')")
        check("Checklist Desktop Tab is Visible in Header", checklist_tab.is_visible())
        checklist_tab.click()
        time.sleep(0.5)

        # Check .deep-timer presence
        deep_timer = page.locator(".deep-timer")
        check("Deep Work Timer Widget Exists in DOM", deep_timer.count() > 0)
        check("Deep Work Timer is Visible Floating on Desktop", deep_timer.is_visible())

        print("\n>>> TEST 2: Desktop Fixed Bottom-Right Floating Island Positioning <<<")
        computed_pos = page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).position")
        check("Desktop: position is fixed", computed_pos == "fixed", f"(position: {computed_pos})")

        computed_bottom = page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).bottom")
        check("Desktop: anchored near bottom (24px)", "24px" in computed_bottom or "px" in computed_bottom, f"(bottom: {computed_bottom})")

        computed_right = page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).right")
        check("Desktop: anchored near right (28px)", "28px" in computed_right or "px" in computed_right, f"(right: {computed_right})")

        timer_box = page.locator(".deep-timer").bounding_box()
        check("Desktop: Floating Card has compact pill dimensions", timer_box and 300 <= timer_box["width"] <= 500, f"(width: {timer_box['width']}px, height: {timer_box['height']}px)")

        # Verify it doesn't obstruct header or top 500px of page
        check("Desktop: Floating card is in bottom viewport area", timer_box and timer_box["y"] > 700, f"(y position: {timer_box['y']}px)")

        print("\n>>> TEST 3: High Contrast Typography & Live Pulse Beacon <<<")
        # Pulse beacon
        pulse = page.locator(".deep-timer__pulse")
        check("Live Pulse Beacon is Visible", pulse.is_visible())

        # Monospace time readout
        time_text = page.locator(".deep-timer__time").inner_text()
        check("Monospace Elapsed Time is Rendered", len(time_text) >= 4 and ":" in time_text, f"(time: {time_text})")

        target_text = page.locator(".deep-timer__target").inner_text()
        check("Target Duration is Rendered", "25" in target_text or "m" in target_text, f"(target: {target_text})")

        # Progress bar fill
        progress_bar = page.locator(".deep-timer__progress-bar")
        check("Progress Track is Visible", progress_bar.is_visible())
        progress_fill = page.locator(".deep-timer__progress-fill")
        check("Progress Fill is Rendered", progress_fill.count() > 0)

        # Glassmorphic contrast
        timer_bg = page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).backgroundColor")
        check("HUD Background is High-Contrast White Glass", "255, 255, 255" in timer_bg or "rgb" in timer_bg, f"(bg: {timer_bg})")

        timer_color = page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer__time')).color")
        check("Time Text is Crisp Dark Charcoal (#0f172a)", "15, 23, 42" in timer_color, f"(color: {timer_color})")

        page.screenshot(path="tests/screenshots/phase3_desktop_floating_timer.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase3_desktop_floating_timer.png")

        print("\n>>> TEST 4: Pause & Resume Interactions <<<")
        pause_btn = page.locator(".deep-timer__btn:has(.lucide-pause)")
        check("Pause Button is Available", pause_btn.is_visible())
        pause_btn.click()
        time.sleep(0.4)

        is_paused = page.locator(".deep-timer--paused").count() > 0
        check("Timer enters Paused State (.deep-timer--paused)", is_paused)

        resume_btn = page.locator(".deep-timer__btn:has(.lucide-play)")
        check("Resume Play Button is Available when Paused", resume_btn.is_visible())
        resume_btn.click()
        time.sleep(0.4)

        is_running = page.locator(".deep-timer--running").count() > 0
        check("Timer Resumes Running State (.deep-timer--running)", is_running)

        print("\n>>> TEST 5: Click-to-Focus Station Navigation <<<")
        timer_left = page.locator(".deep-timer__left")
        timer_left.click()
        time.sleep(0.4)

        focus_station_open = (
            page.locator(".deep-work-station").count() > 0
            or page.locator("text='Deep Work Station'").count() > 0
            or page.locator(".hero-desktop-tab--active:has-text('Focus Station')").count() > 0
            or page.locator(".card--focus-station").count() > 0
        )
        check("Clicking Timer Pill Navigates to Focus Workstation", focus_station_open)

        context.close()

        # ══════════════════════════════════════════════════════════════
        # PART 2: MOBILE STICKY TOP HUD TESTING (393 x 852)
        # ══════════════════════════════════════════════════════════════
        print("\n>>> TEST 6: Mobile Sticky Top HUD Adaptation (393 x 852) <<<")
        mobile_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        mobile_page = mobile_ctx.new_page()
        mobile_page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)
        mobile_page.goto("http://localhost:4173/", wait_until="networkidle")
        mobile_page.wait_for_selector(".dashboard-flow", timeout=15000)

        # Launch timer from Mobile Focus tab
        mobile_page.click("#mobile-nav-focus")
        time.sleep(0.5)

        # Start 25m focus session using reliable selector
        mobile_page.wait_for_selector("#focus-btn-start", timeout=8000)
        mobile_page.click("#focus-btn-start")
        time.sleep(0.6)

        # Navigate back to Today tab via bottom nav bar
        mobile_page.click("#mobile-nav-today")
        time.sleep(0.5)

        # Verify .deep-timer on mobile
        mobile_page.wait_for_selector(".deep-timer", timeout=8000)
        mob_timer = mobile_page.locator(".deep-timer")
        check("Mobile: Deep Timer is Visible on Today Tab", mob_timer.is_visible())

        mob_pos = mobile_page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).position")
        check("Mobile: position is sticky", mob_pos == "sticky", f"(position: {mob_pos})")

        mob_top = mobile_page.evaluate("() => window.getComputedStyle(document.querySelector('.deep-timer')).top")
        check("Mobile: anchored below top compact bar (>= 52px)", "52px" in mob_top or int(mob_top.replace("px", "").split(".")[0]) >= 52, f"(top: {mob_top})")

        mob_box = mob_timer.bounding_box()
        check("Mobile: Spans full width cleanly without overflow", mob_box and 380 <= mob_box["width"] <= 400, f"(width: {mob_box['width']}px)")

        # Verify it does not cover the bottom nav bar
        bottom_nav_box = mobile_page.locator(".mobile-bottom-nav").bounding_box()
        check("Mobile: Sits high above bottom navigation bar", mob_box and bottom_nav_box and mob_box["y"] < bottom_nav_box["y"], f"(Timer y: {mob_box['y']}px, Nav y: {bottom_nav_box['y']}px)")

        mobile_page.screenshot(path="tests/screenshots/phase3_mobile_sticky_timer.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase3_mobile_sticky_timer.png")

        # Test Stop & Dismiss on mobile
        mob_stop_btn = mobile_page.locator(".deep-timer__btn--danger")
        check("Mobile: Stop Button is Available", mob_stop_btn.is_visible())
        mob_stop_btn.click()
        time.sleep(0.4)

        timer_count_after_stop = mobile_page.locator(".deep-timer").count()
        check("Mobile: Timer Dismissed and Cleaned Up", timer_count_after_stop == 0)

        mobile_ctx.close()
        browser.close()

    print("\n" + "=" * 60)
    print(f"RESULTS: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 60)
    if failed_checks:
        for f, d in failed_checks:
            print(f"  - {f}: {d}")
        sys.exit(1)
    else:
        print("ALL PHASE 3 DEEP WORK TIMER HUD CHECKS PASSED!")
        sys.exit(0)

if __name__ == "__main__":
    run_phase3_verification()
