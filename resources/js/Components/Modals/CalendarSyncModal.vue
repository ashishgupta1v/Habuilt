<script setup>
import { ref, computed } from 'vue';
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  Check,
  Copy,
  X,
  Sparkles,
  Zap,
  Shield,
  Coffee,
  Sun,
  Moon,
  MapPin,
  Laptop,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
  year: { type: Number, default: 2026 },
  month: { type: Number, default: 9 },
  currentDay: { type: Number, default: 1 },
});

const emit = defineEmits(['close', 'toast']);

const copySuccessId = ref(null);

// Dynamic daily schedule template based on day type and profile
const calendarEvents = computed(() => {
  const d = String(props.currentDay).padStart(2, '0');
  const m = String(props.month).padStart(2, '0');
  const y = props.year;
  const datePrefix = `${y}-${m}-${d}`;

  if (props.isJyoti) {
    return [
      {
        id: 'jyoti-sleep-window',
        title: '🛡️ Protected Sleep & Recovery Window',
        category: 'Recovery',
        startTime: '05:00',
        endTime: '08:00',
        duration: '3h',
        description: 'Uninterrupted morning sleep window for postpartum hormonal reset and cellular repair.',
        badge: 'Critical',
        icon: Moon,
      },
      {
        id: 'jyoti-morning-routine',
        title: '🌸 Morning Nutrition, Hydration & Baby Bonding',
        category: 'Morning',
        startTime: '08:00',
        endTime: '09:30',
        duration: '1h 30m',
        description: 'Lactation hydration, Ayurvedic bath, and Shaarvi morning massage & sun exposure.',
        badge: 'Health',
        icon: Sun,
      },
      {
        id: 'jyoti-sap-study-1',
        title: '📚 SAP IBP Study Sprint 1 (Demand Planning)',
        category: 'Career Focus',
        startTime: '10:30',
        endTime: '12:00',
        duration: '1h 30m',
        description: 'Core SAP IBP technical curriculum, configuration exercises, and supply chain case studies.',
        badge: 'Focus',
        icon: Zap,
      },
      {
        id: 'jyoti-shared-lunch',
        title: '🥗 Shared Couple Lunch & Mindful Reconnect',
        category: 'Couple Anchor',
        startTime: '13:30',
        endTime: '14:15',
        duration: '45m',
        description: 'Warm wholesome meal together with Ashish. Zero phone screens, family gratitude.',
        badge: 'Shared Anchor',
        icon: Coffee,
      },
      {
        id: 'jyoti-sap-study-2',
        title: '💻 SAP IBP Hands-on Lab & Resume Prep',
        category: 'Career Focus',
        startTime: '15:30',
        endTime: '17:00',
        duration: '1h 30m',
        description: 'Interactive system modeling, supply chain planning runs, and career milestones.',
        badge: 'Focus',
        icon: Laptop,
      },
      {
        id: 'jyoti-evening-walk',
        title: '👶 Shaarvi Stroller Park Walk & Sunset Air',
        category: 'Family Anchor',
        startTime: '18:35',
        endTime: '19:15',
        duration: '40m',
        description: 'Couples stroller walk around park. Sensory stimulation for Shaarvi & metabolic recharge.',
        badge: 'Shared Anchor',
        icon: Sparkles,
      },
      {
        id: 'jyoti-wind-down',
        title: '🌙 Night Nursing & Restorative Wind Down',
        category: 'Rest',
        startTime: '21:00',
        endTime: '22:00',
        duration: '1h',
        description: 'Warm water wash, gratitude journal, nursery sleep environment prep.',
        badge: 'Wind Down',
        icon: Moon,
      },
    ];
  }

  // Ashish's Dynamic Schedule based on Day Type
  if (props.dayType === 'office-mon') {
    return [
      {
        id: 'mon-transit-morning',
        title: '🚗 Ludhiana → CHD Commute & Audio Focus',
        category: 'Transit',
        startTime: '06:00',
        endTime: '08:30',
        duration: '2h 30m',
        description: 'Safe highway transit with leadership podcasts, strategic contemplation, and zero phone calls.',
        badge: 'Transit',
        icon: MapPin,
      },
      {
        id: 'mon-deep-work-1',
        title: '⚡ Deep Work Sprint: Core Engineering Deliverable',
        category: 'Deep Work',
        startTime: '09:30',
        endTime: '12:00',
        duration: '2h 30m',
        description: 'High-leverage architectural code, feature pipeline execution, and zero Slack interruption.',
        badge: 'Deep Work',
        icon: Zap,
      },
      {
        id: 'mon-office-sprint',
        title: '🏢 Office Alignment & Cross-Functional Reviews',
        category: 'Office',
        startTime: '14:00',
        endTime: '17:30',
        duration: '3h 30m',
        description: 'In-person team synchronizations, sprint grooming, and unblocking engineering teams.',
        badge: 'Office',
        icon: Laptop,
      },
      {
        id: 'mon-flat-evening',
        title: '🧘 Panchkula Flat Decompression & Mobility',
        category: 'Solo Evening',
        startTime: '19:00',
        endTime: '20:30',
        duration: '1h 30m',
        description: 'Spinal mobility reset after drive, warm simple dinner, and family FaceTime call with Jyoti & Shaarvi.',
        badge: 'Health',
        icon: Moon,
      },
    ];
  }

  if (props.dayType === 'office-mid') {
    return [
      {
        id: 'mid-morning-sadhana',
        title: '🌅 Panchkula Morning Sadhana & Spinal Flow',
        category: 'Morning',
        startTime: '05:30',
        endTime: '07:00',
        duration: '1h 30m',
        description: 'Pre-office spinal mobilization, hydration, breathing practice, and quiet alignment.',
        badge: 'Health',
        icon: Sun,
      },
      {
        id: 'mid-deep-work-1',
        title: '⚡ Deep Work Block: Strategic High-Impact Sprints',
        category: 'Deep Work',
        startTime: '09:30',
        endTime: '12:30',
        duration: '3h',
        description: 'Uninterrupted high-cognition technical architecture and deep problem solving.',
        badge: 'Deep Work',
        icon: Zap,
      },
      {
        id: 'mid-office-collab',
        title: '🏢 Executive Reviews & Stakeholder Syncs',
        category: 'Office',
        startTime: '14:00',
        endTime: '17:30',
        duration: '3h 30m',
        description: 'Project reviews, design evaluations, and client delivery touchpoints.',
        badge: 'Office',
        icon: Laptop,
      },
      {
        id: 'mid-flat-study',
        title: '📖 Evening Self-Mastery & Reading Block',
        category: 'Learning',
        startTime: '19:30',
        endTime: '21:00',
        duration: '1h 30m',
        description: 'Technical mastery books, journal reflection, and call home to Jyoti & baby.',
        badge: 'Learning',
        icon: Moon,
      },
    ];
  }

  if (props.dayType === 'office-fri') {
    return [
      {
        id: 'fri-morning-office',
        title: '⚡ Friday Early Execution Block',
        category: 'Deep Work',
        startTime: '09:00',
        endTime: '12:30',
        duration: '3h 30m',
        description: 'Finalize week deliverables, submit PRs, and review system logs.',
        badge: 'Deep Work',
        icon: Zap,
      },
      {
        id: 'fri-return-transit',
        title: '🚗 Return Transit: Chandigarh → Ludhiana',
        category: 'Transit',
        startTime: '15:30',
        endTime: '18:00',
        duration: '2h 30m',
        description: 'Smooth drive back home to Ludhiana family base. Transition mindset to weekend fatherhood & partnership.',
        badge: 'Transit',
        icon: MapPin,
      },
      {
        id: 'fri-home-reunion',
        title: '🏡 Home Reunion, Shaarvi Play & Family Dinner',
        category: 'Family Anchor',
        startTime: '18:30',
        endTime: '21:30',
        duration: '3h',
        description: 'Reunite with Jyoti and Shaarvi. Shared laughter, dinner, and peaceful weekend welcome.',
        badge: 'Shared Anchor',
        icon: Sparkles,
      },
    ];
  }

  // Default Home WFH Ludhiana Baseline (Full Mastery Day)
  return [
    {
      id: 'home-morning-sadhana',
      title: '🌅 MOVERS Sadhana, Mobility & Cold Splash',
      category: 'Morning Baseline',
      startTime: '05:00',
      endTime: '06:15',
      duration: '1h 15m',
      description: 'Spinal flow, 500ml copper water, Ayurvedic oiling, cold splash, and early morning sunlight.',
      badge: 'Baseline',
      icon: Sun,
    },
    {
      id: 'home-deep-work-1',
      title: '⚡ Deep Work Sprint 1: Critical Strategic Priority',
      category: 'Deep Work',
      startTime: '09:00',
      endTime: '11:30',
      duration: '2h 30m',
      description: 'Peak circadian executive sprint on #1 highest-leverage deliverable. No notifications or email.',
      badge: 'Deep Work',
      icon: Zap,
    },
    {
      id: 'home-deep-work-2',
      title: '🚀 Deep Work Sprint 2: Core Engineering Execution',
      category: 'Deep Work',
      startTime: '11:45',
      endTime: '13:15',
      duration: '1h 30m',
      description: 'High-speed technical iteration, feature build-out, and continuous deployment.',
      badge: 'Deep Work',
      icon: Laptop,
    },
    {
      id: 'home-shared-lunch',
      title: '🥗 Shared Couple Lunch & Mindful Reconnect',
      category: 'Couple Anchor',
      startTime: '13:30',
      endTime: '14:15',
      duration: '45m',
      description: 'Wholesome hot lunch with Jyoti. Daily gratitude touchpoint and midday recharge.',
      badge: 'Shared Anchor',
      icon: Coffee,
    },
    {
      id: 'home-deep-work-3',
      title: '🎯 Deep Work Sprint 3 / Communications Clearing',
      category: 'Deep Work',
      startTime: '14:30',
      endTime: '16:30',
      duration: '2h',
      description: 'Sprint 3 focus or clearing critical business pipeline and client communications.',
      badge: 'Focus',
      icon: Zap,
    },
    {
      id: 'home-sunset-walk',
      title: '👶 Shaarvi Stroller Walk & Metabolic Mile',
      category: 'Family Anchor',
      startTime: '18:35',
      endTime: '19:15',
      duration: '40m',
      description: 'Outdoor park walk with Jyoti pushing Shaarvi. Evening sunlight view for circadian melatonin regulation.',
      badge: 'Shared Anchor',
      icon: Sparkles,
    },
    {
      id: 'home-digital-sunset',
      title: '🌙 Digital Sunset, Diya & Deep Rest Preparation',
      category: 'Wind Down',
      startTime: '21:00',
      endTime: '22:00',
      duration: '1h',
      description: 'Screens off, blue-light blockers, warm foot massage, and restful sleep protocol.',
      badge: 'Rest',
      icon: Moon,
    },
  ];
});

