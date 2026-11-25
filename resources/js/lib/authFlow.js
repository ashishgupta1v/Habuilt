/**
 * Supabase Auth on this project returns an authorization code.
 * The JS client defaults to the implicit flow, which never stores the PKCE
 * verifier, so the code cannot be exchanged. Habuilt must request PKCE.
 */
export const HABUILT_AUTH_FLOW = 'pkce';

const isVerifierKey = (key) => typeof key === 'string' && key.endsWith('-code-verifier');

/**
 * The code verifier has to survive the Google redirect.
 * The website keeps it in session storage for that tab.
 * Android keeps it in localStorage because the custom-tab return can
 * open a fresh WebView, and session storage would be gone.
 * Access tokens stay in memory.
 */
export function createTabAuthStorage(sessionStore = null, options = null) {
  const persistentVerifier = Boolean(options && options.persistentVerifier);
  const localStore = options && options.localStore ? options.localStore : null;
  const memoryStore = new Map();

  const session = () => {
    if (sessionStore) return sessionStore;
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  };

  const local = () => {
    if (localStore) return localStore;
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  };

  const verifierBackend = () => (persistentVerifier ? local() : session());

  const verifierStore = {
    get(key) {
      try {
        const store = verifierBackend();
        if (!store) return null;
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        const store = verifierBackend();
        if (!store) return;
        store.setItem(key, value);
      } catch {
        // The OAuth round trip cannot keep a verifier. Sign-in reports that failure.
      }
    },
    remove(key) {
      try {
        const store = verifierBackend();
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

export function authFormError(error) {
  const raw = typeof error === 'string' ? error : (typeof error?.message === 'string' ? error.message : '');
  const code = typeof error?.code === 'string' ? error.code : '';
  const msg = `${code} ${raw}`.toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Invalid email or password. If you signed up with Google, use Google.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Your email is not confirmed yet. Check your inbox, or continue with Google.';
  }
  if (msg.includes('email_address_invalid') || (msg.includes('email address') && msg.includes('invalid'))) {
    return 'That email address cannot be used. Try another.';
  }
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'The confirmation email could not be sent just now. Wait a little, then try again.';
  }
  if (msg.includes('weak_password') || msg.includes('at least 6') || msg.includes('password should be')) {
    return 'Use at least 6 characters.';
  }
  if (msg.includes('already registered') || msg.includes('user already exists')) {
    return 'An account with that email already exists. Sign in, or use Google.';
  }
  const message = raw.trim();
  return message || 'Authentication error.';
}

export function describeOAuthExchangeError(error, fallback = 'Google sign-in could not be completed. Try again.') {
  const raw = typeof error === 'string' ? error : (typeof error?.message === 'string' ? error.message : '');
  const message = raw.trim();
  if (!message) return fallback;
  if (/code verifier|both auth code and code verifier/i.test(message)) {
    return 'Google sign-in could not be completed. Start it again from this page.';
  }
  if (/unexpected token|valid json|syntaxerror|<!doctype/i.test(message)) {
    return 'Authentication service temporarily unavailable. Please try again.';
  }
  return message;
}
