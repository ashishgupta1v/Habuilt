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

def run_step5_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)

        print("\n--- 1. Testing Desktop Habit Checklist Matrix (1440x900) ---")
        page.goto("http://localhost:4173/", wait_until="networkidle")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(500)

        habits_sec = page.locator("#habits")
        assert habits_sec.is_visible(), "#habits section should be visible"
        sec_bbox = habits_sec.bounding_box()
        print(f"#habits Section: height={sec_bbox['height']:.1f}px, y={sec_bbox['y']:.1f}px")

        # Measure table
        table = page.locator(".habit-grid")
        assert table.is_visible(), ".habit-grid table should be visible on desktop"
        table_bbox = table.bounding_box()
        print(f"Habit Grid Table total height: {table_bbox['height']:.1f}px")

        # Measure individual row heights
        rows = page.locator(".habit-grid tbody tr.habit-grid__row")
        row_count = rows.count()
        print(f"Total Habit Rows count: {row_count}")

        if row_count > 0:
            first_row_bbox = rows.first.bounding_box()
            avg_row_height = table_bbox['height'] / (row_count + 1) # including header
            print(f"First row height: {first_row_bbox['height']:.1f}px, Approximate avg row height: {avg_row_height:.1f}px")

        # Measure sticky habit name cell
        first_name_cell = page.locator(".habit-grid__sticky.habit-grid__name").first
        name_bbox = first_name_cell.bounding_box()
        print(f"Habit Name Sticky Cell: height={name_bbox['height']:.1f}px, width={name_bbox['width']:.1f}px")

        # Measure day header
        thead_th = page.locator(".habit-grid thead th").first
        head_bbox = thead_th.bounding_box()
        print(f"Thead Header height: {head_bbox['height']:.1f}px")

        # Screenshot Desktop Habit Matrix
        desktop_matrix_shot = os.path.join(SCREENSHOT_DIR, "step5_habit_matrix_desktop.png")
        page.locator("#habits").screenshot(path=desktop_matrix_shot)
        print(f"Saved Desktop Matrix screenshot to: {desktop_matrix_shot}")

        # Mobile View (375x812)
        print("\n--- 2. Testing Mobile Today Checklist View (375x812) ---")
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)

        mobile_cards = page.locator(".mobile-daily__card")
        card_count = mobile_cards.count()
        print(f"Mobile habit cards count: {card_count}")

        if card_count > 0:
            first_card_bbox = mobile_cards.first.bounding_box()
            print(f"Mobile Habit Card height: {first_card_bbox['height']:.1f}px")

        mobile_shot = os.path.join(SCREENSHOT_DIR, "step5_mobile_checklist.png")
        page.screenshot(path=mobile_shot, full_page=False)
        print(f"Saved Mobile Checklist screenshot to: {mobile_shot}")

        browser.close()
        print("\n[SUCCESS] Step 5 baseline measurements completed!")

if __name__ == "__main__":
    run_step5_verification()
