import React, { useState, useEffect } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { today, currentMonth } from '../../utils/helpers';
import { X, Calendar, User, ShoppingBag, Coins, Check } from 'lucide-react';

export const EntryModal: React.FC = () => {
  const { isEntryModalOpen, entryModalData, closeEntry, data, saveTransaction, activeMonth } = useMess();
  const { t, currency, currencies } = useLanguage();

  const [date, setDate] = useState<string>(today());
  const [member, setMember] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [hasDraftRestored, setHasDraftRestored] = useState<boolean>(false);

  const editId = entryModalData?.id;

  useEffect(() => {
    if (isEntryModalOpen) {
      if (editId) {
        const existing = data.transactions.find(t => t.id === editId);
        if (existing) {
          setDate(existing.date);
          setAmount(String(existing.amount));
          setNote(existing.note || '');
          setMember(existing.payer || existing.member || data.members[0]?.name || '');
          setHasDraftRestored(false);
          return;
        }
      }

      // Check for uncommitted draft backup
      try {
        const savedDraft = localStorage.getItem('mess_draft_entry');
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && (parsed.amount || parsed.note)) {
            setDate(parsed.date || today());
            setMember(parsed.member || data.members[0]?.name || '');
            setAmount(parsed.amount || '');
            setNote(parsed.note || '');
            setHasDraftRestored(true);
            return;
          }
        }
      } catch {}

      const curMonth = activeMonth || currentMonth();
      const currentYMD = today();
      let defaultDate = currentYMD;
      if (curMonth !== currentYMD.slice(0, 7)) {
        defaultDate = `${curMonth}-01`;
      }

      setDate(defaultDate);
      setAmount('');
      setNote('');
      setMember(data.members[0]?.name || '');
      setHasDraftRestored(false);
    }
  }, [isEntryModalOpen, editId, data.transactions, data.members, activeMonth]);

  // Autosave draft while typing (for new transactions)
  useEffect(() => {
    if (isEntryModalOpen && !editId) {
      if (amount || note) {
        try {
          localStorage.setItem(
            'mess_draft_entry',
            JSON.stringify({ date, member, amount, note })
          );
        } catch {}
      }
    }
  }, [isEntryModalOpen, editId, date, member, amount, note]);

  if (!isEntryModalOpen) return null;

  const clearDraft = () => {
    try {
      localStorage.removeItem('mess_draft_entry');
    } catch {}
    setAmount('');
    setNote('');
    setHasDraftRestored(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    saveTransaction({
      id: editId,
      type: 'expense',
      date,
      amount: numAmount,
      note: note.trim(),
      payer: member,
      member: member,
    });

    try {
      localStorage.removeItem('mess_draft_entry');
    } catch {}
    closeEntry();
  };

  const currentCurrencySymbol = currencies[currency]?.symbol || '৳';
  const dynamicAmountLabel = t.amountLabel.includes('৳')
    ? t.amountLabel.replace('৳', currentCurrencySymbol)
    : `${t.amountLabel} (${currentCurrencySymbol})`;

  const title = editId ? t.editExpenseModalTitle : t.addExpenseModalTitle;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="w-[90vw] md:w-full md:max-w-xs max-h-[calc(100dvh-24px)] overflow-y-auto modal-card bg-white dark:bg-[#101d2d] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-3.5 sm:p-5 shadow-2xl box-border">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="icon-square shrink-0" style={{ color: '#ea580c', backgroundColor: 'rgba(234, 88, 12, 0.12)' }}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold truncate">{title}</h3>
              <p className="muted text-xs truncate">{t.entryModalSub}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn text-xs py-1.5 px-2.5 shrink-0"
            onClick={closeEntry}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasDraftRestored && !editId && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <span>✓ {t.draftRestored}</span>
            <button
              type="button"
              onClick={clearDraft}
              className="underline text-[11px] font-bold hover:opacity-80 cursor-pointer"
            >
              {t.cancel}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Date */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 opacity-70" />
              <span>{t.dateLabel}</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="field text-sm"
              required
            />
          </div>

          {/* Member / Payer */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.payerLabel}</span>
            </label>
            <select
              value={member}
              onChange={e => setMember(e.target.value)}
              className="field text-sm"
              required
            >
              {data.members.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-emerald-500" />
              <span>{dynamicAmountLabel}</span>
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={t.amountPlaceholder}
              className="field text-sm num"
              required
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
              {t.noteLabel}
            </label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder={t.notePlaceholder}
              maxLength={160}
              className="field text-sm"
            />
          </div>

          <button
            type="submit"
            className="btn primary w-full py-2.5 text-sm mt-2 font-bold shadow-md"
          >
            <Check className="w-4 h-4 mr-1" />
            <span>{t.saveExpenseBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
