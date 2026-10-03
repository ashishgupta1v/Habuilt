import sys
import os
import json

# Ensure UTF-8 output encoding on Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_tests():
    console_errors = []
    page_errors = []
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

        # ──────────────────────────────────────────────────────────
        # 1. DESKTOP TEST (1440x900)
        # ──────────────────────────────────────────────────────────
        print("\n=== RUNNING DESKTOP (1440x900) SUITE ===")
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[Desktop] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(f"[Desktop] {str(err)}"))
        page.on("response", lambda r: print(f"[404 URL]: {r.status} {r.url}") if r.status == 404 else None)

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)

        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(500)

        # 1.1 Verify Dashboard Loads
        dashboard = page.locator(".dashboard-flow")
        record_result("Desktop Dashboard Render", dashboard.count() > 0)

        # 1.2 Verify TopCommandBar Brand & Identity
        hero_bar = page.locator(".hero-command-bar")
        record_result("TopCommandBar Exists", hero_bar.count() > 0)

        track_pill = page.locator(".hero-track-pill")
        record_result("User Track Pill", "Ashish" in track_pill.inner_text())

        # 1.3 Verify Consolidated Quick Tools Menu [•••]
        tools_trigger = page.locator(".hero-tools-trigger")
        record_result("Quick Tools Trigger Button Exists", tools_trigger.count() > 0)
        tools_trigger.click()
        page.wait_for_timeout(300)
        
        tools_dropdown = page.locator(".hero-tools-dropdown")
        record_result("Quick Tools Dropdown Opens", tools_dropdown.is_visible())
        
        # Click trigger to close
        tools_trigger.click()
        tools_dropdown.wait_for(state="hidden", timeout=3000)
        record_result("Quick Tools Dropdown Closes on Re-click", not tools_dropdown.is_visible())

        # 1.4 Test Day Type Cycle Button
        travel_btn = page.locator(".hero-command-bar .hero-travel-btn").first
        travel_text_el = page.locator(".hero-command-bar .hero-travel-text").first
        if travel_btn.count() > 0 and travel_text_el.count() > 0:
            initial_text = travel_text_el.inner_text().strip()
            travel_btn.click(force=True)
            try:
                page.wait_for_function(
                    "(initial) => document.querySelector('.hero-command-bar .hero-travel-text')?.innerText.trim() !== initial",
                    arg=initial_text,
                    timeout=3000
                )
            except Exception:
                page.wait_for_timeout(500)
            new_text = travel_text_el.inner_text().strip()
            record_result("Day Type Cycle Button Works", initial_text != new_text, f"({initial_text} -> {new_text})")
            # cycle back
            travel_btn.click(force=True)
            page.wait_for_timeout(300)

        # 1.5 Test Desktop Navigation Tabs
        checklist_tab = page.locator("button.hero-desktop-tab:has-text('Checklist')")
        focus_tab = page.locator("button.hero-desktop-tab:has-text('Focus Station')")
        stats_tab = page.locator("button.hero-desktop-tab:has-text('Analytics')")
        rewards_tab = page.locator("button.hero-desktop-tab:has-text('Reward Vault')")

        record_result("Desktop Tabs Found", all([t.count() > 0 for t in [checklist_tab, focus_tab, stats_tab, rewards_tab]]))

        # 1.6 Habit Creation Flow (Modal)
        add_btn = page.locator("#habits-btn-add")
        record_result("Add Habit Button Exists", add_btn.count() > 0)
        add_btn.click()
        page.wait_for_timeout(400)

        habit_modal = page.locator(".habit-modal-card")
        record_result("Habit Form Modal Opens", habit_modal.is_visible())

        title_input = page.locator(".habit-modal-card input.habit-form-input").first
        new_habit_title = "Deep System Architecture Flow"
        title_input.fill(new_habit_title)
        
        # Select 3 points preset
        pt_btn = page.locator(".points-preset-btn:has-text('+3')")
        if pt_btn.count() > 0:
            pt_btn.click()

        # Submit form
        save_btn = page.locator(".habit-modal__footer-right button.btn--primary-action")
        save_btn.click()
        page.wait_for_timeout(500)
        record_result("Habit Form Modal Closes Upon Save", not habit_modal.is_visible())
        
        # Verify habit appears in checklist/matrix
        page_has_habit = page.locator(f"text={new_habit_title}").count() > 0
        record_result("New Habit Rendered in Checklist", page_has_habit)

        # 1.7 Test Desktop Habit Matrix Interaction
        grid_table = page.locator("table.habit-grid")
        record_result("Desktop Habit Grid Matrix Exists", grid_table.count() > 0)

        current_cell = page.locator(".habit-grid__cell--current").first
        record_result("Desktop Current Day Cell Found", current_cell.count() > 0)

        initial_cls = current_cell.get_attribute("class") or ""
        current_cell.click(force=True)
        try:
            page.wait_for_function(
                "(initial) => document.querySelector('.habit-grid__cell--current')?.className !== initial",
                arg=initial_cls,
                timeout=3000
            )
        except Exception:
            page.wait_for_timeout(500)
        after_cls = current_cell.get_attribute("class") or ""
        record_result("Desktop Matrix Cell Toggle State Changed", initial_cls != after_cls)

        # Revert back
        current_cell.click(force=True)
        page.wait_for_timeout(300)

        # 1.8 Focus Station Flow
        focus_tab.click()
        page.wait_for_timeout(400)
        focus_station = page.locator(".card--focus-station")
        record_result("Focus Station Tab Renders", focus_station.is_visible())

        dur_15 = page.locator("#focus-dur-btn-15")
        if dur_15.count() > 0:
            dur_15.click()
            page.wait_for_timeout(200)

        start_timer_btn = page.locator("#focus-btn-start")
        record_result("Focus Station Start Button Exists", start_timer_btn.is_visible())
        start_timer_btn.click()
        page.wait_for_timeout(500)

        active_timer_view = page.locator(".focus-station-active-view")
        record_result("Focus Station Active Timer View Running", active_timer_view.is_visible())

        # Test Pause
        pause_btn = page.locator("#focus-btn-pause")
        record_result("Focus Timer Pause Button Exists", pause_btn.is_visible())
        pause_btn.click()
        page.wait_for_timeout(300)

        resume_btn = page.locator("#focus-btn-resume")
        record_result("Focus Timer Can Be Paused & Resume Appears", resume_btn.is_visible())

        # Test Resume
        resume_btn.click()
        page.wait_for_timeout(300)

        # Test End Early
        stop_btn = page.locator("#focus-btn-stop")
        stop_btn.click()
        page.wait_for_timeout(400)
        launcher_view = page.locator(".focus-station-launcher")
        record_result("Focus Timer Resets to Launcher", launcher_view.is_visible())

        # 1.9 Analytics Tab
        stats_tab.click()
        page.wait_for_timeout(400)
        record_result("Analytics Tab Renders", page.locator("#analytics").is_visible())

        # 1.10 Reward Shop Tab & Catalog Flow
        rewards_tab.click()
        page.wait_for_timeout(400)
        reward_hero = page.locator(".reward-vault-hero-card")
        record_result("Reward Shop Tab Renders Hero Card", reward_hero.is_visible())

        reward_wallet = page.locator(".reward-vault-balance-num")
        record_result("Reward Wallet Points Displayed", reward_wallet.is_visible())

        edit_rewards_btn = page.locator(".reward-vault-edit-btn").first
        edit_rewards_btn.click()
        page.wait_for_timeout(350)
        rewards_editor = page.locator(".rewards-editor-card")
        record_result("Rewards Catalog Editor Opens", rewards_editor.is_visible())

        # Cancel editor
        cancel_edit_btn = page.locator(".rewards-editor-actions-right .btn--secondary")
        cancel_edit_btn.click()
        page.wait_for_timeout(300)
        record_result("Rewards Catalog Editor Closes", not rewards_editor.is_visible())

        reward_cards = page.locator(".reward-catalog-card")
        record_result("Active Reward Catalog Cards Populated", reward_cards.count() > 0, f"({reward_cards.count()} rewards)")

        # Switch back to Checklist
        checklist_tab.click()
        page.wait_for_timeout(400)

        # 1.11 Spotlight Command Palette Flow
        spotlight_btn = page.locator(".hero-spotlight-btn")
        record_result("Spotlight Button Exists", spotlight_btn.count() > 0)
        spotlight_btn.click()
        page.wait_for_timeout(400)

        spotlight_modal = page.locator(".spotlight-modal")
        record_result("Spotlight Command Palette Opens", spotlight_modal.is_visible())

        spotlight_input = page.locator(".spotlight-input")
        spotlight_input.fill("Focus")
        page.wait_for_timeout(300)

        spotlight_items = page.locator(".spotlight-item")
        record_result("Spotlight Filters Results For Query", spotlight_items.count() > 0)

        # Press Escape to close
        page.keyboard.press("Escape")
        spotlight_modal.wait_for(state="hidden", timeout=3000)
        record_result("Spotlight Closes on Escape", not spotlight_modal.is_visible())

        # 1.12 Protocol Switcher & Protocol Settings Modal Flow
        proto_chip = page.locator(".hero-protocol-chip")
        proto_chip.click()
        page.wait_for_timeout(300)

        proto_dropdown = page.locator(".hero-protocol-dropdown")
        record_result("Protocol Dropdown Opens", proto_dropdown.is_visible())

        settings_link = page.locator(".hero-protocol-action-link:has-text('Scoring & Slot Settings')")
        settings_link.click()
        page.wait_for_timeout(400)

        proto_settings_modal = page.locator(".proto-settings-modal")
        record_result("Protocol Settings Modal Opens", proto_settings_modal.is_visible())

        # Test tabs inside modal
        slots_tab = page.locator(".proto-settings-tab:has-text('Time Slot Windows')")
        slots_tab.click()
        page.wait_for_timeout(300)
        record_result("Protocol Settings Slots Tab Works", slots_tab.get_attribute("class") and "proto-settings-tab--active" in slots_tab.get_attribute("class"))

        presets_tab = page.locator(".proto-settings-tab:has-text('Preset Library')")
        presets_tab.click()
        page.wait_for_timeout(300)
        record_result("Protocol Settings Presets Tab Works", presets_tab.get_attribute("class") and "proto-settings-tab--active" in presets_tab.get_attribute("class"))

        # Close settings modal
        page.locator(".proto-settings-modal .modal-close-btn").click()
        page.wait_for_timeout(350)
        record_result("Protocol Settings Modal Closes", not proto_settings_modal.is_visible())

        # Switch to Mind-Body Longevity Protocol
        proto_chip.click()
        page.wait_for_timeout(300)
        longevity_option = page.locator(".hero-protocol-option:has-text('Mind-Body Longevity')")
        if longevity_option.count() > 0:
            longevity_option.click(force=True)
            page.wait_for_timeout(600)
            record_result("Switched to Mind-Body Longevity Protocol", "Mind-Body" in proto_chip.inner_text() or page.locator("text=Activated").count() > 0)

        # 1.13 Check Horizontal Layout Overflow
        is_overflowing = page.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        record_result("Desktop Zero Horizontal Overflow", not is_overflowing)

        # Screenshot Desktop
        page.screenshot(path="tests/screenshots/desktop_1440.png", full_page=True)
        context.close()

        # ──────────────────────────────────────────────────────────
        # 2. TABLET TEST (820x1180 - iPad Air)
        # ──────────────────────────────────────────────────────────
        print("\n=== RUNNING TABLET (820x1180) SUITE ===")
        context_tab = browser.new_context(
            viewport={"width": 820, "height": 1180},
            device_scale_factor=2
        )
        page_tab = context_tab.new_page()
        page_tab.on("console", lambda msg: console_errors.append(f"[Tablet] {msg.text}") if msg.type == "error" else None)
        page_tab.on("pageerror", lambda err: page_errors.append(f"[Tablet] {str(err)}"))

        page_tab.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)
        page_tab.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_tab.wait_for_selector(".dashboard-flow", timeout=10000)
        page_tab.wait_for_timeout(500)

        tab_overflow = page_tab.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        record_result("Tablet Zero Horizontal Overflow", not tab_overflow)

        page_tab.screenshot(path="tests/screenshots/tablet_820.png")
        context_tab.close()

        # ──────────────────────────────────────────────────────────
        # 3. MOBILE PWA TEST (390x844 - iPhone 14)
        # ──────────────────────────────────────────────────────────
        print("\n=== RUNNING MOBILE (390x844) SUITE ===")
        context_mob = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page_mob = context_mob.new_page()
        page_mob.on("console", lambda msg: console_errors.append(f"[Mobile] {msg.text}") if msg.type == "error" else None)
        page_mob.on("pageerror", lambda err: page_errors.append(f"[Mobile] {str(err)}"))
        page_mob.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)
        page_mob.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_mob.wait_for_selector(".dashboard-flow", timeout=10000)
        page_mob.wait_for_selector(".mobile-compact-bar", timeout=10000)
        page_mob.wait_for_timeout(500)

        # 3.1 Verify Slim 52px Mobile Header
        mcb = page_mob.locator(".mobile-compact-bar")
        record_result("Mobile Compact Bar Visible", mcb.is_visible())
        
        mcb_height = page_mob.evaluate("() => document.querySelector('.mobile-compact-bar')?.offsetHeight || 0")
        record_result("Mobile Bar Slim Height (52px range)", mcb_height <= 60, f"({mcb_height}px)")

        # Desktop hero should be hidden on mobile
        desktop_hero = page_mob.locator(".mobile-tab-hero")
        record_result("Desktop Hero Hidden on Mobile", not desktop_hero.is_visible())

        # 3.2 Verify Expandable Quick HUD
        expand_btn = page_mob.locator(".mcb-btn--expand")
        record_result("Expand Button Exists", expand_btn.count() > 0)
        expand_btn.click()
        page_mob.wait_for_timeout(350)

        drawer = page_mob.locator(".mcb-expanded-drawer")
        record_result("Mobile Quick HUD Expands", drawer.is_visible())

        # Close drawer
        expand_btn.click()
        try:
            drawer.wait_for(state="hidden", timeout=3000)
        except Exception:
            page_mob.wait_for_timeout(500)
        record_result("Mobile Quick HUD Collapses", not drawer.is_visible())

        # 3.3 Verify Mobile Tools Sheet
        tools_btn = page_mob.locator(".mcb-btn--tools")
        tools_btn.click()
        page_mob.wait_for_timeout(350)
        
        tools_sheet = page_mob.locator(".mcb-tools-sheet")
        record_result("Mobile Tools Bottom Sheet Opens", tools_sheet.is_visible())

        # Close sheet
        page_mob.locator(".mcb-tools-close").click(force=True)
        page_mob.wait_for_timeout(300)
        record_result("Mobile Tools Bottom Sheet Closes", not tools_sheet.is_visible())

        # 3.4 Verify Mobile Bottom Nav 4 Tabs
        mob_nav = page_mob.locator(".mobile-bottom-nav")
        record_result("Mobile Bottom Nav Visible", mob_nav.is_visible())

        # Click Focus tab on mobile
        page_mob.locator("#mobile-nav-focus").click(force=True)
        page_mob.wait_for_timeout(400)
        record_result("Mobile Focus Tab Navigates", page_mob.locator(".card--focus-station").is_visible())

        # Click Stats tab on mobile
        page_mob.locator("#mobile-nav-stats").click(force=True)
        page_mob.wait_for_timeout(400)
        record_result("Mobile Stats Tab Navigates", page_mob.locator("#analytics").is_visible())

        # Click Rewards tab on mobile
        page_mob.locator("#mobile-nav-rewards").click(force=True)
        page_mob.wait_for_timeout(400)
        record_result("Mobile Rewards Tab Navigates", page_mob.locator("#rewards, .reward-shop").count() > 0)

        # Click Today tab on mobile
        page_mob.locator("#mobile-nav-today").click(force=True)
        page_mob.wait_for_timeout(400)
        record_result("Mobile Today Tab Navigates Back", page_mob.locator("#habits").is_visible())

        # 3.5 Test Habit Check on Mobile
        mob_card = page_mob.locator(".mobile-daily__card").first
        mob_check = mob_card.locator(".mobile-daily__card-check-btn")
        was_done = "mobile-daily__card--done" in (mob_card.get_attribute("class") or "")
        mob_check.scroll_into_view_if_needed()
        mob_check.click()
        page_mob.wait_for_timeout(400)
        is_done_now = "mobile-daily__card--done" in (mob_card.get_attribute("class") or "")
        record_result("Mobile 44px Checkbox Toggles Successfully", was_done != is_done_now, f"(was_done={was_done}, is_done_now={is_done_now})")
        mob_check.click()
        page_mob.wait_for_timeout(300)

        # 3.5.1 Test Mobile Habit Note Drawer
        note_btn = mob_card.locator(".habit-note-btn")
        note_btn.click()
        page_mob.wait_for_timeout(300)
        note_input = page_mob.locator(".habit-note-input")
        record_result("Mobile Habit Note Drawer Opens", note_input.is_visible())
        note_btn.click()
        page_mob.wait_for_timeout(200)

        # 3.6 Check Mobile Horizontal Overflow
        mob_overflow = page_mob.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        record_result("Mobile Zero Horizontal Overflow", not mob_overflow)

        page_mob.screenshot(path="tests/screenshots/mobile_390.png")
        context_mob.close()

        # ──────────────────────────────────────────────────────────
        # 4. LIGHT / DARK MODE THEME SWITCH TEST
        # ──────────────────────────────────────────────────────────
        print("\n=== RUNNING THEME SWITCH TEST ===")
        context_theme = browser.new_context(viewport={"width": 1440, "height": 900})
        page_theme = context_theme.new_page()
        page_theme.on("console", lambda msg: console_errors.append(f"[Theme] {msg.text}") if msg.type == "error" else None)
        page_theme.on("pageerror", lambda err: page_errors.append(f"[Theme] {str(err)}"))

        page_theme.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_theme', 'dark');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)
        page_theme.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_theme.wait_for_selector(".dashboard-flow", timeout=10000)
        page_theme.wait_for_timeout(500)

        theme_btn = page_theme.locator(".hero-icon-btn--theme")
        is_dark_initial = page_theme.evaluate("() => document.body.classList.contains('theme-dark') || document.body.classList.contains('dark-mode')")
        
        theme_btn.click()
        page_theme.wait_for_timeout(600)
        is_dark_after = page_theme.evaluate("() => document.body.classList.contains('theme-dark') || document.body.classList.contains('dark-mode')")
        
        record_result("Theme Switcher Toggles (Dark <-> Light)", is_dark_initial != is_dark_after, f"({is_dark_initial} -> {is_dark_after})")
        page_theme.screenshot(path="tests/screenshots/light_mode_1440.png")

        # Toggle back to dark
        theme_btn.click()
        page_theme.wait_for_timeout(300)
        context_theme.close()

        # ──────────────────────────────────────────────────────────
        # 5. FRESH LANDING PAGE & GUEST ONBOARDING SUITE
        # ──────────────────────────────────────────────────────────
        print("\n=== RUNNING AUTH & GUEST ONBOARDING SUITE ===")
        context_auth = browser.new_context(viewport={"width": 1440, "height": 900})
        page_auth = context_auth.new_page()
        page_auth.on("console", lambda msg: console_errors.append(f"[Auth] {msg.text}") if msg.type == "error" else None)
        page_auth.on("pageerror", lambda err: page_errors.append(f"[Auth] {str(err)}"))

        # Navigate fresh with no localStorage
        page_auth.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_auth.wait_for_timeout(600)

        landing_el = page_auth.locator(".lp")
        record_result("Landing Page Renders For New Visitor", landing_el.is_visible())

        ashish_launch_btn = page_auth.locator(".lp__hero-guest-btn:has-text('Ashish Track')")
        jyoti_launch_btn = page_auth.locator(".lp__hero-guest-btn:has-text('Jyoti Track')")
        record_result("One-Tap Track Preview Buttons Exist", ashish_launch_btn.is_visible() and jyoti_launch_btn.is_visible())

        page_auth.screenshot(path="tests/screenshots/landing_page_1440.png")

        # Launch Ashish Track
        ashish_launch_btn.click()
        page_auth.wait_for_selector(".dashboard-flow", timeout=10000)
        page_auth.wait_for_timeout(500)
        record_result("Guest Ashish Track Launches Into Dashboard", page_auth.locator(".dashboard-flow").is_visible())

        # Test Track Switching via User Badge
        user_badge = page_auth.locator(".user-badge")
        record_result("Top Nav User Badge Visible in Guest Session", user_badge.is_visible())

        user_badge.click()
        page_auth.wait_for_timeout(600)
        hero_track = page_auth.locator(".hero-track-pill")
        record_result("Track Switcher Changes to Jyoti System", "Jyoti" in hero_track.inner_text())

        page_auth.screenshot(path="tests/screenshots/jyoti_track_1440.png")
        context_auth.close()

        browser.close()

    # Final Summary
    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    print(f"\n==========================================")
    print(f"TEST RUN COMPLETE: {passed}/{total} PASSED ({failed} FAILED)")
    print(f"Console Errors: {len(console_errors)}")
    print(f"Page Errors: {len(page_errors)}")
    print(f"==========================================")

    if console_errors:
        print("\nConsole errors encountered:")
        for e in console_errors[:10]:
            print(f"  - {e}")

    if page_errors:
        print("\nPage errors encountered:")
        for pe in page_errors[:10]:
            print(f"  - {pe}")

    if failed > 0 or len(page_errors) > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_tests()
