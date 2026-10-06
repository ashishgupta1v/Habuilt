<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  Users,
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
  // Couple Alignment Props
  isPartnerPaired: { type: Boolean, default: false },
  partnerDisplayName: { type: String, default: 'Partner' },
  partnerPoints: { type: Number, default: 0 },
  sharedAnchors: { type: Array, default: () => [] },
  alignmentScore: { type: Number, default: 0 },
});

const emit = defineEmits(['close', 'toast', 'open-partner-pair']);

const activeMode = ref('solo'); // 'solo' | 'couple'
const canvasRef = ref(null);
const previewImageSrc = ref('');
const isGenerating = ref(false);
const copiedImage = ref(false);
const copiedCaption = ref(false);

const setMode = (mode) => {
  activeMode.value = mode;
  renderCurrentCanvas();
};

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
  if (activeMode.value === 'couple' && props.isPartnerPaired) {
    const syncedCount = (props.sharedAnchors || []).filter(a => a.completedTogether || a.status === 'both').length;
    const totalAnchors = (props.sharedAnchors || []).length || 3;
    return `⚡ Habuilt Couple Alignment — ${formattedDate.value}\n⚔️ ${props.displayName} (${props.todayPoints} pts) & 🌸 ${props.partnerDisplayName} (${props.partnerPoints} pts)\n🔥 Mutual Streak: ${props.streak} Days | 🤝 Alignment: ${props.alignmentScore}%\n🏆 Combined Energy: ${props.todayPoints + props.partnerPoints} pts crushed today\n✨ Shared Anchors Synced: ${syncedCount}/${totalAnchors}\n\nBuilt with discipline on https://habuilt.com #HabuiltCouples #HabitMastery #PowerCouple`;
  }
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

// ── Solo Scorecard Canvas Renderer (1080x1920 9:16) ──
const generateScorecardCanvas = async () => {
  isGenerating.value = true;
  await nextTick();

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
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

  // 2. Ambient Glow Orbs
  const goldOrb = ctx.createRadialGradient(880, 260, 20, 880, 260, 520);
  goldOrb.addColorStop(0, 'rgba(200, 164, 86, 0.28)');
  goldOrb.addColorStop(1, 'rgba(200, 164, 86, 0)');
  ctx.fillStyle = goldOrb;
  ctx.fillRect(0, 0, width, height);

  const emeraldOrb = ctx.createRadialGradient(180, 920, 20, 180, 920, 580);
  emeraldOrb.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
  emeraldOrb.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = emeraldOrb;
  ctx.fillRect(0, 0, width, height);

  const indigoOrb = ctx.createRadialGradient(920, 1380, 20, 920, 1380, 550);
  indigoOrb.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
  indigoOrb.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = indigoOrb;
  ctx.fillRect(0, 0, width, height);

  const bottomGold = ctx.createRadialGradient(380, 1800, 20, 380, 1800, 500);
  bottomGold.addColorStop(0, 'rgba(200, 164, 86, 0.2)');
  bottomGold.addColorStop(1, 'rgba(200, 164, 86, 0)');
  ctx.fillStyle = bottomGold;
  ctx.fillRect(0, 0, width, height);

  // 3. Luxurious Borders
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

  // 6. User Profile Card
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

  previewImageSrc.value = canvas.toDataURL('image/png', 0.96);
  isGenerating.value = false;
};

