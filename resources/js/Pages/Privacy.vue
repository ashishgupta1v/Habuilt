<script setup>
import { ref } from 'vue';
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, FileText, CheckCircle2, Globe, HeartHandshake } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const lastUpdated = 'October 28, 2026';
const activeSection = ref('data-collection');

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
    <div class="glow-orb glow-emerald"></div>

    <!-- Header Navigation -->
    <header class="legal-header">
      <div class="legal-header__inner">
        <a href="/" class="brand-link">
          <HabuiltLogo size="sm" :with-text="true" />
        </a>
        <div class="header-actions">
          <a href="/terms" class="header-link">Terms of Service</a>
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
        <div class="pill-badge emerald-pill">
          <Shield class="icon-14" />
          <span>Sovereign Privacy &amp; Data Security</span>
        </div>
        <h1 class="legal-title">Privacy Policy</h1>
        <p class="legal-desc">
          At Habuilt, your personal routines, habit completions, and biometric logs belong solely to you. We believe high-performance software must respect user sovereignty without intrusive ad tracking or data brokers.
        </p>
        <div class="legal-meta">
          <span>Effective Date: {{ lastUpdated }}</span>
          <span>•</span>
          <span>Version: 2.1 (GDPR, CCPA &amp; App Store Compliant)</span>
        </div>
      </div>

      <div class="legal-grid">
        <!-- Sticky Navigation Sidebar -->
        <aside class="toc-sidebar">
          <div class="toc-title">Table of Contents</div>
          <nav class="toc-nav">
            <button
              v-for="item in [
                { id: 'data-collection', label: '1. Information We Collect' },
                { id: 'biometric-privacy', label: '2. Health & Biometric Data' },
                { id: 'how-we-use', label: '3. How Your Data is Used' },
                { id: 'sharing-processors', label: '4. Third-Party Processors' },
                { id: 'user-rights', label: '5. Your Rights (GDPR & CCPA)' },
                { id: 'account-deletion', label: '6. Self-Service Account Deletion' },
                { id: 'security-retention', label: '7. Data Security & Storage' },
                { id: 'contact', label: '8. Contact & Data Officer' }
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
          <section id="data-collection" class="legal-card">
            <h2 class="card-heading">
              <FileText class="icon-18 amber-icon" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              We collect only the minimum information necessary to synchronize your habits, maintain streak integrity, and power ZoetiCoach intelligence:
            </p>
            <ul class="styled-list">
              <li><strong>Account Credentials:</strong> Email address and authentication tokens generated via Supabase Auth or OAuth providers (Google and Apple). Passwords are never stored in plaintext.</li>
              <li><strong>Habit &amp; Activity Ledger:</strong> Custom habits created, category classifications, check-in timestamps, milestone points, and streak counters.</li>
              <li><strong>Partner Pairing Information:</strong> When utilizing Universal Partner Pairing, pairing invite codes and shared anchor completion records are synchronized between mutual consent accounts.</li>
              <li><strong>Technical Device Data:</strong> Client device type, operating system version (for Capacitor native notifications and widgets), and local timezone to properly schedule daily resets.</li>
            </ul>
          </section>

          <!-- Section 2 -->
          <section id="biometric-privacy" class="legal-card">
            <h2 class="card-heading">
              <HeartHandshake class="icon-18 emerald-icon" />
              <span>2. Optional Health &amp; Biometric Telemetry</span>
            </h2>
            <p>
              Habuilt includes longitudinal wellness tracking (e.g., morning joint stiffness minutes, daily hydration volume in milliliters, subjective sleep hours, and energy ratings).
            </p>
            <div class="callout-box emerald-box">
              <strong>Explicit Consent:</strong> Health telemetry is strictly optional. You can track pure daily habits without ever logging biomarkers. Biomarker records are never sold, leased, or disclosed to advertising networks, insurance providers, or health analytics brokers.
            </div>
          </section>

          <!-- Section 3 -->
          <section id="how-we-use" class="legal-card">
            <h2 class="card-heading">
              <CheckCircle2 class="icon-18 sky-icon" />
              <span>3. How Your Data is Used</span>
            </h2>
            <p>Your data is used solely to provide and improve the Habuilt Operating System:</p>
            <ul class="styled-list">
              <li>Computing milestone scoring tiers, dynamic floor/half/full percentages, and warrior ranks.</li>
              <li>Triggering local and push notifications for due habits, Pomodoro deep work timers, and circadian transitions.</li>
              <li>Synthesizing personalized ZoetiCoach habit coaching briefings and adherence guidance.</li>
              <li>Syncing progress across multiple devices (phone, desktop web, tablet).</li>
            </ul>
          </section>

          <!-- Section 4 -->
          <section id="sharing-processors" class="legal-card">
            <h2 class="card-heading">
              <Globe class="icon-18 indigo-icon" />
              <span>4. Third-Party Infrastructure &amp; Data Processors</span>
            </h2>
            <p>We work with trusted enterprise-grade infrastructure providers under strict Data Processing Agreements (DPAs):</p>
            <div class="proc-grid">
              <div class="proc-card">
                <div class="proc-name">Supabase Inc.</div>
                <div class="proc-desc">Authentication, encrypted PostgreSQL hosting, and WebSocket realtime messaging.</div>
              </div>
              <div class="proc-card">
                <div class="proc-name">Hostinger VPS (KVM 2)</div>
                <div class="proc-desc">High-speed regional application server &amp; zero-latency API transport.</div>
              </div>
              <div class="proc-card">
                <div class="proc-name">Google &amp; Apple OAuth</div>
                <div class="proc-desc">Identity authentication via OAuth 2.0 / OpenID Connect without sharing passwords.</div>
              </div>
              <div class="proc-card">
                <div class="proc-name">ZoetiCoach AI Bridge</div>
                <div class="proc-desc">Contextual habit analytics and adherence recommendation generation.</div>
              </div>
            </div>
          </section>

          <!-- Section 5 -->
          <section id="user-rights" class="legal-card">
            <h2 class="card-heading">
              <Download class="icon-18 amber-icon" />
              <span>5. Your Rights Under GDPR &amp; CCPA</span>
            </h2>
            <p>Depending on your location, you have statutory rights regarding your personal information:</p>
            <ul class="styled-list">
              <li><strong>Right to Access:</strong> Request a complete copy of your habit check-ins, custom protocols, and account metadata.</li>
              <li><strong>Right to Portability:</strong> Export all your personal data in standard machine-readable JSON format anytime via <em>Settings &gt; Security &gt; Export My Data</em>.</li>
              <li><strong>Right to Rectification:</strong> Edit or correct any inaccurate habit details directly in the interface.</li>
              <li><strong>Right to Erasure (To Be Forgotten):</strong> Irrevocably delete your account, streaks, and check-in history.</li>
            </ul>
          </section>

          <!-- Section 6 -->
          <section id="account-deletion" class="legal-card">
            <h2 class="card-heading">
              <Trash2 class="icon-18 rose-icon" />
              <span>6. Self-Service Account Deletion (Apple 5.1.1(v) Compliant)</span>
            </h2>
            <p>
              In accordance with Apple App Store Review Guideline 5.1.1(v) and global privacy mandates, Habuilt offers an immediate, automated self-service account deletion mechanism:
            </p>
            <div class="callout-box rose-box">
              <div class="callout-title">How to Delete Your Account Instantly:</div>
              <ol class="styled-ol">
                <li>Open Habuilt and tap <strong>Protocol Settings</strong> in the top header.</li>
                <li>Navigate to the <strong>Security &amp; Privacy Vault</strong> tab.</li>
                <li>Under Account Management, click <strong>Delete Account &amp; All Data</strong>.</li>
                <li>Confirm by typing <code>DELETE</code>.</li>
              </ol>
              <p style="margin-top: 10px; font-size: 11.5px; opacity: 0.9;">
                Once confirmed, our atomic cleanup protocol executes immediately: all habit check-ins, custom habits, partner connections, and cloud user records are permanently purged from database replicas.
              </p>
            </div>
          </section>

          <!-- Section 7 -->
          <section id="security-retention" class="legal-card">
            <h2 class="card-heading">
              <Lock class="icon-18 emerald-icon" />
              <span>7. Data Security &amp; Storage Architecture</span>
            </h2>
            <ul class="styled-list">
              <li>All databases enforce PostgreSQL Row Level Security (RLS) guaranteeing that queries only return data belonging to the authenticated tenant.</li>
              <li>All network transmissions use TLS 1.3 cryptographic protocols with Let&apos;s Encrypt SSL certificates.</li>
              <li>Bearer tokens are verified on every incoming API request with strict user-matching authorization (IDOR protection).</li>
              <li>Optional local passkey biometric authentication (WebAuthn / Touch ID / Face ID) protects local telemetry.</li>
            </ul>
          </section>

          <!-- Section 8 -->
          <section id="contact" class="legal-card">
            <h2 class="card-heading">
              <Eye class="icon-18 amber-icon" />
              <span>8. Contact Us &amp; Data Protection Inquiries</span>
            </h2>
            <p>
              If you have any questions about this Privacy Policy or wish to contact our Data Protection Officer, please reach out:
            </p>
            <div class="contact-box">
              <div><strong style="color: #ffffff;">Data Controller:</strong> Habuilt Inc.</div>
              <div><strong style="color: #ffffff;">Email:</strong> <a href="mailto:privacy@habuilt.com" class="accent-link">privacy@habuilt.com</a></div>
              <div><strong style="color: #ffffff;">Platform:</strong> Habuilt Operating System (habuilt.com)</div>
              <div><strong style="color: #ffffff;">Response SLA:</strong> Within 48 business hours</div>
            </div>
          </section>
        </article>
      </div>

      <!-- Footer -->
      <footer class="legal-footer">
        <p>&copy; {{ new Date().getFullYear() }} Habuilt Technologies. All rights reserved. • <a href="/terms">Terms of Service</a> • <a href="/disclaimer">Wellness Disclaimer</a></p>
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
  left: 20%;
  width: 500px;
  height: 500px;
  background: rgba(245, 158, 11, 0.05);
}
.glow-emerald {
  top: 35%;
  right: -100px;
  width: 600px;
  height: 600px;
  background: rgba(16, 185, 129, 0.05);
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
.emerald-pill {
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: #34d399;
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
.card-heading {
  font-size: 1.2rem;
  font-weight: 800;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 16px;
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

.styled-ol {
  margin: 10px 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.callout-box {
  padding: 18px;
  border-radius: 16px;
  font-size: 12.5px;
  line-height: 1.6;
  margin: 16px 0;
}
.emerald-box {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}
.rose-box {
  background: rgba(225, 29, 72, 0.1);
  border: 1px solid rgba(225, 29, 72, 0.25);
  color: #fda4af;
}
.callout-title {
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 6px;
  color: #ffffff;
}

.proc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 14px;
}
.proc-card {
  padding: 14px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.proc-name {
  font-weight: 700;
  color: #ffffff;
  font-size: 13px;
}
.proc-desc {
  color: #94a3b8;
  font-size: 11.5px;
  margin-top: 4px;
}

.contact-box {
  padding: 16px;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12.5px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 14px;
}
.accent-link {
  color: #fbbf24;
  text-decoration: underline;
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
