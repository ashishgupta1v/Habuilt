/**
 * Tab memory for the access token. The refresh token lives in an httpOnly cookie.
 * This module never writes habuilt_cached_user or a Supabase auth token to localStorage.
 */

const memory = {
  accessToken: '',
  user: null,
  expiresAt: 0,
};

let refreshTimer = 0;

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
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = 0;
  }
}

async function readSessionResponse(response) {
  if (!response || !response.ok) return null;
  const body = await response.json();
  if (!body || typeof body.access_token !== 'string' || !body.user || !body.user.id) return null;
  remember(body.access_token, body.user, body.expires_in);
  return memory.user;
}

export async function handoffRefreshToken(refreshToken) {
  if (isGuestMode()) return null;
  if (typeof refreshToken !== 'string' || refreshToken.trim() === '') return null;
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  return readSessionResponse(response);
}

export async function restoreBrowserSession() {
  if (isGuestMode()) return null;
  const response = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  return readSessionResponse(response);
}

export async function clearBrowserSession() {
  clearMemorySession();
  try {
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch {
    // Memory is already clear. The cookie drop is best-effort.
  }
}
