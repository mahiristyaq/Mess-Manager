import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { hashPassword } from '../../utils/helpers';
import { Lock, Unlock, Check, X } from 'lucide-react';

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

  const { t } = useLanguage();

  const [password, setPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isAdminGateOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (adminGateMode === 'change') {
      const supplied = await hashPassword(password);
      if (supplied !== data.config.adminPasswordHash) {
        setError(t.passIncorrect);
        return;
      }
      if (newPassword.length < 4 || newPassword !== confirmPassword) {
        setError(newPassword.length < 4 ? t.passMin4 : t.passMismatch);
        return;
      }
      const hashed = await hashPassword(newPassword);
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
      setError(t.passIncorrect);
      return;
    }

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

          {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>}

          <button
            type="submit"
            className="btn primary w-full py-2.5 text-sm font-bold shadow-lg mt-2 active:scale-98 transition-all"
          >
            {adminGateMode === 'setup' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Unlock className="w-4 h-4" />
            )}
            <span>
              {adminGateMode === 'setup'
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
