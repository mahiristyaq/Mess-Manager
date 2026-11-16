import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Language, translations, TranslationSchema } from '../utils/translations';
import {
  formatNumber,
  money,
  getMonthLabel as getMonthStr,
  formatFriendlyDate as formatFriendlyDateStr,
  formatLocalizedDate,
  formatLocalizedTime,
  CurrencyCode,
  CURRENCIES,
} from '../utils/helpers';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  cycleCurrency: () => void;
  currencies: typeof CURRENCIES;
  t: TranslationSchema;
  formatNumber: (val: number | string) => string;
  formatMoney: (amount: number) => string;
  getMonthLabel: (monthVal: string) => string;
  formatFriendlyDate: (dateStr: string) => string;
  formatLocalizedDate: (dateInput: string | number | Date) => string;
  formatLocalizedTime: (timeInput: number | string | Date) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_lang');
      if (saved === 'bn' || saved === 'en') {
        return saved;
      }
    } catch {}
    return 'en'; // Default to English
  });

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('mess_manager_currency');
      if (saved && saved in CURRENCIES) {
        return saved as CurrencyCode;
      }
    } catch {}
    return 'BDT'; // Default to BDT (৳) strictly
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('mess_manager_lang', lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState(prev => {
      const next: Language = prev === 'bn' ? 'en' : 'bn';
      try {
        localStorage.setItem('mess_manager_lang', next);
      } catch {}
      return next;
    });
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem('mess_manager_currency', c);
    } catch {}
  }, []);

  const cycleCurrency = useCallback(() => {
    const list: CurrencyCode[] = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'SAR', 'AED', 'CAD', 'MYR'];
    setCurrencyState(prev => {
      const idx = list.indexOf(prev);
      const next = list[(idx + 1) % list.length];
      try {
        localStorage.setItem('mess_manager_currency', next);
      } catch {}
      return next;
    });
  }, []);

  const t = useMemo(() => translations[language], [language]);

  const fmtNum = useCallback((val: number | string) => formatNumber(val, language), [language]);
  const fmtMoney = useCallback((amt: number) => money(amt, language, currency), [language, currency]);
  const fmtMonth = useCallback((m: string) => getMonthStr(m, language), [language]);
  const fmtDate = useCallback((d: string) => formatFriendlyDateStr(d, language), [language]);
  const fmtLocDate = useCallback((d: string | number | Date) => formatLocalizedDate(d, language), [language]);
  const fmtLocTime = useCallback((tm: number | string | Date) => formatLocalizedTime(tm, language), [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        currency,
        setCurrency,
        cycleCurrency,
        currencies: CURRENCIES,
        t,
        formatNumber: fmtNum,
        formatMoney: fmtMoney,
        getMonthLabel: fmtMonth,
        formatFriendlyDate: fmtDate,
        formatLocalizedDate: fmtLocDate,
        formatLocalizedTime: fmtLocTime,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
