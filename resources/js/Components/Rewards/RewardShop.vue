<script setup>
import { ref, computed } from 'vue';
import {
  Gift,
  Award,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  RotateCcw,
  Check,
  Plus,
  Sparkles,
  DollarSign,
  ShoppingBag,
  History,
  Heart,
  Users,
  Lock,
  Unlock,
} from 'lucide-vue-next';
import { useBiometricVault } from '@/Composables/useBiometricVault';
import BiometricVaultShield from '@/Components/Modals/BiometricVaultShield.vue';

const props = defineProps({
  availableWallet: { type: Number, default: 0 },
  monthlyTotalEarned: { type: Number, default: 0 },
  rewardsExpanded: { type: Boolean, default: true },
  rewardsEditing: { type: Boolean, default: false },
  rewardsDraft: { type: Array, default: () => [] },
  activeRewards: { type: Array, default: () => [] },
  rewardLedger: { type: Array, default: () => [] },
  isRedeeming: { type: Boolean, default: false },
  isClaimedThisMonth: { type: Function, required: true },
  canAffordReward: { type: Function, required: true },
  // Couple Synergy Rewards Props
  isPartnerPaired: { type: Boolean, default: false },
  partnerDisplayName: { type: String, default: 'Partner' },
  alignmentScore: { type: Number, default: 0 },
  combinedWeeklyPoints: { type: Number, default: 0 },
  isSynergyUnlocked: { type: Boolean, default: false },
  claimedSynergyRewards: { type: Array, default: () => [] },
  activeCoupleSynergyRewards: { type: Array, default: () => [] },
  coupleSynergyRewardsDraft: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'toggle-expand',
  'start-editing',
  'cancel-editing',
  'save-rewards',
  'restore-default-rewards',
  'add-draft-reward',
  'remove-draft-reward',
  'redeem-reward',
  'redeem-synergy-reward',
  'add-draft-synergy-reward',
  'remove-draft-synergy-reward',
  'restore-default-synergy-rewards',
]);

const editorTab = ref('personal'); // 'personal' | 'couple'
const quickEmojiSuggestions = ['🥂', '🌲', '💆', '🎬', '✈️', '🍣', '☕', '🏕️', '🍰', '🏎️', '🎨', '🏖️'];

const defaultCoupleSynergyRewards = [
  {
    id: 'couple-candlelight-dinner',
    item: '🥂 Candlelight Date Night & Dinner',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Celebrate weekly alignment with uninterrupted conversation and wholesome dining.',
    icon: '🥂',
  },
  {
    id: 'couple-sunday-nature',
    item: '🌲 Sunday Nature Trail & Artisanal Coffee',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Screen-free morning walk, crisp fresh air, and deep reflection together.',
    icon: '🌲',
  },
  {
    id: 'couple-recovery-spa',
    item: '💆 Joint Rest, Foot Soak & Recovery Evening',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Joint physical recovery, soothing herbal tea, and complete offline relaxation.',
    icon: '💆',
  },
];

const displayedCoupleRewards = computed(() => {
  if (Array.isArray(props.activeCoupleSynergyRewards) && props.activeCoupleSynergyRewards.length > 0) {
    return props.activeCoupleSynergyRewards;
  }
  return defaultCoupleSynergyRewards;
});

const isSynergyRewardClaimed = (rewardId) => {
  return (props.claimedSynergyRewards || []).includes(rewardId);
};

const nextMilestoneReward = computed(() => {
  const higherRewards = (props.activeRewards || [])
    .filter((r) => (Number(r.cost) || 0) > props.availableWallet)
    .sort((a, b) => (Number(a.cost) || 0) - (Number(b.cost) || 0));

  if (higherRewards.length > 0) {
    const next = higherRewards[0];
    return `${next.item} (${next.cost} pts)`;
  }
  return 'All Unlocked! 👑';
});

const {
  isSectionLocked,
  lockVault,
  unlockVault,
  isVaultConfigured,
  configureVault,
} = useBiometricVault();

