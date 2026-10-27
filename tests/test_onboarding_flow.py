import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_onboarding_test():
    print("=" * 70)
    print("      HABUILT FIRST-RUN ONBOARDING FLOW VERIFICATION SUITE       ")
    print("=" * 70)

    passed_checks = []
    failed_checks = []
    console_errors = []

    def check(name, condition, details=""):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name} {details}", flush=True)
        else:
            failed_checks.append((name, details))
            print(f"  [FAIL] {name} - {details}", flush=True)

    new_user = {
        "id": "usr-elena-99",
        "email": "elena.rostova@example.com",
        "user_metadata": {"full_name": "Elena Rostova"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        # 1. First-time user with NO completion flag
        page.add_init_script(f"""
            if (!sessionStorage.getItem('onboarding_test_init_done')) {{
                sessionStorage.setItem('onboarding_test_init_done', 'true');
                localStorage.setItem('habuilt_guest_mode', 'true');
                localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(new_user)}));
                localStorage.removeItem('habuilt_onboarding_completed_{new_user["id"]}');
                localStorage.removeItem('habuilt_active_protocol_id_{new_user["id"]}');
                localStorage.removeItem('habuilt_user_name_{new_user["id"]}');
            }}
        """)

        print("\n>>> TEST 1: First-Time User Onboarding Trigger <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".first-run-overlay", timeout=8000)
        check("First-Run Onboarding Overlay Visible", page.is_visible(".first-run-overlay"))
        check("Step 1 Identity & Goal Active", page.is_visible(".onboarding-step-1"))

        page.screenshot(path="tests/screenshots/onboarding_step_1.png")

        # 2. Complete Step 1: Identity & Aspiration
        print("\n>>> TEST 2: Step 1 Identity & Aspiration Customization <<<")
        page.fill("#onboarding-display-name", "Elena Rostova")
        page.click("button:has-text('Physical Vitality & Joint Mobility')")
        page.wait_for_timeout(300)

        page.click("#onboarding-next-btn")
        page.wait_for_selector(".onboarding-step-2", timeout=3000)
        check("Transitioned to Step 2 Archetype Selection", page.is_visible(".onboarding-step-2"))

        page.screenshot(path="tests/screenshots/onboarding_step_2.png")

        # 3. Select Archetype on Step 2
        print("\n>>> TEST 3: Archetype Selection (Mind-Body Longevity) <<<")
        page.click("#onboarding-archetype-longevity")
        page.wait_for_timeout(300)
        check("Longevity Archetype Selected", page.is_visible("#onboarding-archetype-longevity"))

        page.click("#onboarding-next-btn")
        page.wait_for_selector(".onboarding-step-3", timeout=3000)
        check("Transitioned to Step 3 Circadian Tuning", page.is_visible(".onboarding-step-3"))

        page.screenshot(path="tests/screenshots/onboarding_step_3.png")

        # 4. Step 3 Circadian Tuning & Launch
        print("\n>>> TEST 4: Circadian Rhythm Tuning & Dashboard Launch <<<")
        page.fill("#onboarding-wake-time", "05:00")
        page.fill("#onboarding-sleep-time", "22:00")
        page.wait_for_timeout(300)

        page.click("#onboarding-next-btn")
        page.wait_for_selector(".dashboard-flow", timeout=8000)
        check("Onboarding Completed & Dashboard Flow Mounted", page.is_visible(".dashboard-flow"))

        # Verify dynamic identity and protocol reflected on dashboard
        hero_pill = page.locator(".hero-track-pill").text_content()
        print(f"  Hero track pill: '{hero_pill.strip()}'")
        check("Dynamic Track Pill reflects Elena Rostova", "Elena Rostova's System" in hero_pill)

        proto_chip = page.locator(".hero-protocol-chip__name").text_content()
        print(f"  Active protocol chip: '{proto_chip.strip()}'")
        check("Active Protocol matches selected Longevity archetype", "Longevity" in proto_chip)

        page.screenshot(path="tests/screenshots/onboarding_launched_dashboard.png")

        # 5. Test Persistence & Reload Idempotency
        print("\n>>> TEST 5: Reload Idempotency (No Re-prompting) <<<")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=8000)
        check("Dashboard loaded directly without onboarding overlay", page.is_visible(".dashboard-flow") and not page.is_visible(".first-run-overlay"))

        # 6. Test Skip to Default for Guest
        print("\n>>> TEST 6: Guest Mode 'Skip to Default Workspace' <<<")
        guest_context = browser.new_context(viewport={"width": 1440, "height": 900})
        guest_page = guest_context.new_page()

        guest_page.add_init_script("""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({
                id: 'guest-rapid-test',
                email: 'guest@habuilt.com',
                user_metadata: { full_name: 'Guest Traveler' }
            }));
            localStorage.removeItem('habuilt_onboarding_completed_guest-rapid-test');
            localStorage.removeItem('habuilt_active_protocol_id_guest-rapid-test');
        """)

        guest_page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        guest_page.wait_for_selector(".first-run-overlay", timeout=5000)
        check("Guest sees First-Run Onboarding initially", guest_page.is_visible(".first-run-overlay"))

        # Click Skip to Default
        guest_page.click("#onboarding-skip-btn")
        guest_page.wait_for_selector(".dashboard-flow", timeout=5000)
        check("Guest skipped directly into Dashboard Matrix", guest_page.is_visible(".dashboard-flow") and not guest_page.is_visible(".first-run-overlay"))

        guest_page.screenshot(path="tests/screenshots/onboarding_guest_skipped.png")

        browser.close()

    print("\n" + "=" * 70)
    print(f"AUDIT SUMMARY: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print(f"Console Errors: {len(console_errors)}")
    print("=" * 70)

    if failed_checks:
        for f, d in failed_checks:
            print(f"  FAILED: {f} ({d})")
        sys.exit(1)
    else:
        print("ALL ONBOARDING FLOW CHECKS PASSED PERFECTLY!")
        sys.exit(0)

if __name__ == '__main__':
    run_onboarding_test()
