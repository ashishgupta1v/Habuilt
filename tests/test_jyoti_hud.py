import sys
import os
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:4173")

def test_jyoti_hud():
    test_results = []
    def record(name, passed, details=""):
        test_results.append({"name": name, "passed": passed})
        print(f"[{'PASS' if passed else 'FAIL'}]: {name} {details}", flush=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        jyoti_user = {
            "id": "jyoti",
            "email": "jyoti@habuilt.com",
            "user_metadata": {"full_name": "Jyoti Gupta"}
        }

        print("\n=== RUNNING JYOTI PROFILE & CLINICAL DIRECTIVES VERIFICATION ===")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(jyoti_user)}));
        """)

        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector(".zoeticoach-hud", timeout=15000)
        page.wait_for_timeout(800)

        # 1. Check HUD rendered for Jyoti
        participant = page.locator(".hud-participant")
        text = participant.text_content() if participant.count() > 0 else ""
        record("Jyoti Participant Identity Detected", "Jyoti" in text, f"(got: {text})")

        # 2. Check Standby Mode Badge
        channel_badge = page.locator(".hud-badge--channel")
        channel_text = channel_badge.text_content() if channel_badge.count() > 0 else ""
        record("Local Standby Active Gracefully for Jyoti", "Standby" in channel_text or "Local" in channel_text, f"(got: {channel_text})")

        # 3. Check Clinical Directives Tab for Jyoti
        clinical_tab = page.locator(".hud-tab:has-text('AI Clinical Directives')")
        if clinical_tab.count() > 0:
            clinical_tab.click()
            page.wait_for_timeout(400)
            clinical_text = page.locator(".clinical-cards-grid").text_content() or ""
            record("Thyroid & Endocrine Rhythm Pillar Present", "Thyroid" in clinical_text or "Endocrine" in clinical_text)
            record("Joint Lubrication & Flexibility Pillar Present", "Joint" in clinical_text or "Mobility" in clinical_text)
            record("Parasympathetic Sleep Pillar Present", "Sleep" in clinical_text or "Parasympathetic" in clinical_text)

        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/jyoti_clinical_hud.png", full_page=False)
        print("Captured screenshot to tests/screenshots/jyoti_clinical_hud.png")

        browser.close()
        passed = sum(1 for r in test_results if r["passed"])
        total = len(test_results)
        print(f"\nSummary: {passed}/{total} Jyoti verification checks passed.")
        return passed == total

if __name__ == "__main__":
    success = test_jyoti_hud()
    sys.exit(0 if success else 1)
