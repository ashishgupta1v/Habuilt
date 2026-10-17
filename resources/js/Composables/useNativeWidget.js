import { Capacitor } from '@capacitor/core';
import { getZoetiCoachConfig, enqueueZoetiCoachEvent, flushZoetiCoachQueue } from '@/lib/zoetiCoachBridge';

export function useNativeWidget() {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  const syncNativeWidget = async ({
    userId,
    habits,
    schedule,
    streak,
    todayPoints,
    adherenceRate,
    complianceStatus,
    clinicalDirective,
  }) => {
    if (!isNative) return;

    try {
      const plugins = Capacitor.Plugins || (window.Capacitor && window.Capacitor.Plugins);
      const HabuiltWidget = plugins?.HabuiltWidget;
      const { url: zoetiUrl, token: zoetiToken } = getZoetiCoachConfig();

      if (HabuiltWidget && typeof HabuiltWidget.syncWidgetData === 'function') {
        await HabuiltWidget.syncWidgetData({
          userId: userId || 'guest',
          habitsJson: JSON.stringify(habits || []),
          scheduleJson: JSON.stringify(schedule || {}),
          streak: Number.isFinite(Number(streak)) ? Number(streak) : 0,
          todayPoints: Number.isFinite(Number(todayPoints)) ? Number(todayPoints) : 0,
          adherenceRate: Number.isFinite(Number(adherenceRate)) ? Number(adherenceRate) : 0,
          complianceStatus: String(complianceStatus || 'Active Protocol'),
          clinicalDirective: String(clinicalDirective || ''),
          zoeticoachUrl: zoetiUrl,
          zoeticoachToken: zoetiToken,
        });
      }
    } catch (err) {
      console.warn('Native widget sync warning:', err);
    }
  };

  const getNativeWidgetData = async () => {
    if (!isNative) return null;
    try {
      const plugins = Capacitor.Plugins || (window.Capacitor && window.Capacitor.Plugins);
      const HabuiltWidget = plugins?.HabuiltWidget;
      if (HabuiltWidget && typeof HabuiltWidget.getWidgetData === 'function') {
        return await HabuiltWidget.getWidgetData();
      }
    } catch (err) {
      console.warn('Native widget get warning:', err);
    }
    return null;
  };

  const drainNativeZoetiQueue = async () => {
    if (!isNative) return 0;
    try {
      const plugins = Capacitor.Plugins || (window.Capacitor && window.Capacitor.Plugins);
      const HabuiltWidget = plugins?.HabuiltWidget;
      if (HabuiltWidget && typeof HabuiltWidget.drainNativeZoetiQueue === 'function') {
        const res = await HabuiltWidget.drainNativeZoetiQueue();
        const raw = res?.eventsJson;
        if (raw && raw !== '[]') {
          const events = JSON.parse(raw);
          if (Array.isArray(events) && events.length > 0) {
            console.debug(`[useNativeWidget] Drained ${events.length} native ZoetiCoach events`);
            for (const payload of events) {
              enqueueZoetiCoachEvent(payload);
            }
            flushZoetiCoachQueue().catch(() => {});
            return events.length;
          }
        }
      }
    } catch (err) {
      console.warn('Native widget Zoeti drain warning:', err);
    }
    return 0;
  };

  return {
    isNative,
    syncNativeWidget,
    getNativeWidgetData,
    drainNativeZoetiQueue,
  };
}
