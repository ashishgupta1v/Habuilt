<script setup>
import { computed } from 'vue';
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
} from 'lucide-vue-next';

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
]);

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
</script>

<template>
  <div class="reward-vault-dashboard">
    <!-- Grand Glowing Gold Wallet Card -->
    <div class="reward-vault-hero-card">
      <div class="reward-vault-hero-bg-glow"></div>
      <div class="reward-vault-hero-content">
        <div class="reward-vault-hero-top">
          <div class="reward-vault-chip">
            <Award class="icon-xs icon-vault-gold" />
            <span>Habuilt Reward Wallet</span>
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
    <div v-if="rewardsEditing" class="rewards-editor-card">
      <div class="rewards-editor-head">
        <h3 class="rewards-editor-title">Customize Your Rewards Catalog</h3>
        <p class="rewards-editor-hint">Assign point costs to meaningful real-world rewards that motivate you.</p>
      </div>

      <div class="rewards-editor-list">
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

      <div class="rewards-editor-actions">
        <div class="rewards-editor-actions-left">
          <button type="button" class="btn btn--secondary btn--sm" @click="emit('add-draft-reward')">
            <Plus class="icon-xs" /> <span>Add Reward</span>
          </button>
          <button type="button" class="btn btn--secondary btn--sm" @click="emit('restore-default-rewards')">
            <RotateCcw class="icon-xs" /> <span>Restore Defaults</span>
          </button>
        </div>
        <div class="rewards-editor-actions-right">
          <button type="button" class="btn btn--secondary btn--sm" @click="emit('cancel-editing')">Cancel</button>
          <button type="button" class="btn btn--primary-action btn--sm" @click="emit('save-rewards')">
            <Check class="icon-xs" /> <span>Save Catalog</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Rewards Catalog (2-Column Responsive Grid) -->
    <div v-else class="rewards-catalog-section">
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
