import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export const CIRCADIAN_PHASES = {
  night: {
    key: 'night',
    name: 'Circadian Deep Night',
    tagline: 'Restorative recovery & cellular rejuvenation',
    icon: '🌙',
    bgColor: '#070a11',
    glow: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(52, 211, 153, 0.035) 0%, transparent 70%)',
    accentColor: '#34d399',
    timeRange: '21:00 – 05:00',
  },
  dawn: {
    key: 'dawn',
    name: 'Circadian Dawn Initiation',
    tagline: 'Morning stiffness release & hydration focus',
    icon: '🌅',
    bgColor: '#0b1322',
    glow: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56, 189, 248, 0.055) 0%, rgba(52, 211, 153, 0.02) 40%, transparent 75%)',
    accentColor: '#38bdf8',
    timeRange: '05:00 – 09:00',
  },
  day: {
    key: 'day',
    name: 'Solar Zenith Focus',
    tagline: 'Peak cognitive output & deep work sprints',
    icon: '☀️',
    bgColor: '#080e1a',
    glow: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.045) 0%, rgba(14, 165, 233, 0.02) 40%, transparent 75%)',
    accentColor: '#10b981',
    timeRange: '09:00 – 17:00',
  },
  dusk: {
    key: 'dusk',
    name: 'Sunset Golden Hour',
    tagline: 'Evening wind-down & executive day debrief',
    icon: '🌇',
    bgColor: '#0e0c16',
    glow: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(200, 164, 86, 0.065) 0%, rgba(245, 158, 11, 0.03) 40%, transparent 75%)',
    accentColor: '#C8A456',
    timeRange: '17:00 – 21:00',
  },
};

export const SOLAR_CITY_PRESETS = [
  { city: 'Chandigarh / Punjab', lat: 30.7333, lon: 76.7794, label: '🇮🇳 Chandigarh (HQ)' },
  { city: 'Delhi / NCR', lat: 28.6139, lon: 77.2090, label: '🇮🇳 New Delhi / NCR' },
  { city: 'Mumbai', lat: 19.0760, lon: 72.8777, label: '🇮🇳 Mumbai' },
  { city: 'Bengaluru', lat: 12.9716, lon: 77.5946, label: '🇮🇳 Bengaluru' },
  { city: 'London', lat: 51.5074, lon: -0.1278, label: '🇬🇧 London' },
  { city: 'New York', lat: 40.7128, lon: -74.0060, label: '🇺🇸 New York' },
  { city: 'San Francisco', lat: 37.7749, lon: -122.4194, label: '🇺🇸 San Francisco' },
  { city: 'Dubai', lat: 25.2048, lon: 55.2708, label: '🇦🇪 Dubai' },
  { city: 'Singapore', lat: 1.3521, lon: 103.8198, label: '🇸🇬 Singapore' },
  { city: 'Sydney', lat: -33.8688, lon: 151.2093, label: '🇦🇺 Sydney' },
];

/**
 * High-precision offline NOAA astronomical solar calculation
 */
