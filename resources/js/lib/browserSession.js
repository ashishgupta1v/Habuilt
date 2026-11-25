/**
 * Tab memory for the access token.
 * The website keeps the refresh token in an httpOnly cookie.
 * The bundled Android app cannot store that cookie, so it keeps the refresh
 * token in Capacitor Preferences and sends a Bearer token to habuilt.com.
 * This module never writes habuilt_cached_user or a Supabase auth token to localStorage.
 */

export const NATIVE_API_ORIGIN = 'https://habuilt.com';
const NATIVE_CLIENT_HEADER = 'X-Habuilt-Client';
const NATIVE_REFRESH_KEY = 'habuilt_refresh_token';

const memory = {
  accessToken: '',
  user: null,
  expiresAt: 0,
};

let refreshTimer = 0;
let rotatedRefresh = '';
let nativePlatformOverride = null;
let nativeStoreOverride = null;
let nativeRefreshInFlight = null;

export function isGuestMode() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('habuilt_guest_mode') === 'true';
  } catch {
    return false;
  }
}

export function getMemoryAccessToken() {
  return memory.accessToken || '';
}

export function getMemoryUser() {
  return memory.user;
}

export function purgeLegacyAuthStorage() {
  if (typeof localStorage === 'undefined') return;
  try {
    const drop = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === 'habuilt_cached_user' || (key.startsWith('sb-') && key.includes('auth-token'))) {
        drop.push(key);
      }
    }
    drop.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be blocked. Nothing here writes a token back.
  }
}

function remember(accessToken, user, expiresIn) {
  memory.accessToken = typeof accessToken === 'string' ? accessToken : '';
  memory.user = user && typeof user === 'object' && user.id
    ? {
        id: String(user.id),
        email: typeof user.email === 'string' ? user.email : '',
        user_metadata: user.user_metadata && typeof user.user_metadata === 'object' ? user.user_metadata : {},
      }
    : null;
  const seconds = Number(expiresIn);
  memory.expiresAt = Number.isFinite(seconds) && seconds > 0 ? Date.now() + (seconds * 1000) : 0;
  scheduleRefresh();
}

function scheduleRefresh() {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = 0;
  }
  if (!memory.accessToken || !memory.expiresAt || typeof window === 'undefined') return;
  const delay = Math.max(15000, memory.expiresAt - Date.now() - 60000);
  refreshTimer = window.setTimeout(() => {
    restoreBrowserSession().catch(() => {});
  }, delay);
}

export function clearMemorySession() {
  memory.accessToken = '';
  memory.user = null;
  memory.expiresAt = 0;
  rotatedRefresh = '';
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = 0;
  }
}

export function configureNativeSessionForTests(options = null) {
  nativePlatformOverride = options && Object.prototype.hasOwnProperty.call(options, 'native')
    ? Boolean(options.native)
    : null;
  nativeStoreOverride = options && options.store ? options.store : null;
  nativeRefreshInFlight = null;
  clearMemorySession();
}

export function isNativeApp() {
  if (nativePlatformOverride !== null) return nativePlatformOverride;
  try {
    const capacitor = typeof window !== 'undefined' ? window.Capacitor : null;
    return Boolean(capacitor && typeof capacitor.isNativePlatform === 'function' && capacitor.isNativePlatform());
  } catch {
    return false;
  }
}

export function apiUrl(path) {
  const endpoint = String(path || '');
  if (!isNativeApp() || /^https?:\/\//i.test(endpoint)) return endpoint;
  return `${NATIVE_API_ORIGIN}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

async function refreshStore() {
  if (nativeStoreOverride) return nativeStoreOverride;
  const { Preferences } = await import('@capacitor/preferences');
  return {
    async get() {
      const { value } = await Preferences.get({ key: NATIVE_REFRESH_KEY });
      return typeof value === 'string' ? value : '';
    },
    async set(value) {
      await Preferences.set({ key: NATIVE_REFRESH_KEY, value: String(value) });
    },
    async remove() {
      await Preferences.remove({ key: NATIVE_REFRESH_KEY });
    },
  };
}

export async function readSessionResponse(response) {
  if (!response || !response.ok || response.redirected) {
    rotatedRefresh = '';
    return null;
  }

  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType && !contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    return null;
  }

  if (!body || typeof body.access_token !== 'string' || !body.user || !body.user.id) {
    rotatedRefresh = '';
    return null;
  }
  rotatedRefresh = typeof body.refresh_token === 'string' ? body.refresh_token.trim() : '';
  remember(body.access_token, body.user, body.expires_in);
  return memory.user;
}

async function persistNativeRotation() {
  const store = await refreshStore();
  if (!rotatedRefresh) {
    await store.remove();
    clearMemorySession();
    return false;
  }
  const next = rotatedRefresh;
  rotatedRefresh = '';
  await store.set(next);
  return true;
}

async function postRefresh(refreshToken) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (isNativeApp()) headers[NATIVE_CLIENT_HEADER] = 'native';
  const response = await fetch(apiUrl('/api/auth/session'), {
    method: 'POST',
    credentials: isNativeApp() ? 'omit' : 'same-origin',
    headers,
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const user = await readSessionResponse(response);
  if (!user) return null;
  if (isNativeApp()) {
    const saved = await persistNativeRotation();
    if (!saved) return null;
  }
  return user;
}

async function restoreNativeSession() {
  const store = await refreshStore();
  const refresh = String(await store.get() || '').trim();
  if (!refresh) return null;
  const user = await postRefresh(refresh);
  if (!user) {
    await store.remove();
    clearMemorySession();
  }
  return user;
}

export async function handoffRefreshToken(refreshToken) {
  if (typeof refreshToken !== 'string' || refreshToken.trim() === '') return null;
  try {
    if (nativeRefreshInFlight) await nativeRefreshInFlight.catch(() => {});
    return await postRefresh(refreshToken.trim());
  } catch {
    return null;
  }
}

export async function restoreBrowserSession() {
  try {
    if (isNativeApp()) {
      if (nativeRefreshInFlight) return nativeRefreshInFlight;
      nativeRefreshInFlight = restoreNativeSession().finally(() => {
        nativeRefreshInFlight = null;
      });
      return nativeRefreshInFlight;
    }
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    return await readSessionResponse(response);
  } catch {
    return null;
  }
}

export async function clearBrowserSession() {
  let nativeRefresh = '';
  if (isNativeApp()) {
    try {
      const store = await refreshStore();
      nativeRefresh = String(await store.get() || '').trim();
      await store.remove();
    } catch {
      // Memory is still cleared below.
    }
  }
  clearMemorySession();
  try {
    const headers = { Accept: 'application/json' };
    const init = {
      method: 'DELETE',
      credentials: isNativeApp() ? 'omit' : 'same-origin',
      headers,
    };
    if (isNativeApp()) {
      headers[NATIVE_CLIENT_HEADER] = 'native';
      headers['Content-Type'] = 'application/json';
      if (nativeRefresh) init.body = JSON.stringify({ refresh_token: nativeRefresh });
    }
    await fetch(apiUrl('/api/auth/session'), init);
  } catch {
    // Memory is already clear. The cookie drop is best-effort.
  }
}