// ── Shared Couple Alignment Scorecard Renderer (1080x1920 9:16) ──
const generateCoupleScorecardCanvas = async () => {
  isGenerating.value = true;
  await nextTick();

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = 1080;
  const height = 1920;

  canvas.width = width;
  canvas.height = height;

  // 1. Deep Obsidian Base Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060a14');
  bgGrad.addColorStop(0.25, '#0b1326');
  bgGrad.addColorStop(0.55, '#150d24');
  bgGrad.addColorStop(0.85, '#0d152a');
  bgGrad.addColorStop(1, '#05070e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Dual Aurora Ambient Glow Orbs
  // Top-Left Gold Glow for User
  const goldOrb = ctx.createRadialGradient(220, 260, 20, 220, 260, 480);
  goldOrb.addColorStop(0, 'rgba(200, 164, 86, 0.28)');
  goldOrb.addColorStop(1, 'rgba(200, 164, 86, 0)');
  ctx.fillStyle = goldOrb;
  ctx.fillRect(0, 0, width, height);

  // Top-Right Rose Glow for Partner
  const roseOrb = ctx.createRadialGradient(860, 260, 20, 860, 260, 480);
  roseOrb.addColorStop(0, 'rgba(244, 63, 94, 0.24)');
  roseOrb.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = roseOrb;
  ctx.fillRect(0, 0, width, height);

  // Mid-Center Emerald Alignment Orb
  const emeraldOrb = ctx.createRadialGradient(540, 680, 20, 540, 680, 520);
  emeraldOrb.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
  emeraldOrb.addColorStop(1, 'rgba(16, 185, 129, 0)');
  ctx.fillStyle = emeraldOrb;
  ctx.fillRect(0, 0, width, height);

  // Bottom Violet Glow
  const purpleOrb = ctx.createRadialGradient(540, 1650, 20, 540, 1650, 550);
  purpleOrb.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
  purpleOrb.addColorStop(1, 'rgba(139, 92, 246, 0)');
  ctx.fillStyle = purpleOrb;
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

  // 4. Top Header Badge
  const topPillGrad = ctx.createLinearGradient(width / 2 - 260, 75, width / 2 + 260, 120);
  topPillGrad.addColorStop(0, 'rgba(200, 164, 86, 0.28)');
  topPillGrad.addColorStop(1, 'rgba(244, 63, 94, 0.28)');
  ctx.fillStyle = topPillGrad;
  ctx.strokeStyle = 'rgba(200, 164, 86, 0.4)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, width / 2 - 270, 75, 540, 46, 23);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#C8A456';
  ctx.font = '800 17px "Inter", -apple-system, sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('⚡ SHARED WARRIOR ALIGNMENT PROTOCOL ⚡', width / 2, 105);

  // 5. Brand Header & Date
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C8A456';
  ctx.font = '900 52px "Inter", sans-serif';
  ctx.letterSpacing = '5px';
  ctx.fillText('HABUILT', 85, 195);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '700 18px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('COUPLE DISCIPLINE ENGINE', 85, 228);

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
  headerLine.addColorStop(1, 'rgba(244, 63, 94, 0.6)');
  ctx.strokeStyle = headerLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(85, 260);
  ctx.lineTo(width - 85, 260);
  ctx.stroke();

  // 6. Dual Warrior Profile Cards
  const cardW = (width - 170 - 24) / 2; // 443px
  const profileY = 285;
  const profileH = 185;

  // Warrior 1 (Left: User)
  const userGrad = ctx.createLinearGradient(85, profileY, 85 + cardW, profileY + profileH);
  userGrad.addColorStop(0, 'rgba(200, 164, 86, 0.14)');
  userGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = userGrad;
  ctx.strokeStyle = 'rgba(200, 164, 86, 0.35)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 85, profileY, cardW, profileH, 24);
  ctx.fill();
  ctx.stroke();

  // User Avatar
  const uAvatarGrad = ctx.createLinearGradient(110, profileY + 20, 175, profileY + 85);
  uAvatarGrad.addColorStop(0, '#F6D380');
  uAvatarGrad.addColorStop(1, '#9E7424');
  ctx.fillStyle = uAvatarGrad;
  ctx.beginPath();
  ctx.arc(142, profileY + 54, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#060a14';
  ctx.font = '900 30px "Inter", sans-serif';
  ctx.fillText((props.displayName || 'U')[0].toUpperCase(), 142, profileY + 65);

  // User Name & Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px "Inter", sans-serif';
  const cleanUserName = props.displayName.length > 15 ? props.displayName.slice(0, 14) + '…' : props.displayName;
  ctx.fillText(cleanUserName, 192, profileY + 48);

  ctx.fillStyle = '#C8A456';
  ctx.font = '700 16px "Inter", sans-serif';
  ctx.fillText(props.levelTitle || 'Practitioner', 192, profileY + 74);

  // User Status Tag
  ctx.fillStyle = '#34d399';
  ctx.font = '800 20px "Inter", sans-serif';
  ctx.fillText(`⚡ ${props.todayPoints} pts earned`, 110, profileY + 140);

  // User Badge
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(200, 164, 86, 0.9)';
  ctx.font = '800 13px "Inter", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('WARRIOR ⚔️', 85 + cardW - 22, profileY + 40);

  // Warrior 2 (Right: Partner)
  const pCardX = 85 + cardW + 24; // 552
  const partnerGrad = ctx.createLinearGradient(pCardX, profileY, pCardX + cardW, profileY + profileH);
  partnerGrad.addColorStop(0, 'rgba(244, 63, 94, 0.14)');
  partnerGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = partnerGrad;
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, pCardX, profileY, cardW, profileH, 24);
  ctx.fill();
  ctx.stroke();

  // Partner Avatar
  const pAvatarGrad = ctx.createLinearGradient(pCardX + 25, profileY + 20, pCardX + 90, profileY + 85);
  pAvatarGrad.addColorStop(0, '#fda4af');
  pAvatarGrad.addColorStop(1, '#e11d48');
  ctx.fillStyle = pAvatarGrad;
  ctx.beginPath();
  ctx.arc(pCardX + 57, profileY + 54, 34, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px "Inter", sans-serif';
  ctx.fillText((props.partnerDisplayName || 'P')[0].toUpperCase(), pCardX + 57, profileY + 65);

  // Partner Name & Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 26px "Inter", sans-serif';
  const cleanPartnerName = props.partnerDisplayName.length > 15 ? props.partnerDisplayName.slice(0, 14) + '…' : props.partnerDisplayName;
  ctx.fillText(cleanPartnerName, pCardX + 107, profileY + 48);

  ctx.fillStyle = '#fb7185';
  ctx.font = '700 16px "Inter", sans-serif';
  ctx.fillText('Allied Partner', pCardX + 107, profileY + 74);

  // Partner Status Tag
  ctx.fillStyle = '#34d399';
  ctx.font = '800 20px "Inter", sans-serif';
  ctx.fillText(`🌸 ${props.partnerPoints} pts earned`, pCardX + 25, profileY + 140);

  // Partner Badge
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(244, 63, 94, 0.9)';
  ctx.font = '800 13px "Inter", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText('ALLIED 🌸', pCardX + cardW - 22, profileY + 40);

  // 7. HERO SECTION: Massive Alignment Score & Sync Rate Card
  const heroY = 495;
  const heroH = 325;
  const heroGrad = ctx.createLinearGradient(85, heroY, width - 85, heroY + heroH);
  heroGrad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
  heroGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.9)');
  heroGrad.addColorStop(1, 'rgba(200, 164, 86, 0.2)');
  ctx.fillStyle = heroGrad;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
  ctx.lineWidth = 3;
  drawRoundRect(ctx, 85, heroY, width - 170, heroH, 32);
  ctx.fill();
  ctx.stroke();

  // Alignment Score Big Display
  ctx.textAlign = 'center';
  ctx.fillStyle = '#34d399';
  ctx.font = '900 128px "Inter", sans-serif';
  ctx.fillText(`${props.alignmentScore}%`, width / 2, heroY + 140);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '800 20px "Inter", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('COUPLE SYNCHRONIZATION RATE', width / 2, heroY + 185);

  // Dynamic Harmony Status Pill
  const harmonyPillGrad = ctx.createLinearGradient(width / 2 - 270, heroY + 225, width / 2 + 270, heroY + 285);
  harmonyPillGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
  harmonyPillGrad.addColorStop(1, 'rgba(200, 164, 86, 0.35)');
  ctx.fillStyle = harmonyPillGrad;
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, width / 2 - 280, heroY + 220, 560, 64, 32);
  ctx.fill();
  ctx.stroke();

  const harmonyTitle = props.alignmentScore >= 80
    ? '🌟 PEAK COUPLE HARMONY 🌟'
    : props.alignmentScore >= 50
    ? '⚡ STRONG SYNCHRONIZED MOMENTUM ⚡'
    : '🛡️ BUILDING MUTUAL SYNERGY 🛡️';

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Inter", sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText(harmonyTitle, width / 2, heroY + 262);

  // 8. 4-Metrics Highlights Grid (2x2)
  const syncedAnchorsCount = (props.sharedAnchors || []).filter(a => a.completedTogether || a.status === 'both').length;
  const totalAnchorsCount = (props.sharedAnchors || []).length || 3;
  const combinedPointsTotal = (props.todayPoints || 0) + (props.partnerPoints || 0);

  const stats = [
    { label: 'COMBINED TODAY', value: `${combinedPointsTotal} pts`, icon: '🏆', color: '#C8A456', sub: 'Joint Energy Vault' },
    { label: 'MUTUAL STREAK', value: `${props.streak} Days`, icon: '🔥', color: '#f59e0b', sub: 'Unbroken Together' },
    { label: 'SHARED ANCHORS', value: `${syncedAnchorsCount}/${totalAnchorsCount}`, icon: '🤝', color: '#10b981', sub: 'Joint Core Rituals' },
    { label: 'COUPLE XP BOOST', value: `+${combinedPointsTotal * 10} XP`, icon: '⚡', color: '#818cf8', sub: 'Mutual Synergy Factor' },
  ];

  const gridX = 85;
  const gridY = 850;
  const gridCardH = 150;

  stats.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = gridX + col * (cardW + 24);
    const y = gridY + row * (gridCardH + 18);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, x, y, cardW, gridCardH, 20);
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
    ctx.fillText(item.sub, x + 24, y + 128);
  });

  // 9. Shared Anchors Live Sync Showcase Table
  const anchorsY = 1195;
  const anchorsH = 485;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, 85, anchorsY, width - 170, anchorsH, 26);
  ctx.fill();
  ctx.stroke();

  // Section Title
  ctx.textAlign = 'left';
  ctx.fillStyle = '#C8A456';
  ctx.font = '900 21px "Inter", sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText('🤝 SHARED ANCHOR RITUALS', 120, anchorsY + 48);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#34d399';
  ctx.font = '800 18px "Inter", sans-serif';
  ctx.fillText(`${syncedAnchorsCount}/${totalAnchorsCount} Synced`, width - 120, anchorsY + 48);

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(115, anchorsY + 66);
  ctx.lineTo(width - 115, anchorsY + 66);
  ctx.stroke();

  // Anchor list (up to 4 items)
  const anchorsToRender = (props.sharedAnchors && props.sharedAnchors.length > 0)
    ? props.sharedAnchors.slice(0, 4)
    : [
        { label: 'Morning Sunlight & Hydration', status: 'both' },
        { label: 'Deep Work Focus Block', status: 'both' },
        { label: 'Evening Wind-down & Sleep Ritual', status: 'user' },
      ];

  anchorsToRender.forEach((anchor, idx) => {
    const rowY = anchorsY + 84 + idx * 90;
    const isBoth = Boolean(anchor.completedTogether || anchor.status === 'both');
    const isPartner = Boolean((anchor.completedByPartner && !anchor.completedTogether) || anchor.status === 'partner');
    const isUser = Boolean((anchor.completedByUser && !anchor.completedTogether) || anchor.status === 'user');

    // Row Card Background
    ctx.fillStyle = isBoth ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.025)';
    ctx.strokeStyle = isBoth ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    drawRoundRect(ctx, 110, rowY, width - 220, 78, 14);
    ctx.fill();
    ctx.stroke();

    // Check Icon Indicator
    ctx.fillStyle = isBoth ? 'rgba(16, 185, 129, 0.25)' : (isUser || isPartner ? 'rgba(200, 164, 86, 0.2)' : 'rgba(255, 255, 255, 0.06)');
    ctx.beginPath();
    ctx.arc(148, rowY + 39, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = isBoth ? '#10b981' : (isUser || isPartner ? '#C8A456' : '#94a3b8');
    ctx.font = '900 20px sans-serif';
    ctx.fillText(isBoth ? '✓' : (isUser || isPartner ? '⚡' : '⏳'), 148, rowY + 47);

    // Anchor Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 22px "Inter", sans-serif';
    const rawAnchorTitle = anchor.title || anchor.label || anchor.name || 'Shared Routine';
    const cleanAnchorName = rawAnchorTitle.length > 36 ? rawAnchorTitle.slice(0, 33) + '…' : rawAnchorTitle;
    ctx.fillText(cleanAnchorName, 188, rowY + 34);

    // Subtitle badges (You / Partner status)
    ctx.font = '600 15px "Inter", sans-serif';
    ctx.fillStyle = (isBoth || isUser) ? '#34d399' : '#94a3b8';
    ctx.fillText(`You: ${isBoth || isUser ? '✓ Done' : '⏳ Pending'}`, 188, rowY + 60);

    ctx.fillStyle = (isBoth || isPartner) ? '#fb7185' : '#94a3b8';
    ctx.fillText(`•   ${props.partnerDisplayName}: ${isBoth || isPartner ? '✓ Done' : '⏳ Pending'}`, 320, rowY + 60);

    // Pill badge on right
    ctx.textAlign = 'right';
    let badgeText = '⏳ PENDING';
    let badgeColor = '#94a3b8';
    if (isBoth) {
      badgeText = '🎉 SYNCED';
      badgeColor = '#34d399';
    } else if (isPartner) {
      badgeText = '🌸 PARTNER';
      badgeColor = '#fb7185';
    } else if (isUser) {
      badgeText = '⚡ YOU DONE';
      badgeColor = '#C8A456';
    }
    ctx.fillStyle = badgeColor;
    ctx.font = '900 17px "Inter", sans-serif';
    ctx.fillText(badgeText, width - 135, rowY + 46);
  });

  // 10. Couple Motivational Quote & Branding Footer
  const footerY = 1715;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '600 23px "Inter", sans-serif';
  ctx.fillText('“Iron sharpens iron. Together we conquer every standard.”', width / 2, footerY);

  ctx.fillStyle = '#C8A456';
  ctx.font = '900 21px "Inter", sans-serif';
  ctx.letterSpacing = '3px';
  ctx.fillText('BUILT WITH DISCIPLINE • HABUILT COUPLES SYNC • HABUILT.COM', width / 2, footerY + 44);

  previewImageSrc.value = canvas.toDataURL('image/png', 0.96);
  isGenerating.value = false;
};

