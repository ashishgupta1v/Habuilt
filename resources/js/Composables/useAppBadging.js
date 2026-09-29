/**
 * useAppBadging.js
 * PWA Dynamic App Badging Engine
 *
 * Utilizes the W3C Badging API (navigator.setAppBadge / navigator.clearAppBadge)
 * to project remaining daily / current-block habit count directly onto the
 * native device home-screen icon, Windows Taskbar badge, and macOS Dock icon.
 */

import { watch } from 'vue';

export function useAppBadging({ remainingCount, isSupported = null }) {
  const supported = typeof navigator !== 'undefined' && 'setAppBadge' in navigator;

  const updateBadge = async (count) => {
    if (!supported) return;

    try {
      const num = Number(count) || 0;
      if (num > 0) {
        await navigator.setAppBadge(num);
      } else {
        await navigator.clearAppBadge();
      }
    } catch (err) {
      // Badging might be disabled in browser permissions or OS settings; fail silently
      console.debug('[AppBadge] Note:', err?.message || err);
    }
  };

  const clearBadge = async () => {
    if (!supported) return;
    try {
      await navigator.clearAppBadge();
    } catch {}
  };

  // Watch reactive remaining habits count
  if (remainingCount && typeof remainingCount === 'object') {
    watch(
      () => remainingCount.value,
      (newCount) => {
        updateBadge(newCount);
      },
      { immediate: true }
    );
  }

  return {
    isSupported: supported,
    updateBadge,
    clearBadge,
  };
}
