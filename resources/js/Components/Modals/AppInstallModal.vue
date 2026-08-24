<script setup>
import { ref } from 'vue';
import {
  Monitor,
  Smartphone,
  Download,
  Bell,
  BellRing,
  QrCode,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
  MousePointerClick,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  notificationsSupported: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: false },
  permissionState: { type: String, default: 'prompt' },
  canInstallPwa: { type: Boolean, default: false },
});

const emit = defineEmits([
  'close',
  'toast',
  'trigger-install-pwa',
  'toggle-notifications',
  'test-notification',
]);

const activeTab = ref('windows'); // 'windows' | 'android'

const apkDownloadUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/download/latest-build/habuilt.apk';
const githubReleaseUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/tag/latest-build';
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(apkDownloadUrl)}`;

const isCopied = ref(false);

const copyLink = async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(apkDownloadUrl);
      isCopied.value = true;
      emit('toast', '📋 Android APK link copied to clipboard!');
      setTimeout(() => { isCopied.value = false; }, 2500);
    }
  } catch (err) {
    emit('toast', '⚠️ Failed to copy link');
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card modal-card--app-hub" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-head">
        <div class="modal-head__title-group">
          <div class="modal-head__icon-badge">
            <Sparkles class="icon-md icon-gold" />
          </div>
          <div>
            <h3 class="modal-title">Install Habuilt & Live Alerts</h3>
            <p class="modal-subtitle">Track seamlessly on Windows laptop, browser, or Android phone</p>
          </div>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          @click="emit('close')"
          aria-label="Close modal"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Platform Switcher Tabs -->
      <div class="app-hub-tabs">
        <button
          type="button"
          class="app-hub-tab"
          :class="{ 'app-hub-tab--active': activeTab === 'windows' }"
          @click="activeTab = 'windows'"
        >
          <Monitor class="icon-xs" />
          <span>Windows Laptop / Browser</span>
        </button>
        <button
          type="button"
          class="app-hub-tab"
          :class="{ 'app-hub-tab--active': activeTab === 'android' }"
          @click="activeTab = 'android'"
        >
          <Smartphone class="icon-xs" />
          <span>Android App & Widget</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body app-hub-body">
        <!-- ══════════════════════════════════════════════════════════════════ -->
        <!-- TAB 1: WINDOWS LAPTOP & BROWSER PWA -->
        <!-- ══════════════════════════════════════════════════════════════════ -->
        <div v-if="activeTab === 'windows'" class="windows-pwa-view">
          <!-- Windows Features Callout -->
          <div class="app-features-grid">
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><BellRing class="icon-sm icon-gold" /></div>
              <div class="app-feature-card__content">
                <strong>Windows Toast Alerts</strong>
                <p>Native action-center banners pop up exactly when habits are due.</p>
              </div>
            </div>
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><CheckCircle2 class="icon-sm icon-emerald" /></div>
              <div class="app-feature-card__content">
                <strong>1-Tap Background Tracking</strong>
                <p>Click <code>[✅ Mark Done]</code> right on the toast without opening the website.</p>
              </div>
            </div>
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><Monitor class="icon-sm icon-indigo" /></div>
              <div class="app-feature-card__content">
                <strong>Standalone App Window</strong>
                <p>Pin to Taskbar & Start Menu. Zero browser tabs or clutter.</p>
              </div>
            </div>
          </div>

          <!-- Windows App Primary Actions -->
          <div class="windows-action-box">
            <div class="windows-action-box__left">
              <div class="app-badge-tag">
                <span class="app-badge-dot"></span>
                <span>Desktop PWA • Edge & Chrome</span>
              </div>
              <h4 class="windows-box-title">Install Habuilt on Windows</h4>
              <p class="windows-box-desc">
                Install as a native standalone desktop app. It will appear in your <strong>Start Menu</strong>, <strong>Taskbar</strong>, and <strong>Alt+Tab</strong> app switcher.
              </p>

              <div class="windows-btn-group">
                <button
                  v-if="canInstallPwa"
                  type="button"
                  class="btn btn--primary-action btn--pwa-install"
                  @click="emit('trigger-install-pwa')"
                >
                  <Download class="icon-sm" />
                  <span>1-Click Install to Windows</span>
                </button>
                <div v-else class="browser-install-hint">
                  <MousePointerClick class="icon-xs icon-gold" />
                  <span>Click the <strong>Install App icon (⊕)</strong> in your browser address bar (Edge / Chrome).</span>
                </div>
              </div>
            </div>

            <!-- Notification Control & Test Card -->
            <div class="windows-notif-card">
              <div class="windows-notif-header">
                <div class="windows-notif-title">
                  <Bell class="icon-xs icon-gold" />
                  <span>Windows Notifications</span>
                </div>
                <button
                  type="button"
                  class="btn-notif-toggle"
                  :class="{ 'btn-notif-toggle--on': notificationsEnabled }"
                  @click="emit('toggle-notifications')"
                >
                  {{ notificationsEnabled ? 'Enabled' : 'Enable' }}
                </button>
              </div>
              <p class="windows-notif-desc">
                Receive time-block alerts with interactive <strong>[✅ Mark Done]</strong> buttons.
              </p>
              <button
                type="button"
                class="btn btn--secondary btn--test-notif"
                @click="emit('test-notification')"
              >
                <Sparkles class="icon-xs" />
                <span>Send Test Toast Notification</span>
              </button>
            </div>
          </div>

          <!-- 3-Step Windows Guide -->
          <div class="app-steps-card">
            <h5 class="app-steps-title">
              <Sparkles class="icon-xs icon-gold" />
              <span>How to Track Without Visiting the Website</span>
            </h5>

            <div class="app-steps-list">
              <div class="app-step-item">
                <div class="app-step-num">1</div>
                <div class="app-step-content">
                  <strong>Install to Windows Taskbar</strong>
                  <p>In Chrome or Edge, click the <strong>Install</strong> icon in the address bar (or Menu <code>...</code> → <em>"Install Habuilt"</em>). Pin it to your Taskbar.</p>
                </div>
              </div>

              <div class="app-step-item">
                <div class="app-step-num">2</div>
                <div class="app-step-content">
                  <strong>Allow Desktop Notifications</strong>
                  <p>When prompted by the browser/Windows, click <strong>"Allow"</strong>. Ensure Windows <em>Focus Assist</em> is not blocking Chrome/Edge alerts.</p>
                </div>
              </div>

              <div class="app-step-item">
                <div class="app-step-num">3</div>
                <div class="app-step-content">
                  <strong>1-Tap Background Tracking</strong>
                  <p>When a habit is due, a Windows Toast appears at bottom-right. Click <strong>[✅ Mark Done]</strong> directly on the toast — the task logs instantly in the background!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══════════════════════════════════════════════════════════════════ -->
        <!-- TAB 2: ANDROID APP & WIDGET -->
        <!-- ══════════════════════════════════════════════════════════════════ -->
        <div v-else class="android-view">
          <div class="app-features-grid">
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><Zap class="icon-sm icon-gold" /></div>
              <div class="app-feature-card__content">
                <strong>Due Now Widget</strong>
                <p>4x2 & 4x1 home screen widget displaying active habit & timer.</p>
              </div>
            </div>
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><CheckCircle2 class="icon-sm icon-emerald" /></div>
              <div class="app-feature-card__content">
                <strong>1-Tap Lockscreen Log</strong>
                <p>Mark habits done with haptic feedback without opening app.</p>
              </div>
            </div>
            <div class="app-feature-card">
              <div class="app-feature-card__icon"><Layers class="icon-sm icon-indigo" /></div>
              <div class="app-feature-card__content">
                <strong>Real-Time Cloud Sync</strong>
                <p>Instant background persistence with 0ms local speed.</p>
              </div>
            </div>
          </div>

          <!-- Download & QR Code Section -->
          <div class="apk-download-section">
            <div class="apk-download-left">
              <div class="app-badge-tag">
                <span class="app-badge-dot"></span>
                <span>Latest Release • Auto-Updated Build</span>
              </div>

              <h4 class="apk-action-title">Install on your Android Device</h4>
              <p class="apk-action-desc">
                Download the APK directly on your phone, or scan the QR code with your phone's camera.
              </p>

              <div class="apk-actions-row">
                <a
                  :href="apkDownloadUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn--primary-action btn--apk-download"
                >
                  <Download class="icon-sm" />
                  <span>Download APK (habuilt.apk)</span>
                </a>

                <button
                  type="button"
                  class="btn btn--secondary btn--apk-copy"
                  @click="copyLink"
                  :title="isCopied ? 'Copied' : 'Copy direct APK download link'"
                >
                  <Check v-if="isCopied" class="icon-xs icon-emerald" />
                  <Copy v-else class="icon-xs" />
                  <span>{{ isCopied ? 'Link Copied' : 'Copy Link' }}</span>
                </button>
              </div>

              <div class="apk-gh-link-wrap">
                <a
                  :href="githubReleaseUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="apk-gh-link"
                >
                  <span>View Release Notes on GitHub</span>
                  <ExternalLink class="icon-xs" />
                </a>
              </div>
            </div>

            <div class="apk-download-right">
              <div class="apk-qr-card">
                <div class="apk-qr-image-wrap">
                  <img
                    :src="qrCodeUrl"
                    alt="Scan QR code with phone camera to download APK"
                    class="apk-qr-image"
                    loading="lazy"
                  />
                </div>
                <span class="apk-qr-hint">
                  <QrCode class="icon-xs" />
                  <span>Scan with phone camera to download</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 3-Step Android Guide -->
          <div class="app-steps-card">
            <h5 class="app-steps-title">
              <Sparkles class="icon-xs icon-gold" />
              <span>3-Step Installation & Widget Guide</span>
            </h5>

            <div class="app-steps-list">
              <div class="app-step-item">
                <div class="app-step-num">1</div>
                <div class="app-step-content">
                  <strong>Download & Open</strong>
                  <p>Tap download on your phone or scan the QR code. Open the downloaded <code>habuilt.apk</code> file.</p>
                </div>
              </div>

              <div class="app-step-item">
                <div class="app-step-num">2</div>
                <div class="app-step-content">
                  <strong>Install / Update Directly</strong>
                  <p>Tap <em>Install</em> (or <em>Update</em>). If prompted by Android, enable <em>"Allow from this source"</em>. All your previous habit data is preserved.</p>
                </div>
              </div>

              <div class="app-step-item">
                <div class="app-step-num">3</div>
                <div class="app-step-content">
                  <strong>Add Due Now Widget</strong>
                  <p>Long-press any empty space on your phone wallpaper → tap <strong>Widgets</strong> → select <strong>Habuilt</strong> → place the <strong>Due Now Widget</strong>!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
