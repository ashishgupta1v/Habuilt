import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  HABUILT_AUTH_FLOW,
  createTabAuthStorage,
  describeOAuthExchangeError,
} from '../../resources/js/lib/authFlow.js';

function memorySession() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    keys() {
      return [...data.keys()];
    },
  };
}

test('Google sign-in uses PKCE because the auth server returns a code', () => {
  assert.equal(HABUILT_AUTH_FLOW, 'pkce');
  const source = fs.readFileSync('resources/js/lib/supabase.js', 'utf8');
  assert.match(source, /flowType:\s*HABUILT_AUTH_FLOW/);
  assert.doesNotMatch(source, /flowType:\s*['"]implicit['"]/);
});

test('the code verifier survives a redirect and the access token stays in memory', () => {
  const session = memorySession();
  const storage = createTabAuthStorage(session);
  storage.setItem('sb-test-auth-token', 'access-token');
  storage.setItem('sb-test-auth-token-code-verifier', 'verifier-value');

  assert.equal(session.getItem('sb-test-auth-token'), null);
  assert.equal(session.getItem('sb-test-auth-token-code-verifier'), 'verifier-value');
  assert.equal(storage.getItem('sb-test-auth-token'), 'access-token');
  assert.equal(storage.getItem('sb-test-auth-token-code-verifier'), 'verifier-value');
});

test('PKCE Google URL carries a code challenge and the implicit default does not', async () => {
  const session = memorySession();
  const storage = createTabAuthStorage(session);
  const redirectTo = 'https://habuilt.com/auth/callback';
  const shared = {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: HABUILT_AUTH_FLOW,
    },
  };
  const pkce = createClient('https://example.supabase.co', 'public-anon-key', shared);
  const { data, error } = await pkce.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  assert.equal(error, null);
  const url = new URL(data.url);
  assert.equal(url.searchParams.get('provider'), 'google');
  assert.equal(url.searchParams.get('redirect_to'), redirectTo);
  assert.ok(url.searchParams.get('code_challenge'));
  assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  assert.equal(session.keys().filter((key) => key.endsWith('-code-verifier')).length, 1);

  const implicit = createClient('https://example.supabase.co', 'public-anon-key', {
    auth: {
      storage: createTabAuthStorage(memorySession()),
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'implicit',
    },
  });
  const implicitResult = await implicit.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  assert.equal(implicitResult.error, null);
  const implicitUrl = new URL(implicitResult.data.url);
  assert.equal(implicitUrl.searchParams.get('code_challenge'), null);
});

test('a missing verifier is explained without the raw auth error', () => {
  assert.equal(
    describeOAuthExchangeError({ message: 'both auth code and code verifier should be non-empty' }),
    'Google sign-in could not be completed. Start it again from this page.',
  );
  assert.equal(
    describeOAuthExchangeError({ message: 'PKCE code verifier not found in storage' }),
    'Google sign-in could not be completed. Start it again from this page.',
  );
  assert.equal(
    describeOAuthExchangeError(null, 'Sign-in did not start a session.'),
    'Sign-in did not start a session.',
  );
});
