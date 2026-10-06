<script setup>
import { ref } from 'vue';
import {
  ShieldAlert,
  Fingerprint,
  KeyRound,
  Lock,
  Unlock,
  Sparkles,
  AlertCircle,
} from 'lucide-vue-next';
import { useBiometricVault } from '@/Composables/useBiometricVault';

const props = defineProps({
  sectionTitle: { type: String, default: 'Sensitive Data' },
  sectionDescription: { type: String, default: 'This section is sealed with hardware biometric protection.' },
});

const emit = defineEmits(['unlocked', 'toast']);

const {
  isSupported,
  isPlatformAvailable,
  isAuthenticating,
  authError,
  registeredCredentials,
  registerBiometricDevice,
  authenticateWithBiometrics,
  authenticateWithPin,
} = useBiometricVault();

const showPinInput = ref(false);
const pinDigits = ref('');
const isSubmittingPin = ref(false);

const handleBiometricAuth = async () => {
  const result = await authenticateWithBiometrics();
  if (result.success) {
    emit('toast', '✓ Biometric identity verified. Vault unsealed.');
    emit('unlocked');
  } else if (result.canFallbackToPin) {
    showPinInput.value = true;
  }
};

const handleEnrollDevice = async () => {
  const res = await registerBiometricDevice({
    deviceName: typeof navigator !== 'undefined' && navigator.userAgent?.includes('Android') ? 'Android Mobile' : 'Primary Workstation',
  });
  if (res.success) {
    emit('toast', '✓ Hardware passkey enrolled! Vault unsealed.');
    emit('unlocked');
  }
};

const handlePinSubmit = async () => {
  if (!pinDigits.value || pinDigits.value.length < 4) {
    emit('toast', 'Please enter a 4-digit PIN.');
    return;
  }
  isSubmittingPin.value = true;
  const ok = await authenticateWithPin(pinDigits.value);
  isSubmittingPin.value = false;
  if (ok) {
    emit('toast', '✓ Sovereign PIN verified. Vault unsealed.');
    emit('unlocked');
  } else {
    emit('toast', '⚠️ Incorrect PIN. Try default (0000).');
  }
};
</script>

<template>
  <div class="biometric-vault-card">
    <div class="biometric-vault-halo"></div>

    <div class="biometric-vault-icon-wrap">
      <Fingerprint class="biometric-vault-icon" />
      <span class="biometric-vault-badge"><Lock class="icon-2xs" /></span>
    </div>

    <h3 class="biometric-vault-title">{{ sectionTitle }} Sealed</h3>
    <p class="biometric-vault-desc">
      {{ sectionDescription }} Verify your identity via Touch ID, Face ID, or Windows Hello to access.
    </p>

    <div v-if="authError" class="biometric-vault-error">
      <AlertCircle class="icon-xs" />
      <span>{{ authError }}</span>
    </div>

    <div class="biometric-vault-actions">
      <button
        type="button"
        class="btn btn--primary biometric-auth-btn"
        :disabled="isAuthenticating"
        @click="handleBiometricAuth"
      >
        <Fingerprint class="icon-sm" />
        <span>{{ isAuthenticating ? 'Scanning...' : 'Authenticate with Biometrics' }}</span>
      </button>

      <button
        type="button"
        class="btn btn--secondary btn--sm biometric-pin-toggle"
        @click="showPinInput = !showPinInput"
      >
        <KeyRound class="icon-xs" />
        <span>{{ showPinInput ? 'Hide PIN Entry' : 'Unlock with PIN (Default: 0000)' }}</span>
      </button>

      <button
        type="button"
        class="btn btn--ghost btn--xs biometric-enroll-btn flex items-center gap-1 text-slate-400 hover:text-amber-400"
        :disabled="isAuthenticating"
        @click="handleEnrollDevice"
      >
        <Sparkles class="icon-2xs text-amber-400" />
        <span>{{ registeredCredentials.length > 0 ? `Enroll Another Device (${registeredCredentials.length} active)` : 'Enroll Device Hardware Passkey' }}</span>
      </button>
    </div>

    <!-- PIN Fallback Drawer -->
    <div v-if="showPinInput" class="biometric-pin-drawer">
      <label class="biometric-pin-label">Sovereign Master PIN:</label>
      <div class="biometric-pin-row">
        <input
          v-model="pinDigits"
          type="password"
          maxlength="6"
          placeholder="••••"
          class="biometric-pin-input"
          @keyup.enter="handlePinSubmit"
        />
        <button
          type="button"
          class="btn btn--secondary biometric-pin-submit"
          :disabled="isSubmittingPin"
          @click="handlePinSubmit"
        >
          <Unlock class="icon-xs" /> Verify
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.biometric-vault-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(14, 20, 36, 0.95) 0%, rgba(7, 10, 17, 0.98) 100%);
  border: 1px solid rgba(139, 92, 246, 0.25);
  box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.65), 0 0 24px rgba(139, 92, 246, 0.08);
  padding: 36px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 12px 0;
}

.biometric-vault-halo {
  position: absolute;
  top: -40px;
  width: 220px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.biometric-vault-icon-wrap {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 20px;
  background: rgba(139, 92, 246, 0.12);
  border: 1px solid rgba(139, 92, 246, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a78bfa;
  margin-bottom: 16px;
  box-shadow: 0 0 24px rgba(139, 92, 246, 0.2);
}

.biometric-vault-icon {
  width: 36px;
  height: 36px;
}

.biometric-vault-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #7c3aed;
  color: #ffffff;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #070a11;
}

.biometric-vault-title {
  font-size: 1.15rem;
  font-weight: 750;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 0.02em;
}

.biometric-vault-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  max-width: 440px;
  margin: 0 0 20px 0;
  line-height: 1.5;
}

.biometric-vault-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f87171;
  font-size: 0.8rem;
  background: rgba(239, 68, 68, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.biometric-vault-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
}

.biometric-auth-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
  border-color: #8b5cf6 !important;
  color: #ffffff !important;
  font-weight: 700;
  padding: 12px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.35);
  transition: all 0.2s ease;
}

.biometric-auth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(124, 58, 237, 0.45);
}

.biometric-pin-toggle {
  color: #94a3b8;
}

.biometric-pin-drawer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  width: 100%;
  max-width: 320px;
}

.biometric-pin-label {
  display: block;
  font-size: 0.75rem;
  color: #94a3b8;
  margin-bottom: 6px;
  text-align: left;
}

.biometric-pin-row {
  display: flex;
  gap: 8px;
}

.biometric-pin-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  color: #ffffff;
  padding: 8px 12px;
  font-size: 1.1rem;
  letter-spacing: 0.3em;
  text-align: center;
}

.biometric-pin-input:focus {
  outline: none;
  border-color: #a78bfa;
}

.biometric-pin-submit {
  flex-shrink: 0;
}
</style>
