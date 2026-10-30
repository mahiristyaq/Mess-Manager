import React, { useState, useEffect } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { Pencil, X, Check, ShoppingBag, Utensils } from 'lucide-react';

export const ReportEditModal: React.FC = () => {
  const {
    isReportEditOpen,
    reportEditMember,
    closeReportEdit,
    data,
    totals,
    getMemberBalance,
    saveReportEdit,
    showToast,
  } = useMess();

  const { t, formatMoney } = useLanguage();

  const [memberName, setMemberName] = useState<string>('');
  const [market, setMarket] = useState<string>('0');
  const [meals, setMeals] = useState<string>('0');

  useEffect(() => {
    if (isReportEditOpen && reportEditMember) {
      const b = getMemberBalance(reportEditMember);
      setMemberName(reportEditMember);
      setMarket(String(Number(b.market.toFixed(2))));
      setMeals(String(Number(b.meals)));
    }
  }, [isReportEditOpen, reportEditMember, getMemberBalance]);

  if (!isReportEditOpen || !reportEditMember) return null;

  const oldB = getMemberBalance(reportEditMember);
  const newMkt = Math.max(0, Number(market) || 0);
  const newMeals = Math.max(0, Number(meals) || 0);

  const totalMealsAfter = Math.max(0, totals.meals - oldB.meals + newMeals);
  const totalExpensesAfter = Math.max(0, totals.expenses - oldB.market + newMkt);
  const rateAfter = totalMealsAfter ? totalExpensesAfter / totalMealsAfter : 0;
  const fixed = (data.config.fixedCostEnabled ? Number(data.config.fixedCost || 0) : 0) / (data.members.length || 1);
  const costAfter = Number((newMeals * rateAfter + fixed).toFixed(2));
  const balAfter = Number((newMkt - costAfter).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = memberName.trim();
    if (!cleanName) {
      showToast(t.emptyMemberNameError);
      return;
    }
    if (cleanName !== reportEditMember && data.members.some(m => m.name === cleanName)) {
      showToast(t.memberNameTakenError);
      return;
    }

    saveReportEdit(reportEditMember, cleanName, 0, newMkt, newMeals);
    showToast(t.reportEditSavedToast(cleanName));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
      <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[calc(100dvh-24px)] overflow-y-auto modal-card bg-white dark:bg-[#101d2d] border border-slate-200 dark:border-slate-700/80 rounded-3xl p-3.5 sm:p-5 shadow-2xl space-y-3.5 box-border">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="icon-square shrink-0">
              <Pencil className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold truncate">{t.reportEditTitle}</h3>
              <p className="muted text-xs truncate">{t.reportEditSub}</p>
            </div>
          </div>
          <button
            type="button"
            className="btn text-xs py-1.5 px-2.5 shrink-0"
            onClick={closeReportEdit}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 block">
              {t.reportEditMemberName}
            </label>
            <input
              type="text"
              value={memberName}
              maxLength={60}
              onChange={e => setMemberName(e.target.value)}
              className="field text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />
              <span>{t.reportEditExpense}</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={market}
              onChange={e => setMarket(e.target.value)}
              className="field text-sm num"
              required
            />
            <p className="text-[11px] muted mt-1">
              {t.reportEditExpenseHelp}
            </p>
          </div>

          <div>
            <label className="text-xs text-slate-700 dark:text-slate-300 font-medium mb-1 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-sky-500" />
              <span>{t.reportEditMeals}</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={meals}
              onChange={e => setMeals(e.target.value)}
              className="field text-sm num"
              required
            />
          </div>

          {/* Live Recalculation Preview */}
          <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">{t.livePreviewTitle}</p>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t.previewMemberExpense}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-300 num">{formatMoney(newMkt)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t.previewMealRate}</span>
              <span className="font-bold text-purple-600 dark:text-purple-300 num">{formatMoney(rateAfter)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t.previewMealCost}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 num">{formatMoney(costAfter)}</span>
            </div>
            <div className="flex justify-between font-bold pt-1.5 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-800 dark:text-slate-200">{t.previewBalanceAfter}</span>
              <span className={`num ${balAfter >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'}`}>
                {balAfter >= 0 ? `${t.willReceive} ` : `${t.willPay} `}
                {formatMoney(Math.abs(balAfter))}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="btn text-xs py-2 px-3 flex-1"
              onClick={closeReportEdit}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="btn primary text-xs py-2 px-4 flex-1 font-bold shadow-md"
            >
              <Check className="w-4 h-4 mr-1" />
              <span>{t.saveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
