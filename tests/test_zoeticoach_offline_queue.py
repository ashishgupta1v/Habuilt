import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:4173")

def run_offline_queue_test():
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

        print("\n=== RUNNING ZOETICOACH OFFLINE QUEUE & AUTO-RECONCILIATION TEST ===")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            // Clear existing queue to test clean slate
            localStorage.removeItem('habuilt_zoeticoach_offline_queue');
        """)

        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
        page.wait_for_selector(".zoeticoach-hud", timeout=15000)
        page.wait_for_timeout(800)

        # 1. Enqueue 2 simulated offline events via the client bridge
        queue_eval = page.evaluate("""
            () => {
                const event1 = {
                    id: 'queue_test_1',
                    payload: {
                        external_participant_id: 'ashish',
                        event_type: 'habit_completed',
                        event_value: '05:00 Waking Core Protocol (Hydration + Pink Salt)',
                        unit: 'session',
                        occurred_at: new Date().toISOString(),
                        payload: { habit_id: 'ashish_core_waking', points: 3, source: 'offline_e2e_test' }
                    },
                    queuedAt: new Date().toISOString(),
                    attempts: 0
                };
                const event2 = {
                    id: 'queue_test_2',
                    payload: {
                        external_participant_id: 'ashish',
                        event_type: 'habit_completed',
                        event_value: '08:30 Deep Focus Work Block',
                        unit: 'session',
                        occurred_at: new Date().toISOString(),
                        payload: { habit_id: 'ashish_deep_work_1', points: 3, source: 'offline_e2e_test' }
                    },
                    queuedAt: new Date().toISOString(),
                    attempts: 0
                };
                localStorage.setItem('habuilt_zoeticoach_offline_queue', JSON.stringify([event1, event2]));
                window.dispatchEvent(new CustomEvent('zoeticoach:event-queued', { detail: { queueCount: 2 } }));
                return JSON.parse(localStorage.getItem('habuilt_zoeticoach_offline_queue') || '[]');
            }
        """)
        record_result("Offline Queue Populated in LocalStorage", len(queue_eval) == 2, f"(count: {len(queue_eval)})")

        page.wait_for_timeout(400)

        # 2. Check if the HUD reactive queue badge appeared
        queue_btn = page.locator(".hud-btn--queue")
        record_result("HUD Queue Badge Appears when Queue > 0", queue_btn.count() > 0)
        btn_text = queue_btn.text_content() if queue_btn.count() > 0 else ""
        record_result("Queue Badge Shows '2 queued • Flush Now'", "2 queued" in btn_text, f"(text: '{btn_text}')")

        # 3. Check Card 4 (Integration Gateway) shows offline queue line
        sync_details = page.locator(".sync-details")
        sync_text = sync_details.text_content() if sync_details.count() > 0 else ""
        record_result("Card 4 Gateway Details Displays '2 pending'", "2 pending" in sync_text, f"(text: '{sync_text}')")

        # 4. Click the 'Flush Now' button to flush queued events to live ZoetiCoach Habit Cloud
        print("Clicking Flush Now button...")
        queue_btn.click()
        page.wait_for_timeout(2500)

        # 5. Verify queue in localStorage drained
        remaining_queue = page.evaluate("""
            () => JSON.parse(localStorage.getItem('habuilt_zoeticoach_offline_queue') || '[]')
        """)
        record_result("Offline Queue Drained via Live API Flush", len(remaining_queue) == 0, f"(remaining: {len(remaining_queue)})")

        # 6. Verify Queue Badge disappeared
        queue_btn_after = page.locator(".hud-btn--queue")
        record_result("Queue Badge Removed After Draining", queue_btn_after.count() == 0)

        # 7. Take screenshot of successfully drained HUD
        os.makedirs("tests/screenshots", exist_ok=True)
        page.screenshot(path="tests/screenshots/zoeticoach_hud_flushed.png", full_page=False)
        print("Captured screenshot to tests/screenshots/zoeticoach_hud_flushed.png")

        browser.close()

        passed_count = sum(1 for r in test_results if r["passed"])
        total_count = len(test_results)
        print(f"\nSummary: {passed_count}/{total_count} offline queue tests passed.")
        return passed_count == total_count

if __name__ == "__main__":
    success = run_offline_queue_test()
    sys.exit(0 if success else 1)
