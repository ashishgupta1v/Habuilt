<script setup>
import { ref, computed } from 'vue';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Circle,
  Award,
  TrendingUp,
  Check,
  Calendar,
  Shield,
  Heart,
  Target,
  Users,
  MessageSquare,
  Copy,
  Share2,
} from 'lucide-vue-next';

const props = defineProps({
  weeklyReviewExpanded: { type: Boolean, default: true },
  weeklySnapshotLabel: { type: String, default: '0%' },
  monthlySnapshotLabel: { type: String, default: '0%' },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  weeklyReview: { type: Object, required: true },
  // Couple Sync Props
  isPartnerPaired: { type: Boolean, default: false },
  partnerDisplayName: { type: String, default: 'Partner' },
  partnerPoints: { type: Number, default: 0 },
  sharedAnchors: { type: Array, default: () => [] },
  alignmentScore: { type: Number, default: 0 },
});

const emit = defineEmits([
  'toggle-expand',
  'fill-metrics',
  'save-review',
  'open-partner-pair',
  'open-reward-vault',
  'toast',
]);

const activeReviewTab = ref('personal'); // 'personal' | 'couple'
const saveFeedback = ref(false);
const copiedDebrief = ref(false);

const isSynergyMilestoneUnlocked = computed(() => {
  if (!props.isPartnerPaired) return false;
  const jointAlignment = props.alignmentScore || 0;
  const combinedPts = combinedWeeklyEstimate.value || 0;
  return jointAlignment >= 80 || combinedPts >= 200;
});

const synergyProgressPercent = computed(() => {
  if (!props.isPartnerPaired) return 0;
  const alignmentPct = Math.min(100, Math.round(((props.alignmentScore || 0) / 80) * 100));
  const ptsPct = Math.min(100, Math.round(((combinedWeeklyEstimate.value || 0) / 200) * 100));
  return Math.max(alignmentPct, ptsPct);
});

const handleSave = () => {
  emit('save-review');
  saveFeedback.value = true;
  setTimeout(() => {
    saveFeedback.value = false;
  }, 2000);
};

// Safe defaults for couple sub-objects
const coupleReflections = computed(() => {
  if (!props.weeklyReview.coupleReflections) {
    props.weeklyReview.coupleReflections = { wins: '', friction: '', commitments: '' };
  }
  return props.weeklyReview.coupleReflections;
});

const coupleChecks = computed(() => {
  if (!Array.isArray(props.weeklyReview.coupleChecks)) {
    props.weeklyReview.coupleChecks = [
      { text: 'We synchronized at least one shared anchor daily without friction.', done: false },
      { text: 'Encouraged partner during intense focus windows without projecting pressure.', done: false },
      { text: 'Held our evening wind-down ritual together with zero late phone interruptions.', done: false },
      { text: 'Celebrated our weekly joint consistency and validated each other\'s progress.', done: false },
    ];
  }
  return props.weeklyReview.coupleChecks;
});

const syncedAnchorsCount = computed(() => {
  return (props.sharedAnchors || []).filter(a => a.status === 'both').length;
});

const totalAnchorsCount = computed(() => {
  return (props.sharedAnchors || []).length || 3;
});

const combinedWeeklyEstimate = computed(() => {
  const userWk = Number(props.weeklyReview.metrics?.weeklyPoints || props.weeklyPoints) || 0;
  const partnerEst = (props.partnerPoints || 0) * 7;
  return userWk + partnerEst;
});

const generateWhatsAppDebriefText = () => {
  const dateStr = props.weeklyReview.reviewDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const wins = coupleReflections.value.wins?.trim() || 'Consistent execution and shared rhythm maintained across morning and evening anchors.';
  const friction = coupleReflections.value.friction?.trim() || 'Schedule compression during afternoon work blocks; addressed via earlier wind-down.';
  const commitments = coupleReflections.value.commitments?.trim() || 'Locking in morning sunlight walk, 13:30 shared lunch stop, and phone-free evening wind-down.';
  const synergyTier = props.alignmentScore >= 80 ? 'Peak Harmony 🌟' : props.alignmentScore >= 50 ? 'Solid Sync ⚔️' : 'Building Sync 🛡️';

  return `🛡️ *HABUILT COUPLE SYNDICATE DEBRIEF*
🗓️ *Week of ${dateStr}* • Partner: ${props.partnerDisplayName}

⚡ *Synchronization Metrics:*
• Combined Energy: ${combinedWeeklyEstimate.value} pts
• Sync Rate Today: ${props.alignmentScore}%
• Shared Anchors: ${syncedAnchorsCount.value}/${totalAnchorsCount.value} Synced
• Synergy Status: ${synergyTier}

✨ *Mutual Breakthroughs & Flow:*
${wins}

⚠️ *Friction & Routine Adjustments:*
${friction}

🎯 *Next Week's Non-Negotiables:*
${commitments}

🔗 Built with Discipline • Habuilt Syndicate: https://habuilt.com`;
};

