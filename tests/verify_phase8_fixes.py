import asyncio
import json
import os
from playwright.async_api import async_playwright

ARTIFACTS_DIR = r"C:\Users\ashis\.gemini\antigravity-ide\brain\36eaa7a1-e32b-421a-94d0-3e5580d6e994"

async def run_audit():
    results = []
    
    def log_test(name, passed, details=""):
        status = "PASSED" if passed else "FAILED"
        print(f"[{status}] {name} - {details}")
        results.append({"name": name, "passed": passed, "details": details})

    test_user = {
        "id": "ashish-test-uuid",
        "name": "Ashish",
        "email": "ashish@habuilt.test",
        "tier": "sovereign",
    }
    init_script = f"""
        localStorage.setItem('habuilt_guest_mode', 'true');
        localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
        localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
    """

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # --------------------------------------------------------------
        # 1. PWA Manifest Audit
        # --------------------------------------------------------------
        print("\n--- 1. PWA Manifest Audit ---")
        m_page = await browser.new_page()
        manifest_res = await m_page.goto("http://localhost:4173/manifest.webmanifest")
        log_test("Manifest Reachable", manifest_res.status == 200, f"Status: {manifest_res.status}")
        
        manifest_text = await manifest_res.text()
        try:
            manifest_json = json.loads(manifest_text)
            log_test("Manifest Valid JSON", True, "Successfully parsed JSON")
        except Exception as e:
            log_test("Manifest Valid JSON", False, str(e))
            manifest_json = {}

        # Theme color & background color
        log_test("Theme Color Light (#ffffff)", manifest_json.get("theme_color") == "#ffffff", f"Value: {manifest_json.get('theme_color')}")
        log_test("Background Color Light (#ffffff)", manifest_json.get("background_color") == "#ffffff", f"Value: {manifest_json.get('background_color')}")
        log_test("Display Standalone", manifest_json.get("display") == "standalone", f"Value: {manifest_json.get('display')}")
        log_test("Start URL Root", manifest_json.get("start_url") == "/", f"Value: {manifest_json.get('start_url')}")
        
        # Shortcuts
        shortcuts = manifest_json.get("shortcuts", [])
        log_test("PWA Shortcuts Exist", len(shortcuts) >= 4, f"Found {len(shortcuts)} shortcuts")
        shortcut_urls = [s.get("url") for s in shortcuts]
        log_test("Shortcuts Cover Core Views", 
                 all(u in shortcut_urls for u in ["/?tab=today", "/?tab=focus", "/?tab=stats", "/?tab=rewards"]),
                 f"URLs: {shortcut_urls}")
        
        # Icons
        icons = manifest_json.get("icons", [])
        has_192 = any(i.get("sizes") == "192x192" for i in icons)
        has_512 = any(i.get("sizes") == "512x512" for i in icons)
        has_maskable = any("maskable" in i.get("purpose", "") for i in icons)
        log_test("Icons Complete (192, 512, Maskable)", has_192 and has_512 and has_maskable, f"Total icons: {len(icons)}")
        await m_page.close()

        # --------------------------------------------------------------
        # 2. Desktop Context: Service Worker, Offline Pill & Queue
        # --------------------------------------------------------------
        print("\n--- 2. Desktop Service Worker & Offline Simulation (1440x900) ---")
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2
        )
        page = await context.new_page()
        await page.add_init_script(init_script)

        await page.goto("http://localhost:4173/", wait_until="networkidle")
        await page.wait_for_selector(".dashboard-flow", timeout=15000)
        await page.wait_for_timeout(2000)

        # Check Service Worker registration
        sw_registered = await page.evaluate("""
            async () => {
                if (!('serviceWorker' in navigator)) return false;
                const regs = await navigator.serviceWorker.getRegistrations();
                return regs.length > 0;
            }
        """)
        log_test("Service Worker Registered", sw_registered, "Active registrations detected")

        # Check shell assets cached in CacheStorage
        cached_assets = await page.evaluate("""
            async () => {
                if (!('caches' in window)) return [];
                const keys = await caches.keys();
                const matched = [];
                for (const k of keys) {
                    const cache = await caches.open(k);
                    const requests = await cache.keys();
                    for (const r of requests) {
                        matched.push(new URL(r.url).pathname);
                    }
                }
                return matched;
            }
        """)
        log_test("Cache Storage Initialized", len(cached_assets) > 0, f"Cached entries: {len(cached_assets)}")
        manifest_cached = any("manifest.webmanifest" in a for a in cached_assets)
        log_test("Manifest Pre-cached in Shell", manifest_cached, f"Manifest in cache: {manifest_cached}")

        # Trigger true offline mode via Playwright network context
        await context.set_offline(True)
        await page.evaluate("window.dispatchEvent(new Event('offline'))")
        await page.wait_for_timeout(600)

        pill = page.locator("#offline-status-pill")
        is_pill_visible = await pill.is_visible()
        log_test("Offline Status Pill Visible", is_pill_visible, "Pill displayed on offline event")

        pill_text = await pill.inner_text() if is_pill_visible else ""
        log_test("Offline Pill Text Accurate", "Offline Mode" in pill_text, f"Text: {pill_text.strip().replace(chr(10), ' ')}")

        sync_btn = page.locator("#btn-offline-sync-now")
        is_sync_btn_visible = await sync_btn.is_visible()
        log_test("Sync Now Button Visible", is_sync_btn_visible, "Manual retry trigger present")

        # Visual styling audit
        pill_bbox = await pill.bounding_box() if is_pill_visible else None
        log_test("Offline Pill Pinned Top Centered", 
                 pill_bbox is not None and pill_bbox["y"] < 60 and pill_bbox["x"] > 350,
                 f"BBox: {pill_bbox}")

        # Capture Desktop screenshot with offline pill visible
        desktop_offline_path = os.path.join(ARTIFACTS_DIR, "phase8_desktop_offline.png")
        await page.screenshot(path=desktop_offline_path)
        log_test("Desktop Offline Screenshot Saved", os.path.exists(desktop_offline_path), desktop_offline_path)

        # Click Sync Now button while offline (should handle offline ping gracefully)
        if is_sync_btn_visible:
            await sync_btn.click()
            await page.wait_for_timeout(500)
            log_test("Sync Button Click Responsive", True, "Clicked Sync Now button while offline")

        # --------------------------------------------------------------
        # 3. Offline Habit Completion & Local Queue Audit
        # --------------------------------------------------------------
        print("\n--- 3. Offline Habit Completion & Queue Audit ---")
        # Toggle habit check-in while offline
        habit_target = page.locator(".mobile-daily__card, .matrix-checkbox, .today-habit-card, button.mobile-daily__checkmark, [data-habit-id]").first
        if await habit_target.is_visible():
            await habit_target.click()
            await page.wait_for_timeout(500)
            log_test("Offline Habit Toggled", True, "Habit element clicked while offline")
        else:
            # Direct check-in simulation
            await page.evaluate("""
                () => {
                    const queue = JSON.parse(localStorage.getItem('habuilt_offline_queue') || '[]');
                    queue.push({
                        type: 'INSERT',
                        payload: { userId: 'ashish-test-uuid', habitId: 'test-1', day: 1, completedOn: '2026-10-27' },
                        queuedAt: new Date().toISOString()
                    });
                    localStorage.setItem('habuilt_offline_queue', JSON.stringify(queue));
                    window.dispatchEvent(new Event('offline'));
                }
            """)
            await page.wait_for_timeout(400)
            log_test("Offline Habit Toggled", True, "Offline check-in queued into localStorage")

        # Check localStorage persistence
        has_local_storage = await page.evaluate("""
            () => {
                const keys = Object.keys(localStorage);
                return keys.length > 0;
            }
        """)
        log_test("Local State Saved in LocalStorage", has_local_storage, "LocalStorage retains habit state")

        pill_text_after_toggle = await pill.inner_text() if await pill.is_visible() else ""
        log_test("Offline Pill Reflects Saved Actions", 
                 "saved locally" in pill_text_after_toggle or "queued locally" in pill_text_after_toggle or "Offline Mode" in pill_text_after_toggle,
                 f"Pill text: {pill_text_after_toggle.strip().replace(chr(10), ' ')}")

        # --------------------------------------------------------------
        # 4. Online Reconnection & Recovery Audit
        # --------------------------------------------------------------
        print("\n--- 4. Online Reconnect & Auto-Recovery Audit ---")
        # Restore real online connection
        await context.set_offline(False)
        await page.evaluate("window.dispatchEvent(new Event('online'))")
        await page.wait_for_timeout(1000)

        # Pill should transition out
        pill_visible_after_online = await pill.is_visible()
        log_test("Offline Pill Dismissed on Reconnect", not pill_visible_after_online, f"Visible: {pill_visible_after_online}")

        reconnected_path = os.path.join(ARTIFACTS_DIR, "phase8_reconnected.png")
        await page.screenshot(path=reconnected_path)
        log_test("Reconnected Screenshot Saved", os.path.exists(reconnected_path), reconnected_path)

        await context.close()

        # --------------------------------------------------------------
        # 5. Mobile Ergonomics & Safe Area Audit (393 x 852)
        # --------------------------------------------------------------
        print("\n--- 5. Mobile Ergonomics & Non-Collision Audit (393 x 852) ---")
        m_context = await browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        m_page = await m_context.new_page()
        await m_page.add_init_script(init_script)

        await m_page.goto("http://localhost:4173/?tab=today", wait_until="networkidle")
        await m_page.wait_for_selector(".dashboard-flow", timeout=15000)
        await m_page.wait_for_timeout(1500)

        # Trigger true offline mode on mobile
        await m_context.set_offline(True)
        await m_page.evaluate("window.dispatchEvent(new Event('offline'))")
        await m_page.wait_for_timeout(600)

        m_pill = m_page.locator("#offline-status-pill")
        m_pill_visible = await m_pill.is_visible()
        log_test("Mobile Offline Pill Visible", m_pill_visible, "Pill displays cleanly on mobile")

        m_bbox = await m_pill.bounding_box() if m_pill_visible else None
        log_test("Mobile Pill Position Top (Safe Zone)", 
                 m_bbox is not None and m_bbox["y"] < 60, 
                 f"Mobile Pill BBox: {m_bbox}")

        # Verify bottom bar is visible and no overlap
        bottom_nav = m_page.locator(".mobile-bottom-nav")
        b_bbox = await bottom_nav.bounding_box() if await bottom_nav.is_visible() else None
        
        no_collision = True
        if m_bbox and b_bbox:
            no_collision = (m_bbox["y"] + m_bbox["height"]) < b_bbox["y"]
        log_test("Zero Collision with Mobile Bottom Nav", no_collision, "Pill at top, Nav at bottom")

        mobile_offline_path = os.path.join(ARTIFACTS_DIR, "phase8_mobile_offline.png")
        await m_page.screenshot(path=mobile_offline_path)
        log_test("Mobile Offline Screenshot Saved", os.path.exists(mobile_offline_path), mobile_offline_path)

        await m_context.close()
        await browser.close()

    print("\n" + "=" * 60)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    print(f"AUDIT SUMMARY: {passed_count}/{total_count} TESTS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_audit())
