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

def run_step2_verification():
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

        # Overview section metrics
        overview = page.locator("#overview")
        assert overview.is_visible(), "Hero section #overview should be visible"
        overview_bbox = overview.bounding_box()
        print(f"Optimized Today #overview height: {overview_bbox['height']:.1f}px (previously 742.1px)")
        assert overview_bbox['height'] < 580, f"Expected #overview height < 580px, got {overview_bbox['height']}px"

        # Deck metrics
        deck = page.locator(".hero-executive-deck")
        deck_bbox = deck.bounding_box()
        print(f"Optimized Executive Deck height: {deck_bbox['height']:.1f}px (previously 312.2px)")
        assert deck_bbox['height'] < 230, f"Expected deck height < 230px, got {deck_bbox['height']}px"

        # Protocol Card & Gauge metrics
        proto_card = page.locator(".hero-protocol-card")
        proto_bbox = proto_card.bounding_box()
        print(f"Optimized Protocol Card height: {proto_bbox['height']:.1f}px (previously 312.2px)")
        assert proto_bbox['height'] < 230, f"Expected protocol card height < 230px, got {proto_bbox['height']}px"

        gauge_wrap = page.locator(".hero-protocol-card__gauge-wrap")
        assert gauge_wrap.is_visible(), "Gauge wrap should be visible"
        svg_ring = page.locator(".hero-protocol-card__svg-ring")
        assert svg_ring.is_visible(), "SVG ring should be visible"
        svg_bbox = svg_ring.bounding_box()
        print(f"SVG Ring dimensions: {svg_bbox['width']:.1f}x{svg_bbox['height']:.1f}px (previously 88x88px unstyled)")
        assert svg_bbox['width'] <= 30, f"Expected SVG ring width <= 30px, got {svg_bbox['width']}px"

        # KPI Ribbon metrics
        kpi_ribbon = page.locator(".hero-kpi-ribbon")
        ribbon_bbox = kpi_ribbon.bounding_box()
        print(f"Optimized KPI Ribbon height: {ribbon_bbox['height']:.1f}px (previously 132.8px)")
        assert ribbon_bbox['height'] < 125, f"Expected KPI Ribbon height < 125px, got {ribbon_bbox['height']}px"

        kpi_card = page.locator(".hero-kpi-card").first
        kpi_card_bbox = kpi_card.bounding_box()
        print(f"Optimized KPI Card height: {kpi_card_bbox['height']:.1f}px (previously 132.8px)")
        assert kpi_card_bbox['height'] < 125, f"Expected KPI Card height < 125px, got {kpi_card_bbox['height']}px"

        total_saved_today = 742.1 - overview_bbox['height']
        print(f"\n>>> SUCCESS: Reclaimed {total_saved_today:.1f}px of vertical dead space on Today Tab! <<<")
        assert total_saved_today >= 150, f"Expected space saved >= 150px, got {total_saved_today}px"

        today_shot = os.path.join(SCREENSHOT_DIR, "step2_desktop_today.png")
        page.screenshot(path=today_shot, full_page=False)
        print(f"Saved: {today_shot}")

        print("\n--- 2. Testing Tab Transitions ---")
        # Focus tab
        page.locator(".hero-desktop-tab", has_text="Focus Station").click()
        page.wait_for_timeout(500)
        focus_shot = os.path.join(SCREENSHOT_DIR, "step2_desktop_focus.png")
        page.screenshot(path=focus_shot, full_page=False)
        print(f"Saved: {focus_shot}")

        # Stats tab
        page.locator(".hero-desktop-tab", has_text="Analytics").click()
        page.wait_for_timeout(500)
        stats_shot = os.path.join(SCREENSHOT_DIR, "step2_desktop_stats.png")
        page.screenshot(path=stats_shot, full_page=False)
        print(f"Saved: {stats_shot}")

        # Rewards tab
        page.locator(".hero-desktop-tab", has_text="Reward Vault").click()
        page.wait_for_timeout(500)
        rewards_shot = os.path.join(SCREENSHOT_DIR, "step2_desktop_rewards.png")
        page.screenshot(path=rewards_shot, full_page=False)
        print(f"Saved: {rewards_shot}")

        # Remount Today tab
        page.locator(".hero-desktop-tab", has_text="Checklist").click()
        page.wait_for_timeout(500)
        assert deck.is_visible() and kpi_ribbon.is_visible(), "Deck and ribbon should cleanly remount"

        print("\n--- 3. Mobile Viewport (393x852) Smoke Test ---")
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

        mobile_shot = os.path.join(SCREENSHOT_DIR, "step2_mobile_today.png")
        mobile_page.screenshot(path=mobile_shot, full_page=False)
        print(f"Saved: {mobile_shot}")

        browser.close()
        print("\n==============================================")
        print("ALL STEP 2 TESTS PASSED WITH 100% SUCCESS!")
        print("==============================================")

if __name__ == "__main__":
    run_step2_verification()
