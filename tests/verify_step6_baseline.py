import os
import json
import asyncio
from playwright.async_api import async_playwright

test_user = {
    "id": "ashish",
    "email": "ashishgupta1v@gmail.com",
    "user_metadata": {"full_name": "Ashish Gupta"}
}

SCREENSHOT_DIR = r"C:\Users\ashis\.gemini\antigravity-ide\brain\36eaa7a1-e32b-421a-94d0-3e5580d6e994"

async def measure_step6():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Desktop Test (1440x900)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        await page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        await page.goto("http://localhost:4173/", wait_until="networkidle")
        await page.wait_for_selector(".dashboard-flow", timeout=10000)
        await page.wait_for_timeout(1000)
        
        print("=== 1. Desktop Analytics Tab (#analytics) ===")
        stats_tab_btn = page.locator(".hero-desktop-tab", has_text="Analytics")
        await stats_tab_btn.click()
        await page.wait_for_timeout(600)
        
        analytics_sec = page.locator("#analytics")
        if await analytics_sec.count() > 0:
            box = await analytics_sec.bounding_box()
            padding = await analytics_sec.evaluate("el => window.getComputedStyle(el).padding")
            margin = await analytics_sec.evaluate("el => window.getComputedStyle(el).margin")
            print(f"#analytics Section: height={box['height']:.1f}px, y={box['y']:.1f}px, padding={padding}, margin={margin}")
            
        dash = page.locator(".analytics-dashboard")
        if await dash.count() > 0:
            box = await dash.bounding_box()
            gap = await dash.evaluate("el => window.getComputedStyle(el).gap")
            print(f".analytics-dashboard: height={box['height']:.1f}px, gap={gap}")
            
        kpi_grid = page.locator(".analytics-kpi-grid")
        if await kpi_grid.count() > 0:
            box = await kpi_grid.bounding_box()
            first_kpi = page.locator(".analytics-glass-card").first
            kpi_p = await first_kpi.evaluate("el => window.getComputedStyle(el).padding")
            kpi_h = (await first_kpi.bounding_box())['height']
            print(f".analytics-kpi-grid: height={box['height']:.1f}px, first_card height={kpi_h:.1f}px, padding={kpi_p}")
            
        heatmap = page.locator(".analytics-panel--heatmap")
        if await heatmap.count() > 0:
            box = await heatmap.bounding_box()
            p = await heatmap.evaluate("el => window.getComputedStyle(el).padding")
            print(f".analytics-panel--heatmap: height={box['height']:.1f}px, padding={p}")
            
        clinical = page.locator(".card--clinical-rheumatology")
        if await clinical.count() > 0:
            box = await clinical.bounding_box()
            p = await clinical.evaluate("el => window.getComputedStyle(el).padding")
            m = await clinical.evaluate("el => window.getComputedStyle(el).marginTop")
            print(f".card--clinical-rheumatology: height={box['height']:.1f}px, padding={p}, marginTop={m}")
            
        shot_stats = os.path.join(SCREENSHOT_DIR, "step6_baseline_desktop_analytics.png")
        await page.screenshot(path=shot_stats)
        print(f"Saved: {shot_stats}")

        print("\n=== 2. Desktop Rewards Tab (#rewards) ===")
        rewards_tab_btn = page.locator(".hero-desktop-tab", has_text="Reward Vault")
        await rewards_tab_btn.click()
        await page.wait_for_timeout(600)
            
        rewards_sec = page.locator("#rewards")
        if await rewards_sec.count() > 0:
            box = await rewards_sec.bounding_box()
            p = await rewards_sec.evaluate("el => window.getComputedStyle(el).padding")
            print(f"#rewards Section: height={box['height']:.1f}px, y={box['y']:.1f}px, padding={p}")
            
        reward_dash = page.locator(".reward-vault-dashboard")
        if await reward_dash.count() > 0:
            box = await reward_dash.bounding_box()
            gap = await reward_dash.evaluate("el => window.getComputedStyle(el).gap")
            print(f".reward-vault-dashboard: height={box['height']:.1f}px, gap={gap}")
            
        hero_wallet = page.locator(".reward-vault-hero-card")
        if await hero_wallet.count() > 0:
            box = await hero_wallet.bounding_box()
            p = await hero_wallet.evaluate("el => window.getComputedStyle(el).padding")
            print(f".reward-vault-hero-card: height={box['height']:.1f}px, padding={p}")
            
        catalog_grid = page.locator(".rewards-grid")
        if await catalog_grid.count() > 0:
            box = await catalog_grid.bounding_box()
            gap = await catalog_grid.evaluate("el => window.getComputedStyle(el).gap")
            first_card = page.locator(".reward-catalog-card").first
            card_p = await first_card.evaluate("el => window.getComputedStyle(el).padding")
            card_h = (await first_card.bounding_box())['height']
            print(f".rewards-grid: height={box['height']:.1f}px, gap={gap}, first_card height={card_h:.1f}px, padding={card_p}")
            
        shot_rewards = os.path.join(SCREENSHOT_DIR, "step6_baseline_desktop_rewards.png")
        await page.screenshot(path=shot_rewards)
        print(f"Saved: {shot_rewards}")
        await context.close()

        # 3. Mobile Test (375x812)
        m_context = await browser.new_context(viewport={'width': 375, 'height': 812})
        m_page = await m_context.new_page()
        await m_page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        await m_page.goto("http://localhost:4173/", wait_until="networkidle")
        await m_page.wait_for_selector(".dashboard-flow", timeout=10000)
        await m_page.wait_for_timeout(1000)
        
        print("\n=== 3. Mobile Stats Tab (375x812) ===")
        m_stats = m_page.locator("#mobile-nav-stats")
        await m_stats.click()
        await m_page.wait_for_timeout(600)
            
        m_sec = m_page.locator("#analytics")
        if await m_sec.count() > 0:
            box = await m_sec.bounding_box()
            p = await m_sec.evaluate("el => window.getComputedStyle(el).padding")
            print(f"Mobile #analytics Section: height={box['height']:.1f}px, padding={p}")
            
        shot_mstats = os.path.join(SCREENSHOT_DIR, "step6_baseline_mobile_analytics.png")
        await m_page.screenshot(path=shot_mstats)
        print(f"Saved: {shot_mstats}")

        print("\n=== 4. Mobile Rewards Tab (375x812) ===")
        m_rewards = m_page.locator("#mobile-nav-rewards")
        await m_rewards.click()
        await m_page.wait_for_timeout(600)
            
        m_rsec = m_page.locator("#rewards")
        if await m_rsec.count() > 0:
            box = await m_rsec.bounding_box()
            p = await m_rsec.evaluate("el => window.getComputedStyle(el).padding")
            print(f"Mobile #rewards Section: height={box['height']:.1f}px, padding={p}")
            
        shot_mrewards = os.path.join(SCREENSHOT_DIR, "step6_baseline_mobile_rewards.png")
        await m_page.screenshot(path=shot_mrewards)
        print(f"Saved: {shot_mrewards}")
        await m_context.close()
        
        await browser.close()
        print("\n[SUCCESS] Baseline Step 6 measurements completed!")

if __name__ == "__main__":
    asyncio.run(measure_step6())
