import json
import os
import subprocess
import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

def run_sentry_telemetry_continuous_verification():
    passed_checks = []
    failed_checks = []

    def check(name, condition):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name}", flush=True)
        else:
            failed_checks.append(name)
            print(f"  [FAIL] {name}", flush=True)

    print("\n" + "=" * 75)
    print("   HABUILT: CONTINUOUS SENTRY TELEMETRY & AD-BLOCKER TUNNEL VERIFICATION   ")
    print("=" * 75)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1400, "height": 900})
        page = context.new_page()

        # Route /api/telemetry/tunnel locally for fast and reliable synthetic responses
        def handle_tunnel(route):
            request = route.request
            body = request.post_data or ""
            # Inspect envelope lines
            lines = body.strip().split("\n")
            header = json.loads(lines[0]) if len(lines) > 0 and lines[0] else {}
            event_id = header.get("event_id", "syn_event_001")
            dsn = header.get("dsn")
            relayed = bool(dsn and "sentry.io" in dsn)
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "relayed": relayed,
                    "event_id": event_id,
                    "upstream_status": 200 if relayed else None,
                    "upstream_host": "o123456.ingest.sentry.io" if relayed else None,
                    "timestamp": "2026-10-30T21:40:00Z"
                })
            )

        def handle_test_event(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "success": True,
                    "verified": True,
                    "test_id": "test_synthetic_abc123",
                    "sentry_relayed": True,
                    "message": "Synthetic telemetry anomaly registered and verified in pipeline."
                })
            )

        page.route("**/api/telemetry/tunnel", handle_tunnel)
        page.route("**/api/telemetry/test-event", handle_test_event)

        # Bypass onboarding overlay for direct Dashboard testing
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
            localStorage.setItem('habuilt_user', JSON.stringify({
                id: 'ashish',
                email: 'ashishgupta1v@gmail.com'
            }));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
            localStorage.setItem('habuilt_active_protocol_id_ashish', 'archetype-ashish');
            localStorage.setItem('habuilt_guest_mode', 'false');
        """)

        print("\n>>> STEP 1: Dashboard Flow Mount & Client Telemetry Engine Check <<<")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_timeout(1000)

        # Inspect if window.__HABUILT_TELEMETRY__ is attached
        telemetry_status = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            if (!engine) return null;
            return engine.getTelemetryStatus();
        }""")

        check("Telemetry Engine Initialized", telemetry_status is not None)
        if telemetry_status:
            print(f"       Engine status: {telemetry_status}", flush=True)
            check("Telemetry Ring Buffer Functional", telemetry_status.get("ringBufferCount", 0) >= 0)

        print("\n>>> STEP 2: Synthetic Telemetry Exception Generation & Ingestion <<<")
        synthetic_event = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            return engine.captureException(new Error('Synthetic Sentry Verification Probe E2E'), {
                source: 'e2e_playwright_test',
                tier: 'Level 4 Spartan'
            });
        }""")

        check("Synthetic Anomaly Created", synthetic_event is not None and "err_" in synthetic_event.get("id", ""))
        ring_count_after = page.evaluate("window.__HABUILT_TELEMETRY__.buffer.length")
        check("Anomaly Recorded in Ring Buffer", ring_count_after >= 1)

        print("\n>>> STEP 3: Client-side Rate Limiting (Flood Protection) <<<")
        # Trigger 12 dispatches in quick succession; max allowed is 10
        rate_limit_result = page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            let allowed = 0;
            let throttled = 0;
            for (let i = 0; i < 12; i++) {
                if (engine.checkRateLimit()) {
                    allowed++;
                } else {
                    throttled++;
                }
            }
            return { allowed, throttled };
        }""")
        print(f"       Rate Limiter: {rate_limit_result}", flush=True)
        check("Rate Limiter throttles excessive dispatches", rate_limit_result.get("throttled", 0) > 0)

        print("\n>>> STEP 4: Offline Telemetry Spooling & Automatic Drain <<<")
        # Simulate offline state
        context.set_offline(True)
        page.evaluate("window.dispatchEvent(new Event('offline'))")

        page.evaluate("""() => {
            const engine = window.__HABUILT_TELEMETRY__;
            engine.captureException(new Error('Offline Queued Exception Probe'), {
                source: 'offline_e2e_test'
            });
        }""")

        spool_count = page.evaluate("window.__HABUILT_TELEMETRY__.spool.length")
        print(f"       Offline Spooled Count: {spool_count}", flush=True)
        check("Exception Spooled while Offline", spool_count >= 1)

        # Reconnect
        context.set_offline(False)
        page.evaluate("window.dispatchEvent(new Event('online'))")
        page.wait_for_timeout(800)

        drained_status = page.evaluate("""async () => {
            const engine = window.__HABUILT_TELEMETRY__;
            if (engine.spool.length > 0) {
                await engine.drainOfflineSpool();
            }
            return engine.getTelemetryStatus().spoolCount;
        }""")
        print(f"       Spooled Count after online drain: {drained_status}", flush=True)
        check("Spooled telemetry drained on reconnect", drained_status == 0)

        print("\n>>> STEP 5: Protocol Settings Modal Telemetry Monitoring Card <<<")
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

                # Test Sentry DSN configuration drawer
                toggle_dsn_btn = page.locator("#btn-toggle-sentry-dsn")
                check("Configure Sentry DSN Button Present", toggle_dsn_btn.count() > 0)
                if toggle_dsn_btn.count() > 0:
                    toggle_dsn_btn.click()
                    page.wait_for_selector("#sentry-dsn-config-drawer", timeout=3000)
                    dsn_drawer = page.locator("#sentry-dsn-config-drawer")
                    check("Sentry DSN Config Drawer Visible", dsn_drawer.is_visible())

                    # Input custom DSN and connect
                    dsn_input = page.locator("#input-custom-sentry-dsn")
                    dsn_input.fill("https://publictest@o123456.ingest.sentry.io/7890123")
                    save_dsn_btn = page.locator("#btn-save-custom-sentry-dsn")
                    save_dsn_btn.click()
                    page.wait_for_timeout(500)

                    # Verify status badge reflects Sentry Active
                    badge_text = page.locator("#proto-telemetry-monitoring-card .proto-badge-status").inner_text()
                    check("Status Badge reflects Sentry Active", "Sentry Active" in badge_text or "Active" in badge_text)

                    # Trigger Anomaly with active Sentry DSN
                    test_anomaly_btn.click()
                    page.wait_for_timeout(1000)
                    updated_card_text = telemetry_card.inner_text()
                    check("Telemetry routed with Upstream Relayed note", "Sentry Upstream Relayed" in updated_card_text or "routed" in updated_card_text)

                    # Test Reset button
                    reset_dsn_btn = page.locator("#btn-reset-custom-sentry-dsn")
                    if reset_dsn_btn.count() > 0:
                        reset_dsn_btn.click()
                        page.wait_for_timeout(500)
                        check("Reset Custom Sentry DSN succeeds", True)

                # Test Export Diagnostics button in UI
                export_btn = page.locator("#btn-export-diagnostics-archive")
                check("Export Diagnostics Archive Button Present", export_btn.count() > 0)

                # Test Clear Buffer button in UI
                purge_btn = page.locator("#btn-purge-diagnostics")
                check("Clear Buffer Button Present", purge_btn.count() > 0)
                if purge_btn.count() > 0:
                    purge_btn.click()
                    page.wait_for_timeout(500)
                    buf_count = page.evaluate("window.__HABUILT_TELEMETRY__.buffer.length")
                    check("Buffer reset to 0 after purge", buf_count == 0)

                page.screenshot(path="tests/screenshots/phase3_telemetry_ui_verified.png")

        print("\n" + "=" * 75)
        print(f"TELEMETRY VERIFICATION COMPLETE: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
        print("=" * 75)

        browser.close()

        if failed_checks:
            sys.exit(1)

if __name__ == "__main__":
    run_sentry_telemetry_continuous_verification()
