import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_decoupling_test():
    print("=" * 70)
    print("   HABUILT DYNAMIC MULTI-USER DECOUPLING & ARCHETYPE VERIFICATION   ")
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

    generic_user = {
        "id": "usr-sarah-101",
        "email": "sarah.connor@example.com",
        "user_metadata": {"full_name": "Sarah Connor"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(generic_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{generic_user["id"]}', 'true');
            localStorage.removeItem('habuilt_vault_configured');
        """)

        # 1. Load application
        print("\n>>> TEST 1: Generic User Render & Dynamic Identity <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(1000)

        # Verify dynamic display name and track pill
        hero_pill = page.locator(".hero-track-pill").text_content()
        print(f"  Found hero track pill text: '{hero_pill.strip()}'")
        check("Dynamic Track Pill reflects User Name", "Sarah Connor's System" in hero_pill)

        # Verify active protocol default is Founder Executive
        proto_chip = page.locator(".hero-protocol-chip__name").text_content()
        print(f"  Active protocol chip: '{proto_chip.strip()}'")
        check("Default Archetype is Founder Executive", "Founder" in proto_chip)

        page.screenshot(path="tests/screenshots/dynamic_test_1_generic_user.png")

        # 2. Protocol Switching Test
        print("\n>>> TEST 2: Switching Protocol Archetype Dynamically <<<")
        page.click(".hero-protocol-chip")
        page.wait_for_selector(".hero-protocol-dropdown", timeout=3000)
        check("Protocol Dropdown Opens", page.locator(".hero-protocol-dropdown").is_visible())

        # Select Longevity Archetype
        page.locator("button.hero-protocol-option:has-text('Mind-Body Longevity')").click()
        page.wait_for_timeout(800)
        proto_chip_after = page.locator(".hero-protocol-chip__name").text_content()
        print(f"  Active protocol after switch: '{proto_chip_after.strip()}'")
        check("Switched to Longevity Archetype", "Longevity" in proto_chip_after)

        page.screenshot(path="tests/screenshots/dynamic_test_2_longevity.png")

        # 3. Switching to Ashish Master Archetype
        print("\n>>> TEST 3: Activating Ashish Master Archetype & Day-Type Engine <<<")
        page.click(".hero-protocol-chip")
        page.wait_for_selector(".hero-protocol-dropdown", timeout=3000)
        page.locator("button.hero-protocol-option:has-text('Ashish Master Protocol')").click()
        page.wait_for_timeout(800)

        proto_chip_ashish = page.locator(".hero-protocol-chip__name").text_content()
        check("Switched to Ashish Master Archetype", "Ashish" in proto_chip_ashish)

        # Verify Day Type cycle button appears
        travel_btn = page.locator(".hero-travel-btn")
        check("Day Type Cycle Button visible for Ashish Master", travel_btn.is_visible())

        # Cycle day type
        if travel_btn.is_visible():
            initial_text = travel_btn.text_content()
            travel_btn.click()
            page.wait_for_timeout(500)
            next_text = travel_btn.text_content()
            print(f"  Cycled day type from '{initial_text.strip()}' to '{next_text.strip()}'")
            check("Day Type cycled successfully", initial_text.strip() != next_text.strip())

        page.screenshot(path="tests/screenshots/dynamic_test_3_ashish_master.png")

        # 4. Universal Partner Pairing
        print("\n>>> TEST 4: Universal Partner Pairing Modal & Anchors <<<")
        page.click(".hero-tools-trigger")
        page.wait_for_selector(".hero-tools-dropdown", timeout=3000)
        page.click("button:has-text('Pair Connection')")
        page.wait_for_selector(".modal-card--partner-pair", timeout=5000)
        check("Universal Partner Pair Modal Opens", page.locator(".modal-card--partner-pair").is_visible())

        code_badge = page.locator(".partner-code-value").text_content()
        print(f"  Generated Invite Code: '{code_badge.strip()}'")
        check("Partner Invite Code format is valid", code_badge.strip().startswith("HAB-") or len(code_badge.strip()) >= 6)

        # Switch to join tab and pair with test partner code
        page.click("button.partner-pair-tab:has-text('Enter Partner')")
        page.wait_for_timeout(300)
        page.fill("input[placeholder*='HAB-']", "HAB-7890")
        page.fill("input[placeholder*='e.g. Jyoti']", "Commander John")
        page.click("button:has-text('Link')")
        page.wait_for_timeout(1000)

        # Verify pairing connected
        check("Partner Connected with custom alias", page.is_visible(".partner-connected-pill, button:has-text('Unpair')"))

        page.screenshot(path="tests/screenshots/dynamic_test_4_partner_paired.png")

        # Close pair modal
        page.click(".modal-head-close-btn, button[aria-label='Close modal'], button:has-text('Done')")
        page.wait_for_timeout(500)

        # Open Partner Cockpit and verify universal couple anchors
        print("\n>>> TEST 5: Universal Shared Anchors Verification <<<")
        page.click(".hero-tools-trigger")
        page.wait_for_selector(".hero-tools-dropdown", timeout=3000)
        page.click("button:has-text('Partner Cockpit')")
        page.wait_for_selector(".modal-card--partner-sync", timeout=4000)
        check("Partner Sync Modal Opens", page.locator(".modal-card--partner-sync").is_visible())

        modal_text = page.locator(".modal-card--partner-sync").text_content()
        check("Uses universal 'Outdoor Evening Walk'", "Outdoor Evening Walk" in modal_text)
        check("Uses universal 'Shared Wholesome Lunch'", "Shared Wholesome Lunch" in modal_text)
        check("Uses universal 'Family Dinner & Reconnect'", "Family Dinner & Reconnect" in modal_text)

        page.screenshot(path="tests/screenshots/dynamic_test_5_universal_anchors.png")
        page.click(".modal-close-btn, button[aria-label='Close Partner Sync Modal']")
        page.wait_for_timeout(500)

        # 6. Biometric Vault Hardware Key naming
        print("\n>>> TEST 6: Biometric Vault Hardware Key Naming <<<")
        page.click(".hero-protocol-chip")
        page.wait_for_selector(".hero-protocol-dropdown", timeout=3000)
        page.click("button:has-text('Scoring & Slot Settings')")
        page.wait_for_selector(".modal-card--protocol-settings", timeout=4000)
        check("Protocol Settings Modal Opens", page.locator(".modal-card--protocol-settings").is_visible())

        # Switch to Security & Devices tab
        page.locator("#proto-tab-security").click()
        page.wait_for_timeout(800)

        passkey_input = page.locator(".proto-enroll-input-row input, input.proto-text-input[placeholder*='Device']").first
        if passkey_input.count() > 0:
            placeholder = passkey_input.get_attribute("placeholder") or ""
            print(f"  Passkey input placeholder: '{placeholder}'")
            check("Passkey input placeholder contains user display name", "Sarah Connor" in placeholder)
        else:
            check("Passkey input found in DOM", False, "Not found")

        page.screenshot(path="tests/screenshots/dynamic_test_6_biometric_vault.png")

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
        print("ALL DYNAMIC DECOUPLING CHECKS PASSED PERFECTLY!")
        sys.exit(0)

if __name__ == '__main__':
    run_decoupling_test()
