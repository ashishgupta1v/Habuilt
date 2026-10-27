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

def run_phase6_verification():
    print("=" * 80)
    print("   HABUILT PHASE 6: AUDIO BRIEFING PLAYER & NEURAL WAVEFORM ENGINE AUDIT   ")
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
        print("\n>>> TEST 1: Tactical Audio Briefing Card & Neural Waveform on Desktop (1440 x 900) <<<")
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

        # Expand Cockpit and switch to Briefing tab
        briefing_tab_btn = page.locator("#btn-cockpit-tab-briefing")
        check("Cockpit Briefing Tab Trigger Exists", briefing_tab_btn.is_visible())
        briefing_tab_btn.click()
        time.sleep(0.5)

        # Verify Audio Briefing Card is Visible
        audio_card = page.locator("#warrior-audio-card")
        check("Audio Briefing Card is Visible", audio_card.is_visible())

        # Check Audio Card Contrast & Theme Colors
        card_styles = audio_card.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return {
                bg: cs.backgroundColor,
                borderColor: cs.borderColor,
                borderRadius: cs.borderRadius
            };
        }""")
        check("Card Background is Crisp Light White (#ffffff)", card_styles["bg"] == "rgb(255, 255, 255)", f"Computed bg: {card_styles['bg']}")
        check("Card Border is Amber Accent", "245, 158, 11" in card_styles["borderColor"], f"Border color: {card_styles['borderColor']}")

        # Verify Title & Subtitle Legibility
        title_el = page.locator("#warrior-audio-title")
        check("Audio Briefing Title is Visible", title_el.is_visible() and "Tactical Audio Briefing" in title_el.inner_text())
        title_color = title_el.evaluate("el => window.getComputedStyle(el).color")
        check("Title Color is High-Contrast Charcoal Slate (#0f172a)", title_color == "rgb(15, 23, 42)", f"Computed color: {title_color}")

        subtitle_el = page.locator("#warrior-audio-subtitle")
        subtitle_color = subtitle_el.evaluate("el => window.getComputedStyle(el).color")
        check("Subtitle Color is High-Contrast Slate-600 (#475569)", subtitle_color == "rgb(71, 85, 105)", f"Computed color: {subtitle_color}")

        # Check Engine Badge
        engine_badge = page.locator("#warrior-audio-engine-badge")
        check("Audio Engine Badge is Visible", engine_badge.is_visible())

        # Check Voice Persona Selector
        persona_select = page.locator("#warrior-persona-select")
        check("Voice Persona Selector is Visible", persona_select.is_visible())
        persona_styles = persona_select.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return { bg: cs.backgroundColor, color: cs.color };
        }""")
        check("Persona Select has Light Theme Background (#f8fafc)", persona_styles["bg"] == "rgb(248, 250, 252)", f"Select bg: {persona_styles['bg']}")
        check("Persona Select has Dark Legible Text (#0f172a)", persona_styles["color"] == "rgb(15, 23, 42)", f"Select color: {persona_styles['color']}")

        # Change Persona Selection
        persona_select.select_option("spartan")
        time.sleep(0.3)
        check("Voice Persona Changed to Spartan", persona_select.input_value() == "spartan")

        # Test Config Drawer Toggle
        config_btn = page.locator("#warrior-audio-config-btn")
        check("Gemini Config Button is Visible", config_btn.is_visible())
        config_btn.click()
        time.sleep(0.3)
        key_drawer = page.locator("#warrior-audio-key-drawer")
        check("Inline API Key Drawer Opens on Click", key_drawer.is_visible())
        cancel_btn = page.locator("#warrior-audio-key-cancel-btn")
        cancel_btn.click()
        time.sleep(0.2)
        check("Inline API Key Drawer Closes on Cancel", not key_drawer.is_visible())

        # Check Player Controls & Waveform Strip
        player_strip = page.locator("#warrior-audio-player-strip")
        check("Player Strip is Visible", player_strip.is_visible())

        play_btn = page.locator("#warrior-audio-play-btn")
        check("Play Button is Visible", play_btn.is_visible())
        play_btn_styles = play_btn.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return { color: cs.color, bg: cs.backgroundImage };
        }""")
        check("Play Button Text Color is Crisp White", play_btn_styles["color"] == "rgb(255, 255, 255)", f"Computed color: {play_btn_styles['color']}")
        check("Play Button Uses Amber Gradient", "linear-gradient" in play_btn_styles["bg"], f"Computed bg: {play_btn_styles['bg']}")

        # Verify Waveform Visualizer Before Play
        waveform = page.locator("#warrior-waveform-visualizer")
        check("Waveform Visualizer Exists", waveform.is_visible())
        check("Waveform is Inactive Initially", not waveform.evaluate("el => el.classList.contains('is-active')"))

        # Click Play Audio Briefing
        play_btn.click()
        time.sleep(0.4)

        # Verify Playback State & Waveform Activation
        check("Play Button Shifts to Playing State", play_btn.evaluate("el => el.classList.contains('is-playing')"))
        check("Neural Waveform Engine Activates (.is-active)", waveform.evaluate("el => el.classList.contains('is-active')"))
        waveform_bars = page.locator(".waveform-bar")
        check("All 7 Neural Waveform Bars Exist", waveform_bars.count() == 7, f"Bar count: {waveform_bars.count()}")

        stop_btn = page.locator("#warrior-audio-stop-btn")
        check("Stop Button Appears During Playback", stop_btn.is_visible())

        # Test Speed Chips
        speed_125_btn = page.locator("#btn-audio-speed-1_25")
        check("Speed Chip 1.25x Exists", speed_125_btn.is_visible())
        speed_125_btn.click()
        time.sleep(0.2)
        check("Speed Chip 1.25x Becomes Active", speed_125_btn.evaluate("el => el.classList.contains('is-active')"))

        # Check Transcript & Strategic Insight Box
        transcript = page.locator("#warrior-audio-transcript")
        check("Briefing Transcript Box is Visible", transcript.is_visible())
        transcript_styles = transcript.evaluate("""el => {
            const cs = window.getComputedStyle(el);
            return {
                bg: cs.backgroundColor,
                borderLeftColor: cs.borderLeftColor
            };
        }""")
        check("Transcript Box has Clean Light Slate Background", transcript_styles["bg"] == "rgb(248, 250, 252)", f"Transcript bg: {transcript_styles['bg']}")
        check("Transcript Box has Amber Left Indicator Bar", "245, 158, 11" in transcript_styles["borderLeftColor"], f"Border left: {transcript_styles['borderLeftColor']}")

        transcript_headline = page.locator("#warrior-transcript-headline")
        headline_color = transcript_headline.evaluate("el => window.getComputedStyle(el).color")
        check("Transcript Headline Color is Deep Slate (#0f172a)", headline_color == "rgb(15, 23, 42)", f"Headline color: {headline_color}")

        transcript_text = page.locator("#warrior-transcript-text")
        text_color = transcript_text.evaluate("el => window.getComputedStyle(el).color")
        check("Transcript Directive Text Color is Legible Charcoal (#334155)", text_color == "rgb(51, 65, 85)", f"Text color: {text_color}")

        # Stop Playback
        stop_btn.click()
        time.sleep(0.3)
        check("Waveform Deactivates on Stop", not waveform.evaluate("el => el.classList.contains('is-active')"))
        check("Play Button Text Resumes to Initial State", "Play Audio Briefing" in play_btn.inner_text())

        # Capture Desktop Screenshot with waveform active for best visual showcase
        play_btn.click()
        time.sleep(0.3)
        desktop_shot_path = "tests/screenshots/phase6_desktop_audio_briefing.png"
        page.screenshot(path=desktop_shot_path)
        print(f"  [SCREENSHOT] Saved: {desktop_shot_path}")

        ctx.close()

        # -------------------------------------------------------------
        # TEST 2: Mobile Viewport (393 x 852 - iPhone 16 Pro)
        # -------------------------------------------------------------
        print("\n>>> TEST 2: Tactical Audio Briefing Mobile Ergonomics (393 x 852) <<<")
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

        # Open Briefing tab in mobile cockpit
        m_briefing_tab = page_m.locator("#btn-cockpit-tab-briefing")
        check("Mobile Cockpit Briefing Tab Exists", m_briefing_tab.is_visible())
        m_briefing_tab.click()
        time.sleep(0.5)

        m_audio_card = page_m.locator("#warrior-audio-card")
        check("Mobile Audio Briefing Card is Visible", m_audio_card.is_visible())

        # Verify No Horizontal Overflow on Mobile
        card_box = m_audio_card.bounding_box()
        check("Mobile Audio Card Width Fits Screen (<= 393px)", card_box["width"] <= 393.0, f"Card width: {card_box['width']}px")

        # Verify Touch Target Sizes on Mobile (>= 40px)
        m_persona_select = page_m.locator("#warrior-persona-select")
        persona_box = m_persona_select.bounding_box()
        check("Mobile Persona Select Touch Height >= 40px", persona_box["height"] >= 39.5, f"Touch height: {persona_box['height']}px")

        m_play_btn = page_m.locator("#warrior-audio-play-btn")
        play_box = m_play_btn.bounding_box()
        check("Mobile Play Button Touch Height >= 42px", play_box["height"] >= 41.5, f"Touch height: {play_box['height']}px")

        m_speed_chip = page_m.locator("#btn-audio-speed-1_0")
        speed_box = m_speed_chip.bounding_box()
        check("Mobile Speed Chip Touch Height >= 38px", speed_box["height"] >= 37.5, f"Touch height: {speed_box['height']}px")

        # Test Playback on Mobile
        m_play_btn.click()
        time.sleep(0.4)
        m_waveform = page_m.locator("#warrior-waveform-visualizer")
        check("Mobile Waveform Engine Pulses (.is-active)", m_waveform.evaluate("el => el.classList.contains('is-active')"))

        mobile_shot_path = "tests/screenshots/phase6_mobile_audio_briefing.png"
        page_m.screenshot(path=mobile_shot_path)
        print(f"  [SCREENSHOT] Saved: {mobile_shot_path}")

        ctx_m.close()
        browser.close()

    print("\n" + "=" * 80)
    print(f"   PHASE 6 VERIFICATION COMPLETE: {len(passed_checks)} PASSED, {len(failed_checks)} FAILED")
    print("=" * 80)

    if failed_checks:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_phase6_verification()
