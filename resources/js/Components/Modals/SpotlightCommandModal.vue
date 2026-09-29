<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import {
  Search,
  CheckSquare,
  Timer,
  Play,
  Moon,
  Sun,
  Share2,
  Calendar,
  Plus,
  Bell,
  Sparkles,
  BarChart3,
  Award,
  ArrowRight,
  X,
  Coffee,
  CheckCircle2,
  Circle,
  Database,
  Users,
  Activity,
  Sliders,
  Heart,
  Volume2,
  Briefcase,
  Crown,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  habits: { type: Array, default: () => [] },
  hasCompletedDay: { type: Function, required: true },
  currentDay: { type: Number, default: 1 },
  isAshish: { type: Boolean, default: false },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  darkMode: { type: Boolean, default: true },
  activeTab: { type: String, default: 'today' },
  dueNowNotificationsEnabled: { type: Boolean, default: false },
});

const emit = defineEmits([
  'close',
  'toggle-habit',
  'start-timer',
  'set-tab',
  'toggle-theme',
  'toggle-zen',
  'toggle-travel',
  'open-add-habit',
  'open-share-scorecard',
  'toggle-notifications',
  'trigger-celebration',
  'open-backup',
  'open-calendar-sync',
  'open-partner-sync',
  'open-partner-pair',
  'open-protocol-wizard',
  'open-protocol-settings',
  'switch-protocol',
  'open-clinical-report',
  'play-tactical-briefing',
]);

const searchQuery = ref('');
const selectedIndex = ref(0);
const searchInputRef = ref(null);

// Reset state when opened
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      searchQuery.value = '';
      selectedIndex.value = 0;
      nextTick(() => {
        if (searchInputRef.value) {
          searchInputRef.value.focus();
        }
      });
    }
  }
);

