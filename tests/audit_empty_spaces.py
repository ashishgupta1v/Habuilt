import os
import json
from playwright.sync_api import sync_playwright

test_user = {
    "id": "ashish",
    "email": "ashishgupta1v@gmail.com",
    "user_metadata": {"full_name": "Ashish Gupta"}
}

def audit_spaces():
    results = {}
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        
        # 1. Desktop Audit (1440x900)
        context_desktop = browser.new_context(viewport={'width': 1440, 'height': 900})
        page_d = context_desktop.new_page()
        page_d.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        page_d.goto("http://localhost:4173/", wait_until="networkidle")
        page_d.wait_for_selector(".dashboard-flow", timeout=10000)
        
        # Measure Desktop Elements
        desktop_measurements = page_d.evaluate("""
            () => {
                const getMetrics = (sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return {
                        selector: sel,
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        top: Math.round(rect.top),
                        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                        margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
                        display: style.display,
                        flexDirection: style.flexDirection,
                        gap: style.gap
                    };
                };

                return {
                    flow: getMetrics(".dashboard-flow"),
                    appHeader: getMetrics(".app-header"),
                    heroCard: getMetrics(".card--hero"),
                    topCommandBar: getMetrics(".hero-command-bar"),
                    executiveDeck: getMetrics(".hero-executive-deck"),
                    todayProtocolCard: getMetrics(".hero-today-protocol-card"),
                    kpiRibbon: getMetrics(".hero-kpi-ribbon"),
                    kpiCards: Array.from(document.querySelectorAll(".hero-kpi-card")).map(el => ({
                        h: Math.round(el.getBoundingClientRect().height),
                        p: window.getComputedStyle(el).padding
                    })),
                    zoetiHud: getMetrics(".zoeticoach-hud-card"),
                    cockpit: getMetrics(".warrior-cockpit-card"),
                    habitsSection: getMetrics("#habits"),
                    monthGrid: getMetrics(".month-grid-card, .grid-container, #month-grid-wrapper")
                };
            }
        """)
        results["desktop"] = desktop_measurements

        # Take screenshots highlighting sections
        os.makedirs("tests/screenshots/space_audit", exist_ok=True)
        page_d.screenshot(path="tests/screenshots/space_audit/desktop_today_full.png", full_page=True)
        
        # Check Focus Tab on Desktop
        page_d.click("button.hero-desktop-tab:has-text('Focus Station')")
        page_d.wait_for_timeout(500)
        page_d.screenshot(path="tests/screenshots/space_audit/desktop_focus_tab.png", full_page=True)
        desktop_focus = page_d.evaluate("""
            () => {
                const el = document.querySelector('.card--focus-station');
                if (!el) return null;
                const rect = el.getBoundingClientRect();
                const style = window.getComputedStyle(el);
                return {
                    height: Math.round(rect.height),
                    padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                    margin: `${style.marginTop} ${style.marginBottom}`
                };
            }
        """)
        results["desktop_focus"] = desktop_focus

        # Check Stats Tab on Desktop
        page_d.click("button.hero-desktop-tab:has-text('Analytics')")
        page_d.wait_for_timeout(500)
        page_d.screenshot(path="tests/screenshots/space_audit/desktop_stats_tab.png", full_page=True)
        
        # Check Rewards Tab on Desktop
        page_d.click("button.hero-desktop-tab:has-text('Reward Vault')")
        page_d.wait_for_timeout(500)
        page_d.screenshot(path="tests/screenshots/space_audit/desktop_rewards_tab.png", full_page=True)

        context_desktop.close()

        # 2. Mobile Audit (393x852)
        context_mobile = browser.new_context(
            viewport={'width': 393, 'height': 852},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True
        )
        page_m = context_mobile.new_page()
        page_m.add_init_script(f"""
            localStorage.setItem('habuilt_guest_mode', 'true');
            localStorage.setItem('habuilt_cached_user', JSON.stringify({json.dumps(test_user)}));
            localStorage.setItem('habuilt_onboarding_completed_ashish', 'true');
        """)
        page_m.goto("http://localhost:4173/", wait_until="networkidle")
        page_m.wait_for_selector(".dashboard-flow", timeout=10000)

        mobile_measurements = page_m.evaluate("""
            () => {
                const getMetrics = (sel) => {
                    const el = document.querySelector(sel);
                    if (!el) return null;
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    return {
                        selector: sel,
                        width: Math.round(rect.width),
                        height: Math.round(rect.height),
                        top: Math.round(rect.top),
                        padding: `${style.paddingTop} ${style.paddingRight} ${style.paddingBottom} ${style.paddingLeft}`,
                        margin: `${style.marginTop} ${style.marginRight} ${style.marginBottom} ${style.marginLeft}`,
                        gap: style.gap
                    };
                };

                return {
                    mobileCompactBar: getMetrics(".mobile-compact-bar"),
                    mobileHeroWrap: getMetrics(".mobile-tab-hero"),
                    mobileExecutiveDeck: getMetrics(".hero-executive-deck"),
                    mobileKpiRibbon: getMetrics(".hero-kpi-ribbon"),
                    mobileTodayChecklist: getMetrics(".checklist-mobile-container, .mobile-checklist-card"),
                    mobileHabitItems: Array.from(document.querySelectorAll(".mobile-habit-row, .checklist-item")).slice(0, 5).map(el => {
                        const style = window.getComputedStyle(el);
                        return {
                            h: Math.round(el.getBoundingClientRect().height),
                            p: `${style.paddingTop} ${style.paddingBottom}`,
                            m: `${style.marginTop} ${style.marginBottom}`
                        };
                    }),
                    mobileBottomNav: getMetrics(".mobile-bottom-nav"),
                    mobileFab: getMetrics("#mobile-habits-fab")
                };
            }
        """)
        results["mobile"] = mobile_measurements
        page_m.screenshot(path="tests/screenshots/space_audit/mobile_today_full.png", full_page=True)

        # Mobile Focus Tab
        page_m.click("#mobile-nav-focus")
        page_m.wait_for_timeout(500)
        page_m.screenshot(path="tests/screenshots/space_audit/mobile_focus_full.png", full_page=True)

        # Mobile Stats Tab
        page_m.click("#mobile-nav-stats")
        page_m.wait_for_timeout(500)
        page_m.screenshot(path="tests/screenshots/space_audit/mobile_stats_full.png", full_page=True)

        # Mobile Rewards Tab
        page_m.click("#mobile-nav-rewards")
        page_m.wait_for_timeout(500)
        page_m.screenshot(path="tests/screenshots/space_audit/mobile_rewards_full.png", full_page=True)

        context_mobile.close()
        browser.close()

    with open("tests/screenshots/space_audit/audit_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Space audit completed! Metrics saved to tests/screenshots/space_audit/audit_metrics.json")

if __name__ == "__main__":
    audit_spaces()