const shareDebriefToWhatsApp = () => {
  const text = generateWhatsAppDebriefText();
  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  emit('toast', 'Opening WhatsApp with Couple Debrief...');
};

const copyWhatsAppDebrief = async () => {
  const text = generateWhatsAppDebriefText();
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    copiedDebrief.value = true;
    setTimeout(() => { copiedDebrief.value = false; }, 2500);
    emit('toast', '📋 Couple Debrief copied to clipboard!');
  } catch (err) {
    emit('toast', 'Failed to copy to clipboard.');
  }
};
</script>

<template>
  <div class="sunday-review-card">
    <!-- Header -->
    <div class="sunday-review-head">
      <div class="sunday-review-head__left" @click="emit('toggle-expand')">
        <div class="sunday-review-icon-wrap">
          <Compass class="icon-md icon-compass-gold" />
        </div>
        <div>
          <div class="sunday-review-title-row">
            <h3 class="sunday-review-title">Sunday Weekly Review</h3>
            <span v-if="weeklyReview.reviewDate" class="sunday-review-date-badge mono-num">
              {{ weeklyReview.reviewDate }}
            </span>
          </div>
          <p class="sunday-review-sub">Weekly accountability ritual &amp; system optimization</p>
        </div>
      </div>

      <div class="sunday-review-head__actions">
        <button
          type="button"
          class="btn btn--secondary btn--sm sunday-autofill-btn"
          @click="emit('fill-metrics')"
          title="Auto-calculate this week's points and consistency"
        >
          <Sparkles class="icon-xs" />
          <span>Auto-Fill Metrics</span>
        </button>
        <button
          type="button"
          class="btn btn--icon-only"
          @click="emit('toggle-expand')"
          aria-label="Toggle Sunday Review"
        >
          <ChevronUp v-if="weeklyReviewExpanded" class="icon-sm" />
          <ChevronDown v-else class="icon-sm" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div v-show="weeklyReviewExpanded" class="sunday-review-body">
      <!-- Mode Tabs (Solo Review vs Couple Review) -->
      <div class="sunday-tabs" role="tablist" aria-label="Review Mode">
        <button
          type="button"
          role="tab"
          :aria-selected="activeReviewTab === 'personal'"
          class="sunday-tab"
          :class="{ 'sunday-tab--active': activeReviewTab === 'personal' }"
          @click="activeReviewTab = 'personal'"
        >
          <Shield class="icon-xs" />
          <span>Solo Execution Audit</span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeReviewTab === 'couple'"
          class="sunday-tab"
          :class="{ 'sunday-tab--active': activeReviewTab === 'couple' }"
          @click="activeReviewTab = 'couple'"
        >
          <Heart class="icon-xs" />
          <span>Couple Synchronization Audit</span>
          <span v-if="isPartnerPaired" class="sunday-tab-badge">{{ alignmentScore }}%</span>
        </button>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 1: SOLO EXECUTION AUDIT -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div v-if="activeReviewTab === 'personal'" class="sunday-tab-content">
        <!-- 4 Key Metrics Bar -->
        <div class="sunday-metrics-grid">
          <div class="sunday-metric-tile">
            <span class="sunday-metric-tile__label">Week Points</span>
            <strong class="sunday-metric-tile__val mono-num">
              {{ weeklyReview.metrics?.weeklyPoints || weeklyPoints }} <small>pts</small>
            </strong>
          </div>
          <div class="sunday-metric-tile">
            <span class="sunday-metric-tile__label">Week Consistency</span>
            <strong class="sunday-metric-tile__val mono-num">
              {{ weeklyReview.metrics?.weeklyStickiness || weeklySnapshotLabel }}
            </strong>
          </div>
          <div class="sunday-metric-tile">
            <span class="sunday-metric-tile__label">Month Total</span>
            <strong class="sunday-metric-tile__val mono-num">
              {{ weeklyReview.metrics?.monthlyPoints || monthlyPoints }} <small>pts</small>
            </strong>
          </div>
          <div class="sunday-metric-tile">
            <span class="sunday-metric-tile__label">Month Stickiness</span>
            <strong class="sunday-metric-tile__val mono-num">
              {{ weeklyReview.metrics?.monthlyStickiness || monthlySnapshotLabel }}
            </strong>
          </div>
        </div>

        <!-- Accountability Checkpoints -->
        <div class="sunday-section">
          <label class="sunday-section-title">
            <Shield class="icon-xs icon-gold" />
            <span>Execution Honesty Checks</span>
          </label>
          <div class="sunday-checks-list">
            <div
              v-for="(check, idx) in (weeklyReview.checks || [])"
              :key="'chk-' + idx"
              class="sunday-check-row"
              :class="{ 'sunday-check-row--done': check.done }"
              role="checkbox"
              tabindex="0"
              :aria-checked="check.done"
              @click="check.done = !check.done; handleSave()"
              @keydown.enter="check.done = !check.done; handleSave()"
              @keydown.space.prevent="check.done = !check.done; handleSave()"
            >
              <CheckCircle2 v-if="check.done" class="icon-sm icon-check-done" />
              <Circle v-else class="icon-sm icon-check-circle" />
              <span class="sunday-check-text">{{ check.text }}</span>
            </div>
          </div>
        </div>

        <!-- Reflection Prompt Quadrants -->
        <div class="sunday-section">
          <label class="sunday-section-title">
            <Target class="icon-xs icon-gold" />
            <span>System Reflections &amp; Next Week Intentions</span>
          </label>
          <div class="sunday-reflections-grid">
            <div class="sunday-reflection-box">
              <span class="sunday-reflection-label">🌟 Big Wins &amp; Breakthroughs</span>
              <textarea
                v-model="weeklyReview.reflections.wins"
                rows="3"
                placeholder="What habits flowed effortlessly? What wins deserve celebrating?"
                class="sunday-textarea"
                @blur="handleSave"
              ></textarea>
            </div>

            <div class="sunday-reflection-box">
              <span class="sunday-reflection-label">⚠️ Friction, Triggers &amp; Misses</span>
              <textarea
                v-model="weeklyReview.reflections.misses"
                rows="3"
                placeholder="Where was there resistance? What trigger caused missed habits?"
                class="sunday-textarea"
                @blur="handleSave"
              ></textarea>
            </div>

            <div class="sunday-reflection-box">
              <span class="sunday-reflection-label">🩺 Energy &amp; Health Check</span>
              <textarea
                v-model="weeklyReview.reflections.healthCheck"
                rows="3"
                placeholder="Sleep quality, hydration, recovery, mental clarity..."
                class="sunday-textarea"
                @blur="handleSave"
              ></textarea>
            </div>

            <div class="sunday-reflection-box sunday-reflection-box--focus">
              <span class="sunday-reflection-label">🎯 Next Week Non-Negotiables</span>
              <textarea
                v-model="weeklyReview.reflections.nextWeekFocus"
                rows="3"
                placeholder="Top 1–3 non-negotiable habits to protect at all costs next week..."
                class="sunday-textarea"
                @blur="handleSave"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <!-- TAB 2: COUPLE SYNCHRONIZATION AUDIT -->
      <!-- ═══════════════════════════════════════════════════════════════════════ -->
      <div v-else class="sunday-tab-content">
        <!-- Unpaired Prompt if Couple tab selected without partner link -->
        <div v-if="!isPartnerPaired" class="sunday-unpaired-card">
          <div class="sunday-unpaired-icon-wrap">
            <Users class="icon-md icon-gold" />
          </div>
          <h4 class="sunday-unpaired-title">Link Your Partner to Unlock Couple Audits</h4>
          <p class="sunday-unpaired-desc">
            Synchronize weekly accountability rituals, track shared anchor habits, and co-elevate discipline with joint reflections.
          </p>
          <button
            type="button"
            class="btn btn--primary-action btn--sm sunday-unpaired-btn"
            @click="emit('open-partner-pair')"
          >
            <Sparkles class="icon-xs" />
            <span>Link Partner with Invite Code</span>
          </button>
        </div>

        <div v-else class="sunday-couple-audit-wrap">
          <!-- 4 Key Couple Metric Tiles -->
          <div class="sunday-metrics-grid">
            <div class="sunday-metric-tile sunday-metric-tile--gold">
              <span class="sunday-metric-tile__label">Combined Week Energy</span>
              <strong class="sunday-metric-tile__val mono-num">
                {{ combinedWeeklyEstimate }} <small>pts</small>
              </strong>
            </div>
            <div class="sunday-metric-tile sunday-metric-tile--emerald">
              <span class="sunday-metric-tile__label">Sync Rate Today</span>
              <strong class="sunday-metric-tile__val mono-num">
                {{ alignmentScore }}%
              </strong>
            </div>
            <div class="sunday-metric-tile sunday-metric-tile--indigo">
              <span class="sunday-metric-tile__label">Shared Anchors</span>
              <strong class="sunday-metric-tile__val mono-num">
                {{ syncedAnchorsCount }}/{{ totalAnchorsCount }} <small>Synced</small>
              </strong>
            </div>
            <div class="sunday-metric-tile sunday-metric-tile--rose">
              <span class="sunday-metric-tile__label">Synergy Status</span>
              <strong class="sunday-metric-tile__val sunday-metric-tile__val--status">
                {{ alignmentScore >= 80 ? 'Peak Harmony 🌟' : alignmentScore >= 50 ? 'Solid Sync ⚔️' : 'Building Sync 🛡️' }}
              </strong>
            </div>
          </div>

          <!-- Couple Synergy Milestone Unlock Banner -->
          <div
            class="sunday-synergy-banner"
            :class="isSynergyMilestoneUnlocked ? 'sunday-synergy-banner--unlocked' : 'sunday-synergy-banner--progress'"
          >
            <div class="sunday-synergy-banner__glow" v-if="isSynergyMilestoneUnlocked"></div>
            <div class="sunday-synergy-banner__body">
              <div class="sunday-synergy-banner__icon">
                {{ isSynergyMilestoneUnlocked ? '🌟' : '🛡️' }}
              </div>
              <div class="sunday-synergy-banner__content">
                <div class="sunday-synergy-banner__tag">
                  {{ isSynergyMilestoneUnlocked ? 'COUPLE SYNERGY MILESTONE UNLOCKED' : 'COUPLE SYNERGY QUALIFIER' }}
                </div>
                <h4 class="sunday-synergy-banner__title">
                  {{ isSynergyMilestoneUnlocked ? `Peak Harmony Unlocked! (${alignmentScore}% Sync • ${combinedWeeklyEstimate} pts)` : 'Unlock Couple Synergy Rewards' }}
                </h4>
                <p class="sunday-synergy-banner__desc">
                  <span v-if="isSynergyMilestoneUnlocked">
                    You and {{ partnerDisplayName }} achieved weekly synergy! Exclusive shared couple rewards are unlocked in your Reward Vault.
                  </span>
                  <span v-else>
                    Maintain <strong>80% joint sync</strong> or <strong>200 combined weekly energy points</strong> to unlock shared milestone experiences in your Reward Vault.
                  </span>
                </p>
                <div v-if="!isSynergyMilestoneUnlocked" class="sunday-synergy-progress-wrap">
                  <div class="sunday-synergy-progress-bar">
                    <div
                      class="sunday-synergy-progress-fill"
                      :style="{ width: `${synergyProgressPercent}%` }"
                    ></div>
                  </div>
                  <div class="sunday-synergy-progress-labels mono-num">
                    <span>Sync: {{ alignmentScore }}% / 80%</span>
                    <span>Energy: {{ combinedWeeklyEstimate }} / 200 pts</span>
                    <span>{{ synergyProgressPercent }}% Qualified</span>
                  </div>
                </div>
              </div>
              <button
                v-if="isSynergyMilestoneUnlocked"
                type="button"
                id="sunday-open-vault-btn"
                class="btn btn--primary-action btn--sm sunday-synergy-banner__btn"
                @click="emit('open-reward-vault')"
              >
                <Award class="icon-xs" />
                <span>Claim in Vault 🎁</span>
              </button>
            </div>
          </div>

          <!-- Couple Execution Honesty & Harmony Checks -->
          <div class="sunday-section">
            <label class="sunday-section-title">
              <Heart class="icon-xs icon-rose" />
              <span>Couple Synergy &amp; Harmony Checks</span>
            </label>
            <div class="sunday-checks-list">
              <div
                v-for="(check, idx) in coupleChecks"
                :key="'c-chk-' + idx"
                class="sunday-check-row"
                :class="{ 'sunday-check-row--done': check.done }"
                role="checkbox"
                tabindex="0"
                :aria-checked="check.done"
                @click="check.done = !check.done; handleSave()"
                @keydown.enter="check.done = !check.done; handleSave()"
                @keydown.space.prevent="check.done = !check.done; handleSave()"
              >
                <CheckCircle2 v-if="check.done" class="icon-sm icon-check-done" />
                <Circle v-else class="icon-sm icon-check-circle" />
                <span class="sunday-check-text">{{ check.text }}</span>
              </div>
            </div>
          </div>

          <!-- Couple Reflections & Mutual Commitments -->
          <div class="sunday-section">
            <label class="sunday-section-title">
              <Sparkles class="icon-xs icon-gold" />
              <span>Joint Reflections with {{ partnerDisplayName }}</span>
            </label>
            <div class="sunday-reflections-grid">
              <div class="sunday-reflection-box">
                <span class="sunday-reflection-label">🌟 Mutual Breakthroughs &amp; Flow</span>
                <textarea
                  v-model="coupleReflections.wins"
                  rows="3"
                  :placeholder="`What routines flowed seamlessly with ${partnerDisplayName}? What mutual consistency wins deserve celebration?`"
                  class="sunday-textarea"
                  @blur="handleSave"
                ></textarea>
              </div>

              <div class="sunday-reflection-box">
                <span class="sunday-reflection-label">⚠️ Friction &amp; Routine Misalignments</span>
                <textarea
                  v-model="coupleReflections.friction"
                  rows="3"
                  placeholder="Where did busy schedules cause misalignments? How did we handle stress or fatigue together?"
                  class="sunday-textarea"
                  @blur="handleSave"
                ></textarea>
              </div>

              <div class="sunday-reflection-box sunday-reflection-box--focus sunday-reflection-box--span2">
                <span class="sunday-reflection-label">🎯 Next Week's Shared Non-Negotiables</span>
                <textarea
                  v-model="coupleReflections.commitments"
                  rows="3"
                  :placeholder="`Top shared anchors to lock in with ${partnerDisplayName} (e.g., Morning sunlight walk, 18:30 dinner stop, phone-free evening)...`"
                  class="sunday-textarea"
                  @blur="handleSave"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Joint WhatsApp Executive Debrief Export Strip -->
          <div class="sunday-export-panel">
            <div class="sunday-export-panel__info">
              <div class="sunday-export-panel__badge">
                <Share2 class="icon-xs text-amber-400" />
                <span>EXECUTIVE DEBRIEF DISPATCH</span>
              </div>
              <h5 class="sunday-export-panel__title">Send Joint Synchronization Debrief</h5>
              <p class="sunday-export-panel__desc">
                Dispatch your formatted couple synergy audit, non-negotiables, and wins directly to {{ partnerDisplayName }} via WhatsApp.
              </p>
            </div>
            <div class="sunday-export-panel__actions">
              <button
                type="button"
                id="sunday-share-whatsapp-btn"
                class="btn btn--whatsapp btn--sm"
                @click="shareDebriefToWhatsApp"
                title="Send directly to WhatsApp"
              >
                <MessageSquare class="icon-xs" />
                <span>Send via WhatsApp</span>
              </button>
              <button
                type="button"
                id="sunday-copy-whatsapp-btn"
                class="btn btn--secondary btn--sm"
                @click="copyWhatsAppDebrief"
                title="Copy formatted text to clipboard"
              >
                <Check v-if="copiedDebrief" class="icon-xs text-emerald-400" />
                <Copy v-else class="icon-xs" />
                <span>{{ copiedDebrief ? 'Copied to Clipboard!' : 'Copy Debrief Text' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="sunday-actions-bar">
        <span v-if="saveFeedback" class="sunday-save-toast">
          <Check class="icon-xs" /> Saved to storage
        </span>
        <button type="button" class="btn btn--primary-action btn--sm" @click="handleSave">
          <Check class="icon-xs" /> <span>Save Sunday Review</span>
        </button>
      </div>
    </div>
  </div>
</template>
