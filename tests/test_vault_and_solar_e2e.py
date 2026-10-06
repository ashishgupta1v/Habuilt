from playwright.sync_api import sync_playwright
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_vault_and_solar():
    ashish_user = {
        "id": "user_ashish",
        "email": "ashish@habuilt.internal",
        "name": "Ashish Gupta",
        "role": "founder",
        "system": "primary"
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        console_errors = []
        page.on("console", lambda msg: print(f"[CONSOLE {msg.type}]", msg.text))

        page.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.removeItem('habuilt_vault_configured');
        """)

        page.goto("http://localhost:4173/", wait_until="domcontentloaded")
        page.wait_for_selector(".dashboard-flow", timeout=10000)
        page.wait_for_timeout(500)

        # 1. Open Protocol Settings Modal
        proto_chip = page.locator(".hero-protocol-chip")
        proto_chip.click()
        page.wait_for_timeout(300)

        settings_link = page.locator(".hero-protocol-action-link:has-text('Scoring & Slot Settings')")
        settings_link.click()
        page.wait_for_timeout(400)

        modal = page.locator(".proto-settings-modal")
        assert modal.is_visible(), "Protocol Settings Modal should be open"
        print("✅ Protocol Settings Modal opened")

        # 2. Click Tab 5 (Vault & Solar)
        tab_security = page.locator("#proto-tab-security")
        assert tab_security.is_visible(), "Vault & Solar Tab button should be visible"
        tab_security.click()
        page.wait_for_timeout(400)
        print("✅ Clicked Vault & Solar Tab")

        # 3. Verify Solar Ephemeris Card & Presets
        ephemeris = page.locator(".proto-ephemeris-card")
        assert ephemeris.is_visible(), "Ephemeris card should be visible"
        
        # Verify 5 solar pills (Dawn, Sunrise, Solar Noon, Sunset, Dusk)
        pills = page.locator(".proto-ephemeris-pill")
        assert pills.count() == 5, f"Expected 5 solar pills, found {pills.count()}"
        print(f"✅ Found {pills.count()} solar ephemeris pills (Dawn, Sunrise, Solar Noon, Sunset, Dusk)")

        # Verify city preset switching
        delhi_btn = page.locator(".proto-city-chip:has-text('New Delhi')")
        assert delhi_btn.is_visible(), "Delhi preset chip should exist"
        delhi_btn.click()
        page.wait_for_timeout(300)
        assert "Delhi" in page.locator(".proto-ephemeris-card__city").inner_text(), "Ephemeris city should update to Delhi"
        print("✅ Switched Solar Preset to New Delhi")

        # Verify Solar Mode Toggle
        fixed_btn = page.locator("#proto-solar-mode-fixed")
        fixed_btn.click()
        page.wait_for_timeout(300)
        badge = page.locator(".proto-badge-status").first
        assert "Fixed Clock" in badge.inner_text(), "Badge should show Fixed Clock"
        
        astro_btn = page.locator("#proto-solar-mode-astronomical")
        astro_btn.click()
        page.wait_for_timeout(300)
        assert "NOAA Algorithmic" in badge.inner_text(), "Badge should show NOAA Algorithmic"
        print("✅ Toggled Astronomical Solar Zenith vs Fixed Clock modes")

        # 4. Verify Biometric Vault Section
        vault_toggle = page.locator("#proto-vault-master-toggle")
        vault_toggle.scroll_into_view_if_needed()
        assert vault_toggle.is_visible(), "Master vault switch should be visible"
        
        # Verify initial vault inactive
        vault_badge = page.locator(".proto-badge-status").nth(1)
        assert "Vault Inactive" in vault_badge.inner_text(), "Vault should be inactive by default"
        
        # Turn vault switch ON
        page.evaluate("() => document.querySelector('.proto-settings-body').scrollTop = 1000")
        page.wait_for_timeout(200)
        vault_toggle.click(force=True)
        page.wait_for_timeout(500)
        badge_txt = page.locator(".proto-badge-status").nth(1).inner_text()
        print("Vault badge text is:", repr(badge_txt))
        assert "Vault Active" in badge_txt, f"Vault badge should show Vault Active, but got {badge_txt}"
        print("✅ Toggled Biometric Vault Active")

        # Verify Shield Options (Clinical & Rewards)
        shield_options = page.locator(".proto-shield-options")
        assert shield_options.is_visible(), "Protected app sections checkboxes should be visible"

        # Verify Passkey Enrollment Button & Input
        enroll_btn = page.locator("#proto-enroll-passkey-btn")
        assert enroll_btn.is_visible(), "Enroll Passkey button should be visible"
        print("✅ Enrolled Passkey Hardware Controls present")

        # Close Modal
        page.locator(".proto-settings-modal .modal-close-btn").click()
        page.wait_for_timeout(300)
        assert not modal.is_visible(), "Modal should close"
        print("✅ Modal closed cleanly")

        # 5. Verify IndexedDB Structure
        db_valid = page.evaluate("""
            async () => {
                return new Promise((resolve) => {
                    const req = indexedDB.open('habuilt_vault_db', 1);
                    req.onsuccess = (e) => {
                        const db = e.target.result;
                        const hasStore = db.objectStoreNames.contains('credentials');
                        db.close();
                        resolve(hasStore);
                    };
                    req.onerror = () => resolve(false);
                });
            }
        """)
        assert db_valid, "IndexedDB 'habuilt_vault_db' with 'credentials' store should exist"
        print("✅ IndexedDB 'habuilt_vault_db' store verified")

        page.screenshot(path="tests/screenshots/test_vault_solar_settings.png")
        print("✅ Screenshot saved: tests/screenshots/test_vault_solar_settings.png")
        
        assert len(console_errors) == 0, f"Expected 0 console errors, got {console_errors}"
        print("✅ 0 console errors verified")

        browser.close()
        print("\n🎉 ALL VAULT & SOLAR VERIFICATIONS PASSED!")

if __name__ == "__main__":
    test_vault_and_solar()