// Built-in system commands
const systemCommands = computed(() => {
  const list = [
    // Tactical Audio & AI Intelligence
    {
      id: 'cmd-tactical-briefing',
      category: 'AI Intelligence',
      title: 'Play Tactical Audio Briefing',
      subtitle: 'Voice-directed circadian protocol & keystone recommendations',
      icon: Volume2,
      badge: 'Audio',
      action: () => emit('play-tactical-briefing'),
    },

    // Focus actions
    {
      id: 'cmd-focus-25',
      category: 'Focus Station',
      title: 'Start 25-Min Pomodoro Sprint',
      subtitle: 'Standard focused work block',
      icon: Timer,
      badge: '25m',
      action: () => emit('start-timer', 25, null),
    },
    {
      id: 'cmd-focus-50',
      category: 'Focus Station',
      title: 'Start 50-Min Deep Work Session',
      subtitle: 'Intense zero-distraction flow block',
      icon: Timer,
      badge: '50m',
      action: () => emit('start-timer', 50, null),
    },
    {
      id: 'cmd-focus-90',
      category: 'Focus Station',
      title: 'Start 90-Min Ultradian Flow Block',
      subtitle: 'Full peak cognitive immersion cycle',
      icon: Timer,
      badge: '90m',
      action: () => emit('start-timer', 90, null),
    },
    {
      id: 'cmd-break-5',
      category: 'Focus Station',
      title: 'Take 5-Min Recovery Break',
      subtitle: 'Step away, hydrate, and stretch',
      icon: Coffee,
      badge: 'Break',
      action: () => emit('start-timer', 5, null),
    },
    {
      id: 'cmd-zen-toggle',
      category: 'Focus Station',
      title: 'Toggle Zen Focus Flow Mode',
      subtitle: 'Distraction-free checklist view (Keyboard: Z)',
      icon: Eye,
      badge: 'Zen',
      action: () => {
        emit('toggle-zen');
        emit('close');
      },
    },

    // Navigation
    {
      id: 'cmd-nav-today',
      category: 'Navigation',
      title: 'Go to Habit Checklist',
      subtitle: 'View daily leading indicators matrix',
      icon: CheckSquare,
      badge: 'View',
      action: () => emit('set-tab', 'today'),
    },
    {
      id: 'cmd-nav-focus',
      category: 'Navigation',
      title: 'Open Deep Work Station',
      subtitle: 'Timer, ambient soundscapes & binaural beats',
      icon: Timer,
      badge: 'View',
      action: () => emit('set-tab', 'focus'),
    },
    {
      id: 'cmd-nav-stats',
      category: 'Navigation',
      title: 'Open Performance Analytics',
      subtitle: 'Monthly trends, grade & completion radar',
      icon: BarChart3,
      badge: 'View',
      action: () => emit('set-tab', 'stats'),
    },
    {
      id: 'cmd-nav-rewards',
      category: 'Navigation',
      title: 'Open Reward Vault',
      subtitle: 'Redeem XP points for verified rewards',
      icon: Award,
      badge: 'View',
      action: () => emit('set-tab', 'rewards'),
    },

    // Actions & Tools
    {
      id: 'cmd-theme',
      category: 'Appearance',
      title: props.darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      subtitle: 'Toggle high-contrast / glass visual mode',
      icon: props.darkMode ? Sun : Moon,
      badge: props.darkMode ? 'Light' : 'Dark',
      action: () => emit('toggle-theme'),
    },
    {
      id: 'cmd-share',
      category: 'Tools',
      title: 'Share Daily Scorecard',
      subtitle: 'Generate high-res image / text scorecard summary',
      icon: Share2,
      badge: 'Export',
      action: () => emit('open-share-scorecard'),
    },
    {
      id: 'cmd-add-habit',
      category: 'Manage',
      title: 'Add New Custom Habit',
      subtitle: 'Scaffold a new habit into your protocol',
      icon: Plus,
      badge: 'New',
      action: () => emit('open-add-habit'),
    },
    {
      id: 'cmd-celebrate',
      category: 'Celebration',
      title: 'Fire Victory Confetti Cannon',
      subtitle: 'Trigger full-screen gold particle celebration',
      icon: Sparkles,
      badge: 'Confetti',
      action: () => emit('trigger-celebration'),
    },
    {
      id: 'cmd-backup-export',
      category: 'Data & Backup',
      title: 'Data Portability & Backup Hub',
      subtitle: 'Export JSON snapshots, RFC 4180 CSV matrix, or restore backup',
      icon: Database,
      badge: 'Backup',
      action: () => emit('open-backup'),
    },
    {
      id: 'cmd-cal-sync',
      category: 'Tools',
      title: 'Calendar Focus Projection (Google / .ics)',
      subtitle: "Lock today's focus blocks into Google, Outlook, or Apple Calendar",
      icon: Calendar,
      badge: 'Calendar',
      action: () => emit('open-calendar-sync'),
    },
    {
      id: 'cmd-protocol-builder',
      category: 'Protocols',
      title: 'Dynamic Protocol Builder & Switcher (Wizard)',
      subtitle: 'Run 4-step archetype quiz, customize circadian windows & habits',
      icon: Sliders,
      badge: 'Wizard',
      action: () => emit('open-protocol-wizard'),
    },
    {
      id: 'cmd-protocol-settings',
      category: 'Protocols',
      title: 'Protocol Scoring Tiers & Time Slots Customizer',
      subtitle: 'Adjust Floor (25%), Half (50%), Full (100%) thresholds & routine windows',
      icon: Settings,
      badge: 'Settings',
      action: () => emit('open-protocol-settings'),
    },
    {
      id: 'cmd-switch-founder',
      category: 'Protocols',
      title: 'Switch to Founder / Deep Work Executive',
      subtitle: '16 core habits • 90m deep work sprints, vitality & shutdown',
      icon: Briefcase,
      badge: 'Archetype',
      action: () => emit('switch-protocol', 'archetype-founder'),
    },
    {
      id: 'cmd-switch-longevity',
      category: 'Protocols',
      title: 'Switch to Mind-Body & Longevity Architecture',
      subtitle: '18 core habits • Circadian alignment, pranayama & mobility',
      icon: Activity,
      badge: 'Archetype',
      action: () => emit('switch-protocol', 'archetype-longevity'),
    },
    {
      id: 'cmd-switch-postpartum',
      category: 'Protocols',
      title: 'Switch to Postpartum Mother & Family Harmony',
      subtitle: '16 core habits • Restorative sleep floor, pelvic reset & baby bonds',
      icon: Heart,
      badge: 'Archetype',
      action: () => emit('switch-protocol', 'archetype-postpartum'),
    },
    {
      id: 'cmd-switch-ashish',
      category: 'Protocols',
      title: 'Switch to Ashish Master Protocol (Flagship 68-Step)',
      subtitle: 'Complete 68-step master blueprint with 4 office day types',
      icon: Crown,
      badge: 'Flagship',
      action: () => emit('switch-protocol', 'archetype-ashish'),
    },
    {
      id: 'cmd-switch-jyoti',
      category: 'Protocols',
      title: 'Switch to Jyoti Master Protocol (Flagship 37-Step)',
      subtitle: 'Complete 37-step maternal & family protocol with baby milestones',
      icon: Sparkles,
      badge: 'Flagship',
      action: () => emit('switch-protocol', 'archetype-jyoti'),
    },
    {
      id: 'cmd-partner-pair',
      category: 'Partnership',
      title: 'Pair With Partner (Invite Code & Link)',
      subtitle: 'Share 6-character code (HAB-XXXX), QR scan, or link accounts',
      icon: Heart,
      badge: 'Pairing',
      action: () => emit('open-partner-pair'),
    },
    {
      id: 'cmd-partner-sync',
      category: 'Partnership',
      title: 'Shared Couple Cockpit (Live Partner Sync)',
      subtitle: 'Real-time visibility, shared anchors & encouragement emotes',
      icon: Users,
      badge: 'Couple',
      action: () => emit('open-partner-sync'),
    },
    {
      id: 'cmd-clinical-report',
      category: 'Health',
      title: 'Rheumatology & Morning Stiffness Analytics',
      subtitle: 'Longitudinal clinical metrics & physician summary report',
      icon: Activity,
      badge: 'Clinical',
      action: () => emit('open-clinical-report'),
    },
  ];

  if (props.isAshish) {
    list.unshift({
      id: 'cmd-travel-cycle',
      category: 'Schedule',
      title: `Cycle Day Type (Currently ${props.dayTypeLabel})`,
      subtitle: 'Switch between Home, Office, Half-day, and Holiday',
      icon: Calendar,
      badge: 'Day Type',
      action: () => emit('toggle-travel'),
    });
  }

  return list;
});

