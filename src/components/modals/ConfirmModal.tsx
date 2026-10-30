import React from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { AlertTriangle, X, Check } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirm } = useMess();
  const { t } = useLanguage();

  if (!confirmModal || !confirmModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm modal-card bg-white dark:bg-[#101d2d] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 box-border">
        <div className="flex items-center gap-2.5">
          <div
            className="icon-square"
            style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)' }}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold">{t.confirm}</h3>
        </div>

        <p className="muted text-sm leading-relaxed">{confirmModal.message}</p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            className="btn text-xs sm:text-sm py-2 hover:border-slate-500"
            onClick={closeConfirm}
          >
            <X className="w-4 h-4" />
            <span>{t.cancel}</span>
          </button>
          <button
            type="button"
            className="btn danger text-xs sm:text-sm py-2"
            onClick={confirmModal.onConfirm}
          >
            <Check className="w-4 h-4" />
            <span>{t.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
