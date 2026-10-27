import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)
artifact_dir = "C:/Users/ashis/.gemini/antigravity-ide/brain/d99f2855-b6e9-4978-93f4-882b90d8e3ac"
os.makedirs(artifact_dir, exist_ok=True)

from playwright.sync_api import sync_playwright

def capture_fitflow_showcase():
    print("Capturing comprehensive Fitflow Framer showcase screenshots...")
    ashish_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Landing Page (Desktop 1440x900)
        ctx_lp = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
        page_lp = ctx_lp.new_page()
        page_lp.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_lp.wait_for_selector(".lp", timeout=12000)
        page_lp.wait_for_timeout(1000)
        
        # Hero Viewport
        lp_desktop_path = "tests/screenshots/fitflow_landing_desktop.png"
        page_lp.screenshot(path=lp_desktop_path)
        page_lp.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_desktop.png"))
        print(f"  [SAVED] Desktop Landing Hero -> {lp_desktop_path}")
        
        # Full Landing Page
        lp_full_path = "tests/screenshots/fitflow_landing_desktop_full.png"
        page_lp.screenshot(path=lp_full_path, full_page=True)
        page_lp.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_desktop_full.png"), full_page=True)
        print(f"  [SAVED] Desktop Landing Full Page -> {lp_full_path}")
        
        # Bento Section
        bento_sec = page_lp.locator(".fitflow-bento-section")
        if bento_sec.count() > 0:
            bento_sec.scroll_into_view_if_needed()
            page_lp.wait_for_timeout(600)
            bento_path = "tests/screenshots/fitflow_landing_bento.png"
            page_lp.screenshot(path=bento_path)
            page_lp.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_bento.png"))
            print(f"  [SAVED] 3D Bento Props Section -> {bento_path}")
            
        # Playground Section
        play_sec = page_lp.locator(".fitflow-playground-section")
        if play_sec.count() > 0:
            play_sec.scroll_into_view_if_needed()
            page_lp.wait_for_timeout(600)
            play_path = "tests/screenshots/fitflow_landing_playground.png"
            page_lp.screenshot(path=play_path)
            page_lp.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_playground.png"))
            print(f"  [SAVED] Interactive Habit Playground -> {play_path}")
            
        # Menu Modal
        page_lp.evaluate("window.scrollTo(0, 0)")
        page_lp.wait_for_timeout(300)
        menu_btn = page_lp.locator("button.fitflow-pill-btn--menu")
        if menu_btn.count() > 0:
            menu_btn.click()
            page_lp.wait_for_timeout(500)
            menu_path = "tests/screenshots/fitflow_menu_open.png"
            page_lp.screenshot(path=menu_path)
            page_lp.screenshot(path=os.path.join(artifact_dir, "fitflow_menu_open.png"))
            print(f"  [SAVED] Navigation Menu Modal -> {menu_path}")
            
        ctx_lp.close()

        # 2. Landing Page (Mobile 390x844)
        ctx_lp_mob = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page_lp_mob = ctx_lp_mob.new_page()
        page_lp_mob.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_lp_mob.wait_for_selector(".lp", timeout=12000)
        page_lp_mob.wait_for_timeout(1000)
        lp_mob_path = "tests/screenshots/fitflow_landing_mobile.png"
        page_lp_mob.screenshot(path=lp_mob_path)
        page_lp_mob.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_mobile.png"))
        print(f"  [SAVED] Mobile Landing -> {lp_mob_path}")
        
        lp_mob_full_path = "tests/screenshots/fitflow_landing_mobile_full.png"
        page_lp_mob.screenshot(path=lp_mob_full_path, full_page=True)
        page_lp_mob.screenshot(path=os.path.join(artifact_dir, "fitflow_landing_mobile_full.png"), full_page=True)
        print(f"  [SAVED] Mobile Landing Full -> {lp_mob_full_path}")
        ctx_lp_mob.close()

        # 3. Desktop Dashboard (1440x900)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1.5)
        page = ctx.new_page()
        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_theme', 'light');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=12000)
        page.wait_for_timeout(1000)
        dash_path = "tests/screenshots/fitflow_dashboard_desktop.png"
        page.screenshot(path=dash_path)
        page.screenshot(path=os.path.join(artifact_dir, "fitflow_dashboard_desktop.png"))
        print(f"  [SAVED] Desktop Dashboard -> {dash_path}")
        
        # 4. Deep Work Focus Station
        focus_tab = page.locator("button.hero-desktop-tab:has-text('Focus Station')")
        if focus_tab.count() > 0:
            focus_tab.click()
            page.wait_for_timeout(800)
            page.locator(".card--focus-station").scroll_into_view_if_needed()
            page.wait_for_timeout(400)
            focus_path = "tests/screenshots/fitflow_focus_desktop.png"
            page.screenshot(path=focus_path)
            page.screenshot(path=os.path.join(artifact_dir, "fitflow_focus_desktop.png"))
            print(f"  [SAVED] Focus Station -> {focus_path}")
            
        # 5. Reward Vault
        rewards_tab = page.locator("button.hero-desktop-tab:has-text('Reward Vault')")
        if rewards_tab.count() > 0:
            rewards_tab.click()
            page.wait_for_timeout(800)
            page.locator(".reward-vault-hero-card").scroll_into_view_if_needed()
            page.wait_for_timeout(400)
            rewards_path = "tests/screenshots/fitflow_rewards_desktop.png"
            page.screenshot(path=rewards_path)
            page.screenshot(path=os.path.join(artifact_dir, "fitflow_rewards_desktop.png"))
            print(f"  [SAVED] Reward Vault -> {rewards_path}")

        # 6. Habit Form Modal (Desktop)
        checklist_tab = page.locator("button.hero-desktop-tab:has-text('Checklist')")
        if checklist_tab.count() > 0:
            checklist_tab.click()
            page.wait_for_timeout(600)
        add_btn = page.locator("#habits-btn-add")
        if add_btn.count() > 0:
            add_btn.scroll_into_view_if_needed()
            add_btn.click()
            page.wait_for_timeout(600)
            modal_path = "tests/screenshots/fitflow_habit_modal.png"
            page.screenshot(path=modal_path)
            page.screenshot(path=os.path.join(artifact_dir, "fitflow_habit_modal.png"))
            print(f"  [SAVED] Habit Form Modal -> {modal_path}")
            close_btn = page.locator(".habit-modal__close-btn")
            if close_btn.count() > 0:
                close_btn.click()
                page.wait_for_timeout(300)
            
        ctx.close()
        
        # 7. Mobile 390x844 Daily Checklist & HUD
        ctx_mob = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        page_mob = ctx_mob.new_page()
        page_mob.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_theme', 'light');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        page_mob.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_mob.wait_for_selector(".dashboard-flow", timeout=12000)
        page_mob.wait_for_timeout(1000)
        
        mob_tab_today = page_mob.locator("#mobile-nav-today")
        if mob_tab_today.count() > 0:
            mob_tab_today.click(force=True)
            page_mob.wait_for_timeout(600)
            
        mob_path = "tests/screenshots/fitflow_mobile_daily.png"
        page_mob.screenshot(path=mob_path)
        page_mob.screenshot(path=os.path.join(artifact_dir, "fitflow_mobile_daily.png"))
        print(f"  [SAVED] Mobile Checklist View -> {mob_path}")

        # 8. Check a habit on mobile to trigger the optimistic undo toast!
        check_target = page_mob.locator(".mobile-habit-checkbox").first
        if check_target.count() > 0:
            check_target.click()
            page_mob.wait_for_timeout(600)
            undo_toast_path = "tests/screenshots/fitflow_mobile_undo_toast.png"
            page_mob.screenshot(path=undo_toast_path)
            page_mob.screenshot(path=os.path.join(artifact_dir, "fitflow_mobile_undo_toast.png"))
            print(f"  [SAVED] Mobile Optimistic Undo Toast -> {undo_toast_path}")

        ctx_mob.close()
        
        browser.close()
        print("All Fitflow Framer showcase screenshots captured successfully!")

if __name__ == '__main__':
    capture_fitflow_showcase()
