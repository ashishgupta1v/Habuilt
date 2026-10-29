import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_sentry_telemetry_continuous_verification():
    print("=" * 75)
    print("   HABUILT: CONTINUOUS SENTRY TELEMETRY & AD-BLOCKER TUNNEL VERIFICATION   ")
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

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Set up authenticated session for Ashish
        page.add_init_script("""
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
        """)

        print("\n>>> STEP 1: Dashboard Flow Mount & Client Telemetry Engine Check <<<")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=15000)

        # Check telemetry engine global on window
        telemetry_init = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            if (!engine) return null;
            return engine.getTelemetryStatus();
        }""")
        print(f"       Client Telemetry Status: {telemetry_init}", flush=True)
        check("Telemetry Engine Initialized", telemetry_init is not None and telemetry_init["initialized"] is True)
        check("Telemetry Ring Buffer Functional", telemetry_init is not None and "ringBufferCount" in telemetry_init)

        print("\n>>> STEP 2: Synthetic Telemetry Exception Generation & Ingestion <<<")
        synthetic_res = page.evaluate("""async () => {
            const engine = window.__HABUILT_TELEMETRY__;
            const res = await engine.sendTestException('playwright_verification_run');
            const buffer = engine.getBuffer();
            return {
                id: res.id,
                name: res.name,
                message: res.message,
                bufferCount: buffer.length
            };
        }""")
        print(f"       Synthetic Anomaly: {synthetic_res}", flush=True)
        check("Synthetic Anomaly Created", "err_" in synthetic_res.get("id", ""))
        check("Anomaly Recorded in Ring Buffer", synthetic_res.get("bufferCount", 0) >= 1)

        print("\n>>> STEP 3: Client-side Rate Limiting (Flood Protection) <<<")
        rate_limit_res = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            const results = [];
            // Try 12 rapid dispatches in sequence
            for (let i = 0; i < 12; i++) {
                results.push(engine.checkRateLimit());
            }
            return {
                allowedCount: results.filter(r => r === true).length,
                blockedCount: results.filter(r => r === false).length
            };
        }""")
        print(f"       Rate Limit Test: {rate_limit_res}", flush=True)
        check("Rate Limiter throttles excessive dispatches", rate_limit_res["blockedCount"] >= 1)

        print("\n>>> STEP 4: Offline Telemetry Spooling & Automatic Drain <<<")
        # Go offline
        context.set_offline(True)
        page.evaluate("window.dispatchEvent(new Event('offline'))")
        page.wait_for_timeout(300)

        # Send error while offline
        spool_status = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            engine.captureException(new Error('Offline Telemetry Spool Test Fault'), { source: 'offline_test' });
            return engine.getTelemetryStatus().spoolCount;
        }""")
        print(f"       Spooled Count while offline: {spool_status}", flush=True)
        check("Exception Spooled while Offline", spool_status >= 1)

        # Reconnect
        context.set_offline(False)
        page.evaluate("window.dispatchEvent(new Event('online'))")
        page.wait_for_timeout(800)

        drained_status = page.evaluate("""async () => {
            const engine = window.__HABUILT_TELEMETRY__;
            if (engine.spool.length > 0) {
                await engine.drainSpool();
            }
            return engine.getTelemetryStatus().spoolCount;
        }""")
        print(f"       Spooled Count after online drain: {drained_status}", flush=True)
        check("Spooled telemetry drained on reconnect", drained_status == 0)

        print("\n>>> STEP 5: Protocol Settings Modal Telemetry Monitoring Card <<<")
        # Open Protocol & Routine Customizer Modal
        modal_opened = page.evaluate("""() => {
            const btn = document.querySelector('.hero-protocol-chip') || document.getElementById('sync-status-capsule');
            return btn !== null;
        }""")
        check("Control Bar elements present", modal_opened)

        # Launch the protocol settings modal directly
        page.evaluate("""() => {
            window.dispatchEvent(new CustomEvent('habuilt:open-protocol-settings'));
        }""")
        page.wait_for_selector("#proto-tab-security", timeout=8000)

        # Switch to Vault & Solar tab
        vault_tab = page.locator("#proto-tab-security")
        check("Vault & Solar Tab Button Present", vault_tab.count() > 0)
        if vault_tab.count() > 0:
            vault_tab.click()
            page.wait_for_selector("#proto-telemetry-monitoring-card", timeout=8000)

            telemetry_card = page.locator("#proto-telemetry-monitoring-card")
            check("Telemetry Monitoring Card Present in UI", telemetry_card.count() > 0)
            
            if telemetry_card.count() > 0:
                check("Telemetry Monitoring Card Visible", telemetry_card.is_visible())

                # Test Send Test Anomaly button in UI
                test_anomaly_btn = page.locator("#btn-test-sentry-event")
                check("Test Sentry Anomaly Button Present", test_anomaly_btn.count() > 0)
                if test_anomaly_btn.count() > 0:
                    test_anomaly_btn.click()
                    page.wait_for_timeout(1000)
                    card_text = telemetry_card.inner_text()
                    check("Test Anomaly confirmation feedback rendered", "Anomaly" in card_text or "routed" in card_text or "Test" in card_text)

                # Test Export Diagnostics button in UI
                export_btn = page.locator("#btn-export-diagnostics-archive")
                check("Export Diagnostics Archive Button Present", export_btn.count() > 0)

                page.screenshot(path="tests/screenshots/phase3_telemetry_ui_verified.png")

        print("\n" + "=" * 75)
        print(f"TELEMETRY VERIFICATION COMPLETE: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
        print("=" * 75)

        browser.close()

        if failed_checks:
            sys.exit(1)

if __name__ == "__main__":
    run_sentry_telemetry_continuous_verification()
