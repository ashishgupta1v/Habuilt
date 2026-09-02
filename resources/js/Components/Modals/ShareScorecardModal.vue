<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  displayName: { type: String, default: 'Habuilt Member' },
  levelTitle: { type: String, default: 'Practitioner' },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },
  wallet: { type: Number, default: 0 },
  todayPoints: { type: Number, default: 0 },
  todayTarget: { type: Number, default: 15 },
  tierTitle: { type: String, default: '🏆 Full Target' },
  completedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  performanceGrade: { type: Object, default: () => ({ grade: 'A+', text: 'Unstoppable Momentum' }) },
  completedHabitsList: { type: Array, default: () => [] },
  dateLabel: { type: String, default: '' },
});

const emit = defineEmits(['close', 'toast']);

const canvasRef = ref(null);
const previewImageSrc = ref('');
const isGenerating = ref(false);
const copiedImage = ref(false);
const copiedCaption = ref(false);

const formattedDate = computed(() => {
  if (props.dateLabel) return props.dateLabel;
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
});

const shareCaptionText = computed(() => {
  return `⚡ Habuilt Daily Protocol — ${formattedDate.value}\n👤 ${props.displayName} (${props.levelTitle} Lv. ${props.level})\n🔥 Streak: ${props.streak} Days | 🏆 Vault: ${props.wallet} pts\n🎯 Target: ${props.tierTitle} (${props.todayPoints}/${props.todayTarget} pts)\n✅ ${props.completedCount}/${props.totalHabits} Habits Crushed\n\nBuilt with discipline on https://habuilt.com #Habuilt #HabitMastery #Productivity`;
});

