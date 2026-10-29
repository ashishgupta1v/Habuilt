import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_account_sovereignty_test():
    print("=" * 70)
    print("      HABUILT ACCOUNT & DATA SOVEREIGNTY VERIFICATION       ")
    print("=" * 70)

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
        "id": "usr-sovereign-01",
        "email": "marcus.vance@example.com",
        "user_metadata": {"full_name": "Marcus Vance", "onboarding_completed": True}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
            localStorage.setItem('habuilt_active_protocol_id_{test_user["id"]}', 'archetype-athlete');
            localStorage.setItem('habuilt_user_name_{test_user["id"]}', 'Marcus Vance');
        """)

        print("\n>>> TEST 1: Mount Dashboard & Open Protocol Settings Modal <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=12000)
        check("Dashboard Flow Mounted", page.is_visible(".dashboard-flow"))

        # Open Protocol Settings Modal via Settings button in command bar
        page.click("button[title*='Settings'], button[title*='settings'], button:has-text('Protocol Settings'), .hero-cmd-btn--settings, .hero-protocol-chip")
        page.wait_for_timeout(400)

        if page.is_visible("button:has-text('Protocol Settings & Tiers')"):
            page.click("button:has-text('Protocol Settings & Tiers')")
        elif not page.is_visible(".proto-settings-modal"):
            page.click("button:has(.lucide-settings)")

        page.wait_for_selector(".proto-settings-modal", timeout=8000)
        check("Protocol Settings Modal Open", page.is_visible(".proto-settings-modal"))

        # Navigate to Tab 5: Security & Privacy Vault
        print("\n>>> TEST 2: Switch to Security & Privacy Vault Tab <<<")
        page.click("#proto-tab-security")
        page.wait_for_selector("#proto-account-management-card", timeout=5000)
        check("Account Management Card Visible", page.is_visible("#proto-account-management-card"))
        check("Export Personal Data Button Present", page.is_visible("#proto-export-data-btn"))
        check("Delete Account Button Present", page.is_visible("#proto-delete-account-btn"))

        page.screenshot(path="tests/screenshots/phase1_security_tab_account_sovereignty.png")

        # Test Export Data Click
        print("\n>>> TEST 3: Trigger Personal Data JSON Export <<<")
        with page.expect_download(timeout=5000) as download_info:
            page.click("#proto-export-data-btn")
        download = download_info.value
        export_path = f"tests/{download.suggested_filename}"
        download.save_as(export_path)
        check("Data Export File Downloaded", os.path.exists(export_path))
        if os.path.exists(export_path):
            with open(export_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            check("Export contains userId", data.get("userId") == test_user["id"])
            try:
                os.remove(export_path)
            except:
                pass

        # Test Delete Confirmation flow
        print("\n>>> TEST 4: Delete Account Confirmation Guardrails <<<")
        page.click("#proto-delete-account-btn")
        page.wait_for_selector("#proto-delete-confirm-box", timeout=3000)
        check("Delete Confirmation Box Revealed", page.is_visible("#proto-delete-confirm-box"))

        # Try invalid text
        page.fill("#proto-delete-confirm-input", "no")
        is_disabled = page.is_disabled("#proto-delete-confirm-final-btn")
        check("Final Delete Button Disabled on Mismatched Text", is_disabled)

        # Type DELETE
        page.fill("#proto-delete-confirm-input", "DELETE")
        is_enabled = page.is_enabled("#proto-delete-confirm-final-btn")
        check("Final Delete Button Enabled on 'DELETE'", is_enabled)

        page.screenshot(path="tests/screenshots/phase1_delete_account_confirm.png")

        browser.close()

    print("\n" + "=" * 70)
    print(f"AUDIT SUMMARY: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 70)
    if failed_checks:
        sys.exit(1)

if __name__ == "__main__":
    run_account_sovereignty_test()
