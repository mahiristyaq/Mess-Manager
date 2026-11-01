import React from 'react';
import { Transaction } from '../types';
import { useMess } from '../context/MessContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingBag, Pencil, Trash2 } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  showActions?: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, showActions = true }) => {
  const { isAdminUnlocked, openEntry, deleteTransaction, askConfirm } = useMess();
  const { t, formatMoney, formatLocalizedDate, language } = useLanguage();

  const fallbackMember = language === 'en' ? 'Member' : 'সদস্য';
  const payerName = transaction.payer || transaction.member || fallbackMember;
  const memberLabel = t.marketEntryTitle ? t.marketEntryTitle(payerName) : payerName;

  const rawNote = (transaction.note || '').trim();
  const isAdjustment = Boolean(
    rawNote && (
      /সমন্বয়|সমন্বয়|চূড়ান্ত|চুড়ান্ত|adjustment/i.test(rawNote) ||
      /অ্যাডমিন|এডমিন|admin/i.test(rawNote)
    )
  );

  const adjustmentSubtitle = language === 'en' ? 'Manager Adjustment (Final)' : 'ম্যানেজার সমন্বয় (চূড়ান্ত হিসাব)';

  let titleText = '';
  let subtitleText = '';

  if (isAdjustment) {
    // নাম উপরে এবং নিচে ম্যানেজার সমন্বয় (চূড়ান্ত হিসাব)
    titleText = payerName;
    subtitleText = `${formatLocalizedDate(transaction.date)} · ${adjustmentSubtitle}`;
  } else {
    const cleanNote = rawNote
      ? rawNote.replace(/অ্যাডমিন|এডমিন/g, 'ম্যানেজার').replace(/Admin/g, 'Manager').replace(/-?এর বাজার/g, '').trim()
      : '';
    titleText = cleanNote || memberLabel;
    subtitleText = cleanNote
      ? `${formatLocalizedDate(transaction.date)} · ${memberLabel}`
      : formatLocalizedDate(transaction.date);
  }

  const handleDelete = () => {
    askConfirm(t.deleteConfirmTx, () => {
      deleteTransaction(transaction.id);
    });
  };

  const isPending = Boolean(transaction.isPending);

  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl shrink-0 mt-0.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 flex items-center justify-center shadow-xs">
          <ShoppingBag className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 break-words">{titleText}</p>
            {isPending && (
              <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30">
                {t.savedOffline}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
            {subtitleText}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-extrabold text-sm num text-orange-700 dark:text-orange-300">
          {formatMoney(transaction.amount)}
        </p>

        {showActions && isAdminUnlocked && (
          <div className="flex items-center gap-2.5 justify-end mt-1.5">
            <button
              type="button"
              className="text-xs text-sky-700 hover:text-sky-800 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 cursor-pointer font-semibold"
              onClick={() => openEntry('expense', transaction.id)}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{t.edit}</span>
            </button>
            <button
              type="button"
              className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer font-semibold"
              onClick={handleDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.delete}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
