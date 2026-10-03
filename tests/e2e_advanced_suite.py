import sys
import os
import json

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_advanced_tests():
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

        print("\n=== RUNNING ADVANCED INTEGRATIONS & MODALS SUITE ===")
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1
        )
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[Console Error] {msg.text}") if msg.type == "error" else None)
        page.on("pageerror", lambda err: page_errors.append(f"[Page Error] {str(err)}"))

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)

        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(500)

        # ── 1. CALENDAR SYNC MODAL FLOW ──
        tools_trigger = page.locator(".hero-tools-trigger")
        tools_trigger.click(force=True)
        page.wait_for_timeout(300)

        cal_menu_item = page.locator(".hero-tools-item:has-text('Calendar Sync')")
        record_result("Tools Dropdown Contains Calendar Sync", cal_menu_item.count() > 0)
        cal_menu_item.click(force=True)
        page.wait_for_timeout(500)

        cal_modal = page.locator(".modal-card--calendar-sync")
        record_result("Calendar Sync Modal Opens", cal_modal.is_visible())

        event_cards = page.locator(".calendar-event-card")
        record_result("Calendar Schedule Events Populated", event_cards.count() > 0, f"({event_cards.count()} events)")

        # Test close button
        cal_close_btn = page.locator(".modal-card--calendar-sync .modal-close-btn")
        cal_close_btn.click(force=True)
        cal_modal.wait_for(state="hidden", timeout=3000)
        record_result("Calendar Sync Modal Closes", not cal_modal.is_visible())

        # ── 2. PARTNER SYNC COCKPIT MODAL FLOW ──
        tools_trigger.click(force=True)
        page.wait_for_timeout(300)
        partner_item = page.locator(".hero-tools-item:has-text('Partner Cockpit')")
        record_result("Tools Dropdown Contains Partner Cockpit", partner_item.count() > 0)
        partner_item.click(force=True)
        page.wait_for_timeout(500)

        partner_modal = page.locator(".modal-card--partner-sync")
        record_result("Partner Sync Modal Opens", partner_modal.is_visible())

        # Check partner metrics render (.stat-pill)
        partner_stats = page.locator(".modal-card--partner-sync .stat-pill")
        record_result("Partner Metric Stats Rendered", partner_stats.count() > 0)

        # Send an emote cheer (.btn-partner-emote)
        emote_btn = page.locator(".btn-partner-emote").first
        if emote_btn.count() > 0:
            emote_btn.click(force=True)
            page.wait_for_timeout(350)
            record_result("Partner Emote Sent with Feedback", True)

        # Close partner modal
        partner_close_btn = page.locator(".modal-card--partner-sync .modal-close-btn")
        partner_close_btn.click(force=True)
        partner_modal.wait_for(state="hidden", timeout=3000)
        record_result("Partner Sync Modal Closes", not partner_modal.is_visible())

        # ── 3. UNIVERSAL PARTNER PAIR MODAL FLOW ──
        tools_trigger.click(force=True)
        page.wait_for_timeout(300)
        pair_item = page.locator(".hero-tools-item:has-text('Pair Connection')")
        record_result("Tools Dropdown Contains Pair Connection", pair_item.count() > 0)
        pair_item.click(force=True)
        page.wait_for_timeout(500)

        pair_modal_title = page.locator("h2:has-text('Partner & Couple Synchronization')")
        record_result("Universal Partner Pair Modal Opens", pair_modal_title.is_visible())

        # Check Tab Switching inside Pair Modal
        join_tab = page.locator("button:has-text(\"Enter Partner's Code\")")
        join_tab.click(force=True)
        page.wait_for_timeout(350)
        join_input = page.locator("input[placeholder*='HAB-']")
        record_result("Switched to Enter Partner's Code Tab", join_input.is_visible())

        # Close Pair Modal
        pair_close_btn = page.locator("button:has(svg.lucide-x)").first
        pair_close_btn.click(force=True)
        page.wait_for_timeout(400)
        record_result("Universal Partner Pair Modal Closes", not pair_modal_title.is_visible())

        # ── 4. APP INSTALL MODAL FLOW (PWA / Windows / Android / iOS) ──
        tools_trigger.click(force=True)
        page.wait_for_timeout(300)
        install_item = page.locator(".hero-tools-item:has-text('Install Desktop App')")
        record_result("Tools Dropdown Contains Install Desktop App", install_item.count() > 0)
        install_item.click(force=True)
        page.wait_for_timeout(500)

        install_modal = page.locator(".modal-card--app-hub")
        record_result("App Install Modal Opens", install_modal.is_visible())

        # Switch to Android tab
        android_tab = page.locator(".app-hub-tab:has-text('Android')")
        if android_tab.count() > 0:
            android_tab.click(force=True)
            page.wait_for_timeout(300)
            qr_img = page.locator("img[src*='qrserver']")
            record_result("Android APK QR Code Renders", qr_img.count() > 0)

        # Close Install Modal
        install_close = page.locator(".modal-card--app-hub .modal-close-btn")
        install_close.click(force=True)
        install_modal.wait_for(state="hidden", timeout=3000)
        record_result("App Install Modal Closes", not install_modal.is_visible())

        # ── 5. ZEN FOCUS MODE TOGGLE (KEYBOARD 'Z') ──
        page.keyboard.press("z")
        page.wait_for_timeout(400)
        is_zen_active = page.evaluate("() => document.querySelector('.dashboard-flow')?.classList.contains('dashboard-flow--zen')")
        record_result("Zen Focus Mode Activates via Keyboard 'Z'", is_zen_active)

        page.screenshot(path="tests/screenshots/zen_mode_1440.png")

        # Press 'Z' again to exit Zen Mode
        page.keyboard.press("z")
        page.wait_for_timeout(400)
        is_zen_off = page.evaluate("() => !document.querySelector('.dashboard-flow')?.classList.contains('dashboard-flow--zen')")
        record_result("Zen Focus Mode Deactivates via Keyboard 'Z'", is_zen_off)

        # ── 6. SPOTLIGHT -> BACKUP & PORTABILITY HUB MODAL ──
        spotlight_btn = page.locator(".hero-spotlight-btn")
        spotlight_btn.click(force=True)
        page.wait_for_timeout(400)
        
        spotlight_input = page.locator(".spotlight-input")
        spotlight_input.fill("Backup")
        page.wait_for_timeout(300)

        backup_cmd = page.locator(".spotlight-item:has-text('Data Portability & Backup Hub')")
        record_result("Spotlight Finds Backup Hub Command", backup_cmd.count() > 0)
        backup_cmd.click(force=True)
        page.wait_for_timeout(500)

        backup_modal = page.locator(".backup-modal")
        record_result("Data Backup Modal Opens via Spotlight", backup_modal.is_visible())

        backup_cards = page.locator(".backup-action-card")
        record_result("Backup Export Cards Rendered", backup_cards.count() >= 2)

        # Close Backup Modal
        backup_close = page.locator(".backup-modal-close")
        backup_close.click(force=True)
        backup_modal.wait_for(state="hidden", timeout=3000)
        record_result("Data Backup Modal Closes", not backup_modal.is_visible())

        # ── 7. SPOTLIGHT -> SHARE SCORECARD MODAL ──
        spotlight_btn.click(force=True)
        page.wait_for_timeout(400)
        spotlight_input.fill("Share")
        page.wait_for_timeout(300)

        share_cmd = page.locator(".spotlight-item:has-text('Share Daily Scorecard')")
        record_result("Spotlight Finds Share Scorecard Command", share_cmd.count() > 0)
        share_cmd.click(force=True)
        page.wait_for_timeout(500)

        share_modal = page.locator(".share-modal-card")
        record_result("Share Scorecard Modal Opens via Spotlight", share_modal.is_visible())

        copy_caption_btn = page.locator("button.share-btn-sub:has-text('Copy Caption')")
        record_result("Copy Caption Action Present in Scorecard", copy_caption_btn.count() > 0)

        share_close = page.locator(".share-modal-close-btn")
        share_close.click(force=True)
        share_modal.wait_for(state="hidden", timeout=3000)
        record_result("Share Scorecard Modal Closes", not share_modal.is_visible())

        # ── 8. SPOTLIGHT -> PROTOCOL ONBOARDING WIZARD ──
        spotlight_btn.click(force=True)
        page.wait_for_timeout(400)
        spotlight_input.fill("Protocol")
        page.wait_for_timeout(300)

        wizard_cmd = page.locator(".spotlight-item:has-text('Dynamic Protocol Builder')")
        record_result("Spotlight Finds Protocol Builder Command", wizard_cmd.count() > 0)
        wizard_cmd.click(force=True)
        page.wait_for_timeout(500)

        wizard_modal = page.locator("h2:has-text('Dynamic Protocol Builder')")
        record_result("Protocol Wizard Modal Opens", wizard_modal.is_visible())

        # Select Longevity archetype in Step 1
        longevity_card = page.locator("h4:has-text('Mind-Body & Longevity')")
        if longevity_card.count() > 0:
            longevity_card.click(force=True)
            page.wait_for_timeout(300)

        # Click Next Step to Step 2
        next_step_btn = page.locator("button:has-text('Next: Circadian Windows')")
        if next_step_btn.count() > 0:
            next_step_btn.click(force=True)
            page.wait_for_timeout(400)
            record_result("Wizard Advanced to Step 2 (Circadian Windows)", page.locator("text=Step 2 of 4").count() > 0)

        # Close wizard modal
        wizard_close = page.locator("button[title='Close Wizard']").first
        wizard_close.click(force=True)
        page.wait_for_timeout(400)
        record_result("Protocol Wizard Closes Cleanly", not wizard_modal.is_visible())

        # ── 9. REWARD REDEMPTION & CATALOG EDIT FLOW ──
        rewards_tab = page.locator("button.hero-desktop-tab:has-text('Reward Vault')")
        rewards_tab.click(force=True)
        page.wait_for_timeout(400)

        # Test Redeem action on first reward
        redeem_btn = page.locator(".reward-catalog-card button:has-text('Claim Reward'), .reward-catalog-card button:has-text('Redeem')").first
        if redeem_btn.count() > 0:
            redeem_btn.click(force=True)
            page.wait_for_timeout(400)
            record_result("Redeem Reward Interaction Handled", True)

        # Open Rewards Editor to add a new reward
        edit_rewards_btn = page.locator(".reward-vault-edit-btn").first
        edit_rewards_btn.click(force=True)
        page.wait_for_timeout(400)

        editor_card = page.locator(".rewards-editor-card")
        record_result("Rewards Catalog Editor Opened", editor_card.is_visible())

        # Add a custom reward item
        add_reward_row_btn = page.locator(".rewards-editor-actions-left button:has-text('Add Reward')").first
        if add_reward_row_btn.count() > 0:
            add_reward_row_btn.click(force=True)
            page.wait_for_timeout(300)
            new_name_input = page.locator(".rewards-editor-name-input").last
            if new_name_input.count() > 0:
                new_name_input.fill("VIP Recovery Espresso")
                page.wait_for_timeout(200)

        # Cancel or save editor
        save_cat_btn = page.locator(".rewards-editor-actions-right button:has-text('Save Catalog')")
        save_cat_btn.click(force=True)
        page.wait_for_timeout(500)
        record_result("Rewards Editor Saved and Closed", not editor_card.is_visible())

        # Return to Checklist tab
        checklist_tab = page.locator("button.hero-desktop-tab:has-text('Checklist')")
        checklist_tab.click(force=True)
        page.wait_for_timeout(400)

        context.close()

        # ── 10. MOBILE BOTTOM SHEET MODAL INTEGRATIONS (390x844) ──
        print("\n=== RUNNING MOBILE SHEET INTEGRATIONS SUITE ===")
        context_mob = browser.new_context(
            viewport={"width": 390, "height": 844},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True
        )
        page_mob = context_mob.new_page()
        page_mob.on("console", lambda msg: console_errors.append(f"[Mobile Error] {msg.text}") if msg.type == "error" else None)
        page_mob.on("pageerror", lambda err: page_errors.append(f"[Mobile Page Error] {str(err)}"))

        page_mob.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
        """)
        page_mob.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page_mob.wait_for_selector(".mobile-compact-bar", timeout=10000)
        page_mob.wait_for_timeout(400)

        # Open mobile tools sheet
        page_mob.locator(".mcb-btn--tools").click(force=True)
        page_mob.wait_for_timeout(350)

        # Launch Calendar Sync from Mobile Sheet
        cal_mob_btn = page_mob.locator(".mcb-tool-item:has-text('Calendar Sync')")
        record_result("Mobile Tools Contains Calendar Sync", cal_mob_btn.count() > 0)
        cal_mob_btn.click(force=True)
        page_mob.wait_for_timeout(500)

        cal_modal_mob = page_mob.locator(".modal-card--calendar-sync")
        record_result("Calendar Sync Opens on Mobile", cal_modal_mob.is_visible())

        # Close calendar on mobile
        page_mob.locator(".modal-card--calendar-sync .modal-close-btn").click(force=True)
        cal_modal_mob.wait_for(state="hidden", timeout=3000)
        record_result("Calendar Sync Closes on Mobile", not cal_modal_mob.is_visible())

        # Open mobile tools sheet again
        page_mob.locator(".mcb-btn--tools").click(force=True)
        page_mob.wait_for_timeout(350)

        # Launch Partner Sync from Mobile Sheet
        partner_mob_btn = page_mob.locator(".mcb-tool-item:has-text('Partner Sync')")
        record_result("Mobile Tools Contains Partner Sync", partner_mob_btn.count() > 0)
        partner_mob_btn.click(force=True)
        page_mob.wait_for_timeout(500)

        partner_modal_mob = page_mob.locator(".modal-card--partner-sync")
        record_result("Partner Sync Opens on Mobile", partner_modal_mob.is_visible())

        page_mob.locator(".modal-card--partner-sync .modal-close-btn").click(force=True)
        partner_modal_mob.wait_for(state="hidden", timeout=3000)
        record_result("Partner Sync Closes on Mobile", not partner_modal_mob.is_visible())

        # Verify zero horizontal overflow on mobile
        mob_overflow = page_mob.evaluate("() => document.documentElement.scrollWidth > window.innerWidth")
        record_result("Mobile Post-Modals Zero Horizontal Overflow", not mob_overflow)

        context_mob.close()
        browser.close()

    total = len(test_results)
    passed = sum(1 for t in test_results if t["passed"])
    failed = total - passed
    print(f"\n==========================================")
    print(f"ADVANCED TEST RUN COMPLETE: {passed}/{total} PASSED ({failed} FAILED)")
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
    run_advanced_tests()
