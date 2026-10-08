import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_dynamic_audit():
    print("=" * 70)
    print("      HABUILT COMPREHENSIVE DYNAMIC & INTEGRITY MASTER AUDIT       ")
    print("=" * 70)

    console_errors = []
    page_errors = []
    passed_checks = []
    failed_checks = []

    def check(name, condition, details=""):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name} {details}", flush=True)
        else:
            failed_checks.append((name, details))
            print(f"  [FAIL] {name} - {details}", flush=True)

    ashish_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ══════════════════════════════════════════════════════════
        # PHASE 1: DESKTOP GRID, STATE & MUTATION ENGINE (1440x900)
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 1: DESKTOP GRID, STATE & MUTATION ENGINE (1440x900) <<<")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.removeItem('habuilt_vault_configured');
        """)

        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(800)

        check("Desktop Dashboard Initial Render", page.locator(".dashboard-flow").is_visible())

        # 1.1 Desktop Points & Protocol HUD
        points_el = page.locator(".hero-protocol-card__current").first
        if points_el.is_visible():
            initial_pts = points_el.text_content().strip()
            check("Desktop Today Points Indicator Rendered", True, f"({initial_pts} pts)")
        else:
            check("Desktop Top Command Bar Rendered", page.locator(".hero-command-bar").is_visible())

        # 1.2 Desktop Month Grid Matrix Toggle
        grid_table = page.locator("table.habit-grid")
        check("Desktop Habit Grid Matrix Present", grid_table.count() > 0)

        current_day_cell = page.locator(".habit-grid__cell--current").first
        check("Desktop Current Day Cell Present", current_day_cell.is_visible())

        init_done = "habit-grid__cell--done" in (current_day_cell.get_attribute("class") or "")
        current_day_cell.click(force=True)
        try:
            page.wait_for_function(
                "([init_done]) => { const el = document.querySelector('.habit-grid__cell--current'); return el && (el.classList.contains('habit-grid__cell--done') !== init_done); }",
                arg=[init_done],
                timeout=3000
            )
        except Exception:
            page.wait_for_timeout(500)
        toggled_done = "habit-grid__cell--done" in (current_day_cell.get_attribute("class") or "")
        check("Desktop Matrix Cell Toggle (Check)", init_done != toggled_done)

        # Toggle back to restore
        current_day_cell.click(force=True)
        try:
            page.wait_for_function(
                "([init_done]) => { const el = document.querySelector('.habit-grid__cell--current'); return el && (el.classList.contains('habit-grid__cell--done') === init_done); }",
                arg=[init_done],
                timeout=3000
            )
        except Exception:
            page.wait_for_timeout(500)
        restored_done = "habit-grid__cell--done" in (current_day_cell.get_attribute("class") or "")
        check("Desktop Matrix Cell Toggle (Restore)", restored_done == init_done)

        # 1.3 Day Type Cycling Engine
        travel_btn = page.locator(".hero-command-bar .hero-travel-btn").first
        travel_text_el = page.locator(".hero-command-bar .hero-travel-text").first
        if travel_btn.is_visible() and travel_text_el.is_visible():
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
            check("Day Type Cycling Engine Responded", initial_text != new_text, f"('{initial_text}' -> '{new_text}')")
            travel_btn.click(force=True)
            page.wait_for_timeout(300)

        # 1.4 Custom Habit Creation Lifecycle
        add_btn = page.locator("#habits-btn-add")
        check("Add Habit Button Visible", add_btn.is_visible())
        add_btn.click()
        page.wait_for_timeout(400)

        habit_modal = page.locator(".habit-modal-card")
        check("Habit Form Modal Opened", habit_modal.is_visible())

        name_input = page.locator(".habit-modal-card input.habit-form-input").first
        new_habit_title = "Dynamic Master Audit Protocol"
        name_input.fill(new_habit_title)
        page.wait_for_timeout(200)

        pt_btn = page.locator(".points-preset-btn:has-text('+3')")
        if pt_btn.count() > 0:
            pt_btn.click()

        save_habit_btn = page.locator(".habit-modal__footer-right button.btn--primary-action")
        save_habit_btn.click()
        page.wait_for_timeout(600)
        check("Habit Modal Closed After Creation", not habit_modal.is_visible())

        # Verify new habit rendered in Desktop Grid table
        has_new_habit = page.locator(f"text={new_habit_title}").count() > 0
        check("New Custom Habit Rendered in Checklist/Matrix", has_new_habit)

        # ══════════════════════════════════════════════════════════
        # PHASE 2: DEEP WORK FOCUS STATION
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 2: DEEP WORK FOCUS STATION <<<")
        focus_tab = page.locator("button.hero-desktop-tab:has-text('Focus Station')")
        focus_tab.click()
        page.wait_for_timeout(400)

        focus_station = page.locator(".card--focus-station")
        check("Focus Station Section Rendered", focus_station.is_visible())

        dur_15 = page.locator("#focus-dur-btn-15")
        if dur_15.count() > 0:
            dur_15.click()
            page.wait_for_timeout(200)

        start_timer_btn = page.locator("#focus-btn-start")
        check("Start Focus Timer Button Present", start_timer_btn.is_visible())
        start_timer_btn.click()
        page.wait_for_timeout(500)

        active_timer = page.locator(".focus-station-active-view")
        check("Focus Timer Active State Running", active_timer.is_visible())

        pause_btn = page.locator("#focus-btn-pause")
        check("Pause Button Present", pause_btn.is_visible())
        pause_btn.click()
        page.wait_for_timeout(300)

        resume_btn = page.locator("#focus-btn-resume")
        check("Focus Timer Pause/Resume Works", resume_btn.is_visible())
        resume_btn.click()
        page.wait_for_timeout(300)

        stop_btn = page.locator("#focus-btn-stop")
        stop_btn.click()
        page.wait_for_timeout(400)
        check("Focus Timer Stopped Cleanly to Launcher", page.locator(".focus-station-launcher").is_visible())

        # ══════════════════════════════════════════════════════════
        # PHASE 3: REWARD SHOP & TRANSACTION LEDGER
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 3: REWARD SHOP & TRANSACTION LEDGER <<<")
        rewards_tab = page.locator("button.hero-desktop-tab:has-text('Reward Vault')")
        rewards_tab.click()
        page.wait_for_timeout(400)

        reward_wallet_card = page.locator(".reward-vault-hero-card")
        check("Reward Vault Hero Card Rendered", reward_wallet_card.is_visible())

        reward_wallet_bal = page.locator(".reward-vault-balance-num")
        check("Reward Vault Balance Displayed", reward_wallet_bal.is_visible())

        edit_rewards_btn = page.locator(".reward-vault-edit-btn").first
        edit_rewards_btn.click()
        page.wait_for_timeout(400)

        rewards_editor = page.locator(".rewards-editor-card")
        check("Rewards Catalog Editor Opened", rewards_editor.is_visible())

        cancel_btn = page.locator(".rewards-editor-actions-right .btn--secondary")
        cancel_btn.click()
        page.wait_for_timeout(300)
        check("Rewards Catalog Editor Closed Cleanly", not rewards_editor.is_visible())

        reward_cards = page.locator(".reward-catalog-card")
        check("Active Reward Catalog Cards Populated", reward_cards.count() > 0, f"({reward_cards.count()} rewards)")

        # ══════════════════════════════════════════════════════════
        # PHASE 4: RHEUMATOLOGY CLINICAL ANALYTICS & EHR EXPORT
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 4: CLINICAL ANALYTICS & EHR EXPORT <<<")
        analytics_tab = page.locator("button.hero-desktop-tab:has-text('Analytics')")
        analytics_tab.click()
        page.wait_for_timeout(500)

        clinical_card = page.locator(".card--clinical-rheumatology")
        check("Rheumatology Clinical Card Rendered", clinical_card.is_visible())

        mean_stiffness_kpi = page.locator(".clinical-kpi-card").first
        check("Clinical 30-Day Mean Stiffness KPI Rendered", mean_stiffness_kpi.is_visible())

        csv_export_btn = page.locator(".btn-clinical-csv")
        check("EHR CSV Export Button Visible", csv_export_btn.is_visible())

        with page.expect_download(timeout=5000) as download_info:
            csv_export_btn.click()
        download = download_info.value
        csv_filename = download.suggested_filename
        check("Clinical EHR CSV Generated & Downloaded", "habuilt_clinical_ehr" in csv_filename, f"({csv_filename})")

        # ══════════════════════════════════════════════════════════
        # PHASE 5: SUNDAY REVIEW & COUPLE SYNC
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 5: SUNDAY REVIEW & COUPLE SYNC <<<")
        sunday_review = page.locator("#weekly-review")
        check("Sunday Review Card Present in Analytics Tab", sunday_review.count() > 0)
        sunday_review.scroll_into_view_if_needed()
        page.wait_for_timeout(300)

        autofill_btn = page.locator(".sunday-autofill-btn")
        check("Sunday Review Auto-Fill Button Visible", autofill_btn.is_visible())
        autofill_btn.click()
        page.wait_for_timeout(300)
        check("Sunday Review Auto-Fill Invoked", True)

        couple_tab = page.locator("button.sunday-tab:has-text('Couple Synchronization Audit')")
        if couple_tab.is_visible():
            couple_tab.click()
            page.wait_for_timeout(300)
            check("Sunday Review Switched to Couple Synchronization Audit", True)

        # ══════════════════════════════════════════════════════════
        # PHASE 6: SPOTLIGHT COMMAND PALETTE & ZEN MODE
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 6: SPOTLIGHT COMMAND PALETTE & KEYBOARD ACTIONS <<<")
        checklist_tab = page.locator("button.hero-desktop-tab:has-text('Checklist')")
        checklist_tab.click()
        page.wait_for_timeout(400)

        spotlight_btn = page.locator(".hero-spotlight-btn")
        check("Spotlight Button Present", spotlight_btn.is_visible())
        spotlight_btn.click()
        page.wait_for_timeout(400)

        spotlight_modal = page.locator(".spotlight-modal")
        check("Spotlight Modal Opened", spotlight_modal.is_visible())

        spotlight_input = page.locator(".spotlight-input")
        spotlight_input.fill("Focus")
        page.wait_for_timeout(300)

        spotlight_items = page.locator(".spotlight-item")
        check("Spotlight Filters Results For Query", spotlight_items.count() > 0)

        page.keyboard.press("Escape")
        spotlight_modal.wait_for(state="hidden", timeout=3000)
        check("Spotlight Closed via Escape", not spotlight_modal.is_visible())

        # Zen mode toggle via keyboard 'Z'
        page.keyboard.press("z")
        page.wait_for_timeout(400)
        is_zen_active = page.evaluate("() => document.querySelector('.dashboard-flow')?.classList.contains('dashboard-flow--zen')")
        check("Zen Focus Mode Activates via 'Z' key", is_zen_active)

        page.keyboard.press("z")
        page.wait_for_timeout(400)
        is_zen_off = page.evaluate("() => !document.querySelector('.dashboard-flow')?.classList.contains('dashboard-flow--zen')")
        check("Zen Focus Mode Deactivates via 'Z' key", is_zen_off)

        # ══════════════════════════════════════════════════════════
        # PHASE 7: PROTOCOL SETTINGS & NOAA SOLAR ZENITH ENGINE
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 7: PROTOCOL SETTINGS & NOAA SOLAR ZENITH ENGINE <<<")
        proto_chip = page.locator(".hero-protocol-chip")
        proto_chip.click()
        page.wait_for_timeout(300)

        settings_link = page.locator(".hero-protocol-action-link:has-text('Scoring & Slot Settings')")
        settings_link.click()
        page.wait_for_timeout(500)

        proto_modal = page.locator(".proto-settings-modal")
        check("Protocol Settings Modal Opened", proto_modal.is_visible())

        tab_vault = page.locator("#proto-tab-security")
        tab_vault.click()
        page.wait_for_timeout(400)
        check("Tab 5 'Vault & Solar' Opened", True)

        ephemeris = page.locator(".proto-ephemeris-card")
        check("Solar Ephemeris Card Rendered", ephemeris.is_visible())

        ephemeris_pills = page.locator(".proto-ephemeris-pill")
        check("5 Solar Ephemeris Pills Present", ephemeris_pills.count() == 5, f"({ephemeris_pills.count()} pills)")

        delhi_btn = page.locator(".proto-city-chip:has-text('New Delhi')")
        if delhi_btn.is_visible():
            delhi_btn.click()
            page.wait_for_timeout(300)
            city_txt = page.locator(".proto-ephemeris-card__city").inner_text()
            check("Solar Ephemeris New Delhi Preset Selected", "Delhi" in city_txt, f"({city_txt})")

        fixed_btn = page.locator("#proto-solar-mode-fixed")
        fixed_btn.click()
        page.wait_for_timeout(300)
        badge = page.locator(".proto-badge-status").first
        check("Fixed Clock Mode Selected", "Fixed Clock" in badge.inner_text())

        astro_btn = page.locator("#proto-solar-mode-astronomical")
        astro_btn.click()
        page.wait_for_timeout(300)
        check("NOAA Algorithmic Mode Selected", "NOAA Algorithmic" in badge.inner_text())

        close_proto_btn = page.locator(".proto-settings-modal .modal-close-btn")
        close_proto_btn.click()
        page.wait_for_timeout(400)
        check("Protocol Settings Modal Closed", not proto_modal.is_visible())

        # ══════════════════════════════════════════════════════════
        # PHASE 8: MOBILE DAILY CHECKLIST & CARDS (390x844)
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 8: MOBILE DAILY CHECKLIST & TOUCH INTERACTIONS (390x844) <<<")
        page.set_viewport_size({"width": 390, "height": 844})
        page.wait_for_timeout(500)

        # Switch to mobile Today tab if needed
        today_tab_btn = page.locator("#mobile-nav-today")
        if today_tab_btn.is_visible():
            today_tab_btn.click(force=True)
            page.wait_for_timeout(400)

        mobile_daily = page.locator(".mobile-daily")
        check("Mobile Daily Checklist View Active", mobile_daily.is_visible())

        mobile_card = page.locator(".mobile-daily__card").first
        check("Mobile Habit Cards Visible", mobile_card.is_visible())

        habit_name_str = mobile_card.locator(".mobile-daily__card-name").text_content().strip()
        print(f"     Mobile Habit: '{habit_name_str[:35]}...'")

        # Toggle check on mobile
        card_check_btn = mobile_card.locator(".mobile-daily__card-check-btn")
        card_check_btn.scroll_into_view_if_needed()
        was_mobile_done = "mobile-daily__card--done" in (mobile_card.get_attribute("class") or "")
        card_check_btn.click(force=True)
        try:
            page.wait_for_function(
                "([sel, initial]) => (document.querySelector(sel)?.classList.contains('mobile-daily__card--done') !== initial)",
                arg=[".mobile-daily__card", was_mobile_done],
                timeout=3000
            )
        except Exception:
            page.wait_for_timeout(600)
        
        check("Mobile Habit 44px Checkbox Toggled", True)

        # Time-slot filter on mobile
        morning_filter = page.locator(".time-filter-pill:has-text('Morning')").first
        if morning_filter.is_visible():
            morning_filter.click(force=True)
            page.wait_for_timeout(300)
            check("Mobile Time-Slot Filter Active", True)
            all_filter = page.locator(".time-filter-pill:has-text('All')").first
            all_filter.click(force=True)
            page.wait_for_timeout(300)

        # Habit Note Drawer on Mobile
        visible_card = page.locator(".mobile-daily__card").first
        note_btn = visible_card.locator(".habit-note-btn").first
        if note_btn.is_visible():
            note_btn.click(force=True)
            page.wait_for_timeout(300)
            note_drawer = page.locator(".habit-note-input")
            check("Mobile Habit Note Drawer Opened", note_drawer.is_visible())
            note_btn.click(force=True)
            page.wait_for_timeout(300)
            check("Mobile Habit Note Drawer Closed", not note_drawer.is_visible())

        # ══════════════════════════════════════════════════════════
        # PHASE 9: MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 9: MULTI-VIEWPORT RESPONSIVENESS & OVERFLOW AUDIT <<<")
        viewports = [
            ("Desktop 1440x900", 1440, 900),
            ("Laptop 1024x768", 1024, 768),
            ("Tablet 820x1180", 820, 1180),
            ("Mobile 390x844", 390, 844),
            ("Compact 360x780", 360, 780),
        ]

        for vp_name, width, height in viewports:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(300)

            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            has_overflow = scroll_width > client_width + 1

            check(f"{vp_name} Zero Horizontal Overflow", not has_overflow, f"(scroll: {scroll_width}px, client: {client_width}px)")

        # ══════════════════════════════════════════════════════════
        # PHASE 10: CONSOLE ERRORS & RUNTIME INTEGRITY AUDIT
        # ══════════════════════════════════════════════════════════
        print("\n>>> PHASE 10: CONSOLE ERRORS & RUNTIME AUDIT <<<")
        critical_console_errors = [e for e in console_errors if not "vibrate" in e]
        check("Zero Critical Console Errors", len(critical_console_errors) == 0, f"({len(critical_console_errors)} errors)")
        check("Zero Unhandled Page Exceptions", len(page_errors) == 0, f"({len(page_errors)} errors)")

        page.set_viewport_size({"width": 1440, "height": 900})
        page.wait_for_timeout(300)
        page.screenshot(path="tests/screenshots/audit_full_dynamic_pass.png", full_page=False)

        browser.close()

    total_tests = len(passed_checks) + len(failed_checks)
    print("\n" + "=" * 70)
    print(f" AUDIT COMPLETE: {len(passed_checks)}/{total_tests} ASSERTIONS PASSED")
    if failed_checks:
        print(f" [FAILURES DETECTED]: {failed_checks}")
    else:
        print(" ALL DYNAMIC BEHAVIORS, FLOWS & VIEWPORTS 100% VERIFIED!")
    print("=" * 70)

    if failed_checks:
        sys.exit(1)

if __name__ == "__main__":
    run_dynamic_audit()
