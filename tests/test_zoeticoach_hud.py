import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)
from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:4173")

def run_zoeticoach_hud_test():
    console_errors = []
    page_errors = []
    test_results = []

    def record_result(name, passed, details=""):
        test_results.append({"name": name, "passed": passed, "details": details})
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status}: {name} {details}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ashish_user = {
            "id": "ashish",
            "email": "ashishgupta1v@gmail.com",
            "user_metadata": {"full_name": "Ashish Gupta"}
        }

        print("\n=== RUNNING ZOETICOACH LIVE ADHERENCE HUD TEST ===")
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(f"[Page Error] {str(err)}"))

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)

        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector(".zoeticoach-hud", timeout=15000)
        page.wait_for_timeout(1000)

        # 1. Check HUD container exists
        hud = page.locator(".zoeticoach-hud")
        record_result("ZoetiCoach HUD Component Rendered", hud.count() > 0)

        # 2. Check Header Elements
        title = page.locator(".hud-title:has-text('ZoetiCoach Live Telemetry')")
        record_result("HUD Title Visible", title.count() > 0)

        participant = page.locator(".hud-participant")
        participant_text = participant.text_content() if participant.count() > 0 else ""
        record_result("Participant Name Present", "Ashish" in participant_text, f"(got: {participant_text})")

        # 3. Check Sync Live button
        sync_btn = page.locator(".hud-btn--sync")
        record_result("Sync Live Button Present", sync_btn.count() > 0)

        # 4. Check Adherence Metric Card
        adherence_val = page.locator(".metric-card--adherence .metric-val")
        val_text = adherence_val.text_content() if adherence_val.count() > 0 else ""
        record_result("Adherence Rate Metric Populated", len(val_text.strip()) > 0, f"(value: {val_text}%)")

        # 5. Check Tabs (Clinical Directives & Milestones)
        tabs = page.locator(".hud-tab")
        record_result("HUD Nav Tabs Present", tabs.count() >= 3, f"(count: {tabs.count()})")

        clinical_tab = page.locator(".hud-tab:has-text('AI Clinical Directives')")
        if clinical_tab.count() > 0:
            clinical_tab.click()
            page.wait_for_timeout(400)
            clinical_cards = page.locator(".clinical-card")
            record_result("Clinical Directive Cards Rendered", clinical_cards.count() >= 3, f"(count: {clinical_cards.count()})")

        milestones_tab = page.locator(".hud-tab:has-text('Milestones')")
        if milestones_tab.count() > 0:
            milestones_tab.click()
            page.wait_for_timeout(400)
            milestone_cards = page.locator(".milestone-card")
            record_result("Milestone Cards Rendered", milestone_cards.count() >= 2, f"(count: {milestone_cards.count()})")

        # 6. Switch back to overview tab
        overview_tab = page.locator(".hud-tab:has-text('Compliance Telemetry')")
        if overview_tab.count() > 0:
            overview_tab.click()
            page.wait_for_timeout(300)

        # 7. Take screenshot
        page.screenshot(path="tests/screenshots/zoeticoach_hud.png", full_page=False)
        print("Captured screenshot to tests/screenshots/zoeticoach_hud.png")

        # 8. Check console and page errors
        critical_errors = [e for e in console_errors if "Failed to load resource" not in e and "404" not in e]
        print(f"\nConsole Errors (Total: {len(console_errors)}, Critical: {len(critical_errors)})")
        for err in critical_errors:
            print("  -", err)
        print(f"Page Errors: {len(page_errors)}")
        for err in page_errors:
            print("  -", err)

        record_result("Zero Critical Console Errors", len(critical_errors) == 0)
        record_result("Zero Page Errors", len(page_errors) == 0)

        browser.close()

        passed_count = sum(1 for r in test_results if r["passed"])
        total_count = len(test_results)
        print(f"\nSummary: {passed_count}/{total_count} tests passed.")
        return passed_count == total_count

if __name__ == "__main__":
    success = run_zoeticoach_hud_test()
    sys.exit(0 if success else 1)
