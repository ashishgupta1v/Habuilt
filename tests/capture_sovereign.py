import os
import asyncio
from playwright.async_api import async_playwright

async def capture_sovereign_suite():
    os.makedirs("tests/screenshots", exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # 1. Desktop 1440 Dark
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto("http://localhost:4173/", wait_until="networkidle")
        # Launch into Ashish Track if on landing page
        guest_btn = page.locator(".lp__hero-guest-btn:has-text('Ashish Track')").first
        if await guest_btn.count() > 0:
            await guest_btn.click()
            await page.wait_for_timeout(1000)
        
        await page.wait_for_timeout(800)
        await page.screenshot(path="tests/screenshots/sovereign_desktop_dark.png")
        print("Captured sovereign_desktop_dark.png")

        # 2. Open Mastery Index popover on desktop
        chip = page.locator(".hero-level-chip").first
        if await chip.count() > 0:
            await chip.click()
            await page.wait_for_timeout(500)
            await page.screenshot(path="tests/screenshots/sovereign_mastery_index_popover.png")
            print("Captured sovereign_mastery_index_popover.png")
            # Close popover
            close_btn = page.locator(".hero-level-popover__close").first
            if await close_btn.count() > 0:
                await close_btn.click()
                await page.wait_for_timeout(300)

        # 3. Desktop 1440 Light Mode
        theme_btn = page.locator(".hero-icon-btn--theme").first
        if await theme_btn.count() > 0:
            await theme_btn.click()
            await page.wait_for_timeout(600)
            await page.screenshot(path="tests/screenshots/sovereign_desktop_light.png")
            print("Captured sovereign_desktop_light.png")

        # 4. Mobile 390 Dark
        mobile_page = await browser.new_page(viewport={"width": 390, "height": 844})
        await mobile_page.goto("http://localhost:4173/", wait_until="networkidle")
        guest_mobile_btn = mobile_page.locator(".lp__hero-guest-btn:has-text('Ashish Track')").first
        if await guest_mobile_btn.count() > 0:
            await guest_mobile_btn.click()
            await mobile_page.wait_for_timeout(1000)
        await mobile_page.wait_for_timeout(800)
        await mobile_page.screenshot(path="tests/screenshots/sovereign_mobile_dark.png")
        print("Captured sovereign_mobile_dark.png")

        # 5. TopCommandBar close-up screenshot
        cmd_bar = page.locator(".hero-command-bar").first
        if await cmd_bar.count() > 0:
            await cmd_bar.screenshot(path="tests/screenshots/sovereign_top_command_bar.png")
            print("Captured sovereign_top_command_bar.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(capture_sovereign_suite())
