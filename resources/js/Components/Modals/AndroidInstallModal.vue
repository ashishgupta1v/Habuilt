<script setup>
import { ref } from 'vue';
import {
  Smartphone,
  Download,
  QrCode,
  Sparkles,
  Zap,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  X,
  Layers,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'toast']);

const apkDownloadUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/download/latest-build/habuilt.apk';
const githubReleaseUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/tag/latest-build';
// High-res QR code generated for instant phone camera scanning
const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(apkDownloadUrl)}`;

const isCopied = ref(false);

const copyLink = async () => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(apkDownloadUrl);
      isCopied.value = true;
      emit('toast', '📋 Download link copied to clipboard!');
      setTimeout(() => { isCopied.value = false; }, 2500);
    }
  } catch (err) {
    emit('toast', '⚠️ Failed to copy link');
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card modal-card--apk-install" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-head">
        <div class="modal-head__title-group">
          <div class="modal-head__icon-badge">
            <Smartphone class="icon-md icon-emerald" />
          </div>
          <div>
            <h3 class="modal-title">Habuilt for Android</h3>
            <p class="modal-subtitle">Native App with Live Due Now Home Screen Widget</p>
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

      <!-- Modal Body -->
      <div class="modal-body apk-install-body">
        <!-- Top Banner / Feature Callouts -->
        <div class="apk-features-grid">
          <div class="apk-feature-card">
            <div class="apk-feature-card__icon"><Zap class="icon-sm icon-gold" /></div>
            <div class="apk-feature-card__content">
              <strong>Due Now Widget</strong>
              <p>4x2 & 4x1 home screen widget displaying active habit & timer.</p>
            </div>
          </div>
          <div class="apk-feature-card">
            <div class="apk-feature-card__icon"><CheckCircle2 class="icon-sm icon-emerald" /></div>
            <div class="apk-feature-card__content">
              <strong>1-Tap Lockscreen Log</strong>
              <p>Mark habits done with haptic feedback without opening app.</p>
            </div>
          </div>
          <div class="apk-feature-card">
            <div class="apk-feature-card__icon"><Layers class="icon-sm icon-indigo" /></div>
            <div class="apk-feature-card__content">
              <strong>Real-Time Cloud Sync</strong>
              <p>Instant background persistence with 0ms local speed.</p>
            </div>
          </div>
        </div>

        <!-- Download & QR Code Section -->
        <div class="apk-download-section">
          <!-- Left Column: Primary Actions -->
          <div class="apk-download-left">
            <div class="apk-version-badge">
              <span class="apk-version-badge__dot"></span>
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

          <!-- Right Column: QR Code Box -->
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

        <!-- 3-Step Quick Install Guide -->
        <div class="apk-steps-card">
          <h5 class="apk-steps-title">
            <Sparkles class="icon-xs icon-gold" />
            <span>3-Step Installation & Widget Guide</span>
          </h5>

          <div class="apk-steps-list">
            <div class="apk-step-item">
              <div class="apk-step-num">1</div>
              <div class="apk-step-content">
                <strong>Download & Open</strong>
                <p>Tap download on your phone or scan the QR code. Open the downloaded <code>habuilt.apk</code> file.</p>
              </div>
            </div>

            <div class="apk-step-item">
              <div class="apk-step-num">2</div>
              <div class="apk-step-content">
                <strong>Install / Update Directly</strong>
                <p>Tap <em>Install</em> (or <em>Update</em>). If prompted by Android, enable <em>"Allow from this source"</em>. All your previous habit data is preserved.</p>
              </div>
            </div>

            <div class="apk-step-item">
              <div class="apk-step-num">3</div>
              <div class="apk-step-content">
                <strong>Add Due Now Widget</strong>
                <p>Long-press any empty space on your phone wallpaper → tap <strong>Widgets</strong> → select <strong>Habuilt</strong> → place the <strong>Due Now Widget</strong>!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
