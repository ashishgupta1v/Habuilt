import { ref, computed, unref, watch } from 'vue';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const DEFAULT_CATEGORIES = [
  { id: 'fitness', label: 'Fitness & Mobility', accentColor: '#10b981', icon: 'Dumbbell', defaultPoints: 2, isCustom: false },
  { id: 'nutrition', label: 'Nutrition & Hydration', accentColor: '#f59e0b', icon: 'Apple', defaultPoints: 1, isCustom: false },
  { id: 'work', label: 'Deep Work & Code', accentColor: '#3b82f6', icon: 'Briefcase', defaultPoints: 2, isCustom: false },
  { id: 'family', label: 'Family & Connection', accentColor: '#ec4899', icon: 'Heart', defaultPoints: 2, isCustom: false },
  { id: 'rest', label: 'Rest & Recovery', accentColor: '#8b5cf6', icon: 'Bed', defaultPoints: 2, isCustom: false },
  { id: 'ops', label: 'Protocols & Ops', accentColor: '#06b6d4', icon: 'Activity', defaultPoints: 1, isCustom: false },
];

export const CATEGORY_ICON_OPTIONS = [
  'Dumbbell', 'Apple', 'Briefcase', 'Heart', 'Bed', 'Activity',
  'Zap', 'Sun', 'Moon', 'Book', 'Shield', 'Flame', 'Sparkles',
  'Compass', 'Crown', 'Target', 'Coffee', 'Users'
];

export const COLOR_PALETTE_PRESETS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#eab308', // Gold
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Purple
  '#64748b', // Slate
];

/**
 * Composable for dynamic category management and protocol-linked habit reordering
 */
export function useCategoryTaxonomy(protocolId = 'default', userId = 'guest') {
  const getProtoId = () => {
    const raw = typeof protocolId === 'function' ? protocolId() : unref(protocolId);
    return String(raw || 'default');
  };
  const getUserId = () => {
    const raw = typeof userId === 'function' ? userId() : unref(userId);
    return String(raw || 'guest');
  };

  const getCatStorageKey = () => `habuilt_protocol_categories_${getProtoId()}_${getUserId()}`;
  const getOrderStorageKey = () => `habuilt_protocol_habit_order_${getProtoId()}_${getUserId()}`;

  const loadInitialCategories = () => {
    if (typeof localStorage === 'undefined') return [...DEFAULT_CATEGORIES];
    try {
      const stored = localStorage.getItem(getCatStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map(c => c.id));
          const missingDefaults = DEFAULT_CATEGORIES.filter(d => !existingIds.has(d.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {
      console.warn('[useCategoryTaxonomy] Error reading stored categories:', e);
    }
    return [...DEFAULT_CATEGORIES];
  };

  const categories = ref(loadInitialCategories());

  const reloadCategories = () => {
    categories.value = loadInitialCategories();
  };

  if (typeof protocolId === 'function' || typeof userId === 'function') {
    watch([() => getProtoId(), () => getUserId()], () => {
      reloadCategories();
    });
  }

  const persistCategories = async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getCatStorageKey(), JSON.stringify(categories.value));
    }

    const effUser = getUserId();
    if (isSupabaseConfigured() && effUser !== 'guest' && effUser !== 'ashish' && effUser !== 'jyoti') {
      try {
        await supabase.from('user_settings').upsert({
          user_id: effUser,
          enhanced_state: {
            customCategories: categories.value,
          },
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.debug('[useCategoryTaxonomy] Cloud sync fallback:', e);
      }
    }
  };

  const saveCategory = (catData) => {
    if (!catData || !catData.label) return false;
    const cleanId = (catData.id || catData.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).trim();
    const existingIndex = categories.value.findIndex(c => c.id === cleanId);

    const categoryObj = {
      id: cleanId,
      label: catData.label.trim(),
      accentColor: catData.accentColor || '#3b82f6',
      icon: catData.icon || 'Activity',
      defaultPoints: Number(catData.defaultPoints) || 1,
      isCustom: existingIndex >= 0 ? categories.value[existingIndex].isCustom !== false : true
    };

    if (existingIndex >= 0) {
      categories.value[existingIndex] = {
        ...categories.value[existingIndex],
        ...categoryObj
      };
    } else {
      categories.value.push(categoryObj);
    }

    persistCategories();
    return categoryObj;
  };

  const deleteCategory = (catId) => {
    categories.value = categories.value.filter(c => c.id !== catId);
    if (categories.value.length === 0) {
      categories.value = [...DEFAULT_CATEGORIES];
    }
    persistCategories();
  };

  const resetToDefaults = () => {
    categories.value = [...DEFAULT_CATEGORIES];
    persistCategories();
  };

  const getCategoryMeta = (catId) => {
    if (!catId) return DEFAULT_CATEGORIES[5]; // ops
    const found = categories.value.find(c => c.id === catId);
    if (found) return found;
    const defaultFound = DEFAULT_CATEGORIES.find(c => c.id === catId);
    if (defaultFound) return defaultFound;
    return {
      id: catId,
      label: catId.charAt(0).toUpperCase() + catId.slice(1),
      accentColor: '#06b6d4',
      icon: 'Activity',
      defaultPoints: 1,
      isCustom: true
    };
  };

  // ── Habit Reordering Engine ──
  const getSavedHabitOrder = () => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = localStorage.getItem(getOrderStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[useCategoryTaxonomy] Error reading saved habit order:', e);
    }
    return [];
  };

  const persistHabitOrder = (orderedIds) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getOrderStorageKey(), JSON.stringify(orderedIds));
    }
  };

  const applyHabitOrder = (habitsList) => {
    if (!Array.isArray(habitsList) || habitsList.length <= 1) return habitsList;
    const savedOrder = getSavedHabitOrder();
    if (savedOrder.length === 0) return habitsList;

    const orderMap = new Map();
    savedOrder.forEach((id, index) => orderMap.set(String(id), index));

    const sorted = [...habitsList].sort((a, b) => {
      const posA = orderMap.has(String(a.id)) ? orderMap.get(String(a.id)) : 9999;
      const posB = orderMap.has(String(b.id)) ? orderMap.get(String(b.id)) : 9999;
      return posA - posB;
    });

    return sorted;
  };

  const reorderHabits = (habitsList, sourceIdx, targetIdx) => {
    if (!Array.isArray(habitsList) || sourceIdx < 0 || targetIdx < 0 || sourceIdx >= habitsList.length || targetIdx >= habitsList.length) {
      return habitsList;
    }
    const cloned = [...habitsList];
    const [movedItem] = cloned.splice(sourceIdx, 1);
    cloned.splice(targetIdx, 0, movedItem);

    const orderedIds = cloned.map(h => String(h.id));
    persistHabitOrder(orderedIds);
    return cloned;
  };

  const moveHabitUp = (habitsList, habitId) => {
    const idx = (habitsList || []).findIndex(h => String(h.id) === String(habitId));
    if (idx > 0) {
      return reorderHabits(habitsList, idx, idx - 1);
    }
    return habitsList;
  };

  const moveHabitDown = (habitsList, habitId) => {
    const idx = (habitsList || []).findIndex(h => String(h.id) === String(habitId));
    if (idx >= 0 && idx < (habitsList || []).length - 1) {
      return reorderHabits(habitsList, idx, idx + 1);
    }
    return habitsList;
  };

  return {
    categories,
    reloadCategories,
    saveCategory,
    deleteCategory,
    resetToDefaults,
    getCategoryMeta,
    applyHabitOrder,
    reorderHabits,
    moveHabitUp,
    moveHabitDown,
    persistHabitOrder,
    getSavedHabitOrder
  };
}
