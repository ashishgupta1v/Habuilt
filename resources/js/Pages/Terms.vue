<script setup>
import { ref } from 'vue';
import { ArrowLeft, ShieldAlert, Award, FileText, CheckCircle2, AlertOctagon, Scale, RefreshCw, Zap } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const lastUpdated = 'October 28, 2026';
const activeSection = ref('acceptance');

const scrollToSection = (id) => {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>

<template>
  <div class="legal-root">
    <!-- Ambient Background Glows -->
    <div class="glow-orb glow-amber"></div>
    <div class="glow-orb glow-indigo"></div>

    <!-- Header Navigation -->
    <header class="legal-header">
      <div class="legal-header__inner">
        <a href="/" class="brand-link">
          <HabuiltLogo size="sm" :with-text="true" />
        </a>
        <div class="header-actions">
          <a href="/privacy" class="header-link">Privacy Policy</a>
          <a href="/disclaimer" class="header-link">Medical Disclaimer</a>
          <a href="/auth" class="back-btn">
            <ArrowLeft class="icon-14" />
            <span>Back to App</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="legal-main">
      <!-- Title Banner -->
      <div class="hero-intro">
        <div class="pill-badge amber-pill">
          <Scale class="icon-14" />
          <span>Legal Agreement &amp; Operating Protocol</span>
        </div>
        <h1 class="legal-title">Terms of Service &amp; EULA</h1>
        <p class="legal-desc">
          Please review these Terms of Service and End User License Agreement carefully before operating the Habuilt software suite across Web, Android, and iOS platforms.
        </p>
        <div class="legal-meta">
          <span>Last Revised: {{ lastUpdated }}</span>
          <span>•</span>
          <span>Global Commercial Edition</span>
        </div>
      </div>

      <div class="legal-grid">
        <!-- Sticky Navigation Sidebar -->
        <aside class="toc-sidebar">
          <div class="toc-title">Table of Contents</div>
          <nav class="toc-nav">
            <button
              v-for="item in [
                { id: 'acceptance', label: '1. Acceptance of Terms' },
                { id: 'medical-disclaimer', label: '2. Medical & Wellness Disclaimer' },
                { id: 'account-security', label: '3. Accounts & Security' },
                { id: 'subscriptions-billing', label: '4. Subscriptions & Billing' },
                { id: 'gamification-points', label: '5. Virtual Points & XP' },
                { id: 'intellectual-property', label: '6. Intellectual Property & EULA' },
                { id: 'limitation-liability', label: '7. Limitation of Liability' },
                { id: 'termination', label: '8. Termination & Deletion' },
                { id: 'governing-law', label: '9. Governing Law' }
              ]"
              :key="item.id"
              type="button"
              @click="scrollToSection(item.id)"
              class="toc-btn"
              :class="{ 'active': activeSection === item.id }"
            >
              {{ item.label }}
            </button>
          </nav>
        </aside>

        <!-- Document Content -->
        <article class="legal-content">
          <!-- Section 1 -->
          <section id="acceptance" class="legal-card">
            <h2 class="card-heading">
              <CheckCircle2 class="icon-18 emerald-icon" />
              <span>1. Acceptance of Terms</span>
            </h2>
            <p>
              By accessing, browsing, downloading, or using Habuilt (including Web app, Android APK/Play Store application, or iOS TestFlight/App Store build), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, do not access or use the application.
            </p>
          </section>

          <!-- Section 2: CRITICAL MEDICAL DISCLAIMER -->
          <section id="medical-disclaimer" class="legal-card highlight-card">
            <h2 class="card-heading amber-heading">
              <ShieldAlert class="icon-18 amber-icon" />
              <span>2. Health, Fitness &amp; Medical Disclaimer (Important)</span>
            </h2>
            <div class="callout-box amber-box">
              <p>
                <strong>NOT MEDICAL ADVICE:</strong> Habuilt and the ZoetiCoach intelligence system are habit tracking, cognitive discipline, and lifestyle organization tools. They are NOT certified medical devices, and do NOT provide medical diagnosis, treatment, clinical management, or physical therapy prescriptions.
              </p>
              <p style="margin-top: 10px;">
                Any routines related to hydration volume, joint decompression, stretching, zone 2 cardiovascular activity, or circadian sleep schedules are general educational references. Always consult a licensed healthcare practitioner or physician before starting any strenuous fitness program or radically altering fluid intake or dietary habits.
              </p>
              <p style="margin-top: 10px;">
                If you experience sharp joint pain, shortness of breath, dizziness, or physiological distress while performing any habit or routine, cease immediately and seek qualified medical attention.
              </p>
            </div>
          </section>

          <!-- Section 3 -->
          <section id="account-security" class="legal-card">
            <h2 class="card-heading">
              <Zap class="icon-18 sky-icon" />
              <span>3. User Accounts &amp; Access Security</span>
            </h2>
            <p>
              You must be at least 13 years old (or 16 in the European Economic Area) to create an account. You are responsible for safeguarding your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use or security breach.
            </p>
          </section>

          <!-- Section 4 -->
          <section id="subscriptions-billing" class="legal-card">
            <h2 class="card-heading">
              <Award class="icon-18 indigo-icon" />
              <span>4. Commercial Subscriptions &amp; Billing</span>
            </h2>
            <p>Habuilt offers both free tiers and paid Pro / Duo subscription plans:</p>
            <ul class="styled-list">
              <li><strong>Billing Cycles:</strong> Paid subscriptions are billed on a recurring monthly or annual basis unless cancelled prior to renewal.</li>
              <li><strong>Payment Processors:</strong> Web transactions are processed via Stripe; mobile in-app purchases are billed through Apple StoreKit or Google Play Billing in accordance with store terms.</li>
              <li><strong>Refunds:</strong> In-app purchases on iOS and Android are managed directly by Apple and Google and are subject to their respective refund policies. Web subscriptions may be cancelled anytime with access continuing through the end of the paid billing period.</li>
            </ul>
          </section>

          <!-- Section 5 -->
          <section id="gamification-points" class="legal-card">
            <h2 class="card-heading">
              <Award class="icon-18 amber-icon" />
              <span>5. Virtual Points, XP &amp; Milestone Vaults</span>
            </h2>
            <p>
              Habuilt awards daily discipline points, XP, streak badges, and warrior rank levels:
            </p>
            <div class="callout-box info-box">
              These points, XP, and milestone tokens are strictly non-monetary gamification metrics created solely to reward personal accountability. Points have NO cash value, cannot be redeemed for fiat currency or cryptocurrency, and cannot be transferred or traded outside the Habuilt platform.
            </div>
          </section>

          <!-- Section 6 -->
          <section id="intellectual-property" class="legal-card">
            <h2 class="card-heading">
              <FileText class="icon-18 emerald-icon" />
              <span>6. Intellectual Property &amp; Limited License (EULA)</span>
            </h2>
            <p>
              Habuilt grants you a personal, revocable, non-exclusive, non-transferable, limited license to download and run the software for personal, non-commercial productivity tracking. All code, design systems, Bento grid interfaces, SVG assets, soundscapes, and algorithms remain the exclusive intellectual property of Habuilt Technologies.
            </p>
          </section>

          <!-- Section 7 -->
          <section id="limitation-liability" class="legal-card">
            <h2 class="card-heading">
              <AlertOctagon class="icon-18 rose-icon" />
              <span>7. Limitation of Liability</span>
            </h2>
            <p style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.7;">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HABUILT AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, DEVICE DAMAGE, PERSONAL INJURY RESULTING FROM STRENUOUS PHYSICAL ROUTINES, OR SERVICE INTERRUPTIONS. THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS.
            </p>
          </section>

          <!-- Section 8 -->
          <section id="termination" class="legal-card">
            <h2 class="card-heading">
              <RefreshCw class="icon-18 amber-icon" />
              <span>8. Termination &amp; Self-Service Account Purge</span>
            </h2>
            <p>
              You may terminate your account at any time via <em>Protocol Settings &gt; Security &gt; Delete Account</em>. Upon termination, all personal data, habit logs, and credentials are permanently purged in accordance with our Privacy Policy.
            </p>
          </section>

          <!-- Section 9 -->
          <section id="governing-law" class="legal-card">
            <h2 class="card-heading">
              <Scale class="icon-18 indigo-icon" />
              <span>9. Governing Law &amp; Dispute Resolution</span>
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any legal disputes shall be resolved through binding arbitration or appropriate courts of competent jurisdiction.
            </p>
          </section>
        </article>
      </div>

      <!-- Footer -->
      <footer class="legal-footer">
        <p>&copy; {{ new Date().getFullYear() }} Habuilt Technologies. • <a href="/privacy">Privacy Policy</a> • <a href="/disclaimer">Wellness Disclaimer</a></p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.legal-root {
  min-height: 100vh;
  background-color: #07090e;
  color: #e2e8f0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.glow-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  z-index: 0;
  filter: blur(140px);
}
.glow-amber {
  top: -100px;
  right: 25%;
  width: 500px;
  height: 500px;
  background: rgba(245, 158, 11, 0.05);
}
.glow-indigo {
  bottom: 25%;
  left: -100px;
  width: 600px;
  height: 600px;
  background: rgba(99, 102, 241, 0.05);
}

