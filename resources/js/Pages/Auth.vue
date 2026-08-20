<script setup>
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Mail, Lock, ArrowRight, ShieldCheck, Target, KeyRound, ArrowLeft } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const emit = defineEmits(['guest-login']);

const email = ref('');
const password = ref('');
const newPassword = ref('');
const mode = ref('login'); // 'login' | 'signup' | 'forgot' | 'reset'
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

// Check if user reached here via a password reset recovery link
onMounted(() => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      mode.value = 'reset';
    }

    if (Capacitor.isNativePlatform()) {
      try {
        App.addListener('backButton', () => {
          if (mode.value !== 'login') {
            mode.value = 'login';
            error.value = '';
            successMessage.value = '';
          } else {
            App.exitApp();
          }
        });
      } catch (e) {
        console.warn('Auth back button note:', e);
      }
    }
  }
});

const handleAuth = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    if (mode.value === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
      successMessage.value = 'Account created successfully! Check your email or log in.';
      mode.value = 'login';
    } else if (mode.value === 'forgot') {
      const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
      const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;

      const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: redirectUrl,
      });
      if (err) throw err;
      successMessage.value = `Password reset link sent to ${email.value}! Please check your email inbox.`;
    } else if (mode.value === 'reset') {
      const { error: err } = await supabase.auth.updateUser({
        password: newPassword.value,
      });
      if (err) throw err;
      successMessage.value = 'Password updated successfully! You can now log in with your new password.';
      mode.value = 'login';
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during authentication.';
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  error.value = '';
  loading.value = true;
  try {
    const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
    const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;
    
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isCapacitor,
      },
    });
    if (err) throw err;

    if (isCapacitor && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleGuestAccess = () => {
  const guestUser = {
    id: 'guest',
    email: 'guest@habuilt.com',
    user_metadata: { full_name: 'Habuilt Champion' }
  };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(guestUser));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: guestUser }));
  emit('guest-login', guestUser);
};
</script>

