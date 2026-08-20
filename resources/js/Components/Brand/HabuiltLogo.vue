<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: [String, Number],
    default: 'md', // 'xs' (24px), 'sm' (32px), 'md' (38px), 'lg' (48px), 'xl' (64px) or number
  },
  withText: {
    type: Boolean,
    default: false,
  },
  showBadge: {
    type: Boolean,
    default: true,
  },
  badgeText: {
    type: String,
    default: 'PRO',
  },
  animated: {
    type: Boolean,
    default: false,
  },
  asLink: {
    type: Boolean,
    default: false,
  },
});

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 38,
  lg: 48,
  xl: 64,
};

const dimension = computed(() => {
  if (typeof props.size === 'number') return `${props.size}px`;
  return `${sizeMap[props.size] || 38}px`;
});

// Unique ID for SVG gradients to prevent collision if multiple instances exist
const uid = Math.random().toString(36).substring(2, 9);
</script>

<template>
  <component
    :is="asLink ? 'a' : 'div'"
    href="/"
    class="habuilt-logo-brand"
    :class="[
      `habuilt-logo-brand--${typeof size === 'string' ? size : 'custom'}`,
      { 'habuilt-logo-brand--with-text': withText },
      { 'habuilt-logo-brand--animated': animated },
    ]"
  >
    <div
      class="habuilt-logo-brand__icon"
      :style="{ width: dimension, height: dimension }"
    >
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="habuilt-logo-brand__svg"
      >
        <defs>
          <linearGradient :id="`hbg-${uid}`" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#082f49" />
          </linearGradient>
          <linearGradient :id="`haccent-${uid}`" x1="18" y1="17" x2="46" y2="47" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#22d3ee" />
          </linearGradient>
        </defs>

        <!-- Outer Squircle Card Frame -->
        <rect
          x="2"
          y="2"
          width="60"
          height="60"
          rx="14"
          :fill="`url(#hbg-${uid})`"
          stroke="rgba(255, 255, 255, 0.16)"
          stroke-width="1.5"
        />

        <!-- Precision Geometric 'H' Monogram -->
        <path
          d="M18 17h9v12h10V17h9v30h-9V37H27v10h-9z"
          :fill="`url(#haccent-${uid})`"
        />

        <!-- Signature Emerald Focus Accent Dot -->
        <circle cx="50" cy="14" r="4" fill="#34d399" opacity="0.95" />
      </svg>
    </div>

    <!-- Optional Brand Wordmark & Tag -->
    <div v-if="withText" class="habuilt-logo-brand__info">
      <span class="habuilt-logo-brand__text">Habuilt</span>
      <span v-if="showBadge" class="habuilt-logo-brand__tag">{{ badgeText }}</span>
    </div>
  </component>
</template>

<style scoped>
.habuilt-logo-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  user-select: none;
}

.habuilt-logo-brand__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;
}

.habuilt-logo-brand:hover .habuilt-logo-brand__icon {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.3), 0 2px 5px rgba(0, 0, 0, 0.4);
}

.habuilt-logo-brand__svg {
  width: 100%;
  height: 100%;
  display: block;
}

.habuilt-logo-brand--animated .habuilt-logo-brand__icon {
  animation: logoPulse 2.4s ease-in-out infinite alternate;
}

@keyframes logoPulse {
  0% {
    transform: scale(0.98);
    box-shadow: 0 4px 14px rgba(16, 185, 129, 0.2);
  }
  100% {
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(34, 211, 238, 0.35);
  }
}

.habuilt-logo-brand__info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.habuilt-logo-brand__text {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--text-primary, #0f172a);
}

body.theme-dark .habuilt-logo-brand__text {
  color: #f8fafc;
}

.habuilt-logo-brand__tag {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(14, 165, 233, 0.15));
  color: var(--accent-strong, #10b981);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

@media (max-width: 640px) {
  .habuilt-logo-brand {
    gap: 6px;
  }
  .habuilt-logo-brand__icon {
    width: 28px !important;
    height: 28px !important;
    border-radius: 8px;
  }
  .habuilt-logo-brand__text {
    font-size: 16px;
  }
  .habuilt-logo-brand__tag {
    font-size: 9px;
    padding: 1px 5px;
  }
}

.habuilt-logo-brand--lg .habuilt-logo-brand__text {
  font-size: 22px;
}

.habuilt-logo-brand--xl .habuilt-logo-brand__text {
  font-size: 28px;
}
</style>
