import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

def verify_founder_plan():
    print("=" * 70)
    print("   HABUILT ASHISH 3-WEEK ASSESSMENT PLAN VERIFICATION TEST   ")
    print("=" * 70)

    passed = []
    failed = []
    console_errors = []

    def check(name, condition, details=""):
        if condition:
            passed.append(name)
            print(f"  [PASS] {name} {details}", flush=True)
        else:
            failed.append((name, details))
            print(f"  [FAIL] {name} - {details}", flush=True)

    founder_user = {
        "id": "founder",
        "email": "founder@habuilt.test",
        "user_metadata": {"full_name": "Test Founder"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(founder_user)}));
            localStorage.setItem('habuilt_onboarding_completed_founder', 'true');
            localStorage.removeItem('habuilt_vault_configured');
        """)

        print("\n>>> 1. Loading Habuilt for Founder <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(1200)

        check("Dashboard Rendered", page.locator(".dashboard-flow").is_visible())

        # Check user track pill / greeting
        track_pill = page.locator(".hero-track-pill").text_content()
        print(f"  Track Pill: '{track_pill.strip()}'")
        check("Public Display Name Assigned", "Test Founder" in track_pill)

        proto_chip = page.locator(".hero-protocol-chip__name").text_content()
        print(f"  Active Protocol Chip: '{proto_chip.strip()}'")
        check("Founder Protocol Active", "Founder" in proto_chip)

        content = page.content()
        check("Founder Deep Work Habit Present", "Deep Architecture Sprint" in content)

        # Check cell toggle works
        current_cell = page.locator(".habit-grid__cell--current").first
        if current_cell.is_visible():
            init_done = "habit-grid__cell--done" in (current_cell.get_attribute("class") or "")
            current_cell.scroll_into_view_if_needed()
            current_cell.click(force=True)
            try:
                page.wait_for_function(
                    "([init_done]) => { const el = document.querySelector('.habit-grid__cell--current'); return el && (el.classList.contains('habit-grid__cell--done') !== init_done); }",
                    arg=[init_done],
                    timeout=3000
                )
            except Exception:
                page.wait_for_timeout(500)
            toggled_done = "habit-grid__cell--done" in (current_cell.get_attribute("class") or "")
            check("Habit Cell Interactive Toggle", init_done != toggled_done)
            # restore
            current_cell.click(force=True)
            page.wait_for_timeout(400)

        # Check console errors (ignoring expected static preview 404 API fallbacks)
        filtered_errors = [e for e in console_errors if "favicon" not in e and "chrome-extension" not in e and "Failed to load resource" not in e and "404" not in e]
        check("Zero Critical Console Errors", len(filtered_errors) == 0, f"Found: {filtered_errors}")

        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/founder_plan_verification.png")
        print("\n  Screenshot saved to tests/screenshots/founder_plan_verification.png")

        browser.close()

    print("\n" + "=" * 70)
    print(f"RESULTS: {len(passed)} PASSED, {len(failed)} FAILED")
    print("=" * 70)

    if failed:
        sys.exit(1)

if __name__ == "__main__":
    verify_founder_plan()