<template>
  <div class="auth-layout">
    
    <!-- Left Promotional Panel (Hidden on Mobile) -->
    <div class="auth-panel-premium">
      <!-- Decorative Background Shapes -->
      <div class="auth-bg-blob auth-bg-blob--primary"></div>
      <div class="auth-bg-blob auth-bg-blob--secondary"></div>
      <div class="auth-bg-blob auth-bg-blob--tertiary"></div>

      <div class="auth-panel__content-wrapper">
        <div class="auth-panel__icon-container">
          <HabuiltLogo size="lg" animated />
        </div>
        <h1 class="auth-panel__title">
          Build habits that <span class="text-gradient">actually stick.</span>
        </h1>
        <p class="auth-panel__description">
          Join high-performers transforming their daily routines. Track your tasks, earn points, and unlock milestones.
        </p>

        <div class="auth-panel__feature-list">
          <div class="feature-chip">
            <Target class="feature-chip__icon feature-chip__icon--fuchsia" />
            <span class="feature-chip__text">Achieve milestone goals efficiently</span>
          </div>
          <div class="feature-chip">
            <ShieldCheck class="feature-chip__icon feature-chip__icon--emerald" />
            <span class="feature-chip__text">Secure, persistent progression</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Authentication Panel -->
    <div class="auth-panel-form">
      <div class="auth-form-container">
        
        <!-- Mobile Logo Fallback -->
        <div class="auth-mobile-logo">
          <HabuiltLogo size="md" :with-text="true" />
        </div>

        <div class="auth-header">
          <h2 class="auth-header__title">
            <template v-if="mode === 'login'">Welcome back</template>
            <template v-else-if="mode === 'signup'">Create your account</template>
            <template v-else-if="mode === 'forgot'">Reset your password</template>
            <template v-else-if="mode === 'reset'">Set new password</template>
          </h2>
          <p class="auth-header__subtitle">
            <template v-if="mode === 'login'">Enter your details to access your dashboard.</template>
            <template v-else-if="mode === 'signup'">Start your journey to better habits today.</template>
            <template v-else-if="mode === 'forgot'">Enter your email and we'll send you a password recovery link.</template>
            <template v-else-if="mode === 'reset'">Enter a secure new password for your account.</template>
          </p>
        </div>

        <!-- Google OAuth Button (Only on login / signup modes) -->
        <template v-if="mode === 'login' || mode === 'signup'">
          <button 
            @click="handleGoogleSignIn"
            type="button" 
            class="btn-oauth"
          >
            <svg class="icon-oauth" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <!-- Divider -->
          <div class="auth-divider">
            <div class="auth-divider__line"></div>
            <div class="auth-divider__text-wrapper">
              <span class="auth-divider__text">Or continue with email</span>
            </div>
          </div>
        </template>

        <form @submit.prevent="handleAuth" class="auth-form">
          <!-- Success Message -->
          <div v-if="successMessage" class="auth-alert auth-alert--success">
            <ShieldCheck class="auth-alert__icon" />
            {{ successMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="error" class="auth-alert auth-alert--error">
            <svg class="auth-alert__icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>

          <!-- Email Field (For Login, Signup, Forgot) -->
          <div v-if="mode !== 'reset'" class="auth-input-group">
            <label for="email" class="auth-label">Email address</label>
            <div class="auth-input-wrapper">
              <div class="auth-input-icon">
                <Mail class="icon-muted" />
              </div>
              <input 
                v-model="email" 
                id="email" 
                type="email" 
                required 
                placeholder="you@example.com"
                class="auth-input" 
              />
            </div>
          </div>

          <!-- Password Field (For Login, Signup) -->
          <div v-if="mode === 'login' || mode === 'signup'" class="auth-input-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label for="password" class="auth-label" style="margin-bottom: 0;">Password</label>
              <button 
                v-if="mode === 'login'" 
                type="button" 
                @click="mode = 'forgot'; error = ''; successMessage = '';"
                style="background: none; border: none; font-size: 12px; color: #10b981; cursor: pointer; font-weight: 500;"
              >
                Forgot password?
              </button>
            </div>
            <div class="auth-input-wrapper">
              <div class="auth-input-icon">
                <Lock class="icon-muted" />
              </div>
              <input 
                v-model="password" 
                id="password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="auth-input" 
              />
            </div>
          </div>

          <!-- New Password Field (For Reset mode) -->
          <div v-if="mode === 'reset'" class="auth-input-group">
            <label for="new-password" class="auth-label">New Password</label>
            <div class="auth-input-wrapper">
              <div class="auth-input-icon">
                <KeyRound class="icon-muted" />
              </div>
              <input 
                v-model="newPassword" 
                id="new-password" 
                type="password" 
                required 
                minlength="6"
                placeholder="Enter new password (min 6 chars)"
                class="auth-input" 
              />
            </div>
          </div>

          <div class="auth-form-submit">
            <button 
              type="submit" 
              :disabled="loading" 
              class="btn-primary auth-submit-btn"
            >
              <span v-if="loading" class="auth-submit-btn__inner">
                <svg class="spinner-icon spinner-icon--small" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else class="auth-submit-btn__inner">
                <template v-if="mode === 'login'">
                  Sign in to your account
                  <ArrowRight class="icon-arrow-right" />
                </template>
                <template v-else-if="mode === 'signup'">
                  Create account
                  <ArrowRight class="icon-arrow-right" />
                </template>
                <template v-else-if="mode === 'forgot'">
                  Send Recovery Link
                  <ArrowRight class="icon-arrow-right" />
                </template>
                <template v-else-if="mode === 'reset'">
                  Update Password
                  <ArrowRight class="icon-arrow-right" />
                </template>
              </span>
            </button>
          </div>
        </form>

        <!-- Toggle Mode text -->
        <div class="auth-toggle">
          <p v-if="mode === 'forgot' || mode === 'reset'" class="auth-toggle__text">
            <button 
              type="button" 
              @click="mode = 'login'; error = ''; successMessage = '';" 
              class="auth-toggle__btn"
              style="display: inline-flex; align-items: center; gap: 4px;"
            >
              <ArrowLeft style="width: 14px; height: 14px;" /> Back to Login
            </button>
          </p>
          <p v-else class="auth-toggle__text">
            {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            <button 
              type="button" 
              @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; successMessage = '';" 
              class="auth-toggle__btn"
            >
              {{ mode === 'login' ? "Sign up for free" : 'Log in here' }}
            </button>
          </p>
        </div>

        <!-- Direct Guest Mode Access -->
        <div class="auth-guest-mode" style="margin-top: 18px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 14px;">
          <button 
            type="button" 
            @click="handleGuestAccess" 
            class="btn-guest-link"
            style="background: none; border: none; font-size: 13px; font-weight: 600; color: #34d399; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"
          >
            ⚡ Enter Workspace as Guest (Instant Access)
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  display: none;
}
</style>
