import React, { useState, useEffect } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { hashPassword } from '../../utils/helpers';
import { Lock, Unlock, Check, X } from 'lucide-react';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30000; // 30 seconds cooldown

export const AdminGateModal: React.FC = () => {
  const {
    isAdminGateOpen,
    adminGateMode,
    closeAdminGate,
    data,
    unlockAdminAndProceed,
    saveSettings,
    showToast,
  } = useMess();

  const { t, language } = useLanguage();

  const [password, setPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutUntil, setLockoutUntil] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isAdminGateOpen) {
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [isAdminGateOpen]);

  useEffect(() => {
    if (lockoutUntil <= Date.now()) {
      setRemainingSeconds(0);
      return;
    }
    const updateTimer = () => {
      const diff = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        setLockoutUntil(0);
        setFailedAttempts(0);
        setError('');
      } else {
        setRemainingSeconds(diff);
      }
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [lockoutUntil]);

  if (!isAdminGateOpen) return null;

  const recordFailedAttempt = () => {
    const nextCount = failedAttempts + 1;
    setFailedAttempts(nextCount);
    if (nextCount >= MAX_FAILED_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_DURATION_MS;
      setLockoutUntil(until);
      setError(
        language === 'en'
          ? 'Too many failed attempts! Locked for 30 seconds.'
          : '৫ বার ভুল পাসওয়ার্ড দেওয়া হয়েছে! নিরাপত্তার জন্য ৩০ সেকেন্ড লক করা হয়েছে।'
      );
    } else {
      setError(t.passIncorrect);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutUntil > Date.now()) {
      return;
    }
    setError('');

    if (adminGateMode === 'change') {
      const supplied = await hashPassword(password);
      if (supplied !== data.config.adminPasswordHash) {
        recordFailedAttempt();
        return;
      }
      if (newPassword.length < 4 || newPassword !== confirmPassword) {
        setError(newPassword.length < 4 ? t.passMin4 : t.passMismatch);
        return;
      }
      const hashed = await hashPassword(newPassword);
      setFailedAttempts(0);
      saveSettings(
        { ...data.config, adminPasswordHash: hashed },
        data.members,
        []
      );
      closeAdminGate();
      showToast(t.passChangedToast);
      return;
    }

    if (adminGateMode === 'setup') {
      if (newPassword.length < 4) {
        setError(t.passMin4);
        return;
      }
      if (newPassword !== confirmPassword) {
        setError(t.passMismatch);
        return;
      }
      const hashed = await hashPassword(newPassword);
      setFailedAttempts(0);
      saveSettings(
        { ...data.config, adminPasswordHash: hashed },
        data.members,
        []
      );
      unlockAdminAndProceed();
      showToast(t.passSetUnlockedToast);
      return;
    }

    // mode === 'login'
    const supplied = await hashPassword(password);
    if (supplied !== data.config.adminPasswordHash) {
      recordFailedAttempt();
      return;
    }

    setFailedAttempts(0);
    unlockAdminAndProceed();
    showToast(t.adminUnlockedToast);
  };

  const title =
    adminGateMode === 'setup'
      ? t.adminGateSetupTitle
      : adminGateMode === 'change'
      ? t.adminGateChangeTitle
      : t.adminGateLoginTitle;

  const sub =
    adminGateMode === 'setup'
      ? t.adminGateSetupSub
      : adminGateMode === 'change'
      ? t.adminGateChangeSub
      : t.adminGateLoginSub;

  return (
    <div
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden transition-all overscroll-none touch-none"
      onClick={e => {
        if (e.target === e.currentTarget) closeAdminGate();
      }}
    >
      <div
        className="w-[90vw] md:w-full md:max-w-sm modal-card bg-white dark:bg-[#0e1726]/95 border border-slate-200 dark:border-slate-700/70 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-3.5 box-border my-auto overscroll-contain touch-pan-y"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold truncate">{title}</h3>
              <p className="muted text-xs truncate mt-0.5">{sub}</p>
            </div>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            onClick={closeAdminGate}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {adminGateMode !== 'setup' && (
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                {adminGateMode === 'change' ? t.currentPassLabel : t.passLabel}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t.passLabel}
                className="field text-sm"
                autoComplete="current-password"
                autoFocus
                required
              />
            </div>
          )}

          {adminGateMode !== 'login' && (
            <>
              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  {t.newPassLabel}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t.newPassLabel}
                  minLength={4}
                  className="field text-sm"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                  {t.confirmPassLabel}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPassLabel}
                  minLength={4}
                  className="field text-sm"
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 font-medium">
              {error} {remainingSeconds > 0 ? `(${remainingSeconds}s)` : ''}
            </p>
          )}

          <button
            type="submit"
            disabled={remainingSeconds > 0}
            className="btn primary w-full py-2.5 text-sm font-bold shadow-lg mt-2 active:scale-98 transition-all disabled:opacity-50"
          >
            {adminGateMode === 'setup' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>
              {remainingSeconds > 0
                ? language === 'en'
                  ? `Wait ${remainingSeconds}s`
                  : `অপেক্ষা করুন (${remainingSeconds}s)`
                : adminGateMode === 'setup'
                ? t.setPassBtn
                : adminGateMode === 'change'
                ? t.changePasswordBtn
                : t.unlockBtn}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
