import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, LogIn, PlusCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, handleAuth, savedMesses } = useMess();
  const { t, language, toggleLanguage } = useLanguage();

  const [authMode, setAuthMode] = useState<'login' | 'create'>('login');
  const [messNameInput, setMessNameInput] = useState<string>('');
  const [messCodeInput, setMessCodeInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isAuthModalOpen) return null;

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    if (!messCodeInput.trim()) {
      setError(t.authCodeRequiredError);
      return;
    }
    if (authMode === 'create' && !messNameInput.trim()) {
      setError(t.authNameAndCodeRequired);
      return;
    }

    setLoading(true);
    const success = await handleAuth(messNameInput, messCodeInput, authMode);
    setLoading(false);
    if (!success) {
      setError(t.authConnectionFailed);
    }
  };

  const handleSavedSelect = (name: string, code: string) => {
    setAuthMode('login');
    setMessNameInput(name);
    setMessCodeInput(code);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100dvh-24px)] overflow-y-auto modal-card bg-white dark:bg-[#101d2d] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 box-border relative">
        {/* Language Switch Button */}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-xs flex items-center gap-1"
            title="Switch Language (বাংলা / English)"
            aria-label="Switch Language"
          >
            <span className="text-[10px] uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
              {language === 'bn' ? 'বাং' : 'ENG'}
            </span>
          </button>
        </div>

        {/* Brand Mark */}
        <div className="brand-mark mx-auto">
          <BookOpen className="w-6 h-6 text-white" />
        </div>

        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-extrabold">{t.authPortalTitle}</h2>
          <p className="muted text-xs mt-1">
            {t.authPortalSub}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 bg-slate-100 dark:bg-[#091421] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError('');
            }}
            className={`flex-1 py-2 font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.authTabLogin}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('create');
              setError('');
            }}
            className={`flex-1 py-2 font-bold text-xs sm:text-sm rounded-lg transition-all cursor-pointer ${
              authMode === 'create'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.authTabCreate}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-3.5 pt-1">


          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
              {t.authMessCodeLabel}
            </label>
            <input
              type="text"
              value={messCodeInput}
              onChange={e => setMessCodeInput(e.target.value)}
              placeholder={t.authMessCodePlaceholder}
              className="field text-sm font-mono"
              required
            />
          </div>

          {authMode === 'login' && (
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                {t.memberCodeLabel}
              </label>
              <input
                type="text"
                value={messNameInput}
                onChange={e => setMessNameInput(e.target.value)}
                placeholder={t.memberCodePlaceholder}
                className="field text-sm"
              />
            </div>
          )}



          {authMode === 'create' && (
            <div>
              <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
                {t.authMessNameRequired}
              </label>
              <input
                type="text"
                value={messNameInput}
                onChange={e => setMessNameInput(e.target.value)}
                placeholder={t.authMessNamePlaceholder}
                className="field text-sm"
                required
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn primary w-full py-2.5 text-sm font-bold shadow-md"
          >
            {authMode === 'login' ? (
              <LogIn className="w-4 h-4" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>
              {loading
                ? t.authConnecting
                : authMode === 'login'
                ? t.authEnterMessBtn
                : t.authCreateMessBtn}
            </span>
          </button>
        </form>

        {/* Saved Messes on Device */}
        {savedMesses.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-[11px] muted mb-2">
              {t.savedMessesOnDevice}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {savedMesses.map(item => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSavedSelect(item.name, item.code)}
                  className="btn text-xs py-1.5 px-2.5 flex items-center gap-1.5 text-left hover:border-emerald-500"
                >
                  <span className="font-bold text-emerald-600 dark:text-emerald-300">{item.name}</span>
                  <span className="muted text-[11px]">({item.code})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