const toggleRewardsVault = () => {
  if (!isVaultConfigured.value) {
    configureVault(true);
    emit('toast', '🔒 Biometric Privacy Vault enabled for Reward Reserves!');
  } else if (isSectionLocked('rewards')) {
    unlockVault();
    emit('toast', '🔓 Reward Vault unsealed');
  } else {
    lockVault();
    emit('toast', '🔒 Reward Vault sealed');
  }
};
</script>

<template>
  <div class="reward-vault-dashboard">
    <!-- Grand Glowing Gold Wallet Card -->
    <div class="reward-vault-hero-card">
      <div class="reward-vault-hero-bg-glow"></div>
      <div class="reward-vault-hero-content">
        <div class="reward-vault-hero-top flex items-center justify-between">
          <div class="reward-vault-chip">
            <Award class="icon-xs icon-vault-gold" />
            <span>Habuilt Reward Wallet</span>
          </div>
          <button
            type="button"
            class="btn btn--secondary btn--xs reward-vault-lock-btn flex items-center gap-1"
            :title="isVaultConfigured ? (isSectionLocked('rewards') ? 'Vault Sealed (Click to unseal)' : 'Vault Active (Click to lock)') : 'Enable Biometric Privacy Vault'"
            @click="toggleRewardsVault"
          >
            <component :is="isSectionLocked('rewards') ? Lock : Unlock" class="icon-2xs" />
            <span>{{ isSectionLocked('rewards') ? 'Sealed' : (isVaultConfigured ? 'Lock Vault' : 'Vault Off') }}</span>
          </button>
        </div>

        <div class="reward-vault-balance-row">
          <div class="reward-vault-balance-group">
            <span class="reward-vault-balance-num mono-num">{{ availableWallet }}</span>
            <span class="reward-vault-balance-unit">pts available</span>
          </div>
        </div>

        <div class="reward-vault-stats-strip">
          <div class="reward-vault-stat">
            <span class="reward-vault-stat-label">Earned This Month</span>
            <strong class="reward-vault-stat-val mono-num">+{{ monthlyTotalEarned }} pts</strong>
          </div>
          <div class="reward-vault-stat">
            <span class="reward-vault-stat-label">Total Redemptions</span>
            <strong class="reward-vault-stat-val mono-num">{{ rewardLedger.length }} claims</strong>
          </div>
          <div class="reward-vault-stat">
            <span class="reward-vault-stat-label">Next Big Milestone</span>
            <strong class="reward-vault-stat-val mono-num">{{ nextMilestoneReward }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Rewards Editor Panel -->
    <!-- Rewards Editor Panel -->
    <div v-if="rewardsEditing" class="rewards-editor-card">
      <div class="rewards-editor-head">
        <h3 class="rewards-editor-title">Customize Your Rewards Catalog</h3>
        <p class="rewards-editor-hint">Assign point costs to personal rewards or design shared couple synergy milestones.</p>
      </div>

      <!-- Tab Switcher if Paired -->
      <div v-if="isPartnerPaired" class="rewards-editor-tabs">
        <button
          type="button"
          class="rewards-editor-tab"
          :class="{ 'rewards-editor-tab--active': editorTab === 'personal' }"
          @click="editorTab = 'personal'"
        >
          <span>Personal Rewards</span>
          <span class="rewards-editor-tab-badge">{{ (rewardsDraft || []).length }}</span>
        </button>
        <button
          type="button"
          class="rewards-editor-tab"
          :class="{ 'rewards-editor-tab--active': editorTab === 'couple' }"
          @click="editorTab = 'couple'"
        >
          <span>❤️ Couple Synergy Rewards</span>
          <span class="rewards-editor-tab-badge">{{ (coupleSynergyRewardsDraft || []).length }}</span>
        </button>
      </div>

      <!-- Personal Rewards Draft List -->
      <div v-if="editorTab === 'personal'" class="rewards-editor-list">
        <div
          v-for="(reward, index) in rewardsDraft"
          :key="reward.id || `reward-draft-${index}`"
          class="rewards-editor-row"
        >
          <div class="rewards-editor-row-meta">
            <input
              v-model="reward.type"
              type="text"
              maxlength="24"
              placeholder="Tier (Daily, Weekly...)"
              class="rewards-editor-type-input"
              aria-label="Reward Tier"
            />
            <div class="rewards-editor-cost-wrap">
              <input
                v-model.number="reward.cost"
                type="number"
                min="1"
                max="10000"
                placeholder="Pts"
                class="rewards-editor-cost-input mono-num"
                aria-label="Reward Points Cost"
              />
              <span class="rewards-editor-cost-unit">pts</span>
            </div>
            <button
              type="button"
              class="rewards-editor-delete-btn"
              @click="emit('remove-draft-reward', index)"
              title="Delete reward"
              aria-label="Delete reward"
            >
              <Trash2 class="icon-xs" />
            </button>
          </div>
          <div class="rewards-editor-row-main">
            <input
              v-model="reward.item"
              type="text"
              maxlength="100"
              placeholder="Reward item name (e.g. Movie night, Cheat meal...)"
              class="rewards-editor-name-input"
              aria-label="Reward Name"
            />
          </div>
        </div>
      </div>

      <!-- Couple Synergy Rewards Draft List -->
      <div v-else-if="editorTab === 'couple'" class="rewards-editor-list rewards-editor-list--couple">
        <div
          v-for="(reward, index) in coupleSynergyRewardsDraft"
          :key="reward.id || `synergy-draft-${index}`"
          class="rewards-editor-row rewards-editor-row--couple"
        >
          <div class="rewards-editor-row-meta">
            <div class="rewards-editor-emoji-wrap">
              <input
                v-model="reward.icon"
                type="text"
                maxlength="4"
                placeholder="🎁"
                class="rewards-editor-emoji-input"
                aria-label="Reward Emoji Icon"
              />
            </div>
            <div class="rewards-editor-row-meta-tag">
              <span>Couple Synergy</span>
            </div>
            <button
              type="button"
              class="rewards-editor-delete-btn"
              @click="emit('remove-draft-synergy-reward', index)"
              title="Delete couple reward"
              aria-label="Delete couple reward"
            >
              <Trash2 class="icon-xs" />
            </button>
          </div>

          <!-- Quick Emoji Suggestion Pills -->
          <div class="rewards-editor-emoji-suggestions">
            <button
              v-for="emoji in quickEmojiSuggestions"
              :key="emoji"
              type="button"
              class="rewards-editor-emoji-pill"
              :class="{ 'rewards-editor-emoji-pill--selected': reward.icon === emoji }"
              @click="reward.icon = emoji"
            >
              {{ emoji }}
            </button>
          </div>

          <div class="rewards-editor-row-main">
            <input
              v-model="reward.item"
              type="text"
              maxlength="100"
              placeholder="Shared experience (e.g. 🥂 Candlelight Dinner, 🎬 Movie Night...)"
              class="rewards-editor-name-input"
              aria-label="Couple Reward Name"
            />
            <textarea
              v-model="reward.description"
              maxlength="160"
              rows="2"
              placeholder="Short intention or why this shared reward is special together..."
              class="rewards-editor-desc-input"
              aria-label="Couple Reward Description"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="rewards-editor-actions">
        <div class="rewards-editor-actions-left">
          <template v-if="editorTab === 'personal'">
            <button type="button" class="btn btn--secondary btn--sm" @click="emit('add-draft-reward')">
              <Plus class="icon-xs" /> <span>Add Reward</span>
            </button>
            <button type="button" class="btn btn--secondary btn--sm" @click="emit('restore-default-rewards')">
              <RotateCcw class="icon-xs" /> <span>Restore Defaults</span>
            </button>
          </template>
          <template v-else-if="editorTab === 'couple'">
            <button type="button" class="btn btn--secondary btn--sm" @click="emit('add-draft-synergy-reward')">
              <Plus class="icon-xs" /> <span>Add Couple Reward</span>
            </button>
            <button type="button" class="btn btn--secondary btn--sm" @click="emit('restore-default-synergy-rewards')">
              <RotateCcw class="icon-xs" /> <span>Restore Couple Defaults</span>
            </button>
          </template>
        </div>
        <div class="rewards-editor-actions-right">
          <button type="button" class="btn btn--secondary btn--sm" @click="emit('cancel-editing')">Cancel</button>
          <button type="button" class="btn btn--primary-action btn--sm" @click="emit('save-rewards')">
            <Check class="icon-xs" /> <span>Save Catalog</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Biometric Vault Shield for Rewards -->
    <BiometricVaultShield
      v-else-if="isSectionLocked('rewards')"
      section-title="Reward Vault & Milestone Reserves"
      section-description="Your milestone redemption catalog, partner synergy rewards, and reward points ledger are protected by hardware biometrics."
      @unlocked="emit('toast', '✓ Reward Vault Unsealed')"
      @toast="(msg) => emit('toast', msg)"
    />

    <!-- Active Rewards Catalog & Couple Synergy Section -->
    <div v-else class="rewards-catalog-section">
      <!-- Couple Synergy Milestone Rewards Strip (when paired) -->
      <div v-if="isPartnerPaired" class="couple-synergy-rewards-panel">
        <div class="couple-synergy-head">
          <div class="couple-synergy-head__title">
            <Heart class="icon-sm text-rose-400" />
            <span>Couple Synergy Milestone Rewards</span>
            <span
              v-if="isSynergyUnlocked"
              class="couple-synergy-badge couple-synergy-badge--unlocked"
            >
              🌟 Milestone Unlocked
            </span>
            <span
              v-else
              class="couple-synergy-badge couple-synergy-badge--locked"
            >
              🔒 80% Sync / 200 Pts Req.
            </span>
          </div>
          <div class="couple-synergy-head__meta">
            <span class="mono-num">Sync: {{ alignmentScore }}%</span>
            <span>•</span>
            <span class="mono-num">Energy: {{ combinedWeeklyPoints }} pts</span>
            <button
              type="button"
              class="couple-synergy-edit-btn"
              @click="editorTab = 'couple'; emit('start-editing')"
              title="Edit Couple Synergy Rewards"
              aria-label="Edit Couple Synergy Rewards"
            >
              <Edit3 class="icon-xs" />
              <span>Customize</span>
            </button>
          </div>
        </div>

        <p class="couple-synergy-desc">
          Joint rewards with {{ partnerDisplayName }}. Qualify weekly through mutual discipline and routine sync to celebrate shared experiences.
        </p>

        <!-- Couple Synergy Cards Grid -->
        <div class="couple-synergy-grid">
          <div
            v-for="reward in displayedCoupleRewards"
            :key="reward.id"
            class="couple-synergy-card"
            :class="{
              'couple-synergy-card--unlocked': isSynergyUnlocked && !isSynergyRewardClaimed(reward.id),
              'couple-synergy-card--claimed': isSynergyRewardClaimed(reward.id),
              'couple-synergy-card--locked': !isSynergyUnlocked,
            }"
          >
            <div class="couple-synergy-card__icon">{{ reward.icon }}</div>
            <div class="couple-synergy-card__body">
              <div class="couple-synergy-card__top">
                <span class="couple-synergy-card__type">{{ reward.type }}</span>
                <span
                  class="couple-synergy-card__status"
                  :class="{
                    'text-emerald-400': isSynergyRewardClaimed(reward.id),
                    'text-amber-400': isSynergyUnlocked && !isSynergyRewardClaimed(reward.id),
                    'text-slate-400': !isSynergyUnlocked,
                  }"
                >
                  {{ isSynergyRewardClaimed(reward.id) ? 'Claimed' : (isSynergyUnlocked ? 'Available' : 'Locked') }}
                </span>
              </div>
              <h4 class="couple-synergy-card__title">{{ reward.item }}</h4>
              <p class="couple-synergy-card__desc">{{ reward.description }}</p>
            </div>
            <div class="couple-synergy-card__action">
              <button
                type="button"
                class="btn couple-synergy-claim-btn"
                :class="{
                  'couple-synergy-claim-btn--claim': isSynergyUnlocked && !isSynergyRewardClaimed(reward.id),
                  'couple-synergy-claim-btn--claimed': isSynergyRewardClaimed(reward.id),
                  'couple-synergy-claim-btn--locked': !isSynergyUnlocked,
                }"
                :disabled="!isSynergyUnlocked || isSynergyRewardClaimed(reward.id)"
                @click="emit('redeem-synergy-reward', reward)"
              >
                <Check v-if="isSynergyRewardClaimed(reward.id)" class="icon-xs" />
                <Sparkles v-else-if="isSynergyUnlocked" class="icon-xs" />
                <span v-if="isSynergyRewardClaimed(reward.id)">Claimed Together ❤️</span>
                <span v-else-if="isSynergyUnlocked">Claim Reward 🎉</span>
                <span v-else>Locked Milestone</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="rewards-catalog-head">
        <div class="rewards-catalog-title">
          <ShoppingBag class="icon-sm icon-catalog-gold" />
          <span>Rewards Catalog ({{ activeRewards.length }})</span>
        </div>
        <button
          type="button"
          class="reward-vault-edit-btn"
          @click="emit('start-editing')"
          title="Edit Rewards Catalog"
        >
          <Edit3 class="icon-xs" />
          <span>Edit Catalog</span>
        </button>
      </div>

      <div class="rewards-grid">
        <div
          v-for="reward in activeRewards"
          :key="reward.id || reward.item"
          class="reward-catalog-card"
          :class="{
            'reward-catalog-card--claimed': isClaimedThisMonth(reward.id),
            'reward-catalog-card--affordable': canAffordReward(reward) && !isClaimedThisMonth(reward.id),
          }"
        >
          <div class="reward-catalog-card-body">
            <div class="reward-catalog-card-tag-row">
              <span class="reward-catalog-type-pill">{{ reward.type }}</span>
              <span class="reward-catalog-cost-pill mono-num">{{ reward.cost }} pts</span>
            </div>
            <h4 class="reward-catalog-item-name">{{ reward.item }}</h4>
          </div>

          <div class="reward-catalog-card-footer">
            <button
              type="button"
              class="btn reward-redeem-btn"
              :class="{
                'reward-redeem-btn--claimed': isClaimedThisMonth(reward.id),
                'reward-redeem-btn--affordable': canAffordReward(reward) && !isClaimedThisMonth(reward.id),
                'reward-redeem-btn--locked': !canAffordReward(reward) && !isClaimedThisMonth(reward.id),
              }"
              :disabled="isRedeeming || isClaimedThisMonth(reward.id) || !canAffordReward(reward)"
              @click="emit('redeem-reward', reward)"
            >
              <Check v-if="isClaimedThisMonth(reward.id)" class="icon-xs" />
              <span v-if="isClaimedThisMonth(reward.id)">Claimed</span>
              <span v-else-if="canAffordReward(reward)">Redeem {{ reward.cost }} pts</span>
              <span v-else>Need {{ reward.cost - availableWallet }} more pts</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Redemption Transaction History Ledger -->
    <div class="reward-ledger-section" v-if="rewardLedger.length > 0">
      <div class="reward-ledger-head">
        <div class="reward-ledger-title">
          <History class="icon-sm icon-ledger-gold" />
          <span>Redemption History</span>
        </div>
        <span class="reward-ledger-count mono-num">{{ rewardLedger.length }} total</span>
      </div>

      <div class="reward-ledger-list">
        <div
          v-for="entry in rewardLedger.slice(0, 10)"
          :key="entry.id"
          class="reward-ledger-row"
        >
          <div class="reward-ledger-row-left">
            <span class="reward-ledger-item-title">{{ entry.item }}</span>
            <span class="reward-ledger-date">{{ entry.claimed_at }}</span>
          </div>
          <span class="reward-ledger-cost mono-num">-{{ entry.cost }} pts</span>
        </div>
      </div>
    </div>
  </div>
</template>
