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

const calendarEvents = computed(() => {
  return [
    {
      id: 'public-morning',
      title: 'Morning Hydration & Movement',
      category: 'Morning',
      startTime: '05:30',
      endTime: '07:00',
      duration: '1h 30m',
      description: 'Water, light movement, and a short outdoor light break before focused work.',
      badge: 'Morning',
      icon: Sun,
    },
    {
      id: 'public-focus',
      title: 'Deep Work Block',
      category: 'Focus',
      startTime: '08:30',
      endTime: '10:00',
      duration: '1h 30m',
      description: 'Uninterrupted work on the highest-leverage task. Notifications off.',
      badge: 'Focus',
      icon: Zap,
    },
    {
      id: 'public-lunch',
      title: 'Midday Meal & Walk',
      category: 'Midday',
      startTime: '13:00',
      endTime: '13:45',
      duration: '45m',
      description: 'A balanced meal followed by a short walk.',
      badge: 'Midday',
      icon: Coffee,
    },
    {
      id: 'public-evening',
      title: 'Evening Walk & Shutdown',
      category: 'Evening',
      startTime: '18:30',
      endTime: '19:15',
      duration: '45m',
      description: 'Close the work day, take a walk, and reconnect with the people around you.',
      badge: 'Evening',
      icon: Sparkles,
    },
    {
      id: 'public-sleep',
      title: 'Lights Out',
      category: 'Rest',
      startTime: '22:00',
      endTime: '22:30',
      duration: '30m',
      description: 'Screens off, room dark and cool, consistent bedtime.',
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

// Generate 1-Click Outlook Web Direct URL
const getOutlookCalendarUrl = (evt) => {
  const d = String(props.currentDay).padStart(2, '0');
  const m = String(props.month).padStart(2, '0');
  const y = props.year;
  const dateStr = `${y}-${m}-${d}`;

  const startIso = `${dateStr}T${evt.startTime}:00`;
  const endIso = `${dateStr}T${evt.endTime}:00`;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: evt.title,
    body: `${evt.description}\n\n[Tracked via Habuilt Warrior Cockpit • Day Type: ${props.dayTypeLabel}]`,
    startdt: startIso,
    enddt: endIso,
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
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
    <div
      class="modal-card modal-card--calendar-sync"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-sync-title"
    >
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-wrap">
          <div class="modal-header__icon-badge modal-icon-badge--indigo">
            <Calendar class="icon-md" />
          </div>
          <div>
            <div class="modal-title-row">
              <h3 id="calendar-sync-title" class="modal-header__title">Calendar Focus Projection</h3>
              <span class="highlight-day-type">{{ dayTypeLabel }}</span>
            </div>
            <p class="modal-header__sub">
              Lock your Deep Work & Sadhana blocks into Google, Outlook & Apple Calendar
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
          <span class="calendar-action-bar__hint">• 1-Tap to lock schedules & block meeting distractions</span>
        </div>
        <button
          id="btn-download-ics"
          type="button"
          class="btn btn--primary-action btn-calendar-download"
          @click="downloadIcsFile"
          aria-label="Download All Focus Blocks as .ics"
        >
          <Download class="icon-xs" />
          <span>Download All (.ics)</span>
        </button>
      </div>

      <!-- Scheduled Blocks List (Inner Scroll Container) -->
      <div class="calendar-events-list">
        <div
          v-for="evt in calendarEvents"
          :key="evt.id"
          class="calendar-event-card"
          :id="`cal-card-${evt.id}`"
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
              class="btn-cal-link btn-cal-link--google"
              :title="`Add '${evt.title}' to Google Calendar`"
              aria-label="Add to Google Calendar"
            >
              <ExternalLink class="icon-xs" />
              <span>Google</span>
            </a>

            <!-- 1-Click Outlook Web Link -->
            <a
              :href="getOutlookCalendarUrl(evt)"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-cal-link btn-cal-link--outlook"
              :title="`Add '${evt.title}' to Outlook Calendar`"
              aria-label="Add to Outlook Calendar"
            >
              <ExternalLink class="icon-xs" />
              <span>Outlook</span>
            </a>

            <!-- Copy Snippet Button -->
            <button
              type="button"
              class="btn-cal-copy"
              @click="copyEventDetails(evt)"
              :title="`Copy '${evt.title}' snippet`"
              :aria-label="`Copy '${evt.title}' details`"
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
          <Sparkles class="icon-xs icon-amber flex-shrink-0" />
          <span>
            <strong>Pro Tip:</strong> Importing the <code>.ics</code> automatically sets 10-minute pre-focus alarms to get your hydration & notes ready.
          </span>
        </div>
        <button
          id="btn-calendar-close"
          type="button"
          class="btn btn--secondary modal-close-action"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