// Helper: draw smooth rounded rectangle
const drawRoundRect = (ctx, x, y, w, h, r) => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const generateScorecardCanvas = async () => {
  isGenerating.value = true;
  await nextTick();

  // Ensure web fonts are fully loaded before rendering to canvas context
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  // Standard Instagram Story & WhatsApp Status resolution (9:16 aspect ratio)
  const width = 1080;
  const height = 1920;

  canvas.width = width;
  canvas.height = height;

  // 1. Deep Obsidian Base Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060a14');
  bgGrad.addColorStop(0.25, '#0b1326');
  bgGrad.addColorStop(0.6, '#0f1b35');
  bgGrad.addColorStop(0.85, '#0d152a');
  bgGrad.addColorStop(1, '#05070e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. High-Energy Ambient Glow Orbs
  // Top-Right Gold Glow
  const goldOrb = ctx.createRadialGradient(880, 260, 20, 880, 260, 520);
  goldOrb.addColorStop(0, 'rgba(200, 164, 86, 0.28)');
  goldOrb.addColorStop(1, 'rgba(200, 164, 86, 0)');
  ctx.fillStyle = goldOrb;
  ctx.fillRect(0, 0, width, height);

  // Mid-Left Emerald Glow
  const emeraldOrb = ctx.createRadialGradient(180, 920, 20, 180, 920, 580);
  emeraldOrb.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
  emeraldOrb.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = emeraldOrb;
  ctx.fillRect(0, 0, width, height);

  // Mid-Right Cyberpunk Indigo Glow
  const indigoOrb = ctx.createRadialGradient(920, 1380, 20, 920, 1380, 550);
  indigoOrb.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
  indigoOrb.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = indigoOrb;
  ctx.fillRect(0, 0, width, height);

  // Bottom Gold Ambient Glow
  const bottomGold = ctx.createRadialGradient(380, 1800, 20, 380, 1800, 500);
  bottomGold.addColorStop(0, 'rgba(200, 164, 86, 0.2)');
  bottomGold.addColorStop(1, 'rgba(200, 164, 86, 0)');
  ctx.fillStyle = bottomGold;
  ctx.fillRect(0, 0, width, height);

  // 3. Luxurious Outer & Inner Borders
  ctx.strokeStyle = 'rgba(200, 164, 86, 0.45)';
  ctx.lineWidth = 4;
  drawRoundRect(ctx, 36, 36, width - 72, height - 72, 44);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, 48, 48, width - 96, height - 96, 34);
  ctx.stroke();

  // 4. Top Story Header Badge
  const topPillGrad = ctx.createLinearGradient(width / 2 - 200, 75, width / 2 + 200, 120);
  topPillGrad.addColorStop(0, 'rgba(200, 164, 86, 0.25)');
  topPillGrad.addColorStop(1, 'rgba(16, 185, 129, 0.25)');
  ctx.fillStyle = topPillGrad;
  ctx.strokeStyle = 'rgba(200, 164, 86, 0.4)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, width / 2 - 220, 75, 440, 46, 23);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C8A456';
  ctx.font = '800 17px "Inter", -apple-system, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('⚡ DAILY MASTERY PROTOCOL ⚡', width / 2, 105);

  // 5. Brand Header & Date Badge
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C8A456';
  ctx.font = '900 52px "Inter", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('HABUILT', 85, 195);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('DISCIPLINE ARCHITECTURE', 85, 228);

  // Date Tag on Right
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, width - 425, 165, 340, 64, 18);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 20px "Inter", sans-serif';
  ctx.fillText(`📅 ${formattedDate.value}`, width - 255, 206);

  // Header Divider
  const headerLine = ctx.createLinearGradient(85, 260, width - 85, 260);
  headerLine.addColorStop(0, 'rgba(200, 164, 86, 0.6)');
  headerLine.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
  headerLine.addColorStop(1, 'rgba(200, 164, 86, 0.15)');
  ctx.strokeStyle = headerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(85, 260);
  ctx.lineTo(width - 85, 260);
  ctx.stroke();

  // 6. User Profile & Status Card
  const profileCardGrad = ctx.createLinearGradient(85, 290, width - 85, 430);
  profileCardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  profileCardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.6)');
  ctx.fillStyle = profileCardGrad;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 85, 290, width - 170, 140, 24);
  ctx.fill();
  ctx.stroke();

  // Avatar Circle
  const avatarGrad = ctx.createLinearGradient(110, 315, 190, 405);
  avatarGrad.addColorStop(0, '#F6D380');
  avatarGrad.addColorStop(1, '#9E7424');
  ctx.fillStyle = avatarGrad;
  ctx.beginPath();
  ctx.arc(155, 360, 44, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#060a14';
  ctx.font = '900 38px "Inter", sans-serif';
  ctx.fillText((props.displayName || 'U')[0].toUpperCase(), 155, 374);

  // User Name & Rank
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 38px "Inter", sans-serif';
  ctx.fillText(props.displayName, 225, 348);

  ctx.fillStyle = '#C8A456';
  ctx.font = '700 22px "Inter", sans-serif';
  ctx.fillText(`👑 ${props.levelTitle}  •  Level ${props.level}`, 225, 388);

  // Performance Grade Tag
  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = '900 44px "Inter", sans-serif';
  ctx.fillText(props.performanceGrade?.grade || 'A+', width - 120, 350);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 17px "Inter", sans-serif';
  ctx.fillText(props.performanceGrade?.text || 'Elite Status', width - 120, 388);

  // 7. HERO SECTION: Massive Points & Protocol Hit Card
  const heroGrad = ctx.createLinearGradient(85, 460, width - 85, 800);
  heroGrad.addColorStop(0, 'rgba(200, 164, 86, 0.18)');
  heroGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.85)');
  heroGrad.addColorStop(1, 'rgba(16, 185, 129, 0.15)');
  ctx.fillStyle = heroGrad;
  ctx.strokeStyle = 'rgba(200, 164, 86, 0.5)';
  ctx.lineWidth = 3;
  drawRoundRect(ctx, 85, 460, width - 170, 330, 32);
  ctx.fill();
  ctx.stroke();

  // Points Big Display
  ctx.textAlign = 'center';
  ctx.fillStyle = '#C8A456';
  ctx.font = '900 130px "Inter", sans-serif';
  ctx.fillText(`${props.todayPoints}`, width / 2 - 65, 605);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '700 65px "Inter", sans-serif';
  ctx.fillText(`/${props.todayTarget}`, width / 2 + 75, 605);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 21px "Inter", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('DAILY PROTOCOL POINTS EARNED', width / 2, 650);

  // Target Status Pill
  const tierPillGrad = ctx.createLinearGradient(width / 2 - 260, 680, width / 2 + 260, 745);
  tierPillGrad.addColorStop(0, 'rgba(200, 164, 86, 0.35)');
  tierPillGrad.addColorStop(1, 'rgba(16, 185, 129, 0.35)');
  ctx.fillStyle = tierPillGrad;
  ctx.strokeStyle = '#C8A456';
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, width / 2 - 280, 680, 560, 64, 32);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 25px "Inter", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(props.tierTitle.toUpperCase(), width / 2, 722);

  // 8. 4-Metrics Highlights Grid (2x2)
  const stats = [
    { label: 'ACTIVE STREAK', value: `${props.streak} Days`, icon: '🔥', color: '#f59e0b', sub: 'Unbroken Consistency' },
    { label: 'HABIT HIT RATE', value: `${props.completedCount}/${props.totalHabits}`, icon: '✅', color: '#10b981', sub: `${props.totalHabits > 0 ? Math.round((props.completedCount / props.totalHabits) * 100) : 0}% Target Crushed` },
    { label: 'HABUILT VAULT', value: `${props.wallet} pts`, icon: '🏆', color: '#C8A456', sub: 'Available to Claim' },
    { label: 'XP & PROGRESS', value: `+${props.todayPoints * 10} XP`, icon: '⚡', color: '#818cf8', sub: `Level ${props.level} Progress` },
  ];

  const gridX = 85;
  const gridY = 820;
  const cardW = (width - 170 - 24) / 2; // 443px
  const cardH = 155;

  stats.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cardW + 24);
    const y = gridY + row * (cardH + 18);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, x, y, cardW, cardH, 20);
    ctx.fill();
    ctx.stroke();

    // Icon
    ctx.textAlign = 'left';
    ctx.font = '36px sans-serif';
    ctx.fillText(item.icon, x + 24, y + 54);

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '800 14px "Inter", sans-serif';
    ctx.letterSpacing = '1.8px';
    ctx.fillText(item.label, x + 75, y + 46);

    // Value
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px "Inter", sans-serif';
    ctx.fillText(item.value, x + 75, y + 90);

    // Subtext
    ctx.fillStyle = item.color;
    ctx.font = '700 16px "Inter", sans-serif';
    ctx.fillText(item.sub, x + 24, y + 130);
  });

  // 9. Completed Daily Habits Showcase List Card
  const habitsY = 1175;
  const habitsH = 490;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 85, habitsY, width - 170, habitsH, 26);
  ctx.fill();
  ctx.stroke();

  // Section Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C8A456';
  ctx.font = '900 21px "Inter", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('⚡ CRUSHED ROUTINES TODAY', 120, habitsY + 48);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = '800 18px "Inter", sans-serif';
  ctx.fillText(`${props.completedCount} Completed`, width - 120, habitsY + 48);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(115, habitsY + 66);
  ctx.lineTo(width - 115, habitsY + 66);
  ctx.stroke();

  // List of habits (up to 6 items)
  const habitsToRender = (props.completedHabitsList || []).slice(0, 6);
  if (habitsToRender.length === 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '700 24px "Inter", sans-serif';
    ctx.fillText('Daily routine in progress — Keep building momentum!', width / 2, habitsY + 250);
  } else {
    habitsToRender.forEach((habitName, idx) => {
      const rowY = habitsY + 84 + idx * 62;

      // Row background
      ctx.fillStyle = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 255, 255, 0.01)';
      drawRoundRect(ctx, 110, rowY, width - 220, 52, 12);
      ctx.fill();

      // Checkmark icon badge
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.beginPath();
      ctx.arc(142, rowY + 26, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#10b981';
      ctx.font = '900 18px sans-serif';
      ctx.fillText('✓', 142, rowY + 33);

      // Habit text
      ctx.textAlign = 'left';
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 22px "Inter", sans-serif';
      const cleanName = habitName.length > 46 ? habitName.slice(0, 43) + '...' : habitName;
      ctx.fillText(cleanName, 178, rowY + 34);

      // Point Tag on Right
      ctx.textAlign = 'right';
      ctx.fillStyle = '#C8A456';
      ctx.font = '800 18px "Inter", sans-serif';
      ctx.fillText('DONE ⚡', width - 135, rowY + 34);
    });
  }

  // 10. Motivational Quote & Branding Footer
  const footerY = 1715;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 23px "Inter", sans-serif';
  ctx.fillText('“We are what we repeatedly do. Excellence is a habit.”', width / 2, footerY);

  ctx.fillStyle = '#C8A456';
  ctx.font = '900 21px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('BUILT WITH DISCIPLINE • HABUILT.COM', width / 2, footerY + 44);

  // Convert canvas to high-res data URL for preview
  previewImageSrc.value = canvas.toDataURL('image/png', 0.96);
  isGenerating.value = false;
};

