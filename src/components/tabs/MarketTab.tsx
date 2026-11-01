import React, { useState, useMemo } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { TransactionItem } from '../TransactionItem';
import { exportTransactionsToCSV, downloadBlob, getActiveMembersForMonth } from '../../utils/helpers';
import { ShoppingBag, Plus, Receipt, TrendingUp, Users, Download, ChevronDown } from 'lucide-react';

const PAGE_SIZE = 20;

export const MarketTab: React.FC = () => {
  const { totals, activeMonth, openEntry, data, showToast } = useMess();
  const { t, formatMoney, formatNumber, getMonthLabel, language, currency } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const monthLabel = getMonthLabel(activeMonth);

  const filteredTx = useMemo(() => {
    const sel = selectedMember.trim().toLowerCase();
    return [...totals.tx]
      .filter(x => {
        if (selectedMember === 'all') return true;
        const p = String(x.payer || '').trim().toLowerCase();
        const m = String(x.member || '').trim().toLowerCase();
        return p === sel || m === sel;
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
  }, [totals.tx, selectedMember]);

  const pagedTx = useMemo(() => {
    return filteredTx.slice(0, visibleCount);
  }, [filteredTx, visibleCount]);

  const handleExportCSV = () => {
    if (filteredTx.length === 0) {
      showToast(t.noExpensesThisMonth);
      return;
    }
    const csvData = exportTransactionsToCSV(filteredTx, totals, language, currency);
    downloadBlob(csvData, `mess-market-${activeMonth}.csv`, 'text/csv;charset=utf-8');
    showToast(t.csvExpenseDownloaded);
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShoppingBag className="w-5 h-5 text-orange-500 shrink-0" />
            <span>{t.marketTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-normal">
            {t.marketSub(monthLabel)}
          </p>
        </div>

        <button
          type="button"
          className="btn primary py-2 px-3.5 text-xs sm:text-sm font-bold shadow-md shrink-0 flex items-center gap-1"
          onClick={() => openEntry('expense')}
        >
          <Plus className="w-4 h-4 mr-0.5" />
          <span>{t.addExpenseBtn}</span>
        </button>
      </div>

      {/* Monthly Unified Totals Card */}
      <div className="rate-card p-3.5 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 items-center">
          <div className="min-w-0">
            <p className="text-xs text-orange-200 flex items-center gap-1.5 font-medium truncate">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-300 shrink-0" />
              <span className="truncate">{t.totalMessExpense}</span>
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 num truncate">
              {formatMoney(totals.expenses)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-100/90 mt-0.5 truncate">
              {t.expenseEntriesCount(formatNumber(filteredTx.length))}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-xs text-emerald-100 flex items-center gap-1.5 font-medium truncate">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
              <span className="truncate">{t.currentMealRate}</span>
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 num truncate">
              {formatMoney(totals.rate)}
            </p>
            <p className="text-[10px] sm:text-[11px] text-emerald-100/90 mt-0.5 truncate">
              {t.totalMealsInMonth(formatNumber(totals.meals))}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 border-t sm:border-t-0 sm:border-l border-white/20 pt-2 sm:pt-0 sm:pl-3 min-w-0">
            <p className="text-xs text-emerald-100 flex items-center gap-1.5 font-medium truncate">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-200 shrink-0" />
              <span className="truncate">{t.membersContribution}</span>
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 num truncate">
              {t.membersCount(formatNumber(getActiveMembersForMonth(data, activeMonth).length))}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History Card */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <h3 className="section-title flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
            <Receipt className="w-4 h-4 text-sky-500 shrink-0" />
            <span>{t.expenseListTitle}</span>
          </h3>

          {/* Action Controls: Member Filter & CSV Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial sm:w-44">
              <select
                value={selectedMember}
                onChange={e => {
                  setSelectedMember(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-colors"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
              >
                <option value="all">{t.allMembers}</option>
                {getActiveMembersForMonth(data, activeMonth).map(m => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
            </div>

            <button
              type="button"
              className="btn text-xs py-2 px-3 font-semibold flex items-center gap-1.5 shrink-0 hover:border-slate-400 dark:hover:border-slate-600 shadow-xs"
              onClick={handleExportCSV}
              title={t.exportExpenseCsv}
            >
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredTx.length === 0 ? (
            <p className="muted text-sm py-5 text-center">
              {t.noExpensesThisMonth}
            </p>
          ) : (
            pagedTx.map(tx => (
              <TransactionItem key={tx.id} transaction={tx} showActions={true} />
            ))
          )}
        </div>

        {filteredTx.length > PAGE_SIZE && (
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs muted">
              {t.showingCount(
                formatNumber(Math.min(visibleCount, filteredTx.length)),
                formatNumber(filteredTx.length)
              )}
            </p>
            {visibleCount < filteredTx.length && (
              <button
                type="button"
                className="btn text-xs py-1.5 px-3 font-semibold"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              >
                {t.loadMore}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
