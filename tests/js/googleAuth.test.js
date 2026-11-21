import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  HABUILT_AUTH_FLOW,
  createTabAuthStorage,
  describeOAuthExchangeError,
} from '../../resources/js/lib/authFlow.js';
import {
  readSessionResponse,
  clearMemorySession,
} from '../../resources/js/lib/browserSession.js';

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

test('HTML responses or redirects to readSessionResponse fail safely without throwing', async () => {
  clearMemorySession();

  // Redirected response
  const redirectedResponse = {
    ok: true,
    redirected: true,
    headers: new Headers({ 'content-type': 'text/html' }),
    json: async () => { throw new SyntaxError("Unexpected token '<'"); },
  };
  const res1 = await readSessionResponse(redirectedResponse);
  assert.equal(res1, null);

  // HTML content-type response
  const htmlResponse = {
    ok: true,
    redirected: false,
    headers: new Headers({ 'content-type': 'text/html; charset=UTF-8' }),
    json: async () => { throw new SyntaxError("Unexpected token '<'"); },
  };
  const res2 = await readSessionResponse(htmlResponse);
  assert.equal(res2, null);

  // Malformed JSON that throws
  const malformedResponse = {
    ok: true,
    redirected: false,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => { throw new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"); },
  };
  const res3 = await readSessionResponse(malformedResponse);
  assert.equal(res3, null);

  // Missing or non-ok response
  assert.equal(await readSessionResponse(null), null);
  assert.equal(await readSessionResponse({ ok: false }), null);

  // Valid response succeeds
  const validResponse = {
    ok: true,
    redirected: false,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({
      access_token: 'fake-access-token',
      expires_in: 3600,
      user: { id: 'usr_123', email: 'test@example.com' },
    }),
  };
  const user = await readSessionResponse(validResponse);
  assert.deepEqual(user, {
    id: 'usr_123',
    email: 'test@example.com',
    user_metadata: {},
  });

  clearMemorySession();
});

test('raw JSON parse and HTML errors are sanitized with user-friendly copy', () => {
  assert.equal(
    describeOAuthExchangeError(new SyntaxError('Unexpected token \'<\', "<!DOCTYPE "... is not valid JSON')),
    'Authentication service temporarily unavailable. Please try again.',
  );
  assert.equal(
    describeOAuthExchangeError({ message: 'SyntaxError: Unexpected end of JSON input' }),
    'Authentication service temporarily unavailable. Please try again.',
  );
  assert.equal(
    describeOAuthExchangeError('Unexpected token < in JSON at position 0'),
    'Authentication service temporarily unavailable. Please try again.',
  );
  assert.equal(
    describeOAuthExchangeError('<!DOCTYPE html><html><body>Error</body></html>'),
    'Authentication service temporarily unavailable. Please try again.',
  );
});
