import sys
import os
import json
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs("tests/screenshots", exist_ok=True)

from playwright.sync_api import sync_playwright

def run_taxonomy_test():
    print("=" * 70)
    print("     HABUILT CUSTOM CATEGORY & HABIT REORDER VERIFICATION SUITE      ")
    print("=" * 70)

    passed_checks = []
    failed_checks = []
    console_errors = []

    def check(name, condition, details=""):
        if condition:
            passed_checks.append(name)
            print(f"  [PASS] {name} {details}", flush=True)
        else:
            failed_checks.append((name, details))
            print(f"  [FAIL] {name} - {details}", flush=True)

    test_user = {
        "id": "ashish",
        "email": "ashishgupta1v@gmail.com",
        "user_metadata": {"full_name": "Ashish Gupta"}
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type == "error" else None)

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        print("\n>>> TEST 1: Load Dashboard & Open Protocol Settings Modal <<<")
        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        check("Dashboard Loaded Cleanly", page.is_visible(".dashboard-flow"))

        # Open Protocol Settings Modal (via gear icon or protocol switcher chip in command bar)
        page.click("button[title*='Settings'], button[title*='settings'], button:has-text('Protocol Settings'), .hero-cmd-btn--settings, .hero-protocol-chip")
        page.wait_for_timeout(400)

        # If protocol dropdown opened, click Settings inside dropdown, else check if modal opened directly
        if page.is_visible("button:has-text('Protocol Settings & Tiers')"):
            page.click("button:has-text('Protocol Settings & Tiers')")
        elif not page.is_visible(".proto-settings-modal"):
            # Click direct settings button in command bar
            page.click("button:has(.lucide-settings)")

        page.wait_for_selector(".proto-settings-modal", timeout=6000)
        check("Protocol Settings Modal Opened", page.is_visible(".proto-settings-modal"))
        page.screenshot(path="tests/screenshots/taxonomy_modal_opened.png")

        print("\n>>> TEST 2: Navigate to Tab 6 'Categories & Order' <<<")
        page.click("#proto-tab-taxonomy")
        page.wait_for_selector(".proto-section--taxonomy", timeout=3000)
        check("Categories & Order Tab Active", page.is_visible(".proto-section--taxonomy"))
        check("Subtab Category Manager Active", page.is_visible("#proto-subtab-categories"))
        check("Default Categories Rendered (Fitness, Nutrition, etc.)", page.is_visible("#proto-category-card-fitness"))

        page.screenshot(path="tests/screenshots/taxonomy_tab_categories.png")

        print("\n>>> TEST 3: Create Custom Category (Biohacking & Recovery) <<<")
        page.click("#proto-add-category-btn")
        page.wait_for_selector("#proto-category-modal", timeout=3000)
        check("Create Category Form Modal Opened", page.is_visible("#proto-category-modal"))

        # Fill name and pick icon/color
        page.fill("#proto-category-name-input", "Biohacking & Recovery")
        page.click(".proto-color-dot[title='#06b6d4']")  # Cyan swatch
        page.click("button.proto-icon-btn:has-text('Zap')")
        page.wait_for_timeout(200)

        page.click("#proto-save-category-btn")
        page.wait_for_timeout(400)
        check("Category Modal Closed", not page.is_visible("#proto-category-modal"))

        new_cat_card = page.locator(".proto-category-card:has-text('Biohacking & Recovery')")
        check("New Custom Category Card Rendered", new_cat_card.is_visible())
        check("New Category has Custom Pill", new_cat_card.locator(".proto-cat-custom-pill").is_visible())

        page.screenshot(path="tests/screenshots/taxonomy_category_created.png")

        print("\n>>> TEST 4: Habit Sequence & Priority Reordering <<<")
        page.click("#proto-subtab-order")
        page.wait_for_selector(".proto-habits-reorder-list", timeout=3000)
        check("Habit Sequence Reorder View Active", page.is_visible(".proto-habits-reorder-list"))

        # Read initial habit titles for rank #1 and #2
        row1 = page.locator(".proto-reorder-row").nth(0)
        row2 = page.locator(".proto-reorder-row").nth(1)
        habit1_name = row1.locator(".proto-habit-title").text_content().strip()
        habit2_name = row2.locator(".proto-habit-title").text_content().strip()
        print(f"  Initial #1: '{habit1_name}'")
        print(f"  Initial #2: '{habit2_name}'")

        # Move habit #1 down
        row1.locator("button[title='Move Down']").click()
        page.wait_for_timeout(400)

        # Re-check new positions
        new_row1 = page.locator(".proto-reorder-row").nth(0)
        new_row2 = page.locator(".proto-reorder-row").nth(1)
        new_habit1_name = new_row1.locator(".proto-habit-title").text_content().strip()
        new_habit2_name = new_row2.locator(".proto-habit-title").text_content().strip()
        print(f"  After swap #1: '{new_habit1_name}'")
        print(f"  After swap #2: '{new_habit2_name}'")

        check("Habit #2 moved up to Rank #1", new_habit1_name == habit2_name)
        check("Habit #1 moved down to Rank #2", new_habit2_name == habit1_name)

        # Reassign category for row 1 to our new Biohacking category
        select_elem = new_row1.locator(".proto-cat-select")
        select_elem.select_option(label="Biohacking & Recovery")
        page.wait_for_timeout(300)
        check("Habit category reassigned in select", select_elem.input_value() == "biohacking-recovery")

        page.screenshot(path="tests/screenshots/taxonomy_habits_reordered.png")

        print("\n>>> TEST 5: Save Settings & Verify Persistence in Dashboard <<<")
        page.click("button:has-text('Save Changes')")
        page.wait_for_timeout(600)
        check("Protocol Settings Modal Closed", not page.is_visible(".proto-settings-modal"))

        # Verify on Master Grid that the reordered habit appears first
        first_checklist_habit = page.locator("tr.habit-grid__row .habit-grid__name-text").first.text_content().strip()
        print(f"  Dashboard first habit: '{first_checklist_habit}'")
        check("Dashboard reflects new top priority habit", habit2_name in first_checklist_habit or first_checklist_habit in habit2_name)

        page.screenshot(path="tests/screenshots/taxonomy_dashboard_reflected.png")

        print("\n>>> TEST 6: Page Reload Idempotency & Persistence <<<")
        page.reload(wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=8000)
        check("Dashboard loaded after reload", page.is_visible(".dashboard-flow"))

        # Re-verify first habit is still the customized top habit
        reloaded_first_habit = page.locator("tr.habit-grid__row .habit-grid__name-text").first.text_content().strip()
        print(f"  Reloaded first habit: '{reloaded_first_habit}'")
        check("Reordered habit sequence persisted after reload", habit2_name in reloaded_first_habit or reloaded_first_habit in habit2_name)

        print("\n>>> TEST 7: Habit Form Modal Dynamic Category Integration <<<")
        # Click Add Habit
        page.click("#habits-btn-add, button:has-text('+ Add Habit'), button:has-text('Add Habit'), .btn-add-habit")
        page.wait_for_selector(".habit-modal-card", timeout=5000)
        check("Habit Form Modal Opened", page.is_visible(".habit-modal-card"))

        # Check if our new custom category button exists
        custom_cat_btn = page.locator("#habit-form-cat-biohacking-recovery, button.category-option-btn:has-text('Biohacking & Recovery')")
        check("Custom Category button appears in Habit Form Modal", custom_cat_btn.is_visible())

        page.screenshot(path="tests/screenshots/taxonomy_habit_form_modal.png")

        browser.close()

    print("\n" + "=" * 70)
    print(f"AUDIT SUMMARY: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print(f"Console Errors: {len(console_errors)}")
    print("=" * 70)

    if failed_checks:
        for f, d in failed_checks:
            print(f"  FAILED: {f} ({d})")
        sys.exit(1)
    else:
        print("ALL CUSTOM CATEGORY & HABIT REORDER CHECKS PASSED PERFECTLY!")
        sys.exit(0)

if __name__ == '__main__':
    run_taxonomy_test()
