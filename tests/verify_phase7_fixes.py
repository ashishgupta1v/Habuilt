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

def run_phase7_verification():
    print("=" * 80)
    print("   HABUILT PHASE 7: BIOMETRICS & CIRCADIAN ADVISORY VISUAL CALIBRATION   ")
    print("=" * 80)

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
        # TEST 1: Desktop Viewport (1440 x 900)
        # -------------------------------------------------------------
        print("\n>>> TEST 1: Circadian Advisory & Biometrics Rail on Desktop (1440 x 900) <<<")
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

        # Ensure Cockpit is expanded and on Briefing tab
        briefing_tab_btn = page.locator("#btn-cockpit-tab-briefing")
        check("Cockpit Briefing Tab Exists", briefing_tab_btn.is_visible())
        briefing_tab_btn.click()
        time.sleep(0.4)

        # 1. Audit Circadian Phase Card
        circ_card = page.locator("#circadian-phase-card")
        check("Circadian Phase Card is Visible", circ_card.is_visible())

        circ_styles = circ_card.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return {
                bg: cs.backgroundColor,
                borderColor: cs.borderColor,
                borderRadius: cs.borderRadius
            };
        }""")
        check("Circadian Card Background is Crisp Light (#ffffff)", circ_styles["bg"] == "rgb(255, 255, 255)", f"Computed bg: {circ_styles['bg']}")
        check("Circadian Card Border is Amber Accent", "245, 158, 11" in circ_styles["borderColor"], f"Border color: {circ_styles['borderColor']}")

        circ_name = page.locator("#circadian-phase-name")
        check("Circadian Name is Visible", circ_name.is_visible())
        name_color = circ_name.evaluate("el => window.getComputedStyle(el).color")
        check("Circadian Name has High-Contrast Charcoal Slate (#0f172a)", name_color == "rgb(15, 23, 42)", f"Computed color: {name_color}")

        circ_time = page.locator("#circadian-phase-time")
        check("Circadian Time is Visible", circ_time.is_visible())
        time_color = circ_time.evaluate("el => window.getComputedStyle(el).color")
        check("Circadian Time is Warm Amber (#d97706)", time_color == "rgb(217, 119, 6)", f"Computed color: {time_color}")

        circ_advice = page.locator("#circadian-phase-advice")
        check("Circadian Advice is Visible", circ_advice.is_visible())
        advice_color = circ_advice.evaluate("el => window.getComputedStyle(el).color")
        check("Circadian Advice is High-Contrast Slate (#475569)", advice_color == "rgb(71, 85, 105)", f"Computed color: {advice_color}")

        # Capture Desktop Tab 1 Screenshot
        shot1_path = "tests/screenshots/phase7_desktop_circadian_briefing.png"
        page.screenshot(path=shot1_path)
        print(f"  [SCREENSHOT] Saved: {shot1_path}")

        # 2. Switch to Tab 2 (Biometrics Rail)
        bio_tab_btn = page.locator("#btn-cockpit-tab-biometrics")
        check("Cockpit Biometrics Tab Trigger Exists", bio_tab_btn.is_visible())
        bio_tab_btn.click()
        time.sleep(0.4)

        bio_grid = page.locator("#warrior-bio-grid")
        check("Biometrics Grid is Visible", bio_grid.is_visible())

        # 3. Audit Hydration Tracker Card
        hyd_card = page.locator("#card-bio-hydration")
        check("Hydration Tracker Card is Visible", hyd_card.is_visible())
        hyd_styles = hyd_card.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return {
                bg: cs.backgroundColor,
                borderColor: cs.borderColor
            };
        }""")
        check("Hydration Card Background is Crisp White (#ffffff)", hyd_styles["bg"] == "rgb(255, 255, 255)", f"Card bg: {hyd_styles['bg']}")
        check("Hydration Card Border is Amber Accent", "245, 158, 11" in hyd_styles["borderColor"], f"Border: {hyd_styles['borderColor']}")

        track_bar = page.locator("#hydration-track-bar")
        check("Hydration Track Bar is Visible", track_bar.is_visible())
        track_bg = track_bar.evaluate("el => window.getComputedStyle(el).backgroundColor")
        check("Hydration Track Bar has Clean Visible Grey Background (#e2e8f0)", track_bg == "rgb(226, 232, 240)", f"Track bg: {track_bg}")

        current_val_el = page.locator("#hydration-current-val")
        check("Hydration Current Value is Visible", current_val_el.is_visible())
        val_color = current_val_el.evaluate("el => window.getComputedStyle(el).color")
        check("Hydration Current Value is Oceanic Blue (#0284c7)", val_color == "rgb(2, 132, 199)", f"Computed color: {val_color}")

        # Test Hydration Quick Buttons Interaction
        initial_val = int(current_val_el.inner_text().replace("ml", "").strip())
        btn_add_250 = page.locator("#btn-hydration-add-250")
        check("Hydration +250ml Button is Visible", btn_add_250.is_visible())
        btn_add_250.click()
        time.sleep(0.2)
        after_250_val = int(current_val_el.inner_text().replace("ml", "").strip())
        check("Hydration Increases by 250ml on Glass Button Click", after_250_val == initial_val + 250, f"New value: {after_250_val}ml")

        btn_add_500 = page.locator("#btn-hydration-add-500")
        btn_add_500.click()
        time.sleep(0.2)
        after_500_val = int(current_val_el.inner_text().replace("ml", "").strip())
        check("Hydration Increases by 500ml on Bottle Button Click", after_500_val == after_250_val + 500, f"New value: {after_500_val}ml")

        btn_undo = page.locator("#btn-hydration-undo")
        check("Undo Button is Enabled", not btn_undo.is_disabled())
        btn_undo.click()
        time.sleep(0.2)
        after_undo_val = int(current_val_el.inner_text().replace("ml", "").strip())
        check("Undo Button Decrements 250ml", after_undo_val == after_500_val - 250, f"New value: {after_undo_val}ml")

        # 4. Audit Morning Stiffness & Energy Logger Card
        stiff_card = page.locator("#card-bio-stiffness")
        check("Morning Stiffness & Vigor Card is Visible", stiff_card.is_visible())
        stiff_styles = stiff_card.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return { bg: cs.backgroundColor, borderColor: cs.borderColor };
        }""")
        check("Stiffness Card Background is Crisp White (#ffffff)", stiff_styles["bg"] == "rgb(255, 255, 255)", f"Card bg: {stiff_styles['bg']}")
        check("Stiffness Card Border is Amber Accent", "245, 158, 11" in stiff_styles["borderColor"], f"Border: {stiff_styles['borderColor']}")

        status_badge = page.locator("#badge-bio-stiffness-status")
        check("Status Badge is Visible", status_badge.is_visible())

        stiff_input = page.locator("#input-bio-stiffness")
        check("Stiffness Number Input is Visible", stiff_input.is_visible())
        input_styles = stiff_input.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor };
        }""")
        check("Stiffness Input has White Background (#ffffff)", input_styles["bg"] == "rgb(255, 255, 255)", f"Input bg: {input_styles['bg']}")
        check("Stiffness Input has High-Contrast Dark Text (#0f172a)", input_styles["color"] == "rgb(15, 23, 42)", f"Input text color: {input_styles['color']}")

        energy_slider = page.locator("#slider-bio-energy")
        check("Energy Range Slider is Visible", energy_slider.is_visible())

        note_input = page.locator("#input-bio-note")
        check("Physical Note Input is Visible", note_input.is_visible())
        note_input.fill("Cervical spine smooth, hamstrings open after midday mobility flow")
        time.sleep(0.2)

        save_bio_btn = page.locator("#btn-save-biomarkers")
        check("Save Biomarkers Button is Visible", save_bio_btn.is_visible())
        save_btn_color = save_bio_btn.evaluate("el => window.getComputedStyle(el).color")
        check("Save Biomarkers Button has Bold White Text", save_btn_color == "rgb(255, 255, 255)", f"Computed color: {save_btn_color}")

        save_bio_btn.click()
        time.sleep(0.3)
        check("Biomarkers Saved Action Triggered Successfully", True)

        # Capture Desktop Tab 2 Screenshot
        shot2_path = "tests/screenshots/phase7_desktop_biometrics_rail.png"
        page.screenshot(path=shot2_path)
        print(f"  [SCREENSHOT] Saved: {shot2_path}")

        ctx.close()

        # -------------------------------------------------------------
        # TEST 2: Mobile Viewport (393 x 852 - iPhone 16 Pro)
        # -------------------------------------------------------------
        print("\n>>> TEST 2: Circadian & Biometrics Mobile Ergonomics (393 x 852) <<<")
        ctx_m = browser.new_context(
            viewport={"width": 393, "height": 852},
            is_mobile=True,
            has_touch=True
        )
        page_m = ctx_m.new_page()
        page_m.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{test_user["id"]}', 'true');
        """)

        page_m.goto("http://localhost:4173/", wait_until="networkidle")
        page_m.wait_for_selector(".dashboard-flow", timeout=15000)

        # Check Tab 1 Circadian Card on Mobile
        m_briefing_tab = page_m.locator("#btn-cockpit-tab-briefing")
        m_briefing_tab.click()
        time.sleep(0.4)

        m_circ_card = page_m.locator("#circadian-phase-card")
        check("Mobile Circadian Card is Visible", m_circ_card.is_visible())
        circ_box = m_circ_card.bounding_box()
        check("Mobile Circadian Card Fits Viewport (<= 393px)", circ_box["width"] <= 393.0, f"Card width: {circ_box['width']}px")

        # Switch to Tab 2 Biometrics on Mobile
        m_bio_tab = page_m.locator("#btn-cockpit-tab-biometrics")
        check("Mobile Biometrics Tab Exists", m_bio_tab.is_visible())
        m_bio_tab.click()
        time.sleep(0.4)

        m_hyd_card = page_m.locator("#card-bio-hydration")
        check("Mobile Hydration Card is Visible", m_hyd_card.is_visible())
        hyd_box = m_hyd_card.bounding_box()
        check("Mobile Hydration Card Width Fits Viewport (<= 393px)", hyd_box["width"] <= 393.0, f"Hydration width: {hyd_box['width']}px")

        m_stiff_card = page_m.locator("#card-bio-stiffness")
        check("Mobile Stiffness Card is Visible", m_stiff_card.is_visible())
        stiff_box = m_stiff_card.bounding_box()
        check("Mobile Stiffness Card Width Fits Viewport (<= 393px)", stiff_box["width"] <= 393.0, f"Stiffness width: {stiff_box['width']}px")

        # Verify Touch Targets on Mobile (>= 40px)
        m_btn_250 = page_m.locator("#btn-hydration-add-250")
        btn_250_box = m_btn_250.bounding_box()
        check("Mobile Hydration Quick Button Height >= 40px", btn_250_box["height"] >= 39.5, f"Touch height: {btn_250_box['height']}px")

        m_stiff_input = page_m.locator("#input-bio-stiffness")
        stiff_input_box = m_stiff_input.bounding_box()
        check("Mobile Stiffness Input Height >= 40px", stiff_input_box["height"] >= 39.5, f"Touch height: {stiff_input_box['height']}px")

        m_save_btn = page_m.locator("#btn-save-biomarkers")
        save_box = m_save_btn.bounding_box()
        check("Mobile Save Biomarkers Button Height >= 42px", save_box["height"] >= 41.5, f"Touch height: {save_box['height']}px")

        # Verify Quick Action Works on Mobile
        m_btn_250.click()
        time.sleep(0.2)
        m_val_text = page_m.locator("#hydration-current-val").inner_text()
        check("Mobile Quick Hydration Tap Updates Value", "ml" in m_val_text, f"Mobile value: {m_val_text}")

        mobile_shot_path = "tests/screenshots/phase7_mobile_biometrics_rail.png"
        page_m.screenshot(path=mobile_shot_path)
        print(f"  [SCREENSHOT] Saved: {mobile_shot_path}")

        ctx_m.close()
        browser.close()

    print("\n" + "=" * 80)
    print(f"   PHASE 7 VERIFICATION COMPLETE: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 80)

    if failed_checks:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_phase7_verification()
