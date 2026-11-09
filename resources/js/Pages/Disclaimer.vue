<script setup>
import { ArrowLeft, ShieldAlert, Heart, Activity, AlertTriangle, Stethoscope } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
</script>

<template>
  <div class="legal-root">
    <!-- Ambient Background Glow -->
    <div class="glow-orb glow-rose"></div>

    <!-- Header Navigation -->
    <header class="legal-header">
      <div class="legal-header__inner">
        <a href="/" class="brand-link">
          <HabuiltLogo size="sm" :with-text="true" :show-badge="false" />
        </a>
        <div class="header-actions">
          <a href="/privacy" class="header-link">Privacy Policy</a>
          <a href="/terms" class="header-link">Terms of Service</a>
          <a href="/auth" class="back-btn">
            <ArrowLeft class="icon-14" />
            <span>Back to App</span>
          </a>
        </div>
      </div>
    </header>

    <!-- Main Content Container -->
    <main class="legal-main">
      <div class="hero-intro">
        <div class="pill-badge rose-pill">
          <ShieldAlert class="icon-14" />
          <span>Wellness notice</span>
        </div>

        <h1 class="legal-title">Medical &amp; Wellness Disclaimer</h1>

        <p class="legal-desc">
          Habuilt is a habit tracker. ZoetiCoach is an optional server forwarder, not an in-app clinical system. Please read this statement before you use either one.
        </p>
      </div>

      <div class="disclaimer-stack">
        <!-- Prominent Critical Callout Card -->
        <div class="callout-card rose-callout">
          <div class="callout-header">
            <Stethoscope class="icon-20 text-rose" />
            <span>Not Licensed Medical or Healthcare Advice</span>
          </div>
          <p class="callout-body">
            The contents of Habuilt, including habit templates (such as hydration volumes, joint mobility flows, breathwork routines, circadian solar exposure, and sleep schedules), are provided solely for general informational and educational purposes.
          </p>
          <p class="callout-body callout-highlight">
            THE APPLICATION DOES NOT PROVIDE MEDICAL ADVICE, DIAGNOSIS, THERAPY, OR TREATMENT OF ANY KIND.
          </p>
        </div>

        <div class="legal-card">
          <h2 class="card-heading">
            <Heart class="icon-18 emerald-icon" />
            <span>Consult Your Physician</span>
          </h2>
          <p>
            Always seek the advice of your physician, rheumatologist, cardiologist, physical therapist, or other qualified health provider with any questions you may have regarding a medical condition, chronic joint stiffness, elevated metabolic biomarkers, or before undertaking a new fitness or dietary routine.
          </p>
          <p style="margin-top: 10px;">
            Never disregard professional medical advice or delay seeking medical evaluation because of information or habit tracking statistics presented in Habuilt.
          </p>
        </div>

        <div class="legal-card">
          <h2 class="card-heading">
            <Activity class="icon-18 amber-icon" />
            <span>Physical Activity &amp; Physiological Awareness</span>
          </h2>
          <p>
            Physical exercise involves inherent physiological risks. When performing mobility flows, zone 2 training, squats, or stretching, proceed within your personal biomechanical capacity. If you feel pain, faintness, or discomfort, stop immediately and rest.
          </p>
        </div>

        <div class="legal-card">
          <h2 class="card-heading">
            <AlertTriangle class="icon-18 sky-icon" />
            <span>Emergency Situations</span>
          </h2>
          <p>
            If you think you may have a medical emergency, call your doctor, dial your national emergency number (e.g. 911 in North America, 112 in Europe, 102/112 in India), or go to the nearest emergency department immediately.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <footer class="legal-footer">
        <p>&copy; {{ new Date().getFullYear() }} Habuilt Technologies. • <a href="/privacy">Privacy Policy</a> • <a href="/terms">Terms of Service</a></p>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.legal-root {
  min-height: 100vh;
  background-color: #F7F8F2;
  color: #0C110D;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
.glow-rose {
  top: -100px;
  left: 30%;
  width: 500px;
  height: 500px;
  background: rgba(244, 63, 94, 0.05);
}

.legal-header {
  position: sticky;
  top: 0;
  z-index: 40;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  background: rgba(247, 248, 242, 0.92);
  border-bottom: 1px solid #E4E6DC;
  padding: 16px 24px;
}
.legal-header__inner {
  max-width: 860px;
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
  color: #3A4338;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.15s ease;
}
.header-link:hover {
  color: #0C110D;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 12px;
  background: #FFFFFF;
  border: 1px solid #E4E6DC;
  color: #0C110D;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s ease;
}
.back-btn:hover {
  background: #F7F8F2;
}

.legal-main {
  position: relative;
  z-index: 10;
  max-width: 860px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.hero-intro {
  margin-bottom: 36px;
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
.rose-pill {
  background: #D9F27A;
  border: 1px solid #E4E6DC;
  color: #0C110D;
}
.legal-title {
  font-family: 'Urbanist', 'Inter', sans-serif;
  font-size: 2.75rem;
  font-weight: 900;
  color: #0C110D;
  letter-spacing: -0.025em;
  margin: 0 0 16px;
  line-height: 1.15;
}
.legal-desc {
  font-size: 15px;
  color: #3A4338;
  line-height: 1.65;
  margin: 0;
}

.disclaimer-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.callout-card {
  padding: 24px 28px;
  border-radius: 20px;
}
.rose-callout {
  background: #FFF8F4;
  border: 1px solid #E4E6DC;
  color: #0C110D;
}
.callout-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 800;
  color: #0C110D;
  margin-bottom: 12px;
}
.callout-body {
  font-size: 13.5px;
  line-height: 1.65;
  margin: 0 0 8px;
  color: #0C110D;
}
.callout-highlight {
  font-weight: 700;
  color: #0C110D;
  margin-top: 12px;
  letter-spacing: 0.02em;
}

.legal-card {
  background: #FFFFFF;
  border: 1px solid #E4E6DC;
  border-radius: 20px;
  padding: 26px;
  font-size: 14px;
  line-height: 1.7;
  color: #0C110D;
}
.card-heading {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0C110D;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 12px;
}

.legal-footer {
  margin-top: 60px;
  padding-top: 32px;
  border-top: 1px solid #E4E6DC;
  text-align: center;
  font-size: 12px;
  color: #3A4338;
}
.legal-footer a {
  color: #3A4338;
  text-decoration: none;
  margin: 0 6px;
}
.legal-footer a:hover {
  color: #0C110D;
}

.icon-14 { width: 14px; height: 14px; }
.icon-18 { width: 18px; height: 18px; }
.icon-20 { width: 20px; height: 20px; }
.text-rose { color: #8E3B3B; }
.emerald-icon { color: #2F6B3A; }
.amber-icon { color: #6A5A22; }
.sky-icon { color: #24556B; }

.glow-orb { position: absolute; }
.legal-desc,
.callout-body,
.legal-card p {
  max-width: var(--calm-measure, 68ch);
}
@media (max-width: 720px) {
  .legal-header { padding: 12px 16px; }
  .legal-header__inner {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 8px 12px;
  }
  .legal-main {
    max-width: none;
    padding: 28px 16px 72px;
  }
  .legal-title {
    font-size: clamp(2rem, 8vw, 2.6rem);
    overflow-wrap: anywhere;
  }
  .legal-desc,
  .callout-body,
  .legal-card,
  .legal-card p,
  .pill-badge,
  .disclaimer-stack {
    max-width: none;
  }
  .pill-badge { white-space: normal; }
  .legal-footer { overflow-wrap: anywhere; }
}
</style>
