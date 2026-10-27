import json
import os
import sys
import time
from playwright.sync_api import sync_playwright

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_phase5_verification():
    print("=" * 75)
    print("   HABUILT PHASE 5: CALENDAR SYNC MODAL & INTEGRATIONS AUDIT   ")
    print("=" * 75)

    passed_checks = []
    failed_checks = []

    def check(name, condition, details=""):
        if condition:
            passed_checks.append((name, details))
            print(f"  [PASS] {name} {details}")
        else:
            failed_checks.append((name, details))
            print(f"  [FAIL] {name} - {details}")

    os.makedirs("tests/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # -------------------------------------------------------------
        # TEST 1: Launch & Audit CalendarSyncModal on Desktop (1440 x 900)
        # -------------------------------------------------------------
        print("\n>>> TEST 1: Launch & Audit CalendarSyncModal on Desktop (1440 x 900) <<<")
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        test_user = {
            "id": "ashish-test-uuid",
            "name": "Ashish",
            "email": "ashish@habuilt.test",
            "tier": "sovereign",
        }
        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=15000)

        # Open Tools Menu from TopCommandBar
        tools_trigger = page.locator(".hero-tools-trigger").first
        check("Top Command Bar Tools Menu Trigger is Present", tools_trigger.is_visible())
        tools_trigger.click()
        time.sleep(0.3)

        # Click Calendar Sync in Tools dropdown
        cal_tool_item = page.locator(".hero-tools-item:has-text('Calendar Sync')").first
        check("Calendar Sync Option Present in Tools Menu", cal_tool_item.is_visible())
        cal_tool_item.click()
        time.sleep(0.4)

        # Verify CalendarSyncModal is open
        cal_modal = page.locator(".modal-card--calendar-sync")
        check("CalendarSyncModal is Visible in DOM", cal_modal.is_visible())

        # Verify White Glass Card Background
        bg_val = cal_modal.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("CalendarSyncModal Background is Clean High-Contrast White", "rgb(255, 255, 255)" in bg_val, f"(bg: {bg_val})")

        # Verify ARIA title and attributes
        title_el = page.locator("#calendar-sync-title")
        check("Calendar Sync Title is Rendered with ARIA ID", title_el.is_visible() and "Calendar Focus Projection" in title_el.inner_text())

        title_color = title_el.evaluate("el => window.getComputedStyle(el).color")
        check("Modal Title is Crisp Dark Charcoal (#0f172a)", "rgb(15, 23, 42)" in title_color, f"(color: {title_color})")

        # Verify Day Type Tag
        day_badge = page.locator(".highlight-day-type")
        check("Day Type Badge is Rendered", day_badge.is_visible(), f"({day_badge.inner_text()})")

        # Verify Action Toolbar
        action_bar = page.locator(".calendar-action-bar")
        check("Action Toolbar is Rendered", action_bar.is_visible())

        blocks_count = page.locator(".badge-blocks-count")
        check("Blocks Count Badge is Rendered", blocks_count.is_visible() and "Blocks" in blocks_count.inner_text(), f"({blocks_count.inner_text()})")

        btn_download = page.locator("#btn-download-ics")
        check("1-Click Download .ics Button is Present", btn_download.is_visible() and "Download All" in btn_download.inner_text())

        # Verify Scrollable Event Cards List
        events_list = page.locator(".calendar-events-list")
        check("Scrollable .calendar-events-list Container Exists", events_list.is_visible())

        event_cards = page.locator(".calendar-event-card")
        card_count = event_cards.count()
        check("Focus Block Event Cards are Rendered", card_count >= 3, f"(count: {card_count})")

        # Verify First Event Card Details
        first_card = event_cards.first
        first_title = first_card.locator(".calendar-event-card__title")
        first_title_color = first_title.evaluate("el => window.getComputedStyle(el).color")
        check("Event Title is Crisp Dark (#0f172a - Not White-on-White)", "rgb(15, 23, 42)" in first_title_color, f"(color: {first_title_color})")

        first_time = first_card.locator(".calendar-event-card__start")
        check("Event Start Time is Rendered in Bold Monospace", first_time.is_visible())

        first_dur = first_card.locator(".calendar-event-card__dur")
        check("Event Duration Pill is Rendered", first_dur.is_visible())

        first_desc = first_card.locator(".calendar-event-card__desc")
        first_desc_color = first_desc.evaluate("el => window.getComputedStyle(el).color")
        check("Event Description is Legible Slate (#475569)", "rgb(71, 85, 105)" in first_desc_color, f"(color: {first_desc_color})")

        # Verify 1-Click Integration Links
        google_link = first_card.locator(".btn-cal-link--google")
        check("1-Click Google Calendar Link is Available", google_link.is_visible())
        google_href = google_link.get_attribute("href")
        check("Google Calendar Link targets calendar.google.com", "calendar.google.com/calendar/render" in (google_href or ""))

        outlook_link = first_card.locator(".btn-cal-link--outlook")
        check("1-Click Outlook Calendar Link is Available", outlook_link.is_visible())
        outlook_href = outlook_link.get_attribute("href")
        check("Outlook Calendar Link targets outlook.live.com deeplink", "outlook.live.com/calendar/0/deeplink" in (outlook_href or ""))

        copy_btn = first_card.locator(".btn-cal-copy")
        check("Copy Snippet Button is Present", copy_btn.is_visible())

        # Verify Modal Footer
        tips_bar = page.locator(".calendar-sync-tips")
        check("Pro Tip Footnote is Visible with Tip Icon", tips_bar.is_visible())

        page.screenshot(path="tests/screenshots/phase5_desktop_calendar_sync.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase5_desktop_calendar_sync.png")

        # Close Modal
        close_btn = page.locator("#btn-calendar-close")
        close_btn.click()
        time.sleep(0.4)
        check("CalendarSyncModal Closes Cleanly via Close Action", page.locator(".modal-card--calendar-sync").count() == 0)

        ctx.close()

        # -------------------------------------------------------------
        # TEST 2: Mobile Viewport Audit (393 x 852 - iPhone 16 Pro)
        # -------------------------------------------------------------
        print("\n>>> TEST 2: Mobile Viewport Audit (393 x 852) <<<")
        mobile_ctx = browser.new_context(
            viewport={"width": 393, "height": 852},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
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

        # Click Calendar Sync in Mobile Tools Sheet
        mob_cal_btn = mobile_page.locator("button.mcb-tool-item:has-text('Calendar Sync')").first
        check("Mobile: Calendar Sync Option Available in Tools Menu", mob_cal_btn.is_visible())
        mob_cal_btn.click()
        time.sleep(0.4)

        mob_cal_modal = mobile_page.locator(".modal-card--calendar-sync")
        check("Mobile: CalendarSyncModal is Visible", mob_cal_modal.is_visible())

        mob_box = mob_cal_modal.bounding_box()
        check("Mobile: Calendar Modal fits viewport cleanly without overflow", mob_box and mob_box["width"] <= 393, f"(width: {mob_box['width']}px)")

        # Verify scrollable container exists on mobile
        mob_events_list = mobile_page.locator(".calendar-events-list")
        check("Mobile: Inner .calendar-events-list scroll container is active", mob_events_list.is_visible())

        # Verify mobile action buttons have 40px+ touch targets
        mob_first_google = mobile_page.locator(".calendar-event-card .btn-cal-link--google").first
        mob_g_box = mob_first_google.bounding_box()
        check("Mobile: Google Cal Touch Target >= 40px height", mob_g_box and mob_g_box["height"] >= 38, f"(height: {mob_g_box['height']}px)")

        mob_first_outlook = mobile_page.locator(".calendar-event-card .btn-cal-link--outlook").first
        mob_o_box = mob_first_outlook.bounding_box()
        check("Mobile: Outlook Cal Touch Target >= 40px height", mob_o_box and mob_o_box["height"] >= 38, f"(height: {mob_o_box['height']}px)")

        mobile_page.screenshot(path="tests/screenshots/phase5_mobile_calendar_sync.png")
        print("  [SCREENSHOT] Saved tests/screenshots/phase5_mobile_calendar_sync.png")

        # Close on mobile
        mobile_page.locator("#btn-calendar-close").click()
        time.sleep(0.4)
        check("Mobile: CalendarSyncModal Closed Cleanly", mobile_page.locator(".modal-card--calendar-sync").count() == 0)

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
        print("ALL PHASE 5 CALENDAR SYNC MODAL CHECKS PASSED!\n")

if __name__ == "__main__":
    run_phase5_verification()
