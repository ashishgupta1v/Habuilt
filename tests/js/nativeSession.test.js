import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIVE_API_ORIGIN,
  apiUrl,
  clearMemorySession,
  configureNativeSessionForTests,
  getMemoryAccessToken,
  handoffRefreshToken,
  restoreBrowserSession,
} from '../../resources/js/lib/browserSession.js';

function memoryStore(initial = '') {
  let value = initial;
  return {
    async get() {
      return value;
    },
    async set(next) {
      value = String(next);
    },
    async remove() {
      value = '';
    },
    current() {
      return value;
    },
  };
}

function jsonResponse(body, ok = true) {
  return {
    ok,
    redirected: false,
    status: ok ? 200 : 401,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => body,
  };
}

test('android sign-in posts to habuilt.com and stores the rotated refresh token', async () => {
  const store = memoryStore();
  configureNativeSessionForTests({ native: true, store });
  const original = global.fetch;
  global.fetch = async (url, init) => {
    assert.equal(url, `${NATIVE_API_ORIGIN}/api/auth/session`);
    assert.equal(init.credentials, 'omit');
    assert.equal(init.headers['X-Habuilt-Client'], 'native');
    assert.equal(JSON.parse(init.body).refresh_token, 'original-refresh-token-value');
    return jsonResponse({
      access_token: 'access-token',
      refresh_token: 'rotated-refresh-token',
      expires_in: 3600,
      user: { id: 'usr_1', email: 'a@example.com' },
    });
  };

  try {
    const user = await handoffRefreshToken('original-refresh-token-value');
    assert.equal(user.id, 'usr_1');
    assert.equal(store.current(), 'rotated-refresh-token');
    assert.equal(getMemoryAccessToken(), 'access-token');
    assert.equal(apiUrl('/api/habits/check-ins'), `${NATIVE_API_ORIGIN}/api/habits/check-ins`);
  } finally {
    global.fetch = original;
    configureNativeSessionForTests(null);
    clearMemorySession();
  }
});

test('a cold start shares one refresh across overlapping restores', async () => {
  const store = memoryStore('stored-refresh-token');
  configureNativeSessionForTests({ native: true, store });
  let calls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const original = global.fetch;
  global.fetch = async () => {
    calls += 1;
    await gate;
    return jsonResponse({
      access_token: 'next-access',
      refresh_token: 'next-refresh-token',
      expires_in: 3600,
      user: { id: 'usr_1', email: 'a@example.com' },
    });
  };

  try {
    const first = restoreBrowserSession();
    const second = restoreBrowserSession();
    release();
    const [a, b] = await Promise.all([first, second]);
    assert.equal(a.id, 'usr_1');
    assert.equal(b.id, 'usr_1');
    assert.equal(calls, 1);
    assert.equal(store.current(), 'next-refresh-token');
  } finally {
    global.fetch = original;
    configureNativeSessionForTests(null);
    clearMemorySession();
  }
});

test('a failed android refresh clears the stored token and the access token', async () => {
  const store = memoryStore('stored-refresh-token');
  configureNativeSessionForTests({ native: true, store });
  const original = global.fetch;
  global.fetch = async () => jsonResponse({ error: 'The session could not be started.' }, false);

  try {
    const user = await restoreBrowserSession();
    assert.equal(user, null);
    assert.equal(store.current(), '');
    assert.equal(getMemoryAccessToken(), '');
  } finally {
    global.fetch = original;
    configureNativeSessionForTests(null);
    clearMemorySession();
  }
});

test('the website session stays on the same origin and does not ask for a native refresh token', async () => {
  configureNativeSessionForTests({ native: false });
  const original = global.fetch;
  global.fetch = async (url, init) => {
    assert.equal(url, '/api/auth/session');
    assert.equal(init.credentials, 'same-origin');
    assert.equal(init.headers['X-Habuilt-Client'], undefined);
    return jsonResponse({
      access_token: 'web-access',
      expires_in: 3600,
      user: { id: 'usr_web', email: 'web@example.com' },
    });
  };

  try {
    const user = await handoffRefreshToken('website-refresh-token');
    assert.equal(user.id, 'usr_web');
    assert.equal(apiUrl('/api/auth/session'), '/api/auth/session');
  } finally {
    global.fetch = original;
    configureNativeSessionForTests(null);
    clearMemorySession();
  }
});
