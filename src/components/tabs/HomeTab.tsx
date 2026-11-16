import React from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { TransactionItem } from '../TransactionItem';
import { PWAInstallButton } from '../PWAInstallButton';
import { getActiveMembersForMonth } from '../../utils/helpers';
import {
  TrendingUp,
  Plus,
  ShoppingBag,
  Users,
  ChevronRight,
  AlertTriangle,
  Receipt,
  User,
  Utensils,
} from 'lucide-react';

export const HomeTab: React.FC = () => {
  const {
    data,
    totals,
    activeMonth,
    getMemberBalance,
    firebaseError,
    openEntry,
    setActiveTab,
  } = useMess();

  const { t, formatMoney, formatNumber, getMonthLabel } = useLanguage();

  const monthLabel = getMonthLabel(activeMonth);

  const recentTransactions = [...totals.tx]
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Firebase Error Banner */}
      {firebaseError && (
        <div className="card p-3.5 border-red-500/60 bg-red-950/40 text-xs text-red-200 space-y-1.5">
          <p className="font-bold text-red-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>{firebaseError.title}</span>
          </p>
          <p className="text-slate-300 leading-relaxed">{firebaseError.desc}</p>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Header and Quick Action */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t.dashboard}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-normal">
            {t.dashboardSub(monthLabel)}
          </p>
        </div>
        <button
          type="button"
          className="btn primary text-xs sm:text-sm font-bold shadow-md shrink-0 py-2 px-3 sm:px-3.5"
          onClick={() => openEntry('expense')}
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Rate Card */}
      <div className="rate-card p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm text-emerald-100 flex items-center gap-1.5 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="break-words leading-tight">{t.mealRateTitle}</span>
            </p>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mt-1.5 sm:mt-2 num tracking-tight truncate">
              {formatMoney(totals.rate)}
            </p>
            <p className="text-[11px] sm:text-xs text-emerald-100/90 mt-1 break-words">
              {t.rateCalcFormula(formatMoney(totals.expenses), formatNumber(totals.meals))}
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="icon-square ml-auto bg-white/20 text-white w-8 h-8 sm:w-9 sm:h-9">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl font-extrabold mt-1.5 sm:mt-2 num text-white">
              {formatMoney(totals.expenses)}
            </p>
            <p className="text-emerald-100/90 text-[11px] sm:text-xs truncate">{t.totalMarketExpense}</p>
          </div>
        </div>
      </div>

      {/* 4 Unified KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="stat-card p-3 sm:p-3.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-xs">
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{t.totalMarketExpense}</span>
          </div>
          <p className="text-base sm:text-lg lg:text-xl font-extrabold text-orange-700 dark:text-orange-300 mt-2 num truncate">
            {formatMoney(totals.expenses)}
          </p>
        </div>

        <div className="stat-card p-3 sm:p-3.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{t.mealRate}</span>
          </div>
          <p className="text-base sm:text-lg lg:text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-2 num truncate">
            {formatMoney(totals.rate)}
          </p>
        </div>

        <div className="stat-card p-3 sm:p-3.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Utensils className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{t.totalMeals}</span>
          </div>
          <p className="text-base sm:text-lg lg:text-xl font-extrabold text-amber-800 dark:text-amber-300 mt-2 num truncate">
            {t.mealsCount(formatNumber(totals.meals))}
          </p>
        </div>

        <div className="stat-card p-3 sm:p-3.5 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">{t.messMembers}</span>
          </div>
          <p className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white mt-2 num truncate">
            {t.membersCount(formatNumber(getActiveMembersForMonth(data, activeMonth).length))}
          </p>
        </div>
      </div>

      {/* Balances and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Members Balance Overview */}
        <div className="card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="section-title flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
              <span>{t.membersBalanceOverview}</span>
            </h3>
            <button
              type="button"
              className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs flex items-center gap-1 cursor-pointer font-bold"
              onClick={() => setActiveTab('report')}
            >
              <span>{t.details}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="space-y-2.5">
            {getActiveMembersForMonth(data, activeMonth).map(memberObj => {
              const member = memberObj.name;
              const b = getMemberBalance(member);
              const isPositive = b.balance >= 0;
              return (
                <div
                  key={member}
                  className="flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">{member}</p>
                      {/* Mobile-visible wrap layout for meal count and expense details */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        <span className="font-bold text-amber-700 dark:text-amber-300 num">
                          {formatNumber(b.meals)} {t.mealUnit}
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span>
                          {t.memberDeposit}: <span className="font-bold text-emerald-700 dark:text-emerald-400 num">{formatMoney(b.market)}</span>
                        </span>
                        <span className="text-slate-400 dark:text-slate-600">•</span>
                        <span>
                          {t.mealCostUnit}: <span className="font-bold text-slate-800 dark:text-slate-200 num">{formatMoney(b.totalCost)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pt-0.5 sm:pt-0">
                    <p className={`font-extrabold text-xs sm:text-sm num ${isPositive ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-400'}`}>
                      <span className="block text-[10px] font-bold opacity-80 uppercase leading-none mb-0.5">
                        {isPositive ? t.willReceive : t.willPay}
                      </span>
                      <span>
                        {isPositive ? `+` : `-`}
                        {formatMoney(Math.abs(b.balance))}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="section-title flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <Receipt className="w-4 h-4 text-sky-500" />
              <span>{t.recentTransactions}</span>
            </h3>
            <button
              type="button"
              className="text-emerald-600 dark:text-emerald-400 hover:opacity-80 text-xs flex items-center gap-1 cursor-pointer font-medium"
              onClick={() => setActiveTab('market')}
            >
              <span>{t.seeAll}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="muted text-sm py-4 text-center">{t.noTransactionsYet}</p>
            ) : (
              recentTransactions.map(tx => (
                <TransactionItem key={tx.id} transaction={tx} showActions={false} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