watch(() => props.isOpen, (open) => {
  if (open) {
    generateScorecardCanvas();
  }
});

// 1. Share via Web Share API with actual Image File
const shareNativeImage = async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  try {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        fallbackShareText();
        return;
      }

      const file = new File([blob], `habuilt-story-${Date.now()}.png`, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Habuilt Scorecard — ${props.displayName}`,
            text: shareCaptionText.value,
            files: [file],
          });
          emit('toast', '🎉 Story Scorecard shared!');
          return;
        } catch (shareErr) {
          if (shareErr && shareErr.name === 'AbortError') return;
        }
      }

      // If file sharing is not supported by device, try standard text share or download
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: `Habuilt Scorecard — ${props.displayName}`,
            text: shareCaptionText.value,
            url: 'https://www.habuilt.com',
          });
          emit('toast', '🎉 Scorecard shared!');
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }

      // Fallback: trigger download
      downloadImage();
    }, 'image/png', 0.96);
  } catch (err) {
    fallbackShareText();
  }
};

// 2. Download Image directly to device
const downloadImage = () => {
  if (!previewImageSrc.value) return;
  const a = document.createElement('a');
  a.href = previewImageSrc.value;
  a.download = `habuilt-story-${props.displayName.toLowerCase()}-${Date.now()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  emit('toast', '📥 High-Res Story Card downloaded to your device!');
};

// 3. Copy Image to Clipboard
const copyImageToClipboard = async () => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  try {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        copiedImage.value = true;
        emit('toast', '📋 Story card image copied to clipboard!');
        setTimeout(() => { copiedImage.value = false; }, 2500);
      } else {
        downloadImage();
      }
    }, 'image/png', 0.96);
  } catch (err) {
    downloadImage();
  }
};

