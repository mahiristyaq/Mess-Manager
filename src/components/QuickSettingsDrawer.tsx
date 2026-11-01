import React, { useEffect } from 'react';
import { useMess } from '../context/MessContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { CurrencyCode } from '../utils/helpers';
import { PWAInstallButton } from './PWAInstallButton';
import {
  X,
  SlidersHorizontal,
  Languages,
  Check,
  Laptop,
  Moon,
  Sun,
  RefreshCw,
  Lock,
  Unlock,
  Settings,
  LogOut,
  Copy,
  Building,
  ChevronDown,
  Trash2,
} from 'lucide-react';

export const QuickSettingsDrawer: React.FC = () => {
  const {
    isQuickSettingsOpen,
    closeQuickSettings,
    messName,
    messCode,
    activeMonth,
    syncState,
    syncNow,
    isAdminUnlocked,
    openSettings,
    openAdminGate,
    lockAdmin,
    switchMess,
    deleteMess,
    requestLeave,
    showToast,
    askConfirm,
  } = useMess();

  const {
    language,
    setLanguage,
    currency,
    setCurrency,
    currencies,
    t,
    getMonthLabel,
  } = useLanguage();

  const { theme, setTheme, resolvedTheme } = useTheme();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQuickSettingsOpen) {
        closeQuickSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSettingsOpen, closeQuickSettings]);


  if (!isQuickSettingsOpen) return null;

  const copyCode = () => {
    if (messCode) {
      navigator.clipboard.writeText(messCode);
      showToast(t.codeCopied(messCode));
    }
  };

  const handleSelectCurrency = (code: CurrencyCode) => {
    setCurrency(code);
    showToast(t.currencyChanged(code));
  };

  const handleOpenFullAdmin = () => {
    closeQuickSettings();
    openSettings();
  };

  const handleUnlockAdmin = () => {
    closeQuickSettings();
    openAdminGate('login', () => openSettings());
  };

  const isLiveSynced = syncState === 'synced';
  const isSyncing = syncState === 'syncing';

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden overscroll-none touch-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 touch-none"
        onClick={closeQuickSettings}
        aria-hidden="true"
      />

      {/* Drawer Container: Full height from top on mobile, Slide-Over Drawer on Desktop (>=640px) */}
      <div
        className="relative z-10 w-full sm:w-[440px] max-w-full bg-[var(--modal-card)] text-[var(--text-main)] border-0 sm:border-l border-[var(--card-border)] rounded-none sm:rounded-l-[28px] shadow-2xl flex flex-col h-full max-h-full mt-0 top-0 transition-transform animate-in slide-in-from-right duration-300 overscroll-contain touch-pan-y"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-settings-title"
      >
        {/* Drawer Header (starts at phone top) */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-200 dark:border-slate-800/80 shrink-0 sticky top-0 bg-[var(--modal-card)] z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <SlidersHorizontal className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 id="quick-settings-title" className="text-base sm:text-lg font-extrabold truncate leading-tight">
                {t.quickSettingsTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {t.quickSettingsSub}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeQuickSettings}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/90 border border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center cursor-pointer transition-colors active:scale-95 shadow-xs"
            aria-label={t.close}
          >
            <X className="w-5 h-5 text-slate-800 dark:text-slate-200" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-3.5 sm:p-4 pb-3 sm:pb-4 overflow-y-auto space-y-4 flex-1 min-w-0 overscroll-contain touch-pan-y">
          {/* Active Mess Info Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between gap-2.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-extrabold text-sm truncate text-slate-900 dark:text-slate-100">
                  {messName || t.appName}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {t.monthLabelField}: <span className="font-bold text-emerald-700 dark:text-emerald-400">{getMonthLabel(activeMonth)}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={copyCode}
              className="px-2.5 py-1.5 rounded-xl border border-emerald-500/40 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-mono text-xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-50 active:scale-95 transition-all shrink-0"
              title={language === 'en' ? 'Tap to copy mess code' : 'ট্যাপ করে কোড কপি করুন'}
            >
              <span className="font-bold">{messCode || '-'}</span>
              <Copy className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          {/* 1. Language Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Languages className="w-4 h-4 text-emerald-500" />
              <span>{language === 'bn' ? 'ভাষা (Language)' : 'Language (ভাষা)'}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`min-h-[48px] px-3 py-2.5 rounded-2xl border font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-black">বাং</span>
                  <span>বাংলা</span>
                </div>
                {language === 'bn' && <Check className="w-4 h-4 text-white" />}
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`min-h-[48px] px-3 py-2.5 rounded-2xl border font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-black">EN</span>
                  <span>English</span>
                </div>
                {language === 'en' && <Check className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>

          {/* 2. Currency Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <span className="text-amber-500 font-black text-sm">৳/$</span>
              <span>{t.currency}</span>
            </label>
            <div className="relative">
              <select
                value={currency}
                onChange={e => handleSelectCurrency(e.target.value as CurrencyCode)}
                className="field w-full min-h-[48px] py-2.5 px-3.5 pr-10 rounded-2xl font-bold text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 cursor-pointer appearance-none focus:border-emerald-500 shadow-xs"
                aria-label={t.currency}
              >
                {(Object.keys(currencies) as CurrencyCode[]).map(cCode => {
                  const c = currencies[cCode];
                  return (
                    <option key={cCode} value={cCode} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                      {language === 'bn' ? c.nameBn : c.nameEn}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 dark:text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Appearance Theme */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Laptop className="w-4 h-4 text-sky-500" />
              <span>{t.appearanceTitle}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* System */}
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`min-h-[50px] p-2 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  theme === 'system'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/60'
                }`}
              >
                <Laptop className="w-4 h-4 text-sky-400" />
                <span className="truncate">{t.themeSystem}</span>
              </button>

              {/* Dark */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`min-h-[50px] p-2 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/60'
                }`}
              >
                <Moon className="w-4 h-4 text-amber-400" />
                <span className="truncate">{t.themeDark}</span>
              </button>

              {/* Light */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`min-h-[50px] p-2 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                  theme === 'light'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/60'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="truncate">{t.themeLight}</span>
              </button>
            </div>
          </div>

          {/* 4. Session & Account Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-emerald-500" />
              <span>{t.sessionAndAccount}</span>
            </label>

            <div className="space-y-2">
              {/* Manual Data Sync Button */}
              <button
                type="button"
                onClick={() => {
                  syncNow();
                  showToast(t.syncNow);
                }}
                disabled={isSyncing}
                className="w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="font-bold truncate">{t.onlineSyncBtn || t.syncNow}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.manualSyncDesc}</p>
                  </div>
                </div>

                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  isLiveSynced
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
                }`}>
                  {isLiveSynced ? t.syncedShort : isSyncing ? t.syncing : t.offline}
                </span>
              </button>

              {/* Admin Panel Row */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAdminUnlocked ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm truncate">{t.adminPanel}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{t.adminPanelSub}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                    isAdminUnlocked
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                  }`}>
                    {isAdminUnlocked ? t.adminUnlockedBadge : t.lockAdminBtn}
                  </span>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  {isAdminUnlocked ? (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenFullAdmin}
                        className="btn primary flex-1 min-h-[44px] text-xs font-bold shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>{t.adminSettingsTitle}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          lockAdmin();
                          showToast(t.lockAdminBtn);
                        }}
                        className="btn text-xs min-h-[44px] px-3 text-red-500 hover:border-red-500/50"
                        title={t.lockAdminPrompt}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t.lockAdminPrompt}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleUnlockAdmin}
                      className="btn primary w-full min-h-[44px] text-xs font-bold shadow-sm"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{t.unlockAdminPrompt}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Switch Mess */}
              <button
                type="button"
                onClick={() => {
                  closeQuickSettings();
                  switchMess();
                }}
                className="w-full min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-between transition-all cursor-pointer active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold">{t.switchMessPrompt}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">({messCode || '-'})</span>
              </button>

              {/* Action Buttons Row: Logout & Leave Request */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    closeQuickSettings();
                    switchMess();
                  }}
                  className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.logoutBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    askConfirm(t.leaveMessDesc, () => {
                      closeQuickSettings();
                      requestLeave(messName || 'Member');
                    });
                  }}
                  className="min-h-[38px] px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">{t.leaveMessPrompt}</span>
                </button>
              </div>

              {/* PWA Install inside Drawer */}
              <div className="pt-1">
                <PWAInstallButton variant="banner" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
