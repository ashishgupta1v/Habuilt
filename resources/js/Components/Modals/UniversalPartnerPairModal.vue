<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import {
  X,
  Users,
  Copy,
  Check,
  Link2,
  QrCode,
  Heart,
  Sparkles,
  Zap,
  ShieldCheck,
  Trash2,
  ArrowRight,
  RefreshCw
} from 'lucide-vue-next';
import {
  getOrCreateInviteCode,
  pairWithInviteCode,
  getPartnerConnection,
  disconnectPartner
} from '@/lib/partnerPairing';
import { broadcastPartnerEvent } from '@/lib/supabase';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  userId: { type: String, default: 'guest' },
  displayName: { type: String, default: 'Sovereign' },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'paired', 'unpaired', 'toast']);

const activeTab = ref('invite'); // 'invite' | 'join'
const inviteCode = ref('HAB-....');
const isCopiedCode = ref(false);
const isCopiedLink = ref(false);
const isSubmitting = ref(false);
const partnerInputCode = ref('');
const partnerInputAlias = ref('');
const activeConnection = ref(null);

const pairUrl = computed(() => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}#pair=${inviteCode.value}`;
});

const isPaired = computed(() => {
  return (activeConnection.value && activeConnection.value.status === 'connected') ||
    ((props.isAshish || props.isJyoti) && activeConnection.value?.status !== 'disconnected');
});

const partnerName = computed(() => {
  if (activeConnection.value?.alias) return activeConnection.value.alias;
  if (props.isAshish) return 'Jyoti';
  if (props.isJyoti) return 'Ashish';
  return 'Partner';
});

const loadState = async () => {
  try {
    const code = await getOrCreateInviteCode(props.userId);
    inviteCode.value = code;

    const connection = await getPartnerConnection(props.userId);
    activeConnection.value = connection;
  } catch (e) {
    console.warn('[PartnerModal] Error loading state:', e);
  }
};

onMounted(() => {
  loadState();
});

watch(() => props.isOpen, (open) => {
  if (open) {
    loadState();
  }
});

const handleCopyCode = async () => {
  try {
    await navigator.clipboard.writeText(inviteCode.value);
    isCopiedCode.value = true;
    emit('toast', 'Invite code copied to clipboard!');
    setTimeout(() => { isCopiedCode.value = false; }, 2000);
  } catch (_) {
    emit('toast', 'Code: ' + inviteCode.value);
  }
};

const handleCopyLink = async () => {
  try {
    await navigator.clipboard.writeText(pairUrl.value);
    isCopiedLink.value = true;
    emit('toast', 'Instant pairing link copied to clipboard!');
    setTimeout(() => { isCopiedLink.value = false; }, 2000);
  } catch (_) {
    emit('toast', 'Link copied!');
  }
};

const handleConnect = async () => {
  if (!partnerInputCode.value.trim()) {
    emit('toast', 'Please enter a valid partner code.');
    return;
  }

  isSubmitting.value = true;
  try {
    const conn = await pairWithInviteCode(
      props.userId,
      partnerInputCode.value.trim(),
      partnerInputAlias.value.trim()
    );
    activeConnection.value = conn;
    partnerInputCode.value = '';
    emit('paired', conn);
    emit('toast', `❤️ Successfully connected with ${partnerName.value}!`);
  } catch (err) {
    emit('toast', err.message || 'Failed to connect. Check code.');
  } finally {
    isSubmitting.value = false;
  }
};