// 4. Copy Caption Text
const copyCaption = async () => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareCaptionText.value);
      copiedCaption.value = true;
      emit('toast', '📋 Caption text copied to clipboard!');
      setTimeout(() => { copiedCaption.value = false; }, 2500);
      return;
    } catch (e) { /* fallback */ }
  }

  // Fallback copy
  const el = document.createElement('textarea');
  el.value = shareCaptionText.value;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  copiedCaption.value = true;
  emit('toast', '📋 Caption text copied to clipboard!');
  setTimeout(() => { copiedCaption.value = false; }, 2500);
};

const fallbackShareText = () => {
  copyCaption();
};
</script>

<template>
  <div v-if="isOpen" class="share-modal-overlay" @click.self="emit('close')">
    <div class="share-modal-card" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
      <!-- Modal Header -->
      <div class="share-modal-header">
        <div class="share-modal-title-wrap">
          <Sparkles class="icon-sm icon-gold" />
          <h3 id="share-modal-title" class="share-modal-title">Story Scorecard Generator</h3>
        </div>
        <button
          type="button"
          class="share-modal-close-btn"
          @click="emit('close')"
          aria-label="Close Share Modal"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Story Aspect Ratio Preview Tag -->
      <div class="share-story-tag-bar">
        <span class="share-story-tag">📱 9:16 Instagram Story & WhatsApp Status</span>
      </div>

      <!-- Live Generated Image Preview (9:16 Story Card) -->
      <div class="share-modal-preview-container share-modal-preview-container--story">
        <canvas ref="canvasRef" class="share-modal-canvas-hidden"></canvas>

        <div v-if="isGenerating" class="share-modal-loading">
          <div class="share-modal-spinner"></div>
          <span>Rendering 9:16 Story Scorecard...</span>
        </div>

        <div v-else-if="previewImageSrc" class="share-modal-image-wrap">
          <img
            :src="previewImageSrc"
            alt="Habuilt 9:16 Daily Story Scorecard"
            class="share-modal-preview-img share-modal-preview-img--story"
          />
        </div>
      </div>

      <!-- Action Buttons Grid -->
      <div class="share-modal-actions">
        <!-- Main Primary Share Button -->
        <button
          type="button"
          class="btn btn--primary-action share-btn-main"
          @click="shareNativeImage"
        >
          <Share2 class="icon-sm" />
          <span>Share to Instagram Story / WhatsApp</span>
        </button>

        <div class="share-modal-action-row">
          <!-- Download Image Button -->
          <button
            type="button"
            class="btn btn--secondary share-btn-sub"
            @click="downloadImage"
            title="Download 9:16 HD Story"
          >
            <Download class="icon-xs" />
            <span>Download HD</span>
          </button>

          <!-- Copy Image Button -->
          <button
            type="button"
            class="btn btn--secondary share-btn-sub"
            @click="copyImageToClipboard"
            title="Copy Image"
          >
            <Check v-if="copiedImage" class="icon-xs icon-success" />
            <Copy v-else class="icon-xs" />
            <span>{{ copiedImage ? 'Copied!' : 'Copy Image' }}</span>
          </button>

          <!-- Copy Text Caption Button -->
          <button
            type="button"
            class="btn btn--secondary share-btn-sub"
            @click="copyCaption"
            title="Copy Caption"
          >
            <Check v-if="copiedCaption" class="icon-xs icon-success" />
            <Copy v-else class="icon-xs" />
            <span>{{ copiedCaption ? 'Copied!' : 'Copy Caption' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
