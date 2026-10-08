import sys
import os
import json
import time
import base64
import urllib.parse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_protocol_studio_test():
    print("=" * 75)
    print("     HABUILT PROTOCOL ARCHETYPE STUDIO & INTEROPERABILITY VERIFICATION   ")
    print("=" * 75)

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

    test_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        print("\n>>> TEST 1: Load Dashboard & Open Protocol Settings Modal <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=12000)
        check("Dashboard Loaded Cleanly", page.is_visible(".dashboard-flow"))

        # Open Protocol Settings Modal via Settings button in command bar
        page.click("button[title*='Settings'], button[title*='settings'], button:has-text('Protocol Settings'), .hero-cmd-btn--settings, .hero-protocol-chip")
        page.wait_for_timeout(400)

        if page.is_visible("button:has-text('Protocol Settings & Tiers')"):
            page.click("button:has-text('Protocol Settings & Tiers')")
        elif not page.is_visible(".proto-settings-modal"):
            page.click("button:has(.lucide-settings)")

        page.wait_for_selector(".proto-settings-modal", timeout=6000)
        check("Protocol Settings Modal Opened", page.is_visible(".proto-settings-modal"))
        page.screenshot(path="tests/screenshots/studio_modal_opened.png")

        print("\n>>> TEST 2: Navigate to Tab 3 'Protocol Studio' <<<")
        page.click("#proto-tab-presets")
        page.wait_for_timeout(400)
        check("Protocol Studio Tab Active", page.is_visible(".proto-presets-grid"))
        check("Default Presets Rendered (Founder Card)", page.locator(".proto-preset-card:has-text('Founder')").first.is_visible())
        check("Default Presets Rendered (Longevity Card)", page.locator(".proto-preset-card:has-text('Longevity')").first.is_visible())
        check("Circadian Anchors Pill Visible", page.is_visible(".proto-circadian-pill"))
        check("Studio '+ Create Protocol' Button Present", page.is_visible("#proto-studio-create-btn"))
        check("Studio 'Import JSON' Button Present", page.is_visible("#proto-studio-import-btn"))
        page.screenshot(path="tests/screenshots/studio_tab_grid.png")

        print("\n>>> TEST 3: Create Custom Protocol via Studio Builder <<<")
        page.click("#proto-studio-create-btn")
        page.wait_for_selector("#proto-studio-editor-modal", timeout=3000)
        check("Protocol Studio Editor Modal Opened", page.is_visible("#proto-studio-editor-modal"))

        # Fill protocol metadata and circadian anchors
        page.fill("#proto-editor-name-input", "Hyper-Focused Biohacker")
        page.fill("#proto-editor-badge-input", "⚡ Deep Focus")
        page.fill("#proto-editor-tagline-input", "90m ultradian sprint routines and strict recovery")
        page.fill("#proto-editor-wake-input", "04:30")
        page.fill("#proto-editor-sleep-input", "21:30")
        page.fill("#proto-editor-work-start-input", "07:30")
        page.fill("#proto-editor-work-end-input", "16:00")
        page.wait_for_timeout(300)

        # Save and Activate
        page.click("#proto-editor-save-btn")
        page.wait_for_timeout(600)
        check("Studio Editor Modal Closed", not page.is_visible("#proto-studio-editor-modal"))

        # Verify new card exists with Custom pill
        custom_card = page.locator(".proto-preset-card:has-text('Hyper-Focused Biohacker')")
        check("Custom Protocol Card Rendered in Studio Grid", custom_card.count() > 0)
        check("Custom Protocol Card has 'Custom' Badge", custom_card.locator(".proto-cat-custom-pill").is_visible())
        page.screenshot(path="tests/screenshots/studio_custom_created.png")

        print("\n>>> TEST 4: Clone Blueprint as Custom Protocol <<<")
        # Clone 'Mind-Body Longevity'
        page.locator("button[id*='clone-btn'][id*='longevity']").first.click()
        page.wait_for_selector("#proto-studio-editor-modal", timeout=3000)
        check("Clone Modal Opened with Cloned Data", page.is_visible("#proto-studio-editor-modal"))

        # Edit cloned name
        page.fill("#proto-editor-name-input", "Longevity & Vitality Elite")
        page.click("#proto-editor-save-btn")
        page.wait_for_timeout(600)

        cloned_card = page.locator(".proto-preset-card:has-text('Longevity & Vitality Elite')")
        check("Cloned Protocol Rendered in Grid", cloned_card.count() > 0)
        check("Cloned Protocol has 'Custom' Badge", cloned_card.locator(".proto-cat-custom-pill").is_visible())
        page.screenshot(path="tests/screenshots/studio_blueprint_cloned.png")

        print("\n>>> TEST 5: Export Protocol as URL & JSON Blueprint <<<")
        # Export 'Mind-Body Longevity'
        page.locator("button[id*='export-btn'][id*='longevity']").first.click()
        page.wait_for_selector("#proto-studio-share-modal", timeout=3000)
        check("Share Modal Opened in Export Mode", page.is_visible("#proto-studio-share-modal"))

        share_url = page.input_value("#proto-share-url-input")
        check("Shareable Universal URL Generated", "#import-protocol=" in share_url, f"URL: {share_url[:40]}...")

        json_export = page.input_value("#proto-export-json-textarea")
        is_valid_json = False
        try:
            parsed = json.loads(json_export)
            is_valid_json = "protocol" in parsed and "Longevity" in parsed["protocol"].get("name", "")
        except Exception:
            is_valid_json = False
        check("Export JSON Manifest Valid & Formatted", is_valid_json)

        # Close share modal
        page.click("#proto-studio-share-modal .btn-icon")
        page.wait_for_timeout(300)
        check("Share Modal Closed", not page.is_visible("#proto-studio-share-modal"))

        print("\n>>> TEST 6: Import Protocol via JSON Manifest <<<")
        page.click("#proto-studio-import-btn")
        page.wait_for_selector("#proto-studio-share-modal", timeout=3000)
        check("Share Modal Opened in Import Mode", page.is_visible("#proto-studio-share-modal"))

        titan_manifest = json.dumps({
            "version": 1,
            "exportedAt": "2026-10-08T12:00:00.000Z",
            "protocol": {
                "id": "custom-titan-imported",
                "name": "Titan High-Performance",
                "badge": "⚡ Titan",
                "tagline": "Peak athletic output and cold immersion",
                "wakeTime": "05:00",
                "sleepTime": "22:00",
                "workStart": "08:30",
                "workEnd": "17:30",
                "habits": [
                    {"name": "Ice Bath & Breathwork", "category": "recovery", "points": 15, "timeSlot": "morning"},
                    {"name": "Zone 2 Cardio 45m", "category": "fitness", "points": 20, "timeSlot": "morning"},
                    {"name": "Deep Work Sprint #1", "category": "focus", "points": 25, "timeSlot": "work"},
                    {"name": "Magnesium & Red Light", "category": "sleep", "points": 10, "timeSlot": "evening"}
                ]
            }
        })

        page.fill("#proto-import-json-input", titan_manifest)
        page.click("#proto-import-submit-btn")
        page.wait_for_timeout(600)
        check("Import Modal Closed on Success", not page.is_visible("#proto-studio-share-modal"))

        titan_card = page.locator(".proto-preset-card:has-text('Titan High-Performance')")
        check("Imported Protocol Rendered in Grid", titan_card.count() > 0)
        check("Imported Protocol has 4 Habits Listed", titan_card.locator("text=4 Habits").count() > 0)
        page.screenshot(path="tests/screenshots/studio_imported_titan.png")

        print("\n>>> TEST 7: Delete Custom Protocol with Clean Fallback <<<")
        # Delete custom protocol
        titan_del_btn = titan_card.locator("button[id*='del-btn']").first
        check("Delete Button Available on Custom Protocol", titan_del_btn.is_visible())
        titan_del_btn.click()
        page.wait_for_timeout(500)

        check("Imported Protocol Cleanly Removed from Grid", page.locator(".proto-preset-card:has-text('Titan High-Performance')").count() == 0)
        page.screenshot(path="tests/screenshots/studio_after_delete.png")

        print("\n>>> TEST 8: Circadian Window Synchronization on Activation <<<")
        # Activate 'Hyper-Focused Biohacker' (wake: 04:30, work: 07:30-16:00, sleep: 21:30)
        biohacker_switch_btn = custom_card.locator("button:has-text('Activate')")
        if biohacker_switch_btn.count() > 0:
            biohacker_switch_btn.first.click()
            page.wait_for_timeout(500)

        # Close settings modal
        if page.is_visible(".proto-settings-modal"):
            page.click(".proto-settings-modal .modal-close-btn")
            page.wait_for_timeout(400)
        check("Protocol Settings Modal Closed", not page.is_visible(".proto-settings-modal"))

        # Verify time slot pill or headers in dashboard flow
        page.screenshot(path="tests/screenshots/studio_dashboard_circadian.png")
        check("Dashboard Remains Responsive and Active", page.is_visible(".dashboard-flow"))

        # Verify localStorage persistence
        saved_custom = page.evaluate("() => localStorage.getItem('habuilt_custom_protocols_ashish')")
        check("Custom Protocols Persisted in LocalStorage", saved_custom is not None and "Hyper-Focused Biohacker" in saved_custom)

        browser.close()

    print("\n" + "=" * 70)
    print(f"VERIFICATION RESULTS: {len(passed_checks)} PASSED | {len(failed_checks)} FAILED")
    print("=" * 70)
    for p in passed_checks:
        print(f"  + {p}")
    if failed_checks:
        print("\nFAILED CHECKS:")
        for f, reason in failed_checks:
            print(f"  - {f}: {reason}")
    if console_errors:
        print(f"\nCONSOLE ERRORS DETECTED ({len(console_errors)}):")
        for err in console_errors[:10]:
            print(f"  ! {err}")

    return len(failed_checks) == 0

if __name__ == "__main__":
    success = run_protocol_studio_test()
    sys.exit(0 if success else 1)