export function computeAstronomicalSolarTimes(lat, lon, date = new Date()) {
  const rad = Math.PI / 180.0;
  const deg = 180.0 / Math.PI;

  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000)) + 1;
  const tzOffsetHours = -date.getTimezoneOffset() / 60;

  const gamma = (2 * Math.PI / 365.0) * (dayOfYear - 1);

  // Equation of time (minutes)
  const eqtime = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  // Solar declination (radians)
  const decl = (
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  );

  const latRad = lat * rad;

  function getHourAngle(zenithDeg) {
    const zenithRad = zenithDeg * rad;
    const cosHA = (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(decl)) / (Math.cos(latRad) * Math.cos(decl));
    if (cosHA > 1) return null;
    if (cosHA < -1) return null;
    return Math.acos(cosHA) * deg;
  }

  const solarNoonMin = 720 - 4 * lon - eqtime + 60 * tzOffsetHours;
  const haOfficial = getHourAngle(90.833) || 90;
  const haCivil = getHourAngle(96.0) || 96;

  const formatMin = (m) => {
    let normalized = (m % 1440 + 1440) % 1440;
    const hh = Math.floor(normalized / 60);
    const mm = Math.floor(normalized % 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  const dawnMin = solarNoonMin - 4 * haCivil;
  const sunriseMin = solarNoonMin - 4 * haOfficial;
  const sunsetMin = solarNoonMin + 4 * haOfficial;
  const duskMin = solarNoonMin + 4 * haCivil;

  return {
    solarNoon: formatMin(solarNoonMin),
    dawn: formatMin(dawnMin),
    sunrise: formatMin(sunriseMin),
    sunset: formatMin(sunsetMin),
    dusk: formatMin(duskMin),
    minutes: {
      dawn: dawnMin,
      sunrise: sunriseMin,
      noon: solarNoonMin,
      sunset: sunsetMin,
      dusk: duskMin,
    },
  };
}

// Singleton state
const activeCircadianMode = ref('auto'); // 'auto' | 'night' | 'dawn' | 'day' | 'dusk'
const detectedPhaseKey = ref('night');
const solarCalculationMode = ref('astronomical'); // 'astronomical' | 'fixed'
const userCoordinates = ref({
  lat: 30.7333,
  lon: 76.7794,
  city: 'Chandigarh / Punjab',
});
let timerId = null;

function calculateCurrentPhase(date = new Date()) {
  if (solarCalculationMode.value === 'astronomical') {
    const solar = computeAstronomicalSolarTimes(userCoordinates.value.lat, userCoordinates.value.lon, date);
    const nowMinutes = date.getHours() * 60 + date.getMinutes();

    const dawnStart = solar.minutes.dawn;
    const dayStart = solar.minutes.sunrise + 90; // ~1.5h after sunrise
    const duskStart = solar.minutes.sunset - 45; // 45m before sunset
    const nightStart = solar.minutes.dusk + 45;  // 45m after civil dusk

    if (nowMinutes >= dawnStart && nowMinutes < dayStart) return 'dawn';
    if (nowMinutes >= dayStart && nowMinutes < duskStart) return 'day';
    if (nowMinutes >= duskStart && nowMinutes < nightStart) return 'dusk';
    return 'night';
  }

  // Standard fixed diurnal routine fallback
  const hours = date.getHours();
  if (hours >= 5 && hours < 9) return 'dawn';
  if (hours >= 9 && hours < 17) return 'day';
  if (hours >= 17 && hours < 21) return 'dusk';
  return 'night';
}

function applyAtmosphereToDOM(phaseKey, isDarkMode = true) {
  if (typeof document === 'undefined') return;
  const phase = CIRCADIAN_PHASES[phaseKey] || CIRCADIAN_PHASES.night;

  if (isDarkMode) {
    document.documentElement.style.setProperty('--circadian-bg', phase.bgColor);
    document.documentElement.style.setProperty('--circadian-glow', phase.glow);
    document.documentElement.style.setProperty('--circadian-accent', phase.accentColor);
    document.documentElement.style.setProperty('--page-bg', phase.bgColor);
    document.body.style.backgroundColor = phase.bgColor;
    document.body.style.backgroundImage = phase.glow;
    document.body.style.backgroundAttachment = 'fixed';
  } else {
    document.documentElement.style.removeProperty('--circadian-bg');
    document.documentElement.style.removeProperty('--circadian-glow');
    document.documentElement.style.removeProperty('--page-bg');
    document.body.style.backgroundImage = '';
  }
}

export function useCircadianAtmosphere(isDarkModeRef = ref(true)) {
  const currentPhaseKey = computed(() => {
    if (activeCircadianMode.value !== 'auto') {
      return activeCircadianMode.value;
    }
    return detectedPhaseKey.value;
  });

  const currentPhase = computed(() => {
    return CIRCADIAN_PHASES[currentPhaseKey.value] || CIRCADIAN_PHASES.night;
  });

  const computedSolarSchedule = computed(() => {
    return computeAstronomicalSolarTimes(userCoordinates.value.lat, userCoordinates.value.lon);
  });

  const refreshAtmosphere = () => {
    detectedPhaseKey.value = calculateCurrentPhase();
    applyAtmosphereToDOM(currentPhaseKey.value, isDarkModeRef.value);
  };

  const setCircadianMode = (mode) => {
    if (mode === 'auto' || CIRCADIAN_PHASES[mode]) {
      activeCircadianMode.value = mode;
      try {
        localStorage.setItem('habuilt_circadian_mode', mode);
      } catch (_) {}
      refreshAtmosphere();
    }
  };

  const setSolarCalculationMode = (mode) => {
    if (mode === 'astronomical' || mode === 'fixed') {
      solarCalculationMode.value = mode;
      try {
        localStorage.setItem('habuilt_circadian_calc_mode', mode);
      } catch (_) {}
      refreshAtmosphere();
    }
  };

  const setCoordinates = (lat, lon, cityName = 'Custom Location') => {
    userCoordinates.value = {
      lat: Number(lat) || 30.7333,
      lon: Number(lon) || 76.7794,
      city: cityName,
    };
    try {
      localStorage.setItem('habuilt_circadian_coords', JSON.stringify(userCoordinates.value));
    } catch (_) {}
    refreshAtmosphere();
  };

  const detectUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return reject(new Error('Geolocation is not supported in this browser.'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          setCoordinates(lat, lon, 'GPS Detected Location');
          resolve({ lat, lon, city: 'GPS Detected Location' });
        },
        (err) => {
          reject(err);
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    });
  };

  const cycleNextPhase = () => {
    const keys = ['auto', 'dawn', 'day', 'dusk', 'night'];
    const idx = keys.indexOf(activeCircadianMode.value);
    const next = keys[(idx + 1) % keys.length];
    setCircadianMode(next);
    return currentPhase.value;
  };

  onMounted(() => {
    try {
      const saved = localStorage.getItem('habuilt_circadian_mode');
      if (saved && (saved === 'auto' || CIRCADIAN_PHASES[saved])) {
        activeCircadianMode.value = saved;
      }
      const savedCalcMode = localStorage.getItem('habuilt_circadian_calc_mode');
      if (savedCalcMode) {
        solarCalculationMode.value = savedCalcMode;
      }
      const savedCoords = localStorage.getItem('habuilt_circadian_coords');
      if (savedCoords) {
        userCoordinates.value = JSON.parse(savedCoords);
      }
    } catch (_) {}

    refreshAtmosphere();

    // Check every 60 seconds
    timerId = setInterval(() => {
      refreshAtmosphere();
    }, 60000);

    // Refresh when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshAtmosphere();
    });
  });

  watch(isDarkModeRef, () => {
    refreshAtmosphere();
  });

  onUnmounted(() => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  });

  return {
    CIRCADIAN_PHASES,
    SOLAR_CITY_PRESETS,
    activeCircadianMode,
    currentPhaseKey,
    currentPhase,
    solarCalculationMode,
    userCoordinates,
    computedSolarSchedule,
    setCircadianMode,
    setSolarCalculationMode,
    setCoordinates,
    detectUserLocation,
    cycleNextPhase,
    refreshAtmosphere,
    computeAstronomicalSolarTimes,
  };
}

