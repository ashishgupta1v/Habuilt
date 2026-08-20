import { Capacitor } from '@capacitor/core';

export function useNativeWidget() {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

  const syncNativeWidget = async ({ userId, habits, schedule, streak, todayPoints }) => {
    if (!isNative) return;

    try {
      const plugins = Capacitor.Plugins || (window.Capacitor && window.Capacitor.Plugins);
      const HabuiltWidget = plugins?.HabuiltWidget;

      if (HabuiltWidget && typeof HabuiltWidget.syncWidgetData === 'function') {
        await HabuiltWidget.syncWidgetData({
          userId: userId || 'guest',
          habitsJson: JSON.stringify(habits || []),
          scheduleJson: JSON.stringify(schedule || {}),
          streak: Number.isFinite(Number(streak)) ? Number(streak) : 0,
          todayPoints: Number.isFinite(Number(todayPoints)) ? Number(todayPoints) : 0,
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
