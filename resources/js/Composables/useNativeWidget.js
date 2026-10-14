import { Capacitor } from '@capacitor/core';
import { getZoetiCoachConfig } from '@/lib/zoetiCoachBridge';

export function useNativeWidget() {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  const syncNativeWidget = async ({ userId, habits, schedule, streak, todayPoints }) => {
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

  return {
    isNative,
    syncNativeWidget,
    getNativeWidgetData,
  };
}
