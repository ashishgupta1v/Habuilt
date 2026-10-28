import os
import sys
import json
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"C:\Users\ashis\.gemini\antigravity-ide\brain\36eaa7a1-e32b-421a-94d0-3e5580d6e994"

test_user = {
    "id": "ashish",
    "email": "ashishgupta1v@gmail.com",
    "user_metadata": {"full_name": "Ashish Gupta"}
}

def run_step1_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)

        print("\n--- 1. Testing Desktop Today View (1440x900) ---")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(1000)

        # Overview section
        overview = page.locator("#overview")
        assert overview.is_visible(), "Hero section #overview should be visible"
        today_bbox = overview.bounding_box()
        print(f"Today #overview bounding box: height={today_bbox['height']:.1f}px, y={today_bbox['y']:.1f}px")

        # Verify deck and ribbon exist
        deck = page.locator(".hero-executive-deck")
        ribbon = page.locator(".hero-kpi-ribbon")
        assert deck.count() > 0 and deck.is_visible(), "HeroExecutiveDeck should be mounted and visible on Today tab"
        assert ribbon.count() > 0 and ribbon.is_visible(), "ExecutiveKpiRibbon should be mounted and visible on Today tab"

        today_deck_h = deck.bounding_box()['height']
        today_ribbon_h = ribbon.bounding_box()['height']
        print(f"HeroExecutiveDeck height: {today_deck_h:.1f}px | ExecutiveKpiRibbon height: {today_ribbon_h:.1f}px")

        today_shot = os.path.join(SCREENSHOT_DIR, "step1_desktop_today.png")
        page.screenshot(path=today_shot, full_page=False)
        print(f"Saved: {today_shot}")

        print("\n--- 2. Switching to Focus Station ---")
        focus_tab_btn = page.locator(".hero-desktop-tab", has_text="Focus Station")
        focus_tab_btn.click()
        page.wait_for_timeout(600)

        # Verify decoupling
        assert deck.count() == 0, "HeroExecutiveDeck MUST be unmounted on Focus tab"
        assert ribbon.count() == 0, "ExecutiveKpiRibbon MUST be unmounted on Focus tab"

        focus_overview_bbox = overview.bounding_box()
        print(f"Focus #overview compact height: {focus_overview_bbox['height']:.1f}px (reduced from {today_bbox['height']:.1f}px)")
        assert focus_overview_bbox['height'] < 220, f"Expected compact height < 220px, got {focus_overview_bbox['height']}px"

        focus_station = page.locator(".card--focus-station")
        assert focus_station.is_visible(), "DeepWorkStation must be visible"
        focus_station_bbox = focus_station.bounding_box()
        print(f"Focus station top Y: {focus_station_bbox['y']:.1f}px (previously > 800px)")
        assert focus_station_bbox['y'] < 260, f"Expected Focus station top < 260px, got {focus_station_bbox['y']}px"

        space_saved = today_bbox['height'] - focus_overview_bbox['height']
        print(f"SUCCESS: Reclaimed {space_saved:.1f}px of vertical dead space on Focus tab!")
        assert space_saved > 350, f"Expected space saved > 350px, got {space_saved}px"

        focus_shot = os.path.join(SCREENSHOT_DIR, "step1_desktop_focus.png")
        page.screenshot(path=focus_shot, full_page=False)
        print(f"Saved: {focus_shot}")

        print("\n--- 3. Switching to Performance Analytics ---")
        stats_tab_btn = page.locator(".hero-desktop-tab", has_text="Analytics")
        stats_tab_btn.click()
        page.wait_for_timeout(600)

        assert deck.count() == 0, "HeroExecutiveDeck MUST be unmounted on Analytics tab"
        assert ribbon.count() == 0, "ExecutiveKpiRibbon MUST be unmounted on Analytics tab"

        stats_overview_bbox = overview.bounding_box()
        print(f"Analytics #overview compact height: {stats_overview_bbox['height']:.1f}px")
        assert stats_overview_bbox['height'] < 220

        stats_shot = os.path.join(SCREENSHOT_DIR, "step1_desktop_stats.png")
        page.screenshot(path=stats_shot, full_page=False)
        print(f"Saved: {stats_shot}")

        print("\n--- 4. Switching to Reward Vault ---")
        rewards_tab_btn = page.locator(".hero-desktop-tab", has_text="Reward Vault")
        rewards_tab_btn.click()
        page.wait_for_timeout(600)

        assert deck.count() == 0, "HeroExecutiveDeck MUST be unmounted on Rewards tab"
        assert ribbon.count() == 0, "ExecutiveKpiRibbon MUST be unmounted on Rewards tab"

        rewards_overview_bbox = overview.bounding_box()
        print(f"Rewards #overview compact height: {rewards_overview_bbox['height']:.1f}px")
        assert rewards_overview_bbox['height'] < 220

        reward_shop = page.locator("#rewards")
        assert reward_shop.is_visible(), "RewardShop must be visible"
        reward_bbox = reward_shop.bounding_box()
        print(f"Reward shop top Y: {reward_bbox['y']:.1f}px (previously > 800px)")
        assert reward_bbox['y'] < 260, f"Expected Reward shop top < 260px, got {reward_bbox['y']}px"

        rewards_shot = os.path.join(SCREENSHOT_DIR, "step1_desktop_rewards.png")
        page.screenshot(path=rewards_shot, full_page=False)
        print(f"Saved: {rewards_shot}")

        print("\n--- 5. Switching back to Checklist (Today) ---")
        checklist_tab_btn = page.locator(".hero-desktop-tab", has_text="Checklist")
        checklist_tab_btn.click()
        page.wait_for_timeout(600)

        assert deck.count() > 0 and deck.is_visible(), "HeroExecutiveDeck should cleanly remount on Today tab"
        assert ribbon.count() > 0 and ribbon.is_visible(), "ExecutiveKpiRibbon should cleanly remount on Today tab"
        today_remount_bbox = overview.bounding_box()
        print(f"Remounted Today #overview height: {today_remount_bbox['height']:.1f}px")

        print("\n--- 6. Mobile Viewport (393x852) Smoke Test ---")
        mobile_context = browser.new_context(viewport={"width": 393, "height": 852})
        mobile_page = mobile_context.new_page()
        mobile_page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        mobile_page.goto("http://localhost:4173/", wait_until="networkidle")
        mobile_page.wait_for_selector(".dashboard-flow", timeout=10000)
        mobile_page.wait_for_timeout(800)

        # Switch to Focus tab via mobile bottom nav
        mobile_focus_nav = mobile_page.locator(".mobile-bottom-nav__item", has_text="Focus")
        mobile_focus_nav.click()
        mobile_page.wait_for_timeout(500)

        mobile_focus_station = mobile_page.locator(".card--focus-station")
        assert mobile_focus_station.is_visible(), "Mobile Focus station should be visible"
        mobile_shot = os.path.join(SCREENSHOT_DIR, "step1_mobile_focus.png")
        mobile_page.screenshot(path=mobile_shot, full_page=False)
        print(f"Saved: {mobile_shot}")

        browser.close()
        print("\n==============================================")
        print("ALL STEP 1 TESTS PASSED WITH 100% SUCCESS!")
        print("==============================================")

if __name__ == "__main__":
    run_step1_verification()
