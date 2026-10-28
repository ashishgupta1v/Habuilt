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

async def verify_step6():
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
        
        print("\n--- 1. Testing Desktop Performance Analytics View (1440x900) ---")
        stats_tab_btn = page.locator(".hero-desktop-tab", has_text="Analytics")
        await stats_tab_btn.click()
        await page.wait_for_timeout(700)
        
        analytics_sec = page.locator("#analytics")
        analytics_box = await analytics_sec.bounding_box()
        analytics_p = await analytics_sec.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized #analytics Section: height={analytics_box['height']:.1f}px (was 1263.7px), padding={analytics_p}")
        
        dash = page.locator(".analytics-dashboard")
        dash_box = await dash.bounding_box()
        dash_gap = await dash.evaluate("el => window.getComputedStyle(el).gap")
        print(f"Optimized .analytics-dashboard: height={dash_box['height']:.1f}px (was 1148.2px), gap={dash_gap}")
        
        kpi_grid = page.locator(".analytics-kpi-grid")
        first_kpi = page.locator(".analytics-glass-card").first
        kpi_box = await first_kpi.bounding_box()
        kpi_p = await first_kpi.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized KPI Glass Card: height={kpi_box['height']:.1f}px (was 129.6px), padding={kpi_p}")
        
        heatmap = page.locator(".analytics-panel--heatmap")
        hm_box = await heatmap.bounding_box()
        hm_p = await heatmap.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized Heatmap Panel: height={hm_box['height']:.1f}px (was 146.2px), padding={hm_p}")
        
        clinical = page.locator(".card--clinical-rheumatology")
        clin_box = await clinical.bounding_box()
        clin_p = await clinical.evaluate("el => window.getComputedStyle(el).padding")
        clin_m = await clinical.evaluate("el => window.getComputedStyle(el).marginTop")
        print(f"Optimized Clinical Card: height={clin_box['height']:.1f}px (was 531.6px), padding={clin_p}, marginTop={clin_m}")
        
        shot_stats = os.path.join(SCREENSHOT_DIR, "step6_analytics_desktop.png")
        await page.screenshot(path=shot_stats)
        print(f"Saved: {shot_stats}")

        print("\n--- 2. Testing Desktop Reward Vault View (1440x900) ---")
        rewards_tab_btn = page.locator(".hero-desktop-tab", has_text="Reward Vault")
        await rewards_tab_btn.click()
        await page.wait_for_timeout(700)
            
        rewards_sec = page.locator("#rewards")
        rewards_box = await rewards_sec.bounding_box()
        rewards_p = await rewards_sec.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized #rewards Section: height={rewards_box['height']:.1f}px (was 1343.1px), padding={rewards_p}")
        
        reward_dash = page.locator(".reward-vault-dashboard")
        rdash_box = await reward_dash.bounding_box()
        rdash_gap = await reward_dash.evaluate("el => window.getComputedStyle(el).gap")
        print(f"Optimized .reward-vault-dashboard: height={rdash_box['height']:.1f}px (was 1227.6px), gap={rdash_gap}")
        
        hero_wallet = page.locator(".reward-vault-hero-card")
        wallet_box = await hero_wallet.bounding_box()
        wallet_p = await hero_wallet.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized Hero Wallet Card: height={wallet_box['height']:.1f}px (was 186.8px), padding={wallet_p}")
        
        catalog_grid = page.locator(".rewards-grid")
        grid_box = await catalog_grid.bounding_box()
        grid_gap = await catalog_grid.evaluate("el => window.getComputedStyle(el).gap")
        first_card = page.locator(".reward-catalog-card").first
        first_card_box = await first_card.bounding_box()
        card_p = await first_card.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized Voucher Grid: height={grid_box['height']:.1f}px (was 670.1px), gap={grid_gap}")
        print(f"Optimized Single Voucher Card: height={first_card_box['height']:.1f}px (was 122.8px), padding={card_p}")
        
        shot_rewards = os.path.join(SCREENSHOT_DIR, "step6_rewards_desktop.png")
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
        
        print("\n--- 3. Testing Mobile Stats Tab (375x812) ---")
        m_stats = m_page.locator("#mobile-nav-stats")
        await m_stats.click()
        await m_page.wait_for_timeout(700)
            
        m_sec = m_page.locator("#analytics")
        m_box = await m_sec.bounding_box()
        m_p = await m_sec.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized Mobile #analytics Section: height={m_box['height']:.1f}px (was 2119.6px), padding={m_p}")
        
        shot_mstats = os.path.join(SCREENSHOT_DIR, "step6_analytics_mobile.png")
        await m_page.screenshot(path=shot_mstats)
        print(f"Saved: {shot_mstats}")

        print("\n--- 4. Testing Mobile Rewards Tab (375x812) ---")
        m_rewards = m_page.locator("#mobile-nav-rewards")
        await m_rewards.click()
        await m_page.wait_for_timeout(700)
            
        m_rsec = m_page.locator("#rewards")
        m_rbox = await m_rsec.bounding_box()
        m_rp = await m_rsec.evaluate("el => window.getComputedStyle(el).padding")
        print(f"Optimized Mobile #rewards Section: height={m_rbox['height']:.1f}px (was 1870.6px), padding={m_rp}")
        
        shot_mrewards = os.path.join(SCREENSHOT_DIR, "step6_rewards_mobile.png")
        await m_page.screenshot(path=shot_mrewards)
        print(f"Saved: {shot_mrewards}")
        await m_context.close()
        
        await browser.close()
        print("\n[SUCCESS] Step 6 verification and measurements completed!")

if __name__ == "__main__":
    asyncio.run(verify_step6())
