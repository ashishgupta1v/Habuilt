import sys
import os
import json
import time
import urllib.request
import ssl

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_live_production_verification():
    print("=" * 75)
    print("      HABUILT PRODUCTION VERIFICATION (https://habuilt.com/)       ")
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

    # 1. Direct HTTPS API Health & Telemetry Check
    print("\n>>> STEP 1: Live HTTPS API Health & Telemetry Check <<<")
    try:
        ctx = ssl.create_default_context()
        req = urllib.request.Request(
            "https://habuilt.com/api/health",
            headers={"User-Agent": "Habuilt-Production-HealthCheck/1.0"}
        )
        with urllib.request.urlopen(req, context=ctx, timeout=15) as res:
            status = res.status
            body = json.loads(res.read().decode())
            print(f"       Health: Status: {status}, Body: {body}", flush=True)
            check("API /api/health HTTP 200", status == 200)
            check("API reports healthy status", body.get("status") == "healthy")
            check("API reports Hostinger KVM 2 server", body.get("server") == "Hostinger KVM 2")

        # Telemetry Health Endpoint Check
        telemetry_req = urllib.request.Request(
            "https://habuilt.com/api/telemetry/health",
            headers={"User-Agent": "Habuilt-Production-HealthCheck/1.0"}
        )
        with urllib.request.urlopen(telemetry_req, context=ctx, timeout=15) as res:
            t_status = res.status
            t_body = json.loads(res.read().decode())
            print(f"       Telemetry Health: Status: {t_status}, Body: {t_body}", flush=True)
            check("API /api/telemetry/health HTTP 200", t_status == 200)
            check("Telemetry operational", t_body.get("status") == "operational")
            check("Telemetry engine active", "Habuilt" in t_body.get("engine", ""))

        # Telemetry Tunnel Proxy Endpoint Check (Synthetic Sentry Envelope Relay)
        envelope_content = '{"event_id":"00000000000000000000000000000001","sent_at":"2026-10-29T07:15:00.000Z"}\n{"type":"event","content_type":"application/json"}\n{"message":"Live Production Verification Ping"}\n'
        tunnel_req = urllib.request.Request(
            "https://habuilt.com/api/telemetry/tunnel",
            data=envelope_content.encode("utf-8"),
            headers={"Content-Type": "text/plain", "User-Agent": "Habuilt-Telemetry-LiveTest/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(tunnel_req, context=ctx, timeout=15) as res:
            tune_status = res.status
            tune_body = json.loads(res.read().decode())
            print(f"       Telemetry Tunnel: Status: {tune_status}, Body: {tune_body}", flush=True)
            check("API /api/telemetry/tunnel HTTP 200", tune_status == 200)
            check("Telemetry Tunnel accepted envelope", tune_body.get("success") is True)

    except Exception as e:
        check("API Health & Telemetry Reachable", False, str(e))

    # 2. Browser E2E Live Testing on https://habuilt.com/
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        print("\n>>> STEP 2: Live Landing & Compliance Page Verification <<<")
        page.goto("https://habuilt.com/", wait_until="networkidle", timeout=30000)
        
        # Verify Apple OAuth button
        apple_btn = page.locator("#auth-apple-btn")
        check("Live Apple OAuth Button Present", apple_btn.count() > 0)

        # Verify Legal Consent Notice
        legal_notice = page.locator(".lp__terms-notice")
        check("Live Legal Notice Present", legal_notice.count() > 0)
        if legal_notice.count() > 0:
            check("Live Notice has Terms & Privacy", "Terms" in legal_notice.inner_text())

        # Verify Cookie Consent Banner
        cookie_banner = page.locator("#cookie-consent-banner")
        check("Live Cookie Banner Present", cookie_banner.count() > 0)

        page.screenshot(path="tests/screenshots/live_01_landing_compliance.png")

        print("\n>>> STEP 3: Live Public Legal Route Endpoints <<<")
        # Test /privacy
        page.goto("https://habuilt.com/privacy", wait_until="networkidle", timeout=20000)
        page.wait_for_selector(".legal-title", timeout=10000)
        check("Live /privacy Loaded", "Privacy Policy" in page.title() or page.locator(".legal-title").count() > 0)

        # Test /terms
        page.goto("https://habuilt.com/terms", wait_until="networkidle", timeout=20000)
        page.wait_for_selector(".legal-title", timeout=10000)
        check("Live /terms Loaded", "Terms of Service" in page.title() or page.locator(".legal-title").count() > 0)

        # Test /disclaimer
        page.goto("https://habuilt.com/disclaimer", wait_until="networkidle", timeout=20000)
        page.wait_for_selector(".legal-title", timeout=10000)
        check("Live /disclaimer Loaded", "Medical & Wellness Disclaimer" in page.title() or page.locator(".legal-title").count() > 0)

        print("\n>>> STEP 4: Live Dashboard & Header Sync Status Capsule <<<")
        # Authenticate session
        page.evaluate("""() => {
            localStorage.setItem('habuilt_cached_user', JSON.stringify({
                id: 'ashish',
                email: 'ashishgupta1v@gmail.com',
                user_metadata: {
                    full_name: 'Ashish Gupta',
                    preferred_archetype: 'archetype-ashish',
                    onboarding_completed: true
                }
            }));
            localStorage.setItem('habuilt_guest_mode', 'false');
            localStorage.setItem('habuilt_active_protocol_id_ashish', 'archetype-ashish');
        }""")

        page.goto("https://habuilt.com/", wait_until="networkidle", timeout=30000)
        page.wait_for_selector("#sync-status-capsule", timeout=15000)

        capsule = page.locator("#sync-status-capsule")
        check("Live Sync Capsule Present", capsule.count() > 0)
        check("Live Sync Capsule Visible", capsule.is_visible())
        
        capsule_text = capsule.inner_text().strip()
        print(f"       Live Capsule Text: '{capsule_text}'", flush=True)
        check("Live Sync Capsule indicates Synced status", "Cloud Synced" in capsule_text or "Synced" in capsule_text)

        # Verify Telemetry Diagnostics initialized on live page
        telemetry_ok = page.evaluate("""() => {
            return localStorage.getItem('habuilt_diagnostics_ring_buffer') !== null;
        }""")
        check("Live Telemetry Ring Buffer Active", telemetry_ok)

        print("\n>>> STEP 5: Live UI Protocol Settings & Telemetry Inspector <<<")
        page.evaluate("""() => {
            window.dispatchEvent(new CustomEvent('habuilt:open-protocol-settings'));
        }""")
        page.wait_for_selector("#proto-tab-security", timeout=8000)
        vault_tab = page.locator("#proto-tab-security")
        check("Live Vault & Solar Tab Present", vault_tab.count() > 0)
        
        if vault_tab.count() > 0:
            vault_tab.click()
            page.wait_for_selector("#proto-telemetry-monitoring-card", timeout=8000)
            telemetry_card = page.locator("#proto-telemetry-monitoring-card")
            check("Live Telemetry Monitoring Card Present", telemetry_card.count() > 0)
            check("Live Telemetry Monitoring Card Visible", telemetry_card.is_visible())

            # Test Send Test Anomaly in live UI
            test_anomaly_btn = page.locator("#btn-test-sentry-event")
            check("Live Test Anomaly Button Present", test_anomaly_btn.count() > 0)
            if test_anomaly_btn.count() > 0:
                test_anomaly_btn.click()
                page.wait_for_timeout(1200)
                card_text = telemetry_card.inner_text()
                check("Live Test Anomaly feedback rendered", "Anomaly" in card_text or "routed" in card_text)

        page.screenshot(path="tests/screenshots/live_02_dashboard_synced.png")

        print("\n" + "=" * 75)
        print(f"LIVE PRODUCTION AUDIT COMPLETE: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
        print("=" * 75)

        browser.close()

        if failed_checks:
            sys.exit(1)

if __name__ == "__main__":
    run_live_production_verification()