// Habits converted to searchable commands
const habitCommands = computed(() => {
  return (props.habits || []).map((habit) => {
    const isDone = props.hasCompletedDay(habit, props.currentDay);
    return {
      id: `habit-${habit.id}`,
      category: 'Today\'s Habits',
      title: habit.name,
      subtitle: isDone
        ? `Completed today (+${habit.points} pts) • Press Enter to uncheck`
        : `Pending today (+${habit.points} pts) • Press Enter to check off`,
      isHabit: true,
      habit,
      isDone,
      icon: isDone ? CheckCircle2 : Circle,
      badge: `${habit.points}pt`,
      action: () => emit('toggle-habit', habit),
    };
  });
});

// Filtered commands based on search
const filteredCommands = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) {
    // Show top commands + first 6 habits
    return [...systemCommands.value.slice(0, 7), ...habitCommands.value.slice(0, 8)];
  }

  const matches = [];

  // Search habits first
  habitCommands.value.forEach((h) => {
    if (h.title.toLowerCase().includes(q) || (h.habit.category && h.habit.category.toLowerCase().includes(q))) {
      matches.push(h);
    }
  });

  // Search system commands
  systemCommands.value.forEach((cmd) => {
    if (
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    ) {
      matches.push(cmd);
    }
  });

  return matches;
});

