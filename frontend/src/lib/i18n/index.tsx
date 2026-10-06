import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import enTranslations from './en.json';
import esTranslations from './es.json';

export type Locale = 'en' | 'es';

type TranslationDictionary = Record<string, any>;

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en: enTranslations,
  es: esTranslations,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultText?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (key, defaultText) => defaultText || key,
});

const STORAGE_KEY = 'worksphere_locale';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    if (saved && (saved === 'en' || saved === 'es')) return saved;
    const browserLang = navigator.language.slice(0, 2);
    return browserLang === 'es' ? 'es' : 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  const t = (path: string, defaultText?: string): string => {
    const dict = DICTIONARIES[locale] || DICTIONARIES.en;
    const parts = path.split('.');
    let current: any = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary
        let fallbackCurrent: any = DICTIONARIES.en;
        for (const fbPart of parts) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbPart in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbPart];
          } else {
            return defaultText || path;
          }
        }
        return typeof fallbackCurrent === 'string' ? fallbackCurrent : defaultText || path;
      }
    }

    return typeof current === 'string' ? current : defaultText || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
export default useTranslation;
