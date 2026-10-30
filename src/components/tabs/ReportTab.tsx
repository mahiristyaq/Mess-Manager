import React, { useState, useRef } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { downloadBlob, normalizeMessData, getActiveMembersForMonth } from '../../utils/helpers';
import {
  FileText,
  Download,
  Upload,
  ShoppingBag,
  TrendingUp,
  Users,
  Utensils,
  Pencil,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  Scale,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

export const ReportTab: React.FC = () => {
  const {
    data,
    totals,
    activeMonth,
    getMemberBalance,
    isAdminUnlocked,
    openReportEdit,
    askConfirm,
    saveSettings,
    showToast,
  } = useMess();

  const { t, formatMoney, formatNumber, getMonthLabel, language } = useLanguage();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calculate table aggregates
  let sumDeposit = 0;
  let sumMarket = 0;
  let sumMeals = 0;
  let sumCost = 0;
  let totalPabe = 0;
  let totalDebe = 0;

  const targetMonth = activeMonth || data.config.month;
  const targetMonthLabel = getMonthLabel(targetMonth);

  const activeMembers = getActiveMembersForMonth(data, targetMonth);
  const memberRows = activeMembers.map(mObj => {
    const m = mObj.name;
    const b = getMemberBalance(m);
    sumDeposit += b.deposit;
    sumMarket += b.market;
    sumMeals += b.meals;
    sumCost += b.totalCost;
    if (b.balance >= 0) totalPabe += b.balance;
    else totalDebe += Math.abs(b.balance);
    return { member: m, balance: b };
  });

  const exportCSV = () => {
    const month = targetMonth;
    const headerRow = language === 'en'
      ? ['Member', 'Total Expense', 'Meal Count', 'Meal Rate', 'Meal Cost', 'Settlement (Receivable/Due)']
      : ['সদস্য', 'মোট খরচ', 'মিল সংখ্যা', 'মিল রেট', 'মিল খরচ', 'পাবেন / দিবেন'];

    const rows = [headerRow];

    memberRows.forEach(({ member, balance: b }) => {
      const balanceStr = language === 'en'
        ? (b.balance >= 0 ? `Receivable ${Number(b.balance.toFixed(2))}` : `Due ${Number(Math.abs(b.balance).toFixed(2))}`)
        : (b.balance >= 0 ? `পাবেন ${Number(b.balance.toFixed(2))}` : `দিবেন ${Number(Math.abs(b.balance).toFixed(2))}`);

      rows.push([
        member,
        String(b.market),
        String(b.meals),
        String(Number(totals.rate.toFixed(2))),
        String(Number(b.totalCost.toFixed(2))),
        balanceStr,
      ]);
    });

    const totalLabel = language === 'en' ? 'Grand Total' : 'সর্বমোট';
    const totalBalanceStr = language === 'en'
      ? `Total Receivable: ${totalPabe.toFixed(2)} | Total Due: ${totalDebe.toFixed(2)}`
      : `মোট পাবেন: ${totalPabe.toFixed(2)} | মোট দিবেন: ${totalDebe.toFixed(2)}`;

    rows.push([
      totalLabel,
      String(totals.expenses),
      String(sumMeals),
      String(Number(totals.rate.toFixed(2))),
      String(Number(sumCost.toFixed(2))),
      totalBalanceStr,
    ]);

    const csvContent =
      '\ufeff' +
      rows
        .map(r => r.map(v => '"' + String(v).replaceAll('"', '""') + '"').join(','))
        .join('\r\n');
    downloadBlob(csvContent, `mess-report-${month}.csv`, 'text/csv;charset=utf-8');
    showToast(t.csvDownloaded);
  };

  const exportBackup = () => {
    const month = targetMonth;
    const backupStr = JSON.stringify(data, null, 2);
    downloadBlob(backupStr, `mess-backup-${month}.json`, 'application/json');
    showToast(t.backupDownloaded);
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.members || !parsed.config) throw new Error('invalid format');

        askConfirm(t.confirmRestore, () => {
          const normalized = normalizeMessData(parsed);
          saveSettings(
            normalized.config,
            normalized.members,
            []
          );
          showToast(t.backupRestored);
        });
      } catch {
        showToast(t.invalidBackupFile);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-full min-w-0 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t.reportTitle}</span>
            <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 font-medium">
              {targetMonthLabel}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-normal">
            {t.reportSub(targetMonthLabel)}
          </p>
        </div>
        <button
          type="button"
          className="btn text-xs sm:text-sm py-1.5 px-3 hover:border-slate-500 shadow-sm shrink-0 self-start sm:self-center flex items-center gap-1"
          onClick={exportCSV}
          title={t.downloadCSV}
        >
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>CSV</span>
        </button>
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 w-full">
        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <ShoppingBag className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate">{t.totalMessExpense}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-orange-600 dark:text-orange-300 mt-1 num truncate">
            {formatMoney(totals.expenses)}
          </p>
        </div>

        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">{t.mealRate}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-300 mt-1 num truncate">
            {formatMoney(totals.rate)}
          </p>
        </div>

        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">{t.totalMeals}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-300 mt-1 num truncate">
            {formatNumber(sumMeals)}
          </p>
        </div>

        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{t.mealCostShare}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-200 mt-1 num truncate">
            {formatMoney(sumCost)}
          </p>
        </div>

        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{t.membersWillReceive}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-300 mt-1 num truncate">
            {formatMoney(totalPabe)}
          </p>
        </div>

        <div className="stat-card p-3 min-w-0">
          <p className="muted text-[11px] sm:text-xs flex items-center gap-1.5 font-medium truncate">
            <ArrowRightLeft className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span className="truncate">{t.membersWillPay}</span>
          </p>
          <p className="text-base sm:text-lg font-extrabold text-red-500 dark:text-red-300 mt-1 num truncate">
            {formatMoney(totalDebe)}
          </p>
        </div>
      </div>

      {/* Main Section with View Mode Switcher */}
      <div className="card p-2 sm:p-5 space-y-3.5 sm:space-y-4 w-full">
        {/* View Toggle Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="min-w-0">
            <h3 className="section-title text-sm sm:text-base flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100 truncate">
              <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{t.membersFinalCalc}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-normal">
              {t.viewToggleSub}
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t.cardView}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{t.tableView}</span>
            </button>
          </div>
        </div>

        {/* View 1: Responsive Cards View */}
        {viewMode === 'cards' && (
          <div className="space-y-3 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {memberRows.map(({ member, balance: b }, index) => {
                const isPositive = b.balance >= 0;
                return (
                  <div
                    key={member}
                    className="bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3.5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm"
                  >
                    {/* Top Row: Avatar, Member Name & Prominent Balance Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                            {member}
                          </h4>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-normal leading-normal">
                            {t.totalMeals}: <span className="text-amber-700 dark:text-amber-300 font-bold num">{formatNumber(b.meals)}</span> {t.mealUnit} ({t.mealRate} {formatMoney(totals.rate)})
                          </p>
                        </div>
                      </div>

                      {/* Prominent Balance Badge */}
                      <div
                        className={`px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black shrink-0 border num text-right ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-300 shadow-xs'
                            : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-500/10 dark:border-red-500/50 dark:text-red-300 shadow-xs'
                        }`}
                      >
                        <span className="block text-[10px] uppercase font-bold opacity-80 leading-none">
                          {isPositive ? t.willReceive : t.willPay}
                        </span>
                        <span className="text-sm sm:text-base">
                          {formatMoney(Math.abs(b.balance))}
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.membersTotalExpense}</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm num block truncate">
                          {formatMoney(b.market)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.mealCostShare}</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs sm:text-sm num block truncate">
                          {formatMoney(b.totalCost)}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {formatNumber(b.meals)} {t.mealUnit} × {formatMoney(totals.rate)}
                        </span>
                      </div>
                    </div>

                    {/* Tap for more details toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedMember(expandedMember === member ? null : member)}
                      className="w-full text-left flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-0.5 cursor-pointer hover:underline"
                    >
                      <span className="flex items-center gap-1">
                        <Info className="w-3 h-3 shrink-0" />
                        <span>{expandedMember === member ? (language === 'en' ? 'Hide details' : 'বিস্তারিত লুকান') : (language === 'en' ? 'Tap for full details' : 'সম্পূর্ণ হিসাব দেখুন')}</span>
                      </span>
                      {expandedMember === member ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>

                    {expandedMember === member && (
                      <div className="bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs animate-in fade-in duration-150">
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>{t.totalMeals}:</span>
                          <span className="font-bold text-amber-800 dark:text-amber-300 num">{formatNumber(b.meals)} {t.mealUnit}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>{t.mealRate}:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 num">{formatMoney(totals.rate)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>{t.membersTotalExpense}:</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-300 num">{formatMoney(b.market)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400">
                          <span>{t.mealCostTotal}:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-200 num">{formatMoney(b.totalCost)}</span>
                        </div>
                        {data.config.fixedCostEnabled && (
                          <div className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span>{language === 'en' ? 'Fixed Cost Share:' : 'স্থায়ী খরচের অংশ:'}</span>
                            <span className="font-bold num text-slate-900 dark:text-slate-100">{formatMoney((data.config.fixedCost || 0) / (data.members.length || 1))}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Admin Action Button */}
                    {isAdminUnlocked && (
                      <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <button
                          type="button"
                          className="btn text-xs py-1 px-3 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-200 dark:border-sky-800"
                          onClick={() => openReportEdit(member)}
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          <span>{t.edit}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall Grand Total Summary Card */}
            <div className="bg-gradient-to-br from-slate-100 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3.5 space-y-3 mt-4 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 truncate">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{t.overallSummary}</span>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0">
                  {t.membersCount(formatNumber(data.members.length))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.totalMessExpense}</span>
                  <span className="font-extrabold text-orange-700 dark:text-orange-300 text-sm num truncate block">{formatMoney(totals.expenses)}</span>
                </div>
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.mealCostTotal}</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-200 text-sm num truncate block">{formatMoney(sumCost)}</span>
                </div>
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.membersWillReceive}</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-sm num truncate block">+{formatMoney(totalPabe)}</span>
                </div>
                <div className="bg-white dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 min-w-0">
                  <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block truncate">{t.membersWillPay}</span>
                  <span className="font-extrabold text-red-700 dark:text-red-300 text-sm num truncate block">-{formatMoney(totalDebe)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Responsive Full Table View - 100% visible on mobile phones at a glance */}
        {viewMode === 'table' && (
          <div className="space-y-3 w-full min-w-0">
            {/* Tap Hint */}
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Info className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>{t.tapRowForDetails}</span>
              </span>
              <span className="text-[11px] font-mono shrink-0 font-bold">
                {t.membersCount(formatNumber(data.members.length))}
              </span>
            </div>

            {/* Complete Table visible on phone at a glance without horizontal cutoff */}
            <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/50 shadow-sm overflow-hidden">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <colgroup>
                  <col className={isAdminUnlocked ? "w-[21%]" : "w-[22%]"} />
                  <col className={isAdminUnlocked ? "w-[18%]" : "w-[19%]"} />
                  <col className={isAdminUnlocked ? "w-[16%]" : "w-[17%]"} />
                  <col className={isAdminUnlocked ? "w-[19%]" : "w-[20%]"} />
                  <col className={isAdminUnlocked ? "w-[20%]" : "w-[22%]"} />
                  {isAdminUnlocked && <col className="w-[6%]" />}
                </colgroup>
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                    <th className="py-2.5 px-1.5 sm:px-3 font-bold text-left">{t.thMember}</th>
                    <th className="py-2.5 px-1 sm:px-2 font-bold text-center whitespace-nowrap">{language === 'en' ? 'Deposit' : 'জমা'}</th>
                    <th className="py-2.5 px-1 sm:px-2 font-bold text-center whitespace-nowrap">{language === 'en' ? 'Meals' : 'মিল'}</th>
                    <th className="py-2.5 px-1 sm:px-2 font-bold text-center whitespace-nowrap">{language === 'en' ? 'Cost' : 'খরচ'}</th>
                    <th className="py-2.5 px-1 sm:px-2 font-bold text-center whitespace-nowrap">{language === 'en' ? 'Balance' : 'ব্যালান্স'}</th>
                    {isAdminUnlocked && (
                      <th className="py-2.5 px-1 text-center w-7 sm:w-8 whitespace-nowrap">
                        <span className="sr-only">{t.edit}</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {memberRows.map(({ member, balance: b }, idx) => {
                    const isPositive = b.balance >= 0;
                    const isExpanded = expandedMember === member;
                    return (
                      <React.Fragment key={member}>
                        <tr
                          onClick={() => setExpandedMember(isExpanded ? null : member)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-900/60 cursor-pointer transition-colors active:bg-slate-100 dark:active:bg-slate-900/90 ${
                            isExpanded ? 'bg-slate-50/80 dark:bg-slate-900/50' : ''
                          }`}
                        >
                          <td className="py-2 sm:py-2.5 px-1.5 sm:px-3 align-middle">
                            <div className="font-bold text-xs flex items-center gap-1 min-w-0">
                              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-emerald-300 font-bold text-[10px] inline-flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                                {idx + 1}
                              </span>
                              <span className="truncate text-slate-900 dark:text-slate-100">
                                {member}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3 text-emerald-600 shrink-0 hidden sm:inline" />
                              ) : (
                                <ChevronDown className="w-3 h-3 opacity-40 shrink-0 hidden sm:inline" />
                              )}
                            </div>
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center num text-emerald-700 dark:text-emerald-400 font-bold text-xs whitespace-nowrap align-middle">
                            {formatMoney(b.market)}
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center num text-amber-700 dark:text-amber-400 font-bold text-xs whitespace-nowrap align-middle">
                            {formatNumber(b.meals)}
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center num text-slate-800 dark:text-slate-200 font-semibold text-xs whitespace-nowrap align-middle">
                            {formatMoney(b.totalCost)}
                          </td>
                          <td className="py-2 sm:py-2.5 px-1 sm:px-2 text-center whitespace-nowrap align-middle">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-black num ${
                              isPositive
                                ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/40'
                                : 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/40'
                            }`}>
                              {isPositive ? `+${formatMoney(b.balance)}` : `-${formatMoney(Math.abs(b.balance))}`}
                            </span>
                          </td>
                          {isAdminUnlocked && (
                            <td className="py-2 sm:py-2.5 px-1 text-center whitespace-nowrap w-7 sm:w-8 align-middle" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                className="w-6 h-6 rounded bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 inline-flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                                onClick={() => openReportEdit(member)}
                                title={t.edit}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                            </td>
                          )}
                        </tr>

                        {/* Tap to expand full details breakdown row */}
                        {isExpanded && (
                          <tr className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800">
                            <td colSpan={isAdminUnlocked ? 6 : 5} className="p-2.5 sm:p-3">
                              <div className="bg-white dark:bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] block">{t.membersTotalExpense}</span>
                                    <span className="font-bold text-emerald-700 dark:text-emerald-300 num text-xs sm:text-sm">{formatMoney(b.market)}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] block">{t.totalMeals}</span>
                                    <span className="font-bold text-amber-800 dark:text-amber-300 num text-xs sm:text-sm">{formatNumber(b.meals)} {t.mealUnit}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] block">{t.mealCostTotal}</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-200 num text-xs sm:text-sm">{formatMoney(b.totalCost)}</span>
                                    <span className="text-[10px] text-slate-500 block">({formatNumber(b.meals)} × {formatMoney(totals.rate)})</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] block">{isPositive ? t.willReceive : t.willPay}</span>
                                    <span className={`font-black num text-xs sm:text-sm ${isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                                      {formatMoney(Math.abs(b.balance))}
                                    </span>
                                  </div>
                                </div>

                                {data.config.fixedCostEnabled && (
                                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                                    <span>{language === 'en' ? 'Fixed Cost Share:' : 'স্থায়ী খরচের অংশ:'}</span>
                                    <span className="font-bold num text-slate-900 dark:text-slate-100">
                                      {formatMoney((data.config.fixedCost || 0) / (data.members.length || 1))}
                                    </span>
                                  </div>
                                )}

                                {isAdminUnlocked && (
                                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                    <button
                                      type="button"
                                      className="btn text-xs py-1 px-3 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-sky-200 dark:border-sky-800"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openReportEdit(member);
                                      }}
                                    >
                                      <Pencil className="w-3.5 h-3.5 mr-1" />
                                      <span>{t.edit}</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold border-t-2 border-emerald-500/50 text-xs">
                  <tr>
                    <td className="py-2.5 px-1.5 sm:px-3 text-emerald-800 dark:text-emerald-300 font-extrabold truncate">
                      {t.grandTotal}
                    </td>
                    <td className="py-2.5 px-1 sm:px-2 text-center text-emerald-700 dark:text-emerald-300 num font-extrabold whitespace-nowrap">
                      {formatMoney(sumMarket)}
                    </td>
                    <td className="py-2.5 px-1 sm:px-2 text-center text-amber-800 dark:text-amber-300 num font-extrabold whitespace-nowrap">
                      {formatNumber(sumMeals)}
                    </td>
                    <td className="py-2.5 px-1 sm:px-2 text-center text-slate-900 dark:text-slate-100 num font-extrabold whitespace-nowrap">
                      {formatMoney(sumCost)}
                    </td>
                    <td className="py-2.5 px-1 sm:px-2 text-center num font-extrabold whitespace-nowrap align-middle" style={{ fontSize: '12px', lineHeight: '16px' }}>
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-emerald-700 dark:text-emerald-400">+{formatMoney(totalPabe)}</span>
                        <span className="text-red-700 dark:text-red-400">-{formatMoney(totalDebe)}</span>
                      </div>
                    </td>
                    {isAdminUnlocked && (
                      <td className="py-2.5 px-1 text-center whitespace-nowrap w-7 sm:w-8"></td>
                    )}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Balance Summary */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-semibold">{t.membersBalanceOverview}:</span>
              <div className="flex items-center gap-3 font-bold num">
                <span className="text-emerald-700 dark:text-emerald-300">{t.membersWillReceive}: +{formatMoney(totalPabe)}</span>
                <span className="text-red-700 dark:text-red-300">{t.membersWillPay}: -{formatMoney(totalDebe)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footnotes */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
          <p className="muted text-xs leading-relaxed">
            {data.config.fixedCostEnabled
              ? t.fixedCostActiveNote(formatMoney(data.config.fixedCost))
              : t.fixedCostDisabledNote}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {t.balanceExplanationNote}
          </p>
        </div>
      </div>

      {/* Data Backup Card */}
      <div className="card p-3 sm:p-4 space-y-2.5 w-full">
        <h3 className="section-title text-sm sm:text-base flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{t.backupCardTitle}</span>
        </h3>
        <p className="muted text-xs">
          {t.backupCardSub}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            className="btn text-xs sm:text-sm hover:border-slate-500"
            onClick={exportBackup}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{t.downloadBackup}</span>
          </button>
          <button
            type="button"
            className="btn text-xs sm:text-sm hover:border-slate-500"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 text-sky-500" />
            <span>{t.restoreBackup}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importBackup}
          />
        </div>
      </div>
    </div>
  );
};
