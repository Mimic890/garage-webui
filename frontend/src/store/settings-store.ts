import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'ru';

interface SettingsStore {
  timezone: string;
  language: Language;
  setTimezone: (timezone: string) => void;
  setLanguage: (language: Language) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: 'en',
      setTimezone: (timezone) => set({ timezone }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
