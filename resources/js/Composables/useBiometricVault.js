import { ref } from 'vue';

/**
 * Account access is the Supabase session and the device lock.
 * This composable stays so older imports keep rendering, and it never unlocks a section.
 */
const isVaultConfigured = ref(false);

export function useBiometricVault() {
  const isSectionLocked = () => false;

  return {
    isSupported: ref(false),
    isPlatformAvailable: ref(false),
    isVaultConfigured,
    isVaultLocked: ref(false),
    protectedSections: ref({}),
    isAuthenticating: ref(false),
    authError: ref(''),
    lastUnlockedAt: ref(null),
    registeredCredentials: ref([]),
    isSectionLocked,
    registerBiometricDevice: async () => ({ success: false }),
    deleteCredential: async () => {},
    refreshRegisteredCredentials: async () => [],
    authenticateWithBiometrics: async () => ({ success: false }),
    authenticateWithPin: async () => false,
    lockVault: () => {},
    unlockVault: () => {},
    configureVault: async () => {},
    updatePin: async () => {},
    toggleSectionProtection: () => {},
  };
}

export { isVaultConfigured };
