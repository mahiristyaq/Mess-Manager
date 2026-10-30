import React, { useState } from 'react';
import { useMess } from '../../context/MessContext';
import { useLanguage } from '../../context/LanguageContext';
import { today, mealsForMember } from '../../utils/helpers';
import {
  Utensils,
  ChevronLeft,
  ChevronRight,
  Users,
  Minus,
  Plus,
  CalendarDays,
  RotateCcw,
} from 'lucide-react';

export const MealsTab: React.FC = () => {
  const { data, updateMealCount, quickSetMeals, activeMonth, setActiveMonth, syncState } = useMess();
  const { t, formatFriendlyDate, formatNumber, getMonthLabel } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<string>(today());

  const handleDateChange = (nextStr: string) => {
    if (!nextStr) return;
    setSelectedDate(nextStr);
    const m = nextStr.slice(0, 7);
    if (m && m !== activeMonth) {
      setActiveMonth(m);
    }
  };

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = (selectedDate || today()).split('-').map(Number);
    const newD = new Date(y, (m || 1) - 1, (d || 1) + delta);
    const nextStr = `${newD.getFullYear()}-${String(newD.getMonth() + 1).padStart(2, '0')}-${String(newD.getDate()).padStart(2, '0')}`;
    handleDateChange(nextStr);
  };

  const dayMeals = data.meals[selectedDate] || {};
  const isToday = selectedDate === today();

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Utensils className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{t.mealsTitle}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-normal">
            {t.mealsSub}
          </p>
        </div>
      </div>

      <div className="card p-3 sm:p-4.5 space-y-3.5">
        {/* Date Navigator */}
        <div className="bg-slate-50 dark:bg-slate-900/80 p-2.5 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2">
            <button
              type="button"
              className="btn text-xs py-2 px-2.5 sm:px-3 shrink-0 flex items-center gap-1"
              onClick={() => changeDateByDays(-1)}
              title={t.prevDay}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.prevDay}</span>
            </button>

            {/* Date Display and Hidden Input */}
            <div className="flex-1 min-w-0 text-center relative flex flex-col items-center justify-center">
              <label
                htmlFor="meal-date-picker"
                className="cursor-pointer inline-flex flex-col items-center justify-center hover:opacity-90 transition-opacity"
              >
                <span className="font-extrabold text-xs sm:text-sm text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{formatFriendlyDate(selectedDate)}</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {selectedDate} {isToday ? `(${t.todayLabel})` : ''}
                </span>
              </label>

              {/* Native Date Picker trigger */}
              <input
                id="meal-date-picker"
                type="date"
                value={selectedDate}
                onChange={e => handleDateChange(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              />
            </div>

            <button
              type="button"
              className="btn text-xs py-2 px-2.5 sm:px-3 shrink-0 flex items-center gap-1"
              onClick={() => changeDateByDays(1)}
              title={t.nextDay}
            >
              <span className="hidden sm:inline">{t.nextDay}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {!isToday && (
            <div className="text-center pt-1 border-t border-slate-200 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => handleDateChange(today())}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.returnToToday}</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick presets for all members */}
        <div className="bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          <label className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-medium mb-1.5 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.quickSetAllTitle}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className="btn text-xs py-2 active:scale-95"
              onClick={() => quickSetMeals(selectedDate, 0)}
            >
              <span className="font-bold">{t.allZero}</span>
            </button>
            <button
              type="button"
              className="btn text-xs py-2 active:scale-95 text-emerald-600 dark:text-emerald-300 font-bold"
              onClick={() => quickSetMeals(selectedDate, 1)}
            >
              <span>{t.allOne}</span>
            </button>
            <button
              type="button"
              className="btn text-xs py-2 active:scale-95 text-emerald-600 dark:text-emerald-200 font-bold"
              onClick={() => quickSetMeals(selectedDate, 2)}
            >
              <span>{t.allTwo}</span>
            </button>
          </div>
        </div>

        {/* Member Meal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.members.map((memberObj, index) => {
            const member = memberObj.name;
            const count = Number(dayMeals[member]?.count) || 0;
            const selectedMonth = (selectedDate || today()).slice(0, 7);
            const totalMonthMeals = mealsForMember(data, member, selectedMonth);
            const monthLabel = getMonthLabel(selectedMonth);

            return (
              <div
                key={member}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between gap-3 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                {/* Top: Member Info & Monthly Total Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="icon-square w-8 h-8 rounded-lg shrink-0 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate leading-tight">
                        {member}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {monthLabel} {t.monthlyTotal}: <span className="text-emerald-600 dark:text-emerald-400 font-bold num">{formatNumber(totalMonthMeals)}</span> {t.mealUnit}
                      </p>
                    </div>
                  </div>

                  {/* Active day count pill indicator */}
                  <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                    count > 0
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/50 text-slate-500 dark:text-slate-400'
                  }`}>
                    {formatNumber(count)} {t.mealUnit}
                  </div>
                </div>

                {/* Bottom: Stepper Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 flex-1 min-w-[130px] max-w-[190px]">
                    {/* Minus button */}
                    <button
                      type="button"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base sm:text-lg font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none shrink-0"
                      disabled={count <= 0}
                      onClick={() => updateMealCount(selectedDate, member, Math.max(0, count - 1))}
                      aria-label="Decrease meal"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    {/* Direct numeric input */}
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={count}
                      onChange={e => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        updateMealCount(selectedDate, member, val);
                      }}
                      className="field h-9 sm:h-10 text-center font-extrabold text-sm sm:text-base py-1 px-1 rounded-xl flex-1 min-w-[42px]"
                    />

                    {/* Plus button */}
                    <button
                      type="button"
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-emerald-600 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 active:scale-95 text-base sm:text-lg font-bold text-white flex items-center justify-center cursor-pointer transition-all shadow-md shrink-0"
                      onClick={() => updateMealCount(selectedDate, member, count + 1)}
                      aria-label="Increase meal"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Half-meal quick toggles */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="btn text-xs py-1.5 px-2 hover:border-emerald-500 font-semibold"
                      onClick={() => updateMealCount(selectedDate, member, Number((count + 0.5).toFixed(1)))}
                      title={t.addHalfMeal}
                    >
                      {t.addHalfMeal}
                    </button>
                    {count > 0 && (
                      <button
                        type="button"
                        className="btn text-xs py-1.5 px-2 hover:border-red-500 text-red-500 dark:text-red-400"
                        onClick={() => updateMealCount(selectedDate, member, 0)}
                        title={t.makeZero}
                      >
                        {t.makeZero}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span className={`w-1.5 h-1.5 rounded-full ${syncState === 'syncing' ? 'bg-sky-500 animate-ping' : 'bg-emerald-500 animate-pulse'} inline-block`} />
          <span>{syncState === 'syncing' ? t.savingStatus : t.savedStatus}</span>
        </div>
      </div>
    </div>
  );
};
