import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_phase2_legal_compliance_test():
    print("=" * 70)
    print("      HABUILT PHASE 2: LEGAL, PRIVACY & APP STORE COMPLIANCE       ")
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

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Clear localStorage to test fresh landing visitor state
        page.add_init_script("""
            localStorage.clear();
        """)

        print("\n>>> STEP 1: Landing & Auth Screen Compliance Verification <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".lp__auth-glass", timeout=12000)
        check("Auth Card Present", page.is_visible(".lp__auth-glass"))

        # Apple Sign In button verification (Apple Review Guideline 4.8)
        apple_btn = page.locator("#auth-apple-btn")
        check("Apple OAuth Button Exists", apple_btn.count() > 0)
        if apple_btn.count() > 0:
            check("Apple OAuth Button Visible", apple_btn.is_visible())
            check("Apple OAuth Button Has Text", "Continue with Apple" in apple_btn.inner_text())

        # Terms & Privacy consent text verification (App Store / GDPR mandate)
        terms_notice = page.locator(".lp__terms-notice")
        check("Legal Consent Notice Present", terms_notice.count() > 0)
        if terms_notice.count() > 0:
            notice_text = terms_notice.inner_text()
            check("Notice mentions Terms", "Terms" in notice_text)
            check("Notice mentions Privacy Policy", "Privacy Policy" in notice_text)
            check("Notice mentions Wellness Disclaimer", "Wellness Disclaimer" in notice_text)

        # Footer links verification
        footer = page.locator(".lp__footer")
        check("Legal Footer Present", footer.count() > 0)
        if footer.count() > 0:
            footer_text = footer.inner_text()
            check("Footer links Privacy Policy", "Privacy Policy" in footer_text)
            check("Footer links Terms of Service", "Terms of Service" in footer_text)
            check("Footer links Medical Disclaimer", "Medical Disclaimer" in footer_text)

        page.screenshot(path="tests/screenshots/phase2_auth_apple_legal_footer.png")

        print("\n>>> STEP 2: Cookie & Privacy Consent Banner Verification <<<")
        # Banner appears with slight delay
        page.wait_for_selector("#cookie-consent-banner", timeout=6000)
        check("Cookie Consent Banner Displayed", page.is_visible("#cookie-consent-banner"))

        banner_text = page.locator("#cookie-consent-banner").inner_text()
        check("Banner mentions Digital Sovereignty", "sovereignty" in banner_text.lower())
        check("Banner Accept All Button Present", page.is_visible("#cookie-accept-btn"))
        check("Banner Essential Only Button Present", page.is_visible("#cookie-essential-btn"))

        page.screenshot(path="tests/screenshots/phase2_cookie_banner.png")

        # Click Accept All and verify banner dismissal and localStorage persistence
        page.click("#cookie-accept-btn")
        page.wait_for_selector("#cookie-consent-banner", state="hidden", timeout=3000)
        check("Cookie Banner Dismissed after Accept", not page.is_visible("#cookie-consent-banner"))

        consent_val = page.evaluate("localStorage.getItem('habuilt_privacy_consent')")
        check("Consent Stored in LocalStorage as 'accepted'", consent_val == "accepted")

        print("\n>>> STEP 3: Privacy Policy View Verification <<<")
        page.goto("http://localhost:4173/privacy", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Privacy Policy')", timeout=8000)
        check("Privacy Policy Title Present", page.is_visible("h1:has-text('Privacy Policy')"))
        check("Sovereign Privacy Badge Visible", page.is_visible("text=Sovereign Privacy"))
        check("Information We Collect Present", page.is_visible("text=Information We Collect"))
        check("Account Deletion Section Present", page.is_visible("text=Account Deletion"))

        page.screenshot(path="tests/screenshots/phase2_privacy_page.png")

        print("\n>>> STEP 4: Terms of Service View Verification <<<")
        page.goto("http://localhost:4173/terms", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Terms of Service')", timeout=8000)
        check("Terms of Service Title Present", page.is_visible("h1:has-text('Terms of Service')"))
        check("Agreement to Terms Badge Visible", page.is_visible("text=Legal Agreement & Operating Protocol"))
        check("Virtual XP Clause Present", page.is_visible("text=Virtual Points, XP & Milestone Vaults"))
        check("Limitation of Liability Present", page.is_visible("text=Limitation of Liability"))

        page.screenshot(path="tests/screenshots/phase2_terms_page.png")

        print("\n>>> STEP 5: Medical & Wellness Disclaimer View Verification <<<")
        page.goto("http://localhost:4173/disclaimer", wait_until="domcontentloaded")
        page.wait_for_selector("h1:has-text('Medical & Wellness Disclaimer')", timeout=8000)
        check("Medical Disclaimer Title Present", page.is_visible("h1:has-text('Medical & Wellness Disclaimer')"))
        check("Clinical Notice Badge Visible", page.is_visible("text=Clinical & Health Notice"))
        check("Diagnostic Warning Present", page.is_visible("text=DOES NOT PROVIDE MEDICAL ADVICE"))
        check("Emergency Warning Present", page.is_visible("text=Emergency Situations"))

        page.screenshot(path="tests/screenshots/phase2_disclaimer_page.png")

        browser.close()

    print("\n" + "=" * 70)
    print(f"AUDIT SUMMARY: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 70)
    if failed_checks:
        sys.exit(1)

if __name__ == "__main__":
    run_phase2_legal_compliance_test()