// ── Master Render Trigger ──
const renderCurrentCanvas = async () => {
  if (activeMode.value === 'couple' && props.isPartnerPaired) {
    await generateCoupleScorecardCanvas();
  } else {
    await generateScorecardCanvas();
  }
};

watch(() => props.isOpen, (open) => {
  if (open) {
    renderCurrentCanvas();
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

      const modeSuffix = activeMode.value === 'couple' && props.isPartnerPaired
        ? `couple-${props.displayName.toLowerCase()}-${props.partnerDisplayName.toLowerCase()}`
        : `story-${props.displayName.toLowerCase()}`;
      const file = new File([blob], `habuilt-${modeSuffix}-${Date.now()}.png`, { type: 'image/png' });

      const shareTitle = activeMode.value === 'couple' && props.isPartnerPaired
        ? `Habuilt Couple Alignment — ${props.displayName} & ${props.partnerDisplayName}`
        : `Habuilt Scorecard — ${props.displayName}`;

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareCaptionText.value,
            files: [file],
          });
          emit('toast', '🎉 Story Scorecard shared!');
          return;
        } catch (shareErr) {
          if (shareErr && shareErr.name === 'AbortError') return;
        }
      }

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareCaptionText.value,
            url: 'https://www.habuilt.com',
          });
          emit('toast', '🎉 Scorecard shared!');
          return;
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }

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
  const modeSuffix = activeMode.value === 'couple' && props.isPartnerPaired
    ? `couple-${props.displayName.toLowerCase()}-${props.partnerDisplayName.toLowerCase()}`
    : `story-${props.displayName.toLowerCase()}`;
  a.download = `habuilt-${modeSuffix}-${Date.now()}.png`;
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

      <!-- Mode Selector Tabs (Solo vs Couple) -->
      <div class="share-mode-tabs" role="tablist" aria-label="Scorecard Mode">
        <button
          type="button"
          role="tab"
          :aria-selected="activeMode === 'solo'"
          class="share-mode-tab"
          :class="{ 'share-mode-tab--active': activeMode === 'solo' }"
          @click="setMode('solo')"
        >
          <span>👤 Solo Protocol</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeMode === 'couple'"
          class="share-mode-tab"
          :class="{ 'share-mode-tab--active': activeMode === 'couple' }"
          @click="setMode('couple')"
        >
          <span>🤝 Couple Alignment</span>
          <span v-if="isPartnerPaired" class="share-mode-badge">{{ alignmentScore }}%</span>
        </button>
      </div>

      <!-- Unpaired Prompt when Couple tab is selected but partner is unlinked -->
      <div v-if="activeMode === 'couple' && !isPartnerPaired" class="share-unpaired-card">
        <div class="share-unpaired-icon-wrap">
          <Users class="icon-lg icon-gold" />
        </div>
        <h4 class="share-unpaired-title">Link Your Partner to Unlock Couple Scorecard</h4>
        <p class="share-unpaired-desc">
          Generate high-resolution dual-warrior certificates with mutual streaks, combined points, and synchronized anchor habits.
        </p>
        <button
          type="button"
          class="btn btn--primary-action share-unpaired-btn"
          @click="emit('open-partner-pair')"
        >
          <Sparkles class="icon-sm" />
          <span>Link Partner with Invite Code</span>
        </button>
      </div>

      <!-- Story Aspect Ratio Preview Tag -->
      <div v-if="activeMode === 'solo' || isPartnerPaired" class="share-story-tag-bar">
        <span class="share-story-tag">
          {{ activeMode === 'couple' ? '🤝 9:16 Couple Alignment Certificate (HD)' : '📱 9:16 Instagram Story & WhatsApp Status' }}
        </span>
      </div>

      <!-- Live Generated Image Preview (9:16 Story Card) -->
      <div
        v-if="activeMode === 'solo' || isPartnerPaired"
        class="share-modal-preview-container share-modal-preview-container--story"
      >
        <canvas ref="canvasRef" class="share-modal-canvas-hidden"></canvas>

        <div v-if="isGenerating" class="share-modal-loading">
          <div class="share-modal-spinner"></div>
          <span>Rendering {{ activeMode === 'couple' ? 'Couple Alignment' : '9:16 Story' }} Scorecard...</span>
        </div>

        <div v-else-if="previewImageSrc" class="share-modal-image-wrap">
          <img
            :src="previewImageSrc"
            :alt="activeMode === 'couple' ? 'Habuilt 9:16 Couple Alignment Scorecard' : 'Habuilt 9:16 Daily Story Scorecard'"
            class="share-modal-preview-img share-modal-preview-img--story"
          />
        </div>
      </div>

      <!-- Action Buttons Grid -->
      <div v-if="activeMode === 'solo' || isPartnerPaired" class="share-modal-actions">
        <!-- Main Primary Share Button -->
        <button
          type="button"
          class="btn btn--primary-action share-btn-main"
          @click="shareNativeImage"
        >
          <Share2 class="icon-sm" />
          <span>{{ activeMode === 'couple' ? 'Share Couple Story to Instagram / WhatsApp' : 'Share to Instagram Story / WhatsApp' }}</span>
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