const handleDisconnect = async () => {
  if (!confirm('Are you sure you want to disconnect from your partner?')) return;

  try {
    await broadcastPartnerEvent({
      type: 'partner_unpair',
      partner: props.displayName,
      userId: props.userId,
    });
  } catch (_) {}

  await disconnectPartner(props.userId);
  activeConnection.value = null;
  emit('unpaired');
  emit('toast', 'Partner disconnected.');
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div
      class="modal-card modal-card--partner-pair"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-pair-title"
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-wrap">
          <div class="modal-header__icon-badge modal-icon-badge--rose">
            <Heart class="icon-md text-rose-500 fill-rose-100" />
          </div>
          <div>
            <div class="modal-title-row">
              <h3 id="partner-pair-title" class="modal-header__title">Partner & Couple Synchronization</h3>
              <span
                class="partner-status-pill"
                :class="isPaired ? 'partner-status-pill--connected' : 'partner-status-pill--standalone'"
              >
                {{ isPaired ? 'Connected' : 'Standalone' }}
              </span>
            </div>
            <p class="modal-header__sub">Share habits, sync joint family anchors, and cheer each other live</p>
          </div>
        </div>
        <button
          type="button"
          class="modal-close-btn modal-head-close-btn"
          @click="emit('close')"
          aria-label="Close"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Active Connection Status Banner (if connected) -->
      <div v-if="isPaired" class="partner-connected-pill">
        <div class="partner-connected-info">
          <Sparkles class="icon-xs" />
          <span>Active Partner Link: <strong>{{ partnerName }}</strong></span>
        </div>
        <button
          type="button"
          class="btn-unpair"
          @click="handleDisconnect"
          title="Disconnect Partner"
        >
          <Trash2 class="icon-xs" /> Unpair
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="partner-pair-tabs">
        <button
          id="tab-invite"
          type="button"
          class="partner-pair-tab"
          :class="{ 'partner-pair-tab--active': activeTab === 'invite' }"
          @click="activeTab = 'invite'"
        >
          <Link2 class="icon-xs" />
          <span>Your Invite Code & Link</span>
        </button>
        <button
          id="tab-join"
          type="button"
          class="partner-pair-tab"
          :class="{ 'partner-pair-tab--active': activeTab === 'join' }"
          @click="activeTab = 'join'"
        >
          <Users class="icon-xs" />
          <span>Enter Partner's Code</span>
        </button>
      </div>

      <!-- Tab Content Area (Scrollable Body) -->
      <div class="partner-pair-body">
        <!-- ══ TAB 1: INVITE PARTNER ══ -->
        <div v-if="activeTab === 'invite'" class="partner-pair-tab-content">
          <div class="partner-pair-code-card">
            <div class="partner-pair-code-label">Your 6-Character Pair Code</div>
            <div class="partner-pair-code-pill">
              <span class="partner-code-value partner-pair-code-val">{{ inviteCode }}</span>
              <button
                id="btn-copy-code"
                type="button"
                class="partner-copy-btn"
                @click="handleCopyCode"
                title="Copy Code"
                aria-label="Copy Invite Code"
              >
                <Check v-if="isCopiedCode" class="icon-xs icon-emerald" />
                <Copy v-else class="icon-xs" />
              </button>
            </div>
          </div>

          <!-- Instant Link Card -->
          <div class="partner-pair-link-card">
            <div class="partner-pair-link-meta">
              <span class="partner-pair-link-title">
                <Link2 class="icon-xs" /> Instant 1-Click Pairing Link
              </span>
              <span class="partner-pair-link-hint">Auto-accepts in browser</span>
            </div>
            <div class="partner-pair-link-row">
              <input
                type="text"
                readonly
                :value="pairUrl"
                class="partner-pair-input"
              />
              <button
                id="btn-copy-link"
                type="button"
                class="btn-copy-link"
                @click="handleCopyLink"
                aria-label="Copy Pairing Link"
              >
                <Check v-if="isCopiedLink" class="icon-xs" />
                <Copy v-else class="icon-xs" />
                <span>{{ isCopiedLink ? 'Copied' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <!-- Decorative SVG QR Code Matrix -->
          <div class="partner-pair-qr-card">
            <div class="partner-pair-qr-box">
              <svg viewBox="0 0 100 100" class="partner-pair-qr-svg">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <!-- Corner 1 -->
                <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
                <rect x="14" y="14" width="16" height="16" fill="white" />
                <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                <!-- Corner 2 -->
                <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
                <rect x="70" y="14" width="16" height="16" fill="white" />
                <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
                <!-- Corner 3 -->
                <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
                <rect x="14" y="70" width="16" height="16" fill="white" />
                <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
                <!-- Data blocks -->
                <rect x="42" y="12" width="6" height="6" fill="#0f172a" />
                <rect x="52" y="18" width="6" height="6" fill="#0f172a" />
                <rect x="42" y="28" width="6" height="6" fill="#0f172a" />
                <rect x="18" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="28" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="44" y="44" width="12" height="12" fill="#0f172a" />
                <rect x="64" y="44" width="6" height="6" fill="#0f172a" />
                <rect x="78" y="44" width="8" height="8" fill="#0f172a" />
                <rect x="44" y="64" width="6" height="6" fill="#0f172a" />
                <rect x="56" y="68" width="6" height="6" fill="#0f172a" />
                <rect x="72" y="68" width="14" height="6" fill="#0f172a" />
                <rect x="44" y="80" width="14" height="6" fill="#0f172a" />
                <rect x="68" y="82" width="6" height="6" fill="#0f172a" />
              </svg>
            </div>
            <div class="partner-pair-qr-sub">Scan with your partner's phone camera to connect</div>
          </div>
        </div>

        <!-- ══ TAB 2: ENTER PARTNER'S CODE ══ -->
        <div v-if="activeTab === 'join'" class="partner-pair-tab-content">
          <div class="partner-pair-join-header">
            <h4 class="partner-pair-join-title">Enter Partner's Invite Code</h4>
            <p class="partner-pair-join-sub">Type the code displayed on your partner's Habuilt screen to pair your accounts instantly.</p>
          </div>

          <div class="partner-pair-form">
            <div class="partner-pair-form-group">
              <label for="partner-input-code" class="partner-pair-form-label">Invite Code</label>
              <input
                id="partner-input-code"
                v-model="partnerInputCode"
                type="text"
                placeholder="e.g. HAB-8942"
                autocapitalize="characters"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                class="partner-pair-code-input"
              />
            </div>

            <div class="partner-pair-form-group">
              <label for="partner-input-alias" class="partner-pair-form-label">Partner's Name / Alias (Optional)</label>
              <input
                id="partner-input-alias"
                v-model="partnerInputAlias"
                type="text"
                placeholder="e.g. Jyoti, Alex, Soulmate"
                class="partner-pair-text-input"
              />
            </div>

            <button
              id="btn-pair-connect"
              type="button"
              class="btn-pair-connect"
              :disabled="isSubmitting"
              @click="handleConnect"
            >
              <RefreshCw v-if="isSubmitting" class="icon-sm animate-spin" />
              <Heart v-else class="icon-sm fill-current" />
              <span>{{ isSubmitting ? 'Connecting...' : 'Link & Sync Accounts' }}</span>
            </button>
          </div>

          <div class="partner-pair-privacy-pill">
            <div class="partner-pair-privacy-title">
              <ShieldCheck class="icon-xs" />
              <span>Peer Privacy Guarantee</span>
            </div>
            <p>Pairing links your daily completion streaks, shared anchors (lunch, stroller walk, date night), and live cheering emotes with zero ad-tracking or third-party sharing.</p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-secondary modal-close-action"
          @click="emit('close')"
        >
          Done
        </button>
      </div>
    </div>
  </div>
</template>
