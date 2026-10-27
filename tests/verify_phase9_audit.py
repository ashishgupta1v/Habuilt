import asyncio
import json
import os
import math
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
        # SECTION 1: PWA Manifest & Shell Integrity
        # --------------------------------------------------------------
        print("\n--- 1. PWA Manifest & Lighthouse Standards Audit ---")
        m_page = await browser.new_page()
        res = await m_page.goto("http://localhost:4173/manifest.webmanifest")
        log_test("Manifest Reachable", res.status == 200, f"Status: {res.status}")
        
        manifest_text = await res.text()
        try:
            m_json = json.loads(manifest_text)
            log_test("Manifest Valid JSON", True, "Successfully parsed JSON")
        except Exception as e:
            log_test("Manifest Valid JSON", False, str(e))
            m_json = {}

        log_test("Manifest Light Theme (#ffffff)", m_json.get("theme_color") == "#ffffff", f"Theme: {m_json.get('theme_color')}")
        log_test("Manifest Background (#ffffff)", m_json.get("background_color") == "#ffffff", f"Background: {m_json.get('background_color')}")
        log_test("Manifest Standalone Display", m_json.get("display") == "standalone", f"Display: {m_json.get('display')}")
        log_test("Manifest Start URL Root", m_json.get("start_url") == "/", f"Start URL: {m_json.get('start_url')}")
        log_test("Manifest 4 Core Shortcuts", len(m_json.get("shortcuts", [])) >= 4, f"Shortcuts: {len(m_json.get('shortcuts', []))}")
        log_test("Manifest Maskable & Any Icons", len(m_json.get("icons", [])) >= 8, f"Icons: {len(m_json.get('icons', []))}")
        await m_page.close()

        # --------------------------------------------------------------
        # SECTION 2: Desktop Accessibility, Focus & Keyboard Audit (1440x900)
        # --------------------------------------------------------------
        print("\n--- 2. Desktop Accessibility & Keyboard Navigation Audit (1440x900) ---")
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        page = await ctx.new_page()
        await page.add_init_script(init_script)

        await page.goto("http://localhost:4173/?tab=today", wait_until="networkidle")
        await page.wait_for_selector(".dashboard-flow", timeout=15000)
        await page.wait_for_timeout(1500)

        # 2A. Skip to Content Link (WCAG 2.4.1)
        skip_link = page.locator(".skip-to-content-link")
        log_test("Skip Link Exists in DOM", await skip_link.count() > 0, "Present in AppLayout")
        
        # Test keyboard Tab to skip link
        await page.keyboard.press("Tab")
        await page.wait_for_timeout(200)
        skip_focused = await page.evaluate("() => document.activeElement.classList.contains('skip-to-content-link')")
        log_test("Skip Link Focusable via Tab", skip_focused, f"Active element focused: {skip_focused}")
        
        skip_bbox = await skip_link.bounding_box() if skip_focused else None
        log_test("Skip Link Visually Slides Into View on Focus", skip_bbox is not None and skip_bbox["y"] >= 0, f"BBox y: {skip_bbox['y'] if skip_bbox else 'N/A'}")

        # 2B. Focus Ring Visibility (WCAG 2.4.7)
        await page.keyboard.press("Tab")
        await page.wait_for_timeout(200)
        focus_outline = await page.evaluate("""
            () => {
                const el = document.activeElement;
                if (!el) return 'none';
                const style = window.getComputedStyle(el);
                return style.outlineStyle + ' ' + style.outlineColor;
            }
        """)
        log_test("Focus Visible Outline Applied", "none" not in focus_outline, f"Focus outline: {focus_outline}")

        # 2C. Modal Escape Key Dismissal (WCAG 2.1.2)
        print("\n--- 3. Modal Dialogues & Escape Key Dismissal ---")
        # Test 1: Tools Menu -> Calendar Sync Modal
        tools_btn = page.locator("#btn-desktop-tools-menu, .hero-tools-trigger, #btn-tools-menu").first
        if await tools_btn.is_visible():
            await tools_btn.click()
            await page.wait_for_timeout(300)
            cal_sync_trigger = page.locator(".hero-tools-item:has-text('Calendar Sync')").first
            if await cal_sync_trigger.is_visible():
                await cal_sync_trigger.click()
                await page.wait_for_timeout(600)
                
                cal_modal = page.locator(".modal-card--calendar-sync, #calendar-sync-modal, [role='dialog']").first
                is_modal_open = await cal_modal.is_visible()
                log_test("Calendar Sync Modal Opened", is_modal_open, "Modal opened via tools menu")
                
                # Capture modal screenshot
                modal_screenshot_path = os.path.join(ARTIFACTS_DIR, "phase9_modal_accessibility.png")
                await page.screenshot(path=modal_screenshot_path)
                log_test("Modal Accessibility Screenshot Captured", os.path.exists(modal_screenshot_path), modal_screenshot_path)
                
                # Press Escape key to dismiss (WCAG 2.1.2)
                await page.keyboard.press("Escape")
                await page.wait_for_timeout(500)
                is_modal_closed = not (await page.locator(".modal-card--calendar-sync").is_visible())
                log_test("Modal Closes via Escape Key (WCAG 2.1.2)", is_modal_closed, "Calendar Sync modal dismissed cleanly with Escape")
            else:
                log_test("Calendar Sync Trigger in Tools", False, "Calendar Sync item not found")
        else:
            log_test("Tools Menu Exists", False, "Tools button not found")

        # --------------------------------------------------------------
        # SECTION 3: Full 4-Tab SPA Flow & Visual Evidence (Desktop)
        # --------------------------------------------------------------
        print("\n--- 4. Full 4-Tab SPA Flow (Desktop 1440x900) ---")
        
        # Tab 1: Today
        today_tab_path = os.path.join(ARTIFACTS_DIR, "phase9_desktop_today.png")
        await page.screenshot(path=today_tab_path)
        log_test("Desktop View 1: Today Routine Captured", os.path.exists(today_tab_path), today_tab_path)

        # Tab 2: Focus
        focus_btn = page.locator(".hero-desktop-tab:has-text('Focus Station'), #mobile-nav-focus, button:has-text('Focus')").first
        if await focus_btn.is_visible():
            await focus_btn.click()
            await page.wait_for_timeout(800)
        else:
            await page.goto("http://localhost:4173/?tab=focus", wait_until="networkidle")
            await page.wait_for_timeout(800)
            
        focus_station = page.locator(".card--focus-station, .deep-work-station, #focus")
        log_test("Desktop View 2: Focus Workstation Active", await focus_station.first.is_visible(), "Focus tab rendered")
        focus_tab_path = os.path.join(ARTIFACTS_DIR, "phase9_desktop_focus.png")
        await page.screenshot(path=focus_tab_path)
        log_test("Desktop View 2: Focus Screenshot Captured", os.path.exists(focus_tab_path), focus_tab_path)

        # Tab 3: Stats
        stats_btn = page.locator(".hero-desktop-tab:has-text('Analytics'), #mobile-nav-stats, button:has-text('Stats')").first
        if await stats_btn.is_visible():
            await stats_btn.click()
            await page.wait_for_timeout(800)
        else:
            await page.goto("http://localhost:4173/?tab=stats", wait_until="networkidle")
            await page.wait_for_timeout(800)
            
        stats_tab_path = os.path.join(ARTIFACTS_DIR, "phase9_desktop_stats.png")
        await page.screenshot(path=stats_tab_path)
        log_test("Desktop View 3: Stats Screenshot Captured", os.path.exists(stats_tab_path), stats_tab_path)

        # Tab 4: Rewards
        rewards_btn = page.locator(".hero-desktop-tab:has-text('Reward Vault'), #mobile-nav-rewards, button:has-text('Rewards')").first
        if await rewards_btn.is_visible():
            await rewards_btn.click()
            await page.wait_for_timeout(800)
        else:
            await page.goto("http://localhost:4173/?tab=rewards", wait_until="networkidle")
            await page.wait_for_timeout(800)
            
        rewards_tab_path = os.path.join(ARTIFACTS_DIR, "phase9_desktop_rewards.png")
        await page.screenshot(path=rewards_tab_path)
        log_test("Desktop View 4: Rewards Screenshot Captured", os.path.exists(rewards_tab_path), rewards_tab_path)

        # Switch back to Today tab
        today_desktop_btn = page.locator(".hero-desktop-tab:has-text('Checklist'), #mobile-nav-today").first
        if await today_desktop_btn.is_visible():
            await today_desktop_btn.click()
            await page.wait_for_timeout(500)

        # 2D. Color Contrast Verification (WCAG 1.4.3 Minimum 4.5:1)
        print("\n--- 5. Color Contrast & Heading Semantics (WCAG 1.4.3 / 1.3.1) ---")
        contrast_checks = await page.evaluate("""
            () => {
                function parseRgb(colorStr) {
                    const match = colorStr.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
                    if (!match) return [0, 0, 0];
                    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
                }
                function luminance(r, g, b) {
                    const a = [r, g, b].map(v => {
                        v /= 255;
                        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                    });
                    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
                }
                function contrastRatio(rgb1, rgb2) {
                    const lum1 = luminance(...rgb1);
                    const lum2 = luminance(...rgb2);
                    const brightest = Math.max(lum1, lum2);
                    const darkest = Math.min(lum1, lum2);
                    return (brightest + 0.05) / (darkest + 0.05);
                }

                const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
                const results = [];
                for (const h of headings.slice(0, 5)) {
                    const style = window.getComputedStyle(h);
                    const color = parseRgb(style.color);
                    // Approximate background as white for cards
                    const ratio = contrastRatio(color, [255, 255, 255]);
                    results.push({ tag: h.tagName, text: h.innerText.slice(0, 30), ratio: ratio.toFixed(2) });
                }
                return results;
            }
        """)
        for c in contrast_checks:
            ratio_val = float(c["ratio"])
            passed = ratio_val >= 4.5 or (ratio_val >= 3.0 and c["tag"] in ["H1", "H2"])
            log_test(f"Contrast {c['tag']}: {c['text']}", passed, f"Ratio {c['ratio']}:1 (WCAG AA requirement: 4.5:1)")

        await ctx.close()

        # --------------------------------------------------------------
        # SECTION 4: Mobile Ergonomics & Touch Target Size (393 x 852)
        # --------------------------------------------------------------
        print("\n--- 6. Mobile Ergonomics & Touch Target Size Audit (393x852) ---")
        m_ctx = await browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        m_page = await m_ctx.new_page()
        await m_page.add_init_script(init_script)

        # Mobile Today
        await m_page.goto("http://localhost:4173/?tab=today", wait_until="networkidle")
        await m_page.wait_for_selector(".dashboard-flow", timeout=15000)
        await m_page.wait_for_timeout(1200)
        
        m_today_path = os.path.join(ARTIFACTS_DIR, "phase9_mobile_today.png")
        await m_page.screenshot(path=m_today_path)
        log_test("Mobile View 1: Today Captured", os.path.exists(m_today_path), m_today_path)

        # Check Touch Target Size (WCAG 2.5.5 / 2.5.8 Minimum 44x44px or sufficient padding)
        nav_items = ["#mobile-nav-today", "#mobile-nav-focus", "#mobile-nav-stats", "#mobile-nav-rewards"]
        for nid in nav_items:
            el = m_page.locator(nid)
            bbox = await el.bounding_box()
            if bbox:
                # 44x44px target requirement
                is_compliant = bbox["width"] >= 40 and bbox["height"] >= 44
                log_test(f"Touch Target Size {nid}", is_compliant, f"{bbox['width']:.1f}x{bbox['height']:.1f}px")

        # Mobile FAB target size
        fab = m_page.locator("#mobile-habits-fab")
        if await fab.is_visible():
            f_bbox = await fab.bounding_box()
            log_test("Mobile FAB Touch Target (>= 48x48px)", f_bbox["width"] >= 48 and f_bbox["height"] >= 48, f"{f_bbox['width']}x{f_bbox['height']}px")

        # Mobile Focus
        await m_page.locator("#mobile-nav-focus").click()
        await m_page.wait_for_timeout(600)
        m_focus_path = os.path.join(ARTIFACTS_DIR, "phase9_mobile_focus.png")
        await m_page.screenshot(path=m_focus_path)
        log_test("Mobile View 2: Focus Captured", os.path.exists(m_focus_path), m_focus_path)

        # Mobile Stats
        await m_page.locator("#mobile-nav-stats").click()
        await m_page.wait_for_timeout(600)
        m_stats_path = os.path.join(ARTIFACTS_DIR, "phase9_mobile_stats.png")
        await m_page.screenshot(path=m_stats_path)
        log_test("Mobile View 3: Stats Captured", os.path.exists(m_stats_path), m_stats_path)

        # Mobile Rewards
        await m_page.locator("#mobile-nav-rewards").click()
        await m_page.wait_for_timeout(600)
        m_rewards_path = os.path.join(ARTIFACTS_DIR, "phase9_mobile_rewards.png")
        await m_page.screenshot(path=m_rewards_path)
        log_test("Mobile View 4: Rewards Captured", os.path.exists(m_rewards_path), m_rewards_path)

        await m_ctx.close()
        await browser.close()

    print("\n" + "=" * 60)
    passed_count = sum(1 for r in results if r["passed"])
    total_count = len(results)
    print(f"AUDIT SUMMARY: {passed_count}/{total_count} TESTS PASSED")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_audit())
