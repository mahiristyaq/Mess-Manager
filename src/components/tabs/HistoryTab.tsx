import React, { useState, useMemo } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { TransactionItem } from '../TransactionItem';
import { exportTransactionsToCSV, downloadBlob } from '../../utils/helpers';
import { History, Download, ChevronDown, Users } from 'lucide-react';

const PAGE_SIZE = 20;

export const HistoryTab: React.FC = () => {
  const { data, totals, showToast } = useMess();
  const { t, formatNumber, language, currency } = useLanguage();
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const filteredTx = useMemo(() => {
    return [...data.transactions]
      .filter(x => selectedMember === 'all' || x.payer === selectedMember || x.member === selectedMember)
      .sort((a, b) =>
        (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0)
      );
  }, [data.transactions, selectedMember]);

  const pagedTx = useMemo(() => {
    return filteredTx.slice(0, visibleCount);
  }, [filteredTx, visibleCount]);

  const handleExportCSV = () => {
    if (filteredTx.length === 0) {
      showToast(t.noTransactionsYet);
      return;
    }
    const csvData = exportTransactionsToCSV(filteredTx, totals, language, currency);
    downloadBlob(csvData, `mess-expenses-${Date.now()}.csv`, 'text/csv;charset=utf-8');
    showToast(t.csvExpenseDownloaded);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-extrabold flex items-center gap-2 truncate">
            <History className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="truncate">{t.historyTitle}</span>
          </h2>
          <p className="muted text-xs mt-0.5 truncate">{t.historySub}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Member Filter Dropdown with well-placed Dropdown Chevron icon */}
          <div className="relative inline-flex items-center">
            <div className="field py-1.5 px-2.5 text-xs font-bold flex items-center justify-between gap-1.5 min-h-[36px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs cursor-pointer hover:border-emerald-500/60 transition-colors">
              <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="truncate max-w-[95px] sm:max-w-[140px]">
                {selectedMember === 'all' ? t.allMembers : selectedMember}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 ml-0.5" />
            </div>
            <select
              value={selectedMember}
              onChange={e => {
                setSelectedMember(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
              aria-label={t.allMembers}
            >
              <option value="all">{t.allMembers}</option>
              {data.members.map(m => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn text-xs py-1.5 px-2.5 flex items-center gap-1 font-semibold"
            onClick={handleExportCSV}
            title={t.exportExpenseCsv}
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="space-y-3">
          {filteredTx.length === 0 ? (
            <p className="muted text-sm py-4 text-center">{t.noTransactionsYet}</p>
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
