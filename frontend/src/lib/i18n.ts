import { useSettingsStore } from '@/store/settings-store';
import en from './locales/en.json';
import ru from './locales/ru.json';

const dictionaries: Record<string, Record<string, string>> = { en, ru };

export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  const dict = dictionaries[language] || dictionaries.en;
  
  const t = (key: string) => {
    return dict[key] || key;
  };
  
  return { t, language };
}