// Helper to format ISO datetime for Google Calendar & iCal
const formatCalendarDate = (dateStr, timeStr) => {
  const [year, month, day] = dateStr.split('-');
  const [hours, minutes] = timeStr.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
};

// Generate 1-Click Google Calendar Direct URL
const getGoogleCalendarUrl = (evt) => {
  const d = String(props.currentDay).padStart(2, '0');
  const m = String(props.month).padStart(2, '0');
  const y = props.year;
  const dateStr = `${y}-${m}-${d}`;

  const startUtc = formatCalendarDate(dateStr, evt.startTime);
  const endUtc = formatCalendarDate(dateStr, evt.endTime);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.title,
    details: `${evt.description}\n\n[Tracked via Habuilt Warrior Cockpit • Day Type: ${props.dayTypeLabel}]`,
    dates: `${startUtc}/${endUtc}`,
    ctz: 'Asia/Kolkata',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// 1-Click Download RFC 5545 iCalendar (.ics) file
const downloadIcsFile = () => {
  try {
    const d = String(props.currentDay).padStart(2, '0');
    const m = String(props.month).padStart(2, '0');
    const y = props.year;
    const dateStr = `${y}${m}${d}`;

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Habuilt//Warrior Focus Protocol//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Habuilt Focus Blocks',
      'X-WR-TIMEZONE:Asia/Kolkata',
    ];

    calendarEvents.value.forEach((evt) => {
      const dtStart = `${dateStr}T${evt.startTime.replace(':', '')}00`;
      const dtEnd = `${dateStr}T${evt.endTime.replace(':', '')}00`;

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:habuilt-${evt.id}-${dateStr}@habuilt.app`,
        `DTSTAMP:${dateStr}T000000Z`,
        `DTSTART;TZID=Asia/Kolkata:${dtStart}`,
        `DTEND;TZID=Asia/Kolkata:${dtEnd}`,
        `SUMMARY:${evt.title}`,
        `DESCRIPTION:${evt.description}`,
        'STATUS:CONFIRMED',
        'BEGIN:VALARM',
        'TRIGGER:-PT10M',
        'ACTION:DISPLAY',
        'DESCRIPTION:Habuilt Focus Block in 10 minutes',
        'END:VALARM',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Habuilt_Focus_Blocks_${y}-${m}-${d}_${props.dayType}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    emit('toast', '📅 Downloaded .ics calendar schedule!');
  } catch (err) {
    console.error('Failed to export calendar file:', err);
    emit('toast', '⚠️ Error generating calendar file');
  }
};

const copyEventDetails = async (evt) => {
  try {
    const text = `${evt.title} (${evt.startTime} - ${evt.endTime})\n${evt.description}`;
    await navigator.clipboard.writeText(text);
    copySuccessId.value = evt.id;
    setTimeout(() => {
      copySuccessId.value = null;
    }, 2000);
    emit('toast', `📋 Copied "${evt.title}" details!`);
  } catch {
    emit('toast', '⚠️ Could not copy text');
  }
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card modal-card--calendar-sync" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-wrap">
          <div class="modal-header__icon-badge">
            <Calendar class="icon-md icon-indigo" />
          </div>
          <div>
            <h3 class="modal-header__title">Calendar Focus Projection</h3>
            <p class="modal-header__sub">
              Lock your Deep Work & Sadhana into Google, Outlook & Apple Calendar for
              <span class="highlight-day-type">{{ dayTypeLabel }}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          @click="emit('close')"
          aria-label="Close Calendar Sync Modal"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Quick Action Toolbar -->
      <div class="calendar-action-bar">
        <div class="calendar-action-bar__info">
          <span class="badge-blocks-count mono-num">{{ calendarEvents.length }} Strategic Blocks</span>
          <span class="text-subtle">• 1-Tap to block external calendar distractions</span>
        </div>
        <button
          type="button"
          class="btn btn--primary-action btn-calendar-download"
          @click="downloadIcsFile"
        >
          <Download class="icon-xs" />
          <span>Download All (.ics)</span>
        </button>
      </div>

      <!-- Scheduled Blocks List -->
      <div class="calendar-events-list">
        <div
          v-for="evt in calendarEvents"
          :key="evt.id"
          class="calendar-event-card"
        >
          <div class="calendar-event-card__time mono-num">
            <span class="calendar-event-card__start">{{ evt.startTime }}</span>
            <span class="calendar-event-card__sep">↓</span>
            <span class="calendar-event-card__end">{{ evt.endTime }}</span>
            <span class="calendar-event-card__dur">{{ evt.duration }}</span>
          </div>

          <div class="calendar-event-card__body">
            <div class="calendar-event-card__head">
              <span class="calendar-event-card__title">{{ evt.title }}</span>
              <span class="calendar-event-card__badge" :class="`badge--${evt.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`">
                {{ evt.badge }}
              </span>
            </div>
            <p class="calendar-event-card__desc">{{ evt.description }}</p>
          </div>

          <div class="calendar-event-card__actions">
            <!-- 1-Click Google Calendar Link -->
            <a
              :href="getGoogleCalendarUrl(evt)"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-cal-link"
              title="Add this block to Google Calendar"
            >
              <ExternalLink class="icon-xs" />
              <span>Google Cal</span>
            </a>

            <!-- Copy Snippet Button -->
            <button
              type="button"
              class="btn-cal-copy"
              @click="copyEventDetails(evt)"
              title="Copy event snippet"
            >
              <Check v-if="copySuccessId === evt.id" class="icon-xs icon-emerald" />
              <Copy v-else class="icon-xs" />
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="calendar-sync-tips">
          <Sparkles class="icon-xs icon-amber" />
          <span>
            <strong>Pro Tip:</strong> Importing the <code>.ics</code> automatically sets 10-minute pre-focus alarms to get your hydration & notes ready.
          </span>
        </div>
        <button
          type="button"
          class="btn btn--secondary"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
