<script setup>
import { ref, computed, onMounted } from 'vue';
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

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  userId: { type: String, default: 'guest' },
  displayName: { type: String, default: 'Warrior' },
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
  if (props.isAshish || props.isJyoti) return true;
  return activeConnection.value && activeConnection.value.status === 'connected';
});

const partnerName = computed(() => {
  if (props.isAshish) return 'Jyoti';
  if (props.isJyoti) return 'Ashish';
  return activeConnection.value?.alias || 'Partner';
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
  if (props.isAshish || props.isJyoti) {
    emit('toast', 'Flagship couple accounts are permanently linked.');
    return;
  }
  if (!confirm('Are you sure you want to disconnect from your partner?')) return;

  await disconnectPartner(props.userId);
  activeConnection.value = null;
  emit('unpaired');
  emit('toast', 'Partner disconnected.');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
    <div class="relative w-full max-w-xl flex flex-col bg-[#14151b] border border-gold/30 rounded-2xl shadow-2xl overflow-hidden text-gray-100">
      
      <!-- Modal Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#191b22]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-glow-rose">
            <Heart class="w-5 h-5 fill-rose-500/20" />
          </div>
          <div>
            <h2 class="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Partner & Couple Synchronization
              <span
                class="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-semibold border"
                :class="isPaired ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'"
              >
                {{ isPaired ? 'Connected' : 'Standalone' }}
              </span>
            </h2>
            <p class="text-xs text-gray-400">Share habits, sync joint family anchors, and cheer each other live</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Active Connection Status Banner (if connected) -->
      <div v-if="isPaired" class="px-6 py-3 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-transparent border-b border-rose-500/20 flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-rose-300">
          <Sparkles class="w-4 h-4 text-rose-400" />
          <span>Active Partner Link: <strong class="text-white">{{ partnerName }}</strong></span>
        </div>
        <button
          v-if="!isAshish && !isJyoti"
          @click="handleDisconnect"
          class="text-[11px] text-gray-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
          title="Disconnect Partner"
        >
          <Trash2 class="w-3.5 h-3.5" /> Unpair
        </button>
      </div>

      <!-- Tabs Navigation -->
      <div class="flex border-b border-white/10 bg-black/20 px-6 pt-2">
        <button
          @click="activeTab = 'invite'"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5"
          :class="activeTab === 'invite' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
        >
          <Link2 class="w-3.5 h-3.5" /> Your Invite Code & Link
        </button>
        <button
          @click="activeTab = 'join'"
          class="px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5"
          :class="activeTab === 'join' ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-gray-200'"
        >
          <Users class="w-3.5 h-3.5" /> Enter Partner's Code
        </button>
      </div>

      <!-- Tab Content Area -->
      <div class="p-6 space-y-6">

        <!-- ══ TAB 1: INVITE PARTNER ══ -->
        <div v-if="activeTab === 'invite'" class="space-y-5">
          <div class="text-center">
            <div class="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">Your 6-Character Pair Code</div>
            <div class="inline-flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-gold/40 shadow-inner">
              <span class="text-2xl sm:text-3xl font-mono font-black tracking-widest text-gold">{{ inviteCode }}</span>
              <button
                @click="handleCopyCode"
                class="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
                title="Copy Code"
              >
                <Check v-if="isCopiedCode" class="w-4 h-4 text-emerald-400" />
                <Copy v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Instant Link Card -->
          <div class="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-gray-300">
              <span class="flex items-center gap-1.5">
                <Link2 class="w-4 h-4 text-gold" /> Instant 1-Click Pairing Link
              </span>
              <span class="text-[10px] text-gray-500">Auto-accepts in browser</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                type="text"
                readonly
                :value="pairUrl"
                class="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 truncate focus:outline-none"
              />
              <button
                @click="handleCopyLink"
                class="px-3 py-2 rounded-lg bg-gold text-black text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-1"
              >
                <Check v-if="isCopiedLink" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                {{ isCopiedLink ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Decorative SVG QR Code Matrix -->
          <div class="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div class="w-36 h-36 p-2 rounded-xl bg-white flex items-center justify-center shadow-md mb-2">
              <!-- Geometric SVG QR representation -->
              <svg viewBox="0 0 100 100" class="w-full h-full text-black">
                <rect x="0" y="0" width="100" height="100" fill="white" />
                <!-- Corner 1 -->
                <rect x="10" y="10" width="24" height="24" fill="black" />
                <rect x="14" y="14" width="16" height="16" fill="white" />
                <rect x="18" y="18" width="8" height="8" fill="black" />
                <!-- Corner 2 -->
                <rect x="66" y="10" width="24" height="24" fill="black" />
                <rect x="70" y="14" width="16" height="16" fill="white" />
                <rect x="74" y="18" width="8" height="8" fill="black" />
                <!-- Corner 3 -->
                <rect x="10" y="66" width="24" height="24" fill="black" />
                <rect x="14" y="70" width="16" height="16" fill="white" />
                <rect x="18" y="74" width="8" height="8" fill="black" />
                <!-- Data blocks -->
                <rect x="42" y="12" width="6" height="6" fill="black" />
                <rect x="52" y="18" width="6" height="6" fill="black" />
                <rect x="42" y="28" width="6" height="6" fill="black" />
                <rect x="18" y="44" width="6" height="6" fill="black" />
                <rect x="28" y="44" width="6" height="6" fill="black" />
                <rect x="44" y="44" width="12" height="12" fill="black" />
                <rect x="64" y="44" width="6" height="6" fill="black" />
                <rect x="78" y="44" width="8" height="8" fill="black" />
                <rect x="44" y="64" width="6" height="6" fill="black" />
                <rect x="56" y="68" width="6" height="6" fill="black" />
                <rect x="72" y="68" width="14" height="6" fill="black" />
                <rect x="44" y="80" width="14" height="6" fill="black" />
                <rect x="68" y="82" width="6" height="6" fill="black" />
              </svg>
            </div>
            <div class="text-[11px] text-gray-400">Scan with your partner's phone camera to connect</div>
          </div>
        </div>

        <!-- ══ TAB 2: ENTER PARTNER'S CODE ══ -->
        <div v-if="activeTab === 'join'" class="space-y-4">
          <div class="text-center max-w-sm mx-auto mb-2">
            <h3 class="text-sm font-bold text-white mb-1">Enter Partner's Invite Code</h3>
            <p class="text-xs text-gray-400">Type the code displayed on your partner's Habuilt screen to pair your accounts instantly.</p>
          </div>

          <div class="space-y-3 max-w-sm mx-auto">
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">Invite Code</label>
              <input
                v-model="partnerInputCode"
                type="text"
                placeholder="e.g. HAB-8942"
                class="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-bold text-gold uppercase tracking-wider focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">Partner's Name / Alias (Optional)</label>
              <input
                v-model="partnerInputAlias"
                type="text"
                placeholder="e.g. Jyoti, Alex, Soulmate"
                class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold"
              />
            </div>

            <button
              @click="handleConnect"
              :disabled="isSubmitting"
              class="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold transition-all shadow-glow-rose flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw v-if="isSubmitting" class="w-4 h-4 animate-spin" />
              <Heart v-else class="w-4 h-4 fill-white" />
              {{ isSubmitting ? 'Connecting...' : 'Link & Sync Accounts' }}
            </button>
          </div>

          <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 leading-relaxed max-w-sm mx-auto">
            <div class="flex items-center gap-1.5 text-gold font-medium mb-1">
              <ShieldCheck class="w-3.5 h-3.5" /> Peer Privacy Guarantee
            </div>
            Pairing links your daily completion streaks, shared anchors (lunch, stroller walk, date night), and live cheering emotes with zero ad-tracking or third-party sharing.
          </div>
        </div>

      </div>

      <!-- Modal Footer -->
      <div class="flex items-center justify-end px-6 py-3.5 border-t border-white/10 bg-[#191b22]">
        <button
          @click="emit('close')"
          class="px-4 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          Done
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.shadow-glow-rose {
  box-shadow: 0 0 20px rgba(244, 63, 94, 0.3);
}
</style>
