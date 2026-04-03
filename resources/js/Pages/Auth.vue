<script setup>
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

const email = ref('');
const password = ref('');
const mode = ref('login'); // 'login' or 'signup'
const loading = ref(false);
const error = ref('');

const handleAuth = async () => {
  loading.value = true;
  error.value = '';

  try {
    if (mode.value === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
      alert('Signup successful! Check email or simply log in if auto-confirm is enabled.');
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
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {{ mode === 'login' ? 'Sign in to Habuilt' : 'Create an account' }}
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
        <form class="space-y-6" @submit.prevent="handleAuth">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
            <div class="mt-1">
              <input v-model="email" id="email" name="email" type="email" autocomplete="email" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
            <div class="mt-1">
              <input v-model="password" id="password" name="password" type="password" autocomplete="current-password" required class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
            </div>
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {{ error }}
          </div>

          <div>
            <button type="submit" :disabled="loading" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              <span v-if="loading">Processing...</span>
              <span v-else>{{ mode === 'login' ? 'Sign in' : 'Sign up' }}</span>
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500"> Or </span>
            </div>
          </div>

          <div class="mt-6 text-center">
            <button type="button" @click="mode = mode === 'login' ? 'signup' : 'login'" class="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none">
              {{ mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
