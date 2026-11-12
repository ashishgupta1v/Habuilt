/**
 * Supabase Auth on this project returns an authorization code.
 * The JS client defaults to the implicit flow, which never stores the PKCE
 * verifier, so the code cannot be exchanged. Habuilt must request PKCE.
 */
export const HABUILT_AUTH_FLOW = 'pkce';

const isVerifierKey = (key) => typeof key === 'string' && key.endsWith('-code-verifier');

/**
 * The code verifier has to survive the Google redirect. Session storage does.
 * Access tokens stay in memory for this tab.
 */
export function createTabAuthStorage(sessionStore = null) {
  const memoryStore = new Map();

  const session = () => {
    if (sessionStore) return sessionStore;
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  };

  const verifierStore = {
    get(key) {
      try {
        const store = session();
        if (!store) return null;
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        const store = session();
        if (!store) return;
        store.setItem(key, value);
      } catch {
        // The OAuth round trip cannot keep a verifier. Sign-in reports that failure.
      }
    },
    remove(key) {
      try {
        const store = session();
        if (!store) return;
        store.removeItem(key);
      } catch {
        // Ignore.
      }
    },
  };

  return {
    getItem(key) {
      if (isVerifierKey(key)) return verifierStore.get(key);
      return memoryStore.has(key) ? memoryStore.get(key) : null;
    },
    setItem(key, value) {
      if (isVerifierKey(key)) {
        verifierStore.set(key, String(value));
        return;
      }
      memoryStore.set(key, String(value));
    },
    removeItem(key) {
      if (isVerifierKey(key)) {
        verifierStore.remove(key);
        return;
      }
      memoryStore.delete(key);
    },
  };
}

export function describeOAuthExchangeError(error, fallback = 'Google sign-in could not be completed. Try again.') {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (!message) return fallback;
  if (/code verifier|both auth code and code verifier/i.test(message)) {
    return 'Google sign-in could not be completed. Start it again from this page.';
  }
  return message;
}
