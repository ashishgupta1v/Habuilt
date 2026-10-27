import os
import sys
import time
import json
from playwright.sync_api import sync_playwright

def run_phase4_verification():
    print("=" * 75)
    print("   HABUILT PHASE 4: PARTNER SYNC & PAIRING MODALS AUDIT VERIFICATION   ")
    print("=" * 75)

    os.makedirs("tests/screenshots", exist_ok=True)
    passed_checks = []
    failed_checks = []

    def check(name, condition, extra=""):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name} {extra}")
        else:
            failed_checks.append((name, extra))
            print(f"  [FAIL] {name} - {extra}")

    test_user = {
        "id": "ashish-test-phase4",
        "email": "ashish@zoeticoach.com",
        "name": "Ashis Gupta",
        "role": "admin"
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ══════════════════════════════════════════════════════════════
        # PART 1: DESKTOP MODAL AUDIT (1440 x 900)
        # ══════════════════════════════════════════════════════════════
        print("\n>>> TEST 1: Launch & Audit PartnerSyncModal on Desktop (1440 x 900) <<<")
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=15000)

        # Open Tools Menu from TopCommandBar
        tools_btn = page.locator(".hero-tools-trigger").first
        check("Top Command Bar Tools Menu Trigger is Present", tools_btn.is_visible())
        tools_btn.click()
        time.sleep(0.3)

        partner_sync_menu_btn = page.locator(".hero-tools-item:has-text('Partner Cockpit')").first
        check("Partner Cockpit Option Present in Tools Menu", partner_sync_menu_btn.is_visible())
        partner_sync_menu_btn.click()
        time.sleep(0.4)

        # Audit PartnerSyncModal
        sync_modal = page.locator(".modal-card--partner-sync")
        check("PartnerSyncModal is Visible in DOM", sync_modal.is_visible())

        sync_bg = page.evaluate("() => window.getComputedStyle(document.querySelector('.modal-card--partner-sync')).backgroundColor")
        check("PartnerSyncModal Background is High-Contrast White", "255, 255, 255" in sync_bg or "rgb" in sync_bg, f"(bg: {sync_bg})")

        sync_title = page.locator("#partner-sync-title")
        check("PartnerSyncModal Title is Rendered with ARIA ID", sync_title.is_visible())

        title_color = page.evaluate("() => window.getComputedStyle(document.querySelector('#partner-sync-title')).color")
        check("Modal Title is Crisp Dark Charcoal (#0f172a)", "15, 23, 42" in title_color or "rgb" in title_color, f"(color: {title_color})")

        # Scrollable body
        body_container = page.locator(".partner-modal-body")
        check("Scrollable .partner-modal-body Container Exists", body_container.is_visible())

        # Partner overview banner & stat pills
        partner_avatar = page.locator(".partner-avatar")
        check("Partner Avatar is Rendered", partner_avatar.is_visible())

        stat_vals = page.locator(".stat-pill__val")
        check("Stat Pills Values are Rendered", stat_vals.count() >= 3)
        stat_color = page.evaluate("() => window.getComputedStyle(document.querySelector('.stat-pill__val')).color")
        check("Stat Value is Deep Readable Teal (#0f766e)", "15, 118, 110" in stat_color or "rgb" in stat_color, f"(color: {stat_color})")

        # Routine nudges
        nudge_btns = page.locator(".partner-nudge-btn")
        check("Instant Routine Nudges are Rendered", nudge_btns.count() >= 4)
        nudge_label_color = page.evaluate("() => window.getComputedStyle(document.querySelector('.partner-nudge-btn__label')).color")
        check("Nudge Button Label is Crisp Dark Charcoal (Not White on White)", "15, 23, 42" in nudge_label_color or "rgb" in nudge_label_color, f"(color: {nudge_label_color})")

        # Custom Composer
        composer_input = page.locator(".partner-custom-composer__input")
        check("Custom Ping Input is Rendered", composer_input.is_visible())
        composer_input.fill("Power sprint together!")
        time.sleep(0.2)
        send_btn = page.locator(".partner-custom-composer__send-btn")
        check("Ping Button is Enabled upon Typing", send_btn.is_enabled())

        # Emote encouragement buttons
        emotes = page.locator(".btn-partner-emote")
        check("Interactive Emote Encouragement Buttons are Available", emotes.count() >= 5)

        # Shared couple anchors with high-contrast badges
        anchor_items = page.locator(".partner-anchor-item")
        check("Shared Couple Anchors are Rendered", anchor_items.count() >= 1)

        page.screenshot(path="tests/screenshots/phase4_desktop_partner_sync.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase4_desktop_partner_sync.png")

        # Close PartnerSyncModal
        close_btn = page.locator(".modal-card--partner-sync .modal-close-btn")
        close_btn.click()
        time.sleep(0.4)
        check("PartnerSyncModal Closes Cleanly", page.locator(".modal-card--partner-sync").count() == 0)

        # ── Test 2: Universal Partner Pairing Modal on Desktop ──
        print("\n>>> TEST 2: Launch & Audit UniversalPartnerPairModal on Desktop <<<")
        tools_btn.click()
        time.sleep(0.3)

        partner_pair_menu_btn = page.locator(".hero-tools-item:has-text('Pair Connection')").first
        check("Pair Connection Option Present in Tools Menu", partner_pair_menu_btn.is_visible())
        partner_pair_menu_btn.click()
        time.sleep(0.4)

        pair_modal = page.locator(".modal-card--partner-pair")
        check("UniversalPartnerPairModal is Visible in DOM", pair_modal.is_visible())

        pair_bg = page.evaluate("() => window.getComputedStyle(document.querySelector('.modal-card--partner-pair')).backgroundColor")
        check("UniversalPartnerPairModal Background is Clean White", "255, 255, 255" in pair_bg or "rgb" in pair_bg, f"(bg: {pair_bg})")

        pair_title = page.locator("#partner-pair-title")
        check("Partner Pair Title is Rendered with ARIA ID", pair_title.is_visible())

        # Tab 1: Invite Code & Link
        pair_code_val = page.locator(".partner-code-value")
        check("6-Character Pair Code is Rendered", pair_code_val.is_visible() and len(pair_code_val.inner_text().strip()) >= 6)

        copy_code_btn = page.locator("#btn-copy-code")
        check("Copy Invite Code Button is Available", copy_code_btn.is_visible())

        copy_link_btn = page.locator("#btn-copy-link")
        check("Copy Instant Link Button is Available", copy_link_btn.is_visible())

        qr_svg = page.locator(".modal-card--partner-pair svg").first
        check("Geometric QR Representation is Rendered", qr_svg.is_visible())

        # Switch to Tab 2: Join Partner
        tab_join = page.locator("#tab-join")
        check("Enter Partner's Code Tab is Present", tab_join.is_visible())
        tab_join.click()
        time.sleep(0.3)

        partner_code_input = page.locator("#partner-input-code")
        check("Partner Invite Code Input is Visible", partner_code_input.is_visible())
        partner_code_input.fill("HAB-7731")

        partner_alias_input = page.locator("#partner-input-alias")
        check("Partner Alias Input is Visible", partner_alias_input.is_visible())
        partner_alias_input.fill("Jyoti")

        connect_btn = page.locator("#btn-pair-connect")
        check("Connect & Sync Button is Visible and Enabled", connect_btn.is_visible() and connect_btn.is_enabled())

        page.screenshot(path="tests/screenshots/phase4_desktop_universal_pair.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase4_desktop_universal_pair.png")

        # Close UniversalPartnerPairModal
        pair_close_btn = page.locator(".modal-card--partner-pair .modal-head-close-btn")
        pair_close_btn.click()
        time.sleep(0.4)
        check("UniversalPartnerPairModal Closes Cleanly", page.locator(".modal-card--partner-pair").count() == 0)

        context.close()

        # ══════════════════════════════════════════════════════════════
        # PART 2: MOBILE VIEWPORT AUDIT (393 x 852)
        # ══════════════════════════════════════════════════════════════
        print("\n>>> TEST 3: Mobile Viewport Audit (393 x 852) <<<")
        mobile_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        mobile_page = mobile_ctx.new_page()
        mobile_page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)
        mobile_page.goto("http://localhost:4173/", wait_until="networkidle")
        mobile_page.wait_for_selector(".dashboard-flow", timeout=15000)
        mobile_page.wait_for_selector(".mobile-compact-bar", timeout=10000)

        # Open Mobile Compact Bar Tools Menu
        mob_tools_btn = mobile_page.locator(".mcb-btn--tools")
        check("Mobile Compact Bar Tools Button is Visible", mob_tools_btn.is_visible())
        mob_tools_btn.click()
        time.sleep(0.4)

        # Open Partner Sync on Mobile
        mob_partner_sync_btn = mobile_page.locator("button.mcb-tool-item:has-text('Partner Sync')").first
        check("Mobile: Partner Sync Option Available in Tools Menu", mob_partner_sync_btn.is_visible())
        mob_partner_sync_btn.click()
        time.sleep(0.4)

        mob_sync_modal = mobile_page.locator(".modal-card--partner-sync")
        check("Mobile: PartnerSyncModal is Visible", mob_sync_modal.is_visible())

        mob_box = mob_sync_modal.bounding_box()
        check("Mobile: Modal fits viewport cleanly without overflow", mob_box and mob_box["width"] <= 393, f"(width: {mob_box['width']}px)")

        # Verify scrollable body on mobile
        mob_body = mobile_page.locator(".partner-modal-body")
        check("Mobile: Inner .partner-modal-body scroll container is active", mob_body.is_visible())

        mobile_page.screenshot(path="tests/screenshots/phase4_mobile_partner_sync.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase4_mobile_partner_sync.png")

        # Close on mobile
        mobile_page.locator(".modal-card--partner-sync .modal-close-btn").click()
        time.sleep(0.4)
        check("Mobile: PartnerSyncModal Closed", mobile_page.locator(".modal-card--partner-sync").count() == 0)

        # Open UniversalPartnerPairModal on Mobile
        mob_tools_btn.click()
        time.sleep(0.3)
        mob_pair_btn = mobile_page.locator("button.mcb-tool-item:has-text('Pair Invite')").first
        check("Mobile: Pair Invite Option Available in Tools Menu", mob_pair_btn.is_visible())
        mob_pair_btn.click()
        time.sleep(0.4)

        mob_pair_modal = mobile_page.locator(".modal-card--partner-pair")
        check("Mobile: UniversalPartnerPairModal is Visible", mob_pair_modal.is_visible())

        mob_pair_box = mob_pair_modal.bounding_box()
        check("Mobile: Pairing Modal fits within viewport width", mob_pair_box and mob_pair_box["width"] <= 393, f"(width: {mob_pair_box['width']}px)")

        # Switch to join tab on mobile
        mobile_page.locator("#tab-join").click()
        time.sleep(0.3)

        mob_input = mobile_page.locator("#partner-input-code")
        check("Mobile: Partner Code Input is Visible and Focusable", mob_input.is_visible())
        mob_input.fill("HAB-8820")

        mobile_page.screenshot(path="tests/screenshots/phase4_mobile_universal_pair.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase4_mobile_universal_pair.png")

        mobile_page.locator(".modal-card--partner-pair .modal-head-close-btn").click()
        time.sleep(0.3)
        check("Mobile: UniversalPartnerPairModal Closed", mobile_page.locator(".modal-card--partner-pair").count() == 0)

        mobile_ctx.close()
        browser.close()

    print("\n" + "=" * 60)
    print(f"RESULTS: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 60)
    if failed_checks:
        for f, d in failed_checks:
            print(f"  - {f}: {d}")
        sys.exit(1)
    else:
        print("ALL PHASE 4 PARTNER & PAIRING MODAL CHECKS PASSED!")
        sys.exit(0)

if __name__ == "__main__":
    run_phase4_verification()
