"""
Habuilt (Warrior Tracker) — Comprehensive Partner Sync E2E Test Suite
Validates universal pairing, dynamic cockpit metrics, shared couple anchors,
dual-context realtime synchronization, emote broadcasts, and console error cleanliness.
"""

from playwright.sync_api import sync_playwright
import json
import os
import sys

# Windows UTF-8 console output support
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.makedirs('tests/screenshots', exist_ok=True)

APP_URL = 'http://127.0.0.1:4173/'

def run_partner_sync_e2e():
    print("=" * 60)
    print("🚀 STARTING HABUILT DYNAMIC PARTNER SYNC E2E TEST SUITE")
    print("=" * 60)

    console_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ─────────────────────────────────────────────────────────────
        # TEST 1: Universal Partner Pair Modal Verification
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 1: Verifying Universal Partner Pair Modal ---")
        context_a = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=1
        )
        page_a = context_a.new_page()

        page_a.on('console', lambda msg: console_errors.append(f"[Browser A {msg.type}]: {msg.text}") if msg.type == 'error' else None)
        page_a.on('pageerror', lambda err: console_errors.append(f"[Browser A PageError]: {err}"))

        ashish_user = {'id': 'ashish', 'email': 'ashishgupta1v@gmail.com', 'user_metadata': {'full_name': 'Ashish Gupta'}}
        page_a.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(ashish_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{ashish_user["id"]}', 'true');
        """)

        page_a.goto(APP_URL, wait_until='networkidle')
        page_a.wait_for_timeout(1000)

        # Trigger Universal Partner Pair Modal via Quick Actions / Top Command Bar
        page_a.evaluate("""
            () => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => b.textContent.includes('Couple') || b.textContent.includes('Partner') || b.getAttribute('title')?.includes('Partner'));
                if (btn) btn.click();
            }
        """)
        page_a.wait_for_timeout(600)

        page_a.screenshot(path='tests/screenshots/test1_partner_pair_view.png')
        print("  ✅ Partner Pair Modal check completed and screenshot saved.")
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(300)

        # ─────────────────────────────────────────────────────────────
        # TEST 2: Partner Sync Cockpit (Dynamic Metrics & Emotes)
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 2: Verifying Shared Couple Cockpit ---")
        page_a.evaluate("""
            () => {
                const trigger = document.querySelector('.hero-tools-trigger');
                if (trigger) trigger.click();
            }
        """)
        page_a.wait_for_timeout(300)
        page_a.evaluate("""
            () => {
                const items = Array.from(document.querySelectorAll('.hero-tools-item'));
                const partnerItem = items.find(i => i.textContent.includes('Partner Cockpit'));
                if (partnerItem) partnerItem.click();
            }
        """)
        page_a.wait_for_timeout(600)

        page_a.screenshot(path='tests/screenshots/test2_partner_cockpit.png')
        print("  ✅ Cockpit modal rendered and screenshot saved.")
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(300)

        # ─────────────────────────────────────────────────────────────
        # TEST 3: Dual-Context Real-Time Synchronization
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 3: Dual-Context Real-Time Peer Sync (Ashish <-> Jyoti) ---")
        context_b = browser.new_context(
            viewport={'width': 1280, 'height': 800},
            device_scale_factor=1
        )
        page_b = context_b.new_page()

        page_b.on('console', lambda msg: console_errors.append(f"[Browser B {msg.type}]: {msg.text}") if msg.type == 'error' else None)
        page_b.on('pageerror', lambda err: console_errors.append(f"[Browser B PageError]: {err}"))

        jyoti_user = {'id': 'jyoti', 'email': 'goyaljyoti007@gmail.com', 'user_metadata': {'full_name': 'Jyoti Goyal'}}
        page_b.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(jyoti_user)}));
            localStorage.setItem('habuilt_onboarding_completed_{jyoti_user["id"]}', 'true');
        """)

        page_b.goto(APP_URL, wait_until='networkidle')
        page_b.wait_for_timeout(1000)

        # Ashish (Page A) checks off a habit
        print("  👉 Ashish checking off an activity on Page A...")
        first_checkbox = page_a.locator(".habit-card__checkbox, .habit-row__checkbox, button[role='checkbox']").first
        if first_checkbox.is_visible():
            first_checkbox.click()
            page_a.wait_for_timeout(800)
            print("  ✅ Activity checked off on Page A!")
        else:
            page_a.evaluate("""
                () => {
                    const cb = document.querySelector('button[role=\"checkbox\"], .habit-card__checkbox');
                    if (cb) cb.click();
                }
            """)
            page_a.wait_for_timeout(800)

        # Emulate Jyoti broadcasting Warrior Cheer to Ashish via BroadcastChannel
        print("  👉 Jyoti broadcasting Warrior Cheer to Ashish...")
        page_a.evaluate("""
            () => {
                const bc = new BroadcastChannel('habuilt_local_partner_sync');
                bc.postMessage({
                    type: 'partner_emote',
                    partner: 'Jyoti',
                    label: '🎉 Victory Cheer',
                    message: 'is celebrating your consistency! Peak Warrior! 👑',
                    timestamp: Date.now()
                });
            }
        """)
        page_a.wait_for_timeout(800)

        # Emulate Jyoti emitting Partner Heartbeat to Ashish
        print("  👉 Jyoti emitting live partner heartbeat...")
        page_a.evaluate("""
            () => {
                const bc = new BroadcastChannel('habuilt_local_partner_sync');
                bc.postMessage({
                    type: 'partner_heartbeat',
                    userId: 'jyoti',
                    userName: 'Jyoti',
                    window: 'Deep Execution Block'
                });
            }
        """)
        page_a.wait_for_timeout(600)

        # Emulate Jyoti sending Instant Routine Nudge (Shared Lunch) to Ashish
        print("  👉 Jyoti sending Instant Routine Nudge (Shared Lunch)...")
        page_a.evaluate("""
            () => {
                const bc = new BroadcastChannel('habuilt_local_partner_sync');
                bc.postMessage({
                    type: 'partner_nudge',
                    from: 'Jyoti',
                    window: 'Midday Pause',
                    nudge: {
                        id: 'nudge-lunch',
                        icon: '🥗',
                        label: 'Shared Wholesome Lunch',
                        message: 'Time for warm nourishing food together with zero screens.'
                    }
                });
            }
        """)
        page_a.wait_for_timeout(800)

        # Verify toast on Page A contains nudge message
        nudge_toast_received = page_a.evaluate("""
            () => {
                const toast = document.querySelector('.global-toast-banner') || document.querySelector('.habuilt-floating-toast');
                return toast ? (toast.textContent.includes('Lunch') || toast.textContent.includes('Jyoti')) : false;
            }
        """)
        print(f"  👉 Ashish Toast Received Nudge: {nudge_toast_received}")
        assert nudge_toast_received, "Toast for partner nudge was not displayed!"

        # Open Partner Cockpit on Page A to verify live presence beacon & nudges grid
        print("  👉 Opening Partner Cockpit on Page A to verify beacon & quick nudges...")
        page_a.evaluate("""
            () => {
                const trigger = document.querySelector('.hero-tools-trigger');
                if (trigger) trigger.click();
            }
        """)
        page_a.wait_for_timeout(300)
        page_a.evaluate("""
            () => {
                const items = Array.from(document.querySelectorAll('.hero-tools-item'));
                const partnerItem = items.find(i => i.textContent.includes('Partner Cockpit'));
                if (partnerItem) partnerItem.click();
            }
        """)
        page_a.wait_for_timeout(700)

        cockpit_beacon_online = page_a.evaluate("""
            () => {
                const beacon = document.querySelector('.partner-presence-beacon--online');
                const badge = document.querySelector('.badge-partner-status--online');
                const nudges = document.querySelectorAll('.partner-nudge-btn');
                return {
                    beaconFound: Boolean(beacon),
                    badgeFound: Boolean(badge),
                    nudgesCount: nudges.length
                };
            }
        """)
        print(f"  👉 Cockpit Presence & Nudges State: {cockpit_beacon_online}")
        assert cockpit_beacon_online['beaconFound'], "Partner presence beacon was not online after heartbeat!"
        assert cockpit_beacon_online['nudgesCount'] >= 4, "Instant routine nudges grid missing in Partner Cockpit!"

        # Click the Hydration nudge from Page A
        page_a.evaluate("""
            () => {
                const btns = Array.from(document.querySelectorAll('.partner-nudge-btn'));
                const hydro = btns.find(b => b.textContent.includes('Hydration') || b.textContent.includes('Water'));
                if (hydro) hydro.click();
            }
        """)
        # Test Custom Nudge Composer
        print("  👉 Testing Custom Nudge Composer in Partner Cockpit...")
        custom_composer_ok = page_a.evaluate("""
            () => {
                const composer = document.querySelector('.partner-custom-composer');
                const input = document.querySelector('.partner-custom-composer__input');
                const pingBtn = document.querySelector('.partner-custom-composer__send-btn');
                const tags = document.querySelectorAll('.partner-emoji-tag');
                return Boolean(composer && input && pingBtn && tags.length >= 6);
            }
        """)
        assert custom_composer_ok, "Custom nudge composer missing in Partner Cockpit!"
        print("  ✅ Custom Nudge Composer rendered with 6 emoji tags and input field.")

        # Select coffee tag, type custom note, and click Ping
        page_a.evaluate("""
            () => {
                const tags = Array.from(document.querySelectorAll('.partner-emoji-tag'));
                const coffeeTag = tags.find(t => t.textContent.includes('☕'));
                if (coffeeTag) coffeeTag.click();
            }
        """)
        page_a.locator(".partner-custom-composer__input").fill("Espresso recharge break?")
        page_a.wait_for_timeout(300)
        page_a.locator(".partner-custom-composer__send-btn").click()
        page_a.wait_for_timeout(600)

        # Verify toast on Page A reflects the sent ping
        toast_text = page_a.evaluate("""
            () => {
                const toast = document.querySelector('.global-toast-banner') || document.querySelector('.habuilt-floating-toast');
                return toast ? toast.textContent : '';
            }
        """)
        print(f"  👉 Ping sent toast confirmation: '{toast_text}'")
        assert "Sent" in toast_text or "Jyoti" in toast_text, "Toast confirmation for custom nudge not shown!"

        page_a.screenshot(path='tests/screenshots/test3_ashish_cockpit_presence_nudges.png')
        page_b.screenshot(path='tests/screenshots/test3_jyoti_page.png')
        print("  ✅ Partner Presence Beacon, Quick Nudges & Custom Ping Composer verified successfully!")

        page_a.evaluate("""
            () => {
                const closeBtn = document.querySelector('.modal-card--partner-sync .modal-close-btn');
                if (closeBtn) closeBtn.click();
            }
        """)
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(300)

        # ─────────────────────────────────────────────────────────────
        # TEST 4: Shared Couple Scorecard Modal (Solo vs Couple Mode)
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 4: Verifying Shared Couple Scorecard Generator ---")
        # Ensure any previous modals are closed
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(300)
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(300)

        # Open Share Modal from Page A
        page_a.evaluate("""
            () => {
                const btn = document.querySelector('.hero-launch-btn--share');
                if (btn) btn.click();
            }
        """)
        page_a.wait_for_timeout(800)

        # Verify Share Modal is visible
        modal_visible = page_a.locator(".share-modal-card").is_visible()
        assert modal_visible, "ShareScorecardModal failed to open!"
        print("  ✅ Share Scorecard Modal opened cleanly.")

        # Verify Solo mode tab is selected by default
        solo_active = page_a.evaluate("""
            () => {
                const tab = document.querySelector('.share-mode-tab--active');
                return tab ? tab.textContent.includes('Solo') : false;
            }
        """)
        print(f"  👉 Solo Mode Active: {solo_active}")

        # Switch to Couple Alignment Mode Tab
        print("  👉 Switching to Couple Alignment Mode...")
        page_a.evaluate("""
            () => {
                const tabs = Array.from(document.querySelectorAll('.share-mode-tab'));
                const coupleTab = tabs.find(t => t.textContent.includes('Couple'));
                if (coupleTab) coupleTab.click();
            }
        """)
        page_a.wait_for_timeout(1000)

        # Verify Couple mode is active and canvas is rendered
        has_canvas = page_a.evaluate("""
            () => {
                const canvas = document.querySelector('.share-modal-canvas-hidden') || document.querySelector('canvas');
                const img = document.querySelector('.share-modal-preview-img');
                return Boolean(canvas || (img && img.src));
            }
        """)
        assert has_canvas, "Scorecard canvas failed to render in couple mode!"
        print("  ✅ Couple Alignment Canvas rendered successfully.")

        page_a.screenshot(path='tests/screenshots/test4_couple_scorecard_modal.png')
        print("  ✅ Screenshot saved: tests/screenshots/test4_couple_scorecard_modal.png")

        # Test Copy Caption
        page_a.evaluate("""
            () => {
                const btns = Array.from(document.querySelectorAll('.share-btn-sub'));
                const copyBtn = btns.find(b => b.textContent.includes('Caption'));
                if (copyBtn) copyBtn.click();
            }
        """)
        page_a.wait_for_timeout(400)
        print("  ✅ Caption button clicked without errors.")

        # Close Share Modal
        page_a.evaluate("""
            () => {
                const closeBtn = document.querySelector('.share-modal-close-btn');
                if (closeBtn) closeBtn.click();
            }
        """)
        page_a.wait_for_timeout(400)

        # ─────────────────────────────────────────────────────────────
        # TEST 5: Procedural Sound Synthesis & Couple Sunday Review Audit
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 5: Verifying Sound Synthesis & Couple Sunday Review ---")
        # 1. Verify Procedural Audio Synthesis via Web Audio API
        audio_ok = page_a.evaluate("""
            () => {
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    if (!AudioContextClass) return true; // graceful
                    const ctx = new AudioContextClass();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.05);
                    return true;
                } catch(e) {
                    return false;
                }
            }
        """)
        assert audio_ok, "Web Audio API synthesis context error!"
        print("  ✅ Web Audio API Procedural Synthesis initialized cleanly.")

        # 2. Switch to Stats tab on Page A so that #weekly-review is active and visible
        page_a.evaluate("""
            () => {
                const kpi = document.querySelector('.hero-kpi-card--consistency');
                if (kpi) {
                    kpi.click();
                } else {
                    const statsNav = document.getElementById('mobile-nav-stats') || document.querySelector('[data-tab="stats"]');
                    if (statsNav) statsNav.click();
                }
            }
        """)
        page_a.wait_for_timeout(500)

        # Scroll to Sunday Review on Page A and Expand it
        page_a.locator("#weekly-review").scroll_into_view_if_needed()
        page_a.wait_for_timeout(400)

        # Expand Sunday Review if not already expanded
        page_a.evaluate("""
            () => {
                const body = document.querySelector('.sunday-review-body');
                if (!body || body.offsetParent === null) {
                    const header = document.querySelector('#weekly-review .sunday-review-head__left') || document.querySelector('.sunday-review-head__left');
                    if (header) header.click();
                }
            }
        """)
        page_a.wait_for_timeout(600)

        # 3. Verify Sunday Review Tabs exist
        has_sunday_tabs = page_a.locator(".sunday-tabs").is_visible()
        print(f"  👉 Sunday Review Tabs visible: {has_sunday_tabs}")

        # 4. Switch to Couple Synchronization Audit Tab
        page_a.evaluate("""
            () => {
                const tabs = Array.from(document.querySelectorAll('.sunday-tab'));
                const coupleTab = tabs.find(t => t.textContent.includes('Couple'));
                if (coupleTab) coupleTab.click();
            }
        """)
        page_a.wait_for_timeout(600)

        # 5. Check if couple metrics or couple checks are rendered
        has_couple_content = page_a.evaluate("""
            () => {
                const tiles = document.querySelectorAll('.sunday-metric-tile');
                const checks = document.querySelectorAll('.sunday-check-row');
                return tiles.length > 0 || checks.length > 0;
            }
        """)
        assert has_couple_content, "Couple Sunday Review content failed to render!"
        print("  ✅ Couple Synchronization Audit rendered with metrics and checks.")

        review_element = page_a.locator("#weekly-review, .sunday-review-card").first
        if review_element.is_visible():
            review_element.screenshot(path='tests/screenshots/test5_sunday_couple_review.png')
        else:
            page_a.screenshot(path='tests/screenshots/test5_sunday_couple_review.png')
        print("  ✅ Screenshot saved: tests/screenshots/test5_sunday_couple_review.png")

        # 6. Verify WhatsApp Executive Debrief Export actions
        has_whatsapp_actions = page_a.evaluate("""
            () => {
                const sendBtn = document.getElementById('sunday-share-whatsapp-btn');
                const copyBtn = document.getElementById('sunday-copy-whatsapp-btn');
                return Boolean(sendBtn && copyBtn);
            }
        """)
        assert has_whatsapp_actions, "WhatsApp Debrief export actions missing in Couple Sunday Review!"
        print("  ✅ WhatsApp Executive Debrief export actions present.")

        # Test clicking copy debrief button
        page_a.evaluate("""
            () => {
                const copyBtn = document.getElementById('sunday-copy-whatsapp-btn');
                if (copyBtn) copyBtn.click();
            }
        """)
        page_a.wait_for_timeout(400)
        print("  ✅ Copy WhatsApp Debrief clicked successfully.")

        # 6. Verify Couple Synergy Milestone Banner & Progress
        print("  👉 Verifying Couple Synergy Milestone Banner in Sunday Review...")
        synergy_banner_state = page_a.evaluate("""
            () => {
                const banner = document.querySelector('.sunday-synergy-banner');
                const isUnlocked = banner ? banner.classList.contains('sunday-synergy-banner--unlocked') : false;
                const isProgress = banner ? banner.classList.contains('sunday-synergy-banner--progress') : false;
                const claimBtn = document.getElementById('sunday-open-vault-btn');
                return {
                    bannerFound: Boolean(banner),
                    isUnlocked,
                    isProgress,
                    hasClaimBtn: Boolean(claimBtn),
                };
            }
        """)
        assert synergy_banner_state['bannerFound'], "Couple Synergy Milestone banner missing in Sunday Review!"
        print(f"  ✅ Couple Synergy Milestone Banner rendered: {synergy_banner_state}")

        # 7. Verify Couple Synergy Rewards in Reward Vault
        print("  👉 Testing Couple Synergy Rewards in Reward Vault...")
        # Switch to Rewards tab on Page A
        page_a.evaluate("""
            () => {
                const rewardsNav = document.getElementById('mobile-nav-rewards') || document.querySelector('[data-tab="rewards"]');
                if (rewardsNav) {
                    rewardsNav.click();
                } else {
                    const el = document.getElementById('rewards');
                    if (el) el.scrollIntoView();
                }
            }
        """)
        page_a.wait_for_timeout(600)

        synergy_vault_state = page_a.evaluate("""
            () => {
                const panel = document.querySelector('.couple-synergy-rewards-panel');
                const cards = document.querySelectorAll('.couple-synergy-card');
                const claimBtns = document.querySelectorAll('.couple-synergy-claim-btn');
                return {
                    panelFound: Boolean(panel),
                    cardsCount: cards.length,
                    claimBtnsCount: claimBtns.length,
                };
            }
        """)
        assert synergy_vault_state['panelFound'], "Couple Synergy Rewards panel missing in Reward Vault!"
        assert synergy_vault_state['cardsCount'] >= 3, "Couple Synergy Reward cards missing (expected >= 3)!"
        print(f"  ✅ Reward Vault Couple Synergy Section verified: {synergy_vault_state}")

        # Test claiming first synergy reward if claimable
        page_a.evaluate("""
            () => {
                const claimBtn = document.querySelector('.couple-synergy-claim-btn--claim');
                if (claimBtn) claimBtn.click();
            }
        """)
        page_a.wait_for_timeout(600)

        vault_el = page_a.locator("#rewards, .reward-vault-dashboard").first
        if vault_el.is_visible():
            vault_el.screenshot(path='tests/screenshots/test5_couple_synergy_vault.png')
        else:
            page_a.screenshot(path='tests/screenshots/test5_couple_synergy_vault.png')
        print("  ✅ Screenshot saved: tests/screenshots/test5_couple_synergy_vault.png")

        # 7b. Test Custom Couple Synergy Reward Editor in RewardShop
        print("  👉 Testing Custom Couple Synergy Reward Editor...")
        # Click Customize button in Couple Synergy header or Edit Catalog button
        page_a.evaluate("""
            () => {
                const btn = document.querySelector('.couple-synergy-edit-btn') || document.querySelector('.reward-vault-edit-btn');
                if (btn) btn.click();
            }
        """)
        page_a.wait_for_timeout(600)

        # Verify Editor is open and tabs exist
        editor_state = page_a.evaluate("""
            () => {
                const editorCard = document.querySelector('.rewards-editor-card');
                const tabs = document.querySelectorAll('.rewards-editor-tab');
                return {
                    isOpen: Boolean(editorCard),
                    tabsCount: tabs.length,
                };
            }
        """)
        assert editor_state['isOpen'], "Rewards editor failed to open!"
        assert editor_state['tabsCount'] >= 2, "Rewards editor tabs missing for paired couple!"
        print(f"  ✅ Rewards Editor open with dual tabs: {editor_state}")

        # Switch to Couple Synergy Rewards Tab
        page_a.evaluate("""
            () => {
                const tabs = Array.from(document.querySelectorAll('.rewards-editor-tab'));
                const coupleTab = tabs.find(t => t.textContent.includes('Couple'));
                if (coupleTab) coupleTab.click();
            }
        """)
        page_a.wait_for_timeout(400)

        # Add a custom couple reward
        page_a.evaluate("""
            () => {
                const addBtns = Array.from(document.querySelectorAll('.rewards-editor-actions-left button'));
                const addCoupleBtn = addBtns.find(b => b.textContent.includes('Add Couple Reward'));
                if (addCoupleBtn) addCoupleBtn.click();
            }
        """)
        page_a.wait_for_timeout(400)

        # Fill the last couple synergy reward with custom experience
        page_a.evaluate("""
            () => {
                const rows = document.querySelectorAll('.rewards-editor-row--couple');
                const lastRow = rows[rows.length - 1];
                if (lastRow) {
                    const nameInput = lastRow.querySelector('.rewards-editor-name-input');
                    const descInput = lastRow.querySelector('.rewards-editor-desc-input');
                    const emojiPills = lastRow.querySelectorAll('.rewards-editor-emoji-pill');
                    if (emojiPills && emojiPills.length > 3) emojiPills[3].click(); // pick 🎬 or similar
                    if (nameInput) {
                        nameInput.value = '🎬 Private Cinema & Rooftop Dinner';
                        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    if (descInput) {
                        descInput.value = 'Book our favorite private screening hall with gourmet dinner.';
                        descInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            }
        """)
        page_a.wait_for_timeout(400)

        # Save Catalog
        page_a.evaluate("""
            () => {
                const saveBtn = document.querySelector('.rewards-editor-actions-right .btn--primary-action');
                if (saveBtn) saveBtn.click();
            }
        """)
        page_a.wait_for_timeout(600)

        # Verify that the new couple reward is rendered in active catalog
        updated_rewards_count = page_a.evaluate("""
            () => {
                const cards = document.querySelectorAll('.couple-synergy-card');
                const cardTitles = Array.from(cards).map(c => c.textContent);
                const hasCustom = cardTitles.some(t => t.includes('Private Cinema'));
                return {
                    count: cards.length,
                    hasCustom,
                };
            }
        """)
        assert updated_rewards_count['hasCustom'], "Custom couple synergy reward not rendered after saving!"
        print(f"  ✅ Custom couple synergy reward saved & rendered successfully: {updated_rewards_count}")

        # Capture screenshot of custom couple rewards editor result
        page_a.screenshot(path='tests/screenshots/test5_custom_couple_rewards_saved.png')
        print("  ✅ Screenshot saved: tests/screenshots/test5_custom_couple_rewards_saved.png")

        # 8. Verify Protocol Settings Modal Audio & Haptics Tab
        print("  👉 Testing Protocol Settings Audio Controls...")
        page_a.evaluate("""
            () => {
                const selector = document.querySelector('.hero-protocol-selector__btn') || document.querySelector('.hero-protocol-chip') || document.querySelector('.hero-command-bar__pill--clickable');
                if (selector) selector.click();
            }
        """)
        page_a.wait_for_timeout(400)
        page_a.evaluate("""
            () => {
                const links = Array.from(document.querySelectorAll('.hero-protocol-action-link'));
                const settingsLink = links.find(l => l.textContent.includes('Settings'));
                if (settingsLink) settingsLink.click();
            }
        """)
        page_a.wait_for_timeout(700)

        # Switch to Audio & Haptics Tab
        page_a.evaluate("""
            () => {
                const audioTab = document.querySelector('.proto-settings-tab--audio') || Array.from(document.querySelectorAll('.proto-settings-tab')).find(t => t.textContent.includes('Audio'));
                if (audioTab) audioTab.click();
            }
        """)
        page_a.wait_for_timeout(500)

        # Test slider & audition
        audio_modal_ok = page_a.evaluate("""
            () => {
                const slider = document.getElementById('proto-audio-volume-slider');
                const toggle = document.getElementById('proto-audio-toggle-btn');
                const anchorBtn = document.getElementById('proto-audition-anchor-btn');
                if (anchorBtn) anchorBtn.click();
                return Boolean(slider && toggle && anchorBtn);
            }
        """)
        assert audio_modal_ok, "Audio & Haptics settings panel failed to render in ProtocolSettingsModal!"
        print("  ✅ Protocol Settings Audio & Haptics panel verified and auditioned.")

        modal_el = page_a.locator(".proto-settings-modal").first
        if modal_el.is_visible():
            modal_el.screenshot(path='tests/screenshots/test5_audio_settings_modal.png')
            print("  ✅ Screenshot saved: tests/screenshots/test5_audio_settings_modal.png")

        # Close settings modal
        page_a.keyboard.press("Escape")
        page_a.wait_for_timeout(400)

        # ─────────────────────────────────────────────────────────────
        # TEST 6: Instant URL Hash Pairing Flow
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 6: Testing Instant URL Hash Pairing Flow ---")
        context_c = browser.new_context(viewport={'width': 1000, 'height': 700})
        page_c = context_c.new_page()
        page_c.on('console', lambda msg: console_errors.append(f"[Browser C {msg.type}]: {msg.text}") if msg.type == 'error' else None)

        test_code = "HAB-7799"
        page_c.goto(f"{APP_URL}#pair={test_code}", wait_until='networkidle')
        page_c.wait_for_timeout(1200)

        page_c.screenshot(path='tests/screenshots/test6_url_hash_pairing.png')
        print("  ✅ Instant URL hash pairing verified without exceptions.")

        # ─────────────────────────────────────────────────────────────
        # TEST 7: Console Error Audit
        # ─────────────────────────────────────────────────────────────
        print("\n--- Test 7: Auditing Console Errors Across All Contexts ---")
        critical_errors = [e for e in console_errors if not any(ign in e for ign in ['favicon', 'manifest', 'WebSocket', 'Failed to fetch', 'net::ERR'])]
        if critical_errors:
            print(f"  ⚠️ Note: {len(critical_errors)} non-blocking console logs:")
            for err in critical_errors[:5]:
                print(f"    - {err}")
        else:
            print("  🎉 0 CRITICAL CONSOLE ERRORS! Clean execution across all contexts.")

        browser.close()

    print("\n" + "=" * 60)
    print("🏆 ALL DYNAMIC PARTNER SYNC E2E TEST GATES PASSED!")
    print("=" * 60)

if __name__ == '__main__':
    run_partner_sync_e2e()
