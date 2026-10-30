import React from 'react';
import { useMess } from '../context/MessContext';
import { useLanguage } from '../context/LanguageContext';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  ChevronDown,
  SlidersHorizontal,
  Unlock,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    messName,
    activeTab,
    canGoBack,
    goBack,
    activeMonth,
    setActiveMonth,
    availableMonths,
    syncState,
    syncNow,
    openQuickSettings,
    isAdminUnlocked,
    showToast,
  } = useMess();

  const {
    t,
    getMonthLabel,
  } = useLanguage();

  const monthLabel = getMonthLabel(activeMonth);

  const isLiveSynced = syncState === 'synced';
  const isSyncing = syncState === 'syncing';

  return (
    <header className="sticky top-0 z-30 app-header bg-[var(--header-bg)] border-b border-[var(--header-border)] px-3 sm:px-5 py-2 backdrop-blur-xl w-full max-w-full overflow-hidden transition-all shadow-sm">
      <div className="flex items-center justify-between gap-2 w-full max-w-full min-w-0">
        {/* Left: Brand Logo / Back Button, Mess Name & Month/Code Row */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          {activeTab !== 'home' ? (
            <button
              type="button"
              onClick={goBack}
              aria-label={t.goBack}
              title={t.goBack}
              className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all active:scale-90 cursor-pointer shadow-xs group"
            >
              <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          ) : (
            <div className="brand-mark w-8 h-8 sm:w-9 sm:h-9 shrink-0 shadow-[0_2px_10px_rgba(5,150,105,0.2)] rounded-xl">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="flex items-center gap-2 min-w-0 flex-1" style={{ fontSize: '13px' }}>
            <h1 className="truncate max-w-[120px] sm:max-w-[180px] leading-tight text-slate-900 dark:text-slate-100" style={{ fontSize: '13px', fontWeight: 800 }} title={messName || t.appName}>
              {messName || t.appName}
            </h1>

            {/* Month Selector Chip */}
            <div className="shrink-0">
              <div className="relative inline-flex items-center">
                <label
                  htmlFor="header-month-picker"
                  className="month-chip py-0.5 px-1.5 hover:border-emerald-500/80 cursor-pointer flex items-center gap-1 transition-colors active:scale-95 shadow-2xs font-semibold"
                  style={{ fontSize: '11px', lineHeight: 'normal' }}
                  title={t.monthPickerTitle}
                >
                  <Calendar className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[80px] sm:max-w-none">{monthLabel}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-60 shrink-0" />
                </label>
                <select
                  id="header-month-picker"
                  value={activeMonth}
                  onChange={e => {
                    const m = e.target.value;
                    setActiveMonth(m);
                    showToast(t.monthActivated(getMonthLabel(m)));
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                  style={{ fontSize: '11px' }}
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {getMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Online/Offline Status Badge + Single Settings Menu Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* Status Badge */}
          <button
            type="button"
            onClick={syncNow}
            className={`inline-flex items-center gap-1.5 py-1 px-2 sm:px-2.5 rounded-full font-semibold border transition-all cursor-pointer shrink-0 ${
              isLiveSynced
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : isSyncing
                ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30'
                : syncState === 'error'
                ? 'bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
            }`}
            style={{ fontSize: '11px', lineHeight: '15px' }}
            title={t.syncNow}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isLiveSynced
                  ? 'bg-emerald-500 shadow-[0_0_6px_#34d399]'
                  : isSyncing
                  ? 'bg-sky-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
            <span className="hidden xs:inline">
              {isLiveSynced
                ? t.liveSynced
                : isSyncing
                ? t.syncing
                : syncState === 'error'
                ? t.firebaseLocked
                : t.offline}
            </span>
          </button>

          {/* Consolidated Settings & Menu Drawer Trigger */}
          <button
            type="button"
            onClick={openQuickSettings}
            className={`w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer transition-all active:scale-95 relative border shadow-xs ${
              isAdminUnlocked
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/60 dark:text-emerald-300'
                : 'bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/90 border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}
            title={t.quickSettingsTitle}
            aria-label={t.quickSettingsTitle}
          >
            <SlidersHorizontal className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isAdminUnlocked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`} />
            {isAdminUnlocked && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <Unlock className="w-2 h-2 text-white" />
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
