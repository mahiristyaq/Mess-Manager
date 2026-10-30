import React from 'react';
import { useMess } from '../context/MessContext';
import { useLanguage } from '../context/LanguageContext';
import { Home, Utensils, ShoppingBag, FileText } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useMess();
  const { t } = useLanguage();

  const navItems = [
    { id: 'home' as const, label: t.navHome, icon: Home },
    { id: 'meals' as const, label: t.navMeals, icon: Utensils },
    { id: 'market' as const, label: t.navMarket, icon: ShoppingBag },
    { id: 'report' as const, label: t.navReport, icon: FileText },
  ];

  return (
    <nav className="nav-bar" aria-label="Navigation">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id || (item.id === 'market' && activeTab === 'history');
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`group flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all duration-200 cursor-pointer min-w-0 select-none ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div
              className={`flex items-center justify-center px-3.5 sm:px-4 py-1 rounded-full transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 scale-105 shadow-xs'
                  : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span
              className={`text-[11px] sm:text-xs mt-1 leading-none tracking-tight truncate max-w-full ${
                isActive ? 'font-bold' : 'font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
