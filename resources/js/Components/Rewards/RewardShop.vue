<script setup>
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
} from 'lucide-vue-next';

const props = defineProps({
  availableWallet: { type: Number, default: 0 },
  rewardsExpanded: { type: Boolean, default: false },
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
  'clear-progress',
]);
</script>

<template>
  <div class="rewards-tab-wrap">
    <!-- Compact Reward Bar -->
    <div class="reward-bar">
      <div class="reward-bar__wallet">
        <Gift class="icon-sm" />
        <span class="reward-bar__label">Reward Wallet</span>
        <strong class="reward-bar__balance mono-num">{{ availableWallet }} <small>pts</small></strong>
      </div>
      <div class="reward-bar__actions">
        <button
          class="btn btn--compact-redeem"
          :class="{ 'btn--compact-redeem--open': rewardsExpanded }"
          @click="emit('toggle-expand')"
        >
          <span>{{ rewardsExpanded ? 'Close' : 'Redeem' }}</span>
          <ChevronDown v-if="!rewardsExpanded" class="icon-xs" />
          <ChevronUp v-else class="icon-xs" />
        </button>
        <button class="btn btn--icon-only" @click="emit('start-editing')" title="Edit Rewards">
          <Edit3 class="icon-xs" />
        </button>
      </div>
    </div>

    <!-- Expandable Reward List -->
    <div v-show="rewardsExpanded" class="reward-bar__body">
      <div v-if="rewardsEditing" class="rewards-editor">
        <p class="habits-editor__hint">Edit reward type, title and redeem points. Save to apply for this month.</p>

        <div class="rewards-editor__list">
          <div v-for="(reward, index) in rewardsDraft" :key="`reward-draft-${index}`" class="rewards-editor__row">
            <input v-model="reward.type" type="text" maxlength="24" placeholder="Type (Daily/Weekly...)" class="rewards-editor__type">
            <input v-model="reward.item" type="text" maxlength="100" placeholder="Reward name" class="rewards-editor__item">
            <label class="rewards-editor__cost-label">
              <span>Pts</span>
              <input v-model.number="reward.cost" type="number" min="1" max="10000" class="rewards-editor__cost">
            </label>
            <button class="habits-editor__delete" @click="emit('remove-draft-reward', index)" title="Delete reward">
              <Trash2 class="icon-xs" />
            </button>
          </div>
        </div>

        <div class="rewards-editor__actions">
          <button class="btn btn--secondary btn--sm" @click="emit('add-draft-reward')">
            <Plus class="icon-xs" /> <span>Add Reward</span>
          </button>
          <button class="btn btn--secondary btn--sm" @click="emit('restore-default-rewards')">
            <RotateCcw class="icon-xs" /> <span>Restore Defaults</span>
          </button>
          <button class="btn btn--secondary btn--sm" @click="emit('cancel-editing')">Cancel</button>
          <button class="btn btn--primary-action btn--sm" @click="emit('save-rewards')">Save Rewards</button>
        </div>
      </div>

      <div v-else class="reward-bar__items">
        <div
          v-for="reward in activeRewards"
          :key="reward.id"
          class="reward-chip"
          :class="{
            'reward-chip--claimed': isClaimedThisMonth(reward.id),
            'reward-chip--affordable': canAffordReward(reward),
          }"
        >
          <div class="reward-chip__info">
            <span class="reward-chip__type">{{ reward.type }}</span>
            <strong class="reward-chip__name">{{ reward.item }}</strong>
          </div>
          <button
            class="btn btn--redeem"
            :disabled="isRedeeming || isClaimedThisMonth(reward.id) || !canAffordReward(reward)"
            @click="emit('redeem-reward', reward)"
          >
            <Check v-if="isClaimedThisMonth(reward.id)" class="icon-xs" />
            <span v-if="isClaimedThisMonth(reward.id)">Claimed</span>
            <span v-else>{{ reward.cost }} pts</span>
          </button>
        </div>
      </div>

      <!-- Compact Ledger -->
      <div v-if="rewardLedger.length > 0" class="reward-bar__ledger">
        <span class="reward-bar__ledger-title">Recent Redemptions</span>
        <div class="reward-bar__ledger-list">
          <div v-for="entry in rewardLedger.slice(0, 5)" :key="entry.id" class="reward-bar__ledger-item">
            <span class="reward-bar__ledger-name">{{ entry.item }}</span>
            <span class="reward-bar__ledger-date">{{ entry.claimed_at }}</span>
            <span class="reward-bar__ledger-cost mono-num">-{{ entry.cost }} pts</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