.legal-header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(7, 9, 14, 0.85);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 16px 24px;
}
.legal-header__inner {
  max-width: 1150px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand-link {
  text-decoration: none;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.header-link {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}
.header-link:hover {
  color: #ffffff;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}
.back-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

.legal-main {
  position: relative;
  z-index: 10;
  max-width: 1150px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.hero-intro {
  max-width: 760px;
  margin-bottom: 48px;
}
.pill-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 16px;
}
.amber-pill {
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #fbbf24;
}
.legal-title {
  font-size: 2.75rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -0.025em;
  margin: 0 0 16px;
  line-height: 1.15;
}
.legal-desc {
  font-size: 15px;
  color: #94a3b8;
  line-height: 1.65;
  margin: 0 0 16px;
}
.legal-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  font-family: monospace;
  color: #64748b;
}

.legal-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 36px;
  align-items: start;
}
@media (max-width: 860px) {
  .legal-grid {
    grid-template-columns: 1fr;
  }
}

.toc-sidebar {
  position: sticky;
  top: 96px;
  background: rgba(15, 20, 31, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
  backdrop-filter: blur(12px);
}
.toc-title {
  font-size: 11px;
  font-family: monospace;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  padding: 0 8px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 10px;
}
.toc-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toc-btn {
  text-align: left;
  background: transparent;
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  color: #94a3b8;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.toc-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}
.toc-btn.active {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  font-weight: 700;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.legal-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.legal-card {
  background: rgba(15, 20, 31, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 28px;
  font-size: 14px;
  line-height: 1.7;
  color: #cbd5e1;
}
.highlight-card {
  border-color: rgba(245, 158, 11, 0.25);
}
.card-heading {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
}
.amber-heading {
  color: #fde68a;
}

.styled-list {
  margin: 14px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #94a3b8;
}
.styled-list li strong {
  color: #e2e8f0;
}

.callout-box {
  padding: 18px;
  border-radius: 16px;
  font-size: 12.5px;
  line-height: 1.6;
  margin: 16px 0;
}
.amber-box {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #fef3c7;
}
.info-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
}

.legal-footer {
  margin-top: 60px;
  padding-top: 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  font-size: 12px;
  color: #64748b;
}
.legal-footer a {
  color: #94a3b8;
  text-decoration: none;
  margin: 0 6px;
}
.legal-footer a:hover {
  color: #ffffff;
}

.icon-14 {
  width: 14px;
  height: 14px;
}
.icon-18 {
  width: 18px;
  height: 18px;
}
.amber-icon { color: #fbbf24; }
.emerald-icon { color: #34d399; }
.sky-icon { color: #38bdf8; }
.indigo-icon { color: #818cf8; }
.rose-icon { color: #fb7185; }
</style>
