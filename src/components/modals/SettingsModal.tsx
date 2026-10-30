import React, { useState, useEffect } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { MessConfig, Member } from '../../types';
import { currentMonth, hashPassword } from '../../utils/helpers';
import {
  Settings,
  X,
  Plus,
  Trash2,
  RefreshCw,
  KeyRound,
  Lock,
  RotateCcw,
  Check,
  Building,
  Calendar,
  Languages,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    closeSettings,
    data,
    messName,
    messCode,
    switchMess,
    deleteMess,
    handleLeaveRequest,
    saveSettings,
    syncNow,
    openAdminGate,
    lockAdmin,
    resetCurrentMonth,
    startNewMonth,
    askConfirm,
    showToast,
  } = useMess();

  const { t, language, setLanguage, currency, setCurrency, currencies } = useLanguage();
  const { theme, setTheme } = useTheme();

  const [sMessName, setSMessName] = useState<string>('');
  const [sMonth, setSMonth] = useState<string>('');
  const [sFixedEnabled, setSFixedEnabled] = useState<boolean>(false);
  const [sFixed, setSFixed] = useState<string>('0');
  const [memberDraft, setMemberDraft] = useState<{ orig: string; name: string }[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [delCode, setDelCode] = useState<string>('');
  const [delPass, setDelPass] = useState<string>('');

  useEffect(() => {
    if (isSettingsOpen) {
      setSMessName(data.config.messName || messName);
      setSMonth(data.config.month || currentMonth());
      setSFixedEnabled(Boolean(data.config.fixedCostEnabled));
      setSFixed(String(data.config.fixedCost || 0));
      setMemberDraft(data.members.map(m => ({ orig: m.name, name: m.name })));
    } else {
      setIsDeleting(false);
      setDelCode('');
      setDelPass('');
    }
  }, [isSettingsOpen, data.config, messName, data.members]);

  if (!isSettingsOpen) return null;

  const handleMemberChange = (index: number, val: string) => {
    setMemberDraft(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], name: val };
      return copy;
    });
  };

  const handleAddMember = () => {
    setMemberDraft(prev => [...prev, { orig: '', name: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    if (memberDraft.length <= 1) {
      showToast(t.minOneMemberError);
      return;
    }
    setMemberDraft(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const cleanMembers: Member[] = memberDraft.map(x => ({ name: x.name.trim() }));
    if (!cleanMembers.length) {
      showToast(t.minOneMemberError);
      return;
    }
    if (cleanMembers.some(x => !x.name)) {
      showToast(t.emptyMemberNameError);
      return;
    }
    if (new Set(cleanMembers.map(m => m.name)).size !== cleanMembers.length) {
      showToast(t.duplicateMemberError);
      return;
    }

    const newConfig: MessConfig = {
      ...data.config,
      messName: sMessName.trim() || (language === 'en' ? 'Mess Manager' : 'মেস ম্যানেজার'),
      month: sMonth || currentMonth(),
      fixedCostEnabled: sFixedEnabled,
      fixedCost: sFixedEnabled ? Math.max(0, Number(sFixed) || 0) : 0,
    };

    saveSettings(newConfig, cleanMembers, memberDraft);
    showToast(t.settingsSavedDone);
  };

  const handleResetMonth = () => {
    askConfirm(t.confirmResetMonth, () => {
      resetCurrentMonth();
      showToast(t.monthResetDone);
    });
  };

  const handleStartNewMonth = () => {
    startNewMonth();
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-lg backdrop-filter z-50 flex items-start sm:items-center justify-center p-2.5 sm:p-5 overflow-hidden pt-3 sm:pt-6 overscroll-none touch-none"
      onClick={e => {
        if (e.target === e.currentTarget) closeSettings();
      }}
    >
      <div
        className="w-[90vw] md:w-full md:max-w-xs max-h-[calc(100dvh-28px)] overflow-y-auto modal-card bg-white dark:bg-[#0e1726]/95 border border-slate-200 dark:border-slate-700/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 pb-3 sm:pb-4 shadow-2xl space-y-3.5 box-border overscroll-contain touch-pan-y"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold truncate">{t.adminSettingsTitle}</h3>
              <p className="muted text-xs truncate">{t.adminSettingsSub}</p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors"
            onClick={closeSettings}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Mess Info */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t.currentMess}:</p>
            <p className="font-bold text-emerald-700 dark:text-emerald-300 text-xs truncate mt-0.5">
              {data.config.messName || messName} <span className="text-slate-600 dark:text-slate-400 font-normal">({t.codeLabel}: {messCode})</span>
            </p>
          </div>
          <button
            type="button"
            className="btn text-xs py-1.5 px-3 shrink-0"
            onClick={switchMess}
          >
            {t.changeMess}
          </button>
        </div>

        {/* Theme & Language Preferences Card */}
        <div className="bg-slate-50 dark:bg-slate-900/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          {/* Theme Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-sky-500" />
              <span>{t.theme}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'system'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="truncate">{language === 'en' ? 'System' : 'ডিভাইস'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span className="truncate">{language === 'en' ? 'Dark' : 'ডার্ক'}</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  theme === 'light'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="truncate">{language === 'en' ? 'Light' : 'লাইট'}</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.lang}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  language === 'bn'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                <span>বাংলা (Bangla)</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  language === 'en'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Multi-Currency Selector (Point 9) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <span className="text-amber-500 font-black text-xs">৳/$</span>
              <span>{t.currency}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(currencies) as (keyof typeof currencies)[]).map(cCode => {
                const c = currencies[cCode];
                const isSelected = currency === cCode;
                return (
                  <button
                    key={cCode}
                    type="button"
                    onClick={() => {
                      setCurrency(cCode);
                      showToast(t.currencyChanged(cCode));
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span className="text-amber-400 font-extrabold">{c.symbol}</span>
                      <span>{cCode}</span>
                    </span>
                    {cCode === 'BDT' && (
                      <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                        {language === 'en' ? 'Default' : 'ডিফল্ট'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mess Name and Month */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs text-slate-800 dark:text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 opacity-70" />
              <span>{t.messNameLabel}</span>
            </label>
            <input
              type="text"
              value={sMessName}
              onChange={e => setSMessName(e.target.value)}
              placeholder={t.messNamePlaceholder}
              className="field py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-[#091421]"
            />
          </div>

          <div>
            <label className="text-xs text-slate-800 dark:text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>{t.monthLabelField}</span>
            </label>
            <input
              type="month"
              value={sMonth}
              onChange={e => setSMonth(e.target.value)}
              className="field py-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-[#091421]"
            />
          </div>
        </div>



        {/* Fixed Costs Card */}
        <div className="card p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
              {t.fixedCostHeader}
            </p>
            <label className="flex items-center gap-1.5 mb-0 text-xs cursor-pointer text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={sFixedEnabled}
                onChange={e => setSFixedEnabled(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
              <span>{t.fixedCostEnabledLabel}</span>
            </label>
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={sFixed}
            disabled={!sFixedEnabled}
            onChange={e => setSFixed(e.target.value)}
            placeholder={t.fixedCostPlaceholder}
            className={`field py-1.5 text-xs ${!sFixedEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Member List Manager */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <label className="mb-0 text-xs text-slate-700 dark:text-slate-300 font-medium">
              {t.memberListLabel(memberDraft.length)}
            </label>
            <button
              type="button"
              className="btn text-xs py-1.5 px-2.5 hover:border-emerald-600"
              onClick={handleAddMember}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.addMemberBtn}</span>
            </button>
          </div>

          <div className="space-y-1.5 member-scroll-box pr-1">
            {memberDraft.map((item, i) => (
              <div key={i} className="member-setting-row" style={{ gridTemplateColumns: 'minmax(0, 1fr) 42px' }}>
                <input
                  type="text"
                  value={item.name}
                  maxLength={60}
                  onChange={e => handleMemberChange(i, e.target.value)}
                  placeholder={t.memberNamePlaceholder(i + 1)}
                  className="field py-1.5 text-xs"
                />
                <button
                  type="button"
                  className="btn danger py-2 px-2.5"
                  title={t.delete}
                  onClick={() => handleRemoveMember(i)}
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Leave Requests (Visible to Manager) */}
        {Array.isArray(data.pendingLeaveRequests) && data.pendingLeaveRequests.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="text-xs font-bold text-amber-600 dark:text-amber-400 block">
              {t.pendingLeaveRequests} ({data.pendingLeaveRequests.length})
            </label>
            <div className="space-y-2">
              {data.pendingLeaveRequests.map((memName, idx) => (
                <div key={idx} className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{memName}</span>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleLeaveRequest(memName, true)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer shadow-xs"
                    >
                      {t.approveLeave}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLeaveRequest(memName, false)}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer shadow-xs"
                    >
                      {t.rejectLeave}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Tools */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 space-y-2">
          {/* Compact Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {/* 1. Sync */}
            <button
              type="button"
              className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              onClick={syncNow}
              title={t.onlineSyncBtn}
            >
              <RefreshCw className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{language === 'en' ? 'Data Sync' : 'অনলাইন সিঙ্ক'}</span>
            </button>

            {/* 2. Password */}
            <button
              type="button"
              className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              onClick={() => openAdminGate('change')}
              title={t.changePasswordBtn}
            >
              <KeyRound className="w-3 h-3 text-sky-500 shrink-0" />
              <span className="truncate">{language === 'en' ? 'Change PIN' : 'পিন পরিবর্তন'}</span>
            </button>

            {/* 3. Lock */}
            <button
              type="button"
              className="py-1.5 px-2 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              onClick={lockAdmin}
              title={t.lockAdminBtn}
            >
              <Lock className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{language === 'en' ? 'Lock Admin' : 'লক করুন'}</span>
            </button>

            {/* 4. New Month */}
            <button
              type="button"
              className="py-1.5 px-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
              onClick={handleStartNewMonth}
              title={language === 'en' ? 'Start New Month' : 'নতুন মাস শুরু'}
            >
              <RotateCcw className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">{language === 'en' ? 'New Month' : 'নতুন মাস'}</span>
            </button>
          </div>

          {/* 5. Mess Delete - Secure flow */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
            {!isDeleting ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-[10px] text-red-500/60 hover:text-red-600 dark:hover:text-red-400 font-medium inline-flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded hover:bg-red-500/5 transition-colors"
                  onClick={() => setIsDeleting(true)}
                  title={language === 'en' ? 'Delete Mess' : 'মেস মুছে ফেলুন'}
                >
                  <Trash2 className="w-2.5 h-2.5 shrink-0 opacity-80" />
                  <span>{language === 'en' ? 'Delete Mess' : 'মেস ডিলিট'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                <input
                  type="text"
                  placeholder={language === 'en' ? 'Enter Mess Code' : 'মেস কোড লিখুন'}
                  value={delCode}
                  onChange={e => setDelCode(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border dark:bg-slate-800"
                />
                <input
                  type="password"
                  placeholder={language === 'en' ? 'Manager Password' : 'ম্যানেজার পাসওয়ার্ড'}
                  value={delPass}
                  onChange={e => setDelPass(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border dark:bg-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsDeleting(false)} className="text-[10px] px-2 py-1 rounded hover:bg-slate-200">Cancel</button>
                  <button
                    onClick={async () => {
                      if (delCode !== messCode) {
                        showToast(t.wrongMessCode);
                        return;
                      }
                      const hashed = await hashPassword(delPass);
                      if (hashed !== data.config.adminPasswordHash) {
                        showToast(t.wrongPassword);
                        return;
                      }
                      askConfirm(t.confirmDeleteAccount, () => {
                        closeSettings();
                        deleteMess();
                      });
                    }}
                    className="text-[10px] px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          className="btn primary w-full py-2.5 text-sm font-bold shadow-lg"
          onClick={handleSave}
        >
          <Check className="w-4 h-4" />
          <span>{t.saveSettingsBtn}</span>
        </button>
      </div>
    </div>
  );
};
