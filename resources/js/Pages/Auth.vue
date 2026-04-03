<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight, ShieldCheck, Activity, Target } from 'lucide-vue-next';

const email = ref('');
const password = ref('');
const mode = ref('login'); // 'login' or 'signup'
const loading = ref(false);
const error = ref('');
const successMessage = ref('');

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
      successMessage.value = 'Account created successfully! Check your email or try logging in.';
      mode.value = 'login';
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  error.value = '';
  try {
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (err) throw err;
  } catch (err) {
    error.value = err.message;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex">
    
    <!-- Left Promotional Panel (Hidden on Mobile) -->
    <div class="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden items-center justify-center p-12">
      <!-- Decorative Background Shapes -->
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500 opacity-50 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-cyan-400 opacity-20 blur-3xl"></div>
      <div class="absolute top-1/2 left-1/4 w-64 h-64 rounded-full bg-fuchsia-500 opacity-30 blur-3xl"></div>

      <div class="relative z-10 text-white max-w-lg">
        <div class="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl backdrop-blur-md mb-8 border border-white/20 shadow-xl">
          <Activity class="w-8 h-8 text-cyan-300" />
        </div>
        <h1 class="text-5xl font-extrabold tracking-tight mb-6 leading-tight">
          Build habits that <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">actually stick.</span>
        </h1>
        <p class="text-xl text-indigo-100 mb-10 leading-relaxed">
          Join high-performers transforming their daily routines. Track your tasks, earn points, and unlock milestones.
        </p>

        <div class="space-y-6">
          <div class="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <Target class="w-6 h-6 text-fuchsia-300 flex-shrink-0" />
            <span class="text-indigo-50 font-medium tracking-wide">Achieve milestone goals efficiently</span>
          </div>
          <div class="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <ShieldCheck class="w-6 h-6 text-emerald-300 flex-shrink-0" />
            <span class="text-indigo-50 font-medium tracking-wide">Secure, persistent progression</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Authentication Panel -->
    <div class="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 xl:p-24 bg-white relative">
      <div class="w-full max-w-md">
        
        <!-- Mobile Logo Fallback -->
        <div class="lg:hidden flex justify-center mb-8">
           <div class="flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl shadow-lg">
             <Activity class="w-6 h-6 text-white" />
           </div>
        </div>

        <div class="text-center mb-10">
          <h2 class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ mode === 'login' ? 'Welcome back' : 'Create your account' }}
          </h2>
          <p class="text-slate-500 mt-2 text-sm font-medium">
            {{ mode === 'login' ? 'Enter your details to access your dashboard.' : 'Start your journey to better habits today.' }}
          </p>
        </div>

        <!-- Google OAuth Button -->
        <button 
          @click="handleGoogleSignIn"
          type="button" 
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 rounded-xl shadow-sm bg-white text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-200"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-slate-500 font-medium">Or continue with email</span>
          </div>
        </div>

        <form @submit.prevent="handleAuth" class="space-y-5">
          <!-- Success Message -->
          <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center">
            <ShieldCheck class="w-4 h-4 mr-2 flex-shrink-0" />
            {{ successMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center">
            <svg class="w-4 h-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail class="h-5 w-5 text-slate-400" />
              </div>
              <input 
                v-model="email" 
                id="email" 
                name="email" 
                type="email" 
                autocomplete="email" 
                required 
                placeholder="you@example.com"
                class="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-colors sm:text-sm" 
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock class="h-5 w-5 text-slate-400" />
              </div>
              <input 
                v-model="password" 
                id="password" 
                name="password" 
                type="password" 
                autocomplete="current-password" 
                required 
                placeholder="••••••••"
                class="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 focus:bg-white transition-colors sm:text-sm" 
              />
            </div>
          </div>

          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loading" 
              class="group w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              <span v-if="loading" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
              <span v-else class="flex items-center">
                {{ mode === 'login' ? 'Sign in to your account' : 'Create account' }}
                <ArrowRight class="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </form>

        <!-- Toggle Mode text -->
        <div class="mt-8 text-center text-sm">
          <p class="text-slate-500">
            {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            <button 
              type="button" 
              @click="mode = mode === 'login' ? 'signup' : 'login'" 
              class="font-semibold text-indigo-600 hover:text-indigo-500 ml-1 transition-colors outline-none focus:underline"
            >
              {{ mode === 'login' ? "Sign up for free" : 'Log in here' }}
            </button>
          </p>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Hide scrollbar on auth screen */
::-webkit-scrollbar {
  display: none;
}
</style>