// Keyboard navigation
const onKeyDown = (e) => {
  if (!props.isOpen) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % filteredCommands.value.length;
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (filteredCommands.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const target = filteredCommands.value[selectedIndex.value];
    if (target) {
      executeCommand(target);
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    emit('close');
  }
};

const executeCommand = (cmd) => {
  if (cmd && cmd.action) {
    cmd.action();
    emit('close');
  }
};

// Global Cmd+K / Ctrl+K listener
const handleGlobalHotkey = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (props.isOpen) {
      emit('close');
    } else {
      emit('close', false); // triggers toggle in parent
    }
  }
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalHotkey);
  }
});

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalHotkey);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="spotlight-fade">
      <div v-if="isOpen" class="spotlight-overlay" @click.self="emit('close')">
        <div class="spotlight-modal" role="dialog" aria-modal="true" aria-label="Spotlight Command Palette">
          <!-- Search Header Input -->
          <div class="spotlight-input-wrap">
            <Search class="icon-sm spotlight-search-icon" />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="spotlight-input"
              placeholder="Search habits, timers, tabs, commands..."
              autocomplete="off"
              spellcheck="false"
              @keydown="onKeyDown"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="spotlight-clear-btn"
              @click="searchQuery = ''; searchInputRef?.focus()"
              aria-label="Clear search"
            >
              <X class="icon-xs" />
            </button>
            <kbd class="spotlight-kbd-badge">ESC</kbd>
          </div>

          <!-- Command List -->
          <div class="spotlight-list-container" role="listbox">
            <div v-if="filteredCommands.length === 0" class="spotlight-empty-state">
              <Sparkles class="icon-md icon-focus-gold" />
              <p class="spotlight-empty-title">No matching actions or habits</p>
              <p class="spotlight-empty-desc">Try searching for "focus", "25", "water", or "theme"</p>
            </div>

            <div
              v-for="(cmd, index) in filteredCommands"
              :key="cmd.id"
              class="spotlight-item"
              :class="{
                'spotlight-item--active': index === selectedIndex,
                'spotlight-item--habit': cmd.isHabit,
                'spotlight-item--done': cmd.isDone,
              }"
              role="option"
              :aria-selected="index === selectedIndex"
              @mouseenter="selectedIndex = index"
              @click="executeCommand(cmd)"
            >
              <div class="spotlight-item-icon-box">
                <component
                  :is="cmd.icon"
                  class="icon-sm"
                  :class="{
                    'icon-emerald': cmd.isDone,
                    'icon-focus-gold': !cmd.isDone && cmd.isHabit,
                    'icon-indigo': !cmd.isHabit,
                  }"
                />
              </div>

              <div class="spotlight-item-body">
                <div class="spotlight-item-title-row">
                  <span class="spotlight-item-title">{{ cmd.title }}</span>
                  <span class="spotlight-item-category">{{ cmd.category }}</span>
                </div>
                <span class="spotlight-item-subtitle">{{ cmd.subtitle }}</span>
              </div>

              <div class="spotlight-item-tail">
                <span v-if="cmd.badge" class="spotlight-badge">{{ cmd.badge }}</span>
                <span v-if="index === selectedIndex" class="spotlight-enter-hint">
                  <ArrowRight class="icon-xs" />
                </span>
              </div>
            </div>
          </div>

          <!-- Footer Hints Bar -->
          <div class="spotlight-footer">
            <div class="spotlight-footer-hint">
              <kbd class="spotlight-key">↑</kbd>
              <kbd class="spotlight-key">↓</kbd>
              <span>to navigate</span>
            </div>
            <div class="spotlight-footer-hint">
              <kbd class="spotlight-key">↵</kbd>
              <span>to select</span>
            </div>
            <div class="spotlight-footer-hint">
              <kbd class="spotlight-key">ESC</kbd>
              <span>to close</span>
            </div>
            <div class="spotlight-footer-brand">
              <span>Habuilt Spotlight</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
