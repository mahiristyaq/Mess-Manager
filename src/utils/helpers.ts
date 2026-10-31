import { MessData, TotalsSummary, MemberBalance, Transaction, Member } from '../types';

export const bnMonths = [
  'জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

export const enMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const bnDays = [
  'রোববার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
];

export const enDays = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function currentMonth(): string {
  return today().slice(0, 7);
}

export function getNextMonth(monthStr: string): string {
  const [y, m] = (monthStr || currentMonth()).split('-').map(Number);
  let nextY = y;
  let nextM = (m || 1) + 1;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  return `${nextY}-${String(nextM).padStart(2, '0')}`;
}

export function getPreviousMonth(monthStr: string): string {
  const [y, m] = (monthStr || currentMonth()).split('-').map(Number);
  let prevY = y;
  let prevM = (m || 1) - 1;
  if (prevM < 1) {
    prevM = 12;
    prevY -= 1;
  }
  return `${prevY}-${String(prevM).padStart(2, '0')}`;
}

export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const s = String(num);
  return s.replace(/\d/g, d => bnDigits[Number(d)]);
}

export function formatNumber(num: number | string, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'en') {
    const n = Number(num);
    if (!isNaN(n)) {
      return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
    }
    return String(num);
  }
  return toBengaliNumber(num);
}

export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'AED' | 'CAD' | 'MYR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  nameEn: string;
  nameBn: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BDT: { code: 'BDT', symbol: '৳', nameEn: 'BDT (৳) - Bangladeshi Taka', nameBn: 'BDT (৳) - বাংলাদেশি টাকা' },
  USD: { code: 'USD', symbol: '$', nameEn: 'USD ($) - US Dollar', nameBn: 'USD ($) - মার্কিন ডলার' },
  EUR: { code: 'EUR', symbol: '€', nameEn: 'EUR (€) - Euro', nameBn: 'EUR (€) - ইউরো' },
  GBP: { code: 'GBP', symbol: '£', nameEn: 'GBP (£) - British Pound', nameBn: 'GBP (£) - ব্রিটিশ পাউন্ড' },
  INR: { code: 'INR', symbol: '₹', nameEn: 'INR (₹) - Indian Rupee', nameBn: 'INR (₹) - ভারতীয় রুপি' },
  SAR: { code: 'SAR', symbol: '﷼', nameEn: 'SAR (﷼) - Saudi Riyal', nameBn: 'SAR (﷼) - সৌদি রিয়াল' },
  AED: { code: 'AED', symbol: 'د.إ', nameEn: 'AED (د.إ) - UAE Dirham', nameBn: 'AED (د.إ) - ইউএই দিরহাম' },
  CAD: { code: 'CAD', symbol: 'C$', nameEn: 'CAD (C$) - Canadian Dollar', nameBn: 'CAD (C$) - কানাডিয়ান ডলার' },
  MYR: { code: 'MYR', symbol: 'RM', nameEn: 'MYR (RM) - Malaysian Ringgit', nameBn: 'MYR (RM) - মালয়েশিয়ান রিঙ্গিত' },
};

export function money(n: number, lang: 'bn' | 'en' = 'bn', curr: CurrencyCode = 'BDT'): string {
  const num = Number(n) || 0;
  const cfg = CURRENCIES[curr] || CURRENCIES.BDT;
  const symbol = cfg.symbol;

  if (lang === 'bn') {
    const rawFormatted = num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
    return symbol + toBengaliNumber(rawFormatted);
  }
  return symbol + num.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 0 });
}

export function getMonthLabel(monthVal: string, lang: 'bn' | 'en' = 'bn'): string {
  if (!monthVal) monthVal = currentMonth();
  const [yy, mm] = monthVal.split('-');
  const idx = Number(mm) - 1;
  const monthName = lang === 'en' ? (enMonths[idx] || monthVal) : (bnMonths[idx] || monthVal);
  const yearStr = lang === 'en' ? (yy || '') : toBengaliNumber(yy || '');
  return `${monthName} ${yearStr}`;
}

export function formatLocalizedDate(dateInput: string | number | Date, lang: 'bn' | 'en' = 'bn'): string {
  try {
    let dateObj: Date;
    if (typeof dateInput === 'number') {
      dateObj = new Date(dateInput);
    } else if (typeof dateInput === 'string' && dateInput.includes('-')) {
      const parts = dateInput.split('-').map(Number);
      dateObj = new Date(parts[0], parts[1] - 1, parts[2] || 1);
    } else {
      dateObj = new Date(dateInput);
    }
    const locale = lang === 'bn' ? 'bn-BD' : undefined;
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return String(dateInput);
  }
}

export function formatLocalizedTime(timeInput: number | string | Date, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const dateObj = new Date(timeInput);
    const locale = lang === 'bn' ? 'bn-BD' : undefined;
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(dateObj);
  } catch {
    return '';
  }
}

export function formatFriendlyDate(dateStr: string, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (lang === 'en') {
      const dayName = enDays[dateObj.getDay()] || '';
      const monthName = enMonths[m - 1] || '';
      return `${dayName}, ${d} ${monthName}`;
    } else {
      const dayName = bnDays[dateObj.getDay()] || '';
      const monthName = bnMonths[m - 1] || '';
      return `${dayName}, ${toBengaliNumber(d)} ${monthName}`;
    }
  } catch {
    return dateStr;
  }
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function normalizeCodeString(code: string): string {
  return String(code || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function getMessKey(code: string): string {
  try {
    return 'mess_' + btoa(encodeURIComponent(normalizeCodeString(code))).replace(/=/g, '');
  } catch {
    return 'mess_' + normalizeCodeString(code).replace(/[^a-z0-9]/g, '');
  }
}

export function getMainDocPath(code: string): string {
  return `messes_v3/${encodeURIComponent(getMessKey(code))}/data/main`;
}

export async function hashPassword(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function computeFingerprint(d: MessData | null | undefined): string {
  if (!d) return '';
  return `${d.syncId || ''}_${d.updatedAt || 0}_${d.revision || 0}_${(d.members || []).join(',')}_${(d.transactions || []).length}_${JSON.stringify(d.meals || {}).length}`;
}

export function isMonthEditable(dateStr: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const targetMonth = dateStr.slice(0, 7);
  const curMonth = currentMonth();

  // Future months are always editable
  if (targetMonth > curMonth) return true;

  if (targetMonth === curMonth) return true;

  const now = new Date();
  // If current day is > 5, past months are locked
  if (now.getDate() > 5) {
    return false;
  }
  return true;
}

export function defaultData(isFresh = true, messName = 'আমার মেস'): MessData {
  return {
    version: 6,
    revision: isFresh ? 0 : 1,
    syncId: isFresh ? '' : uid(),
    isDefault: isFresh,
    config: {
      messName: messName || 'আমার মেস',
      month: currentMonth(),
      fixedCost: 0,
      fixedCostEnabled: false,
      adminPasswordHash: '',
    },
    members: [
      { name: 'সদস্য ১' },
      { name: 'সদস্য ২' },
      { name: 'সদস্য ৩' },
      { name: 'সদস্য ৪' },
    ],
    meals: {},
    transactions: [],
    updatedAt: isFresh ? 0 : Date.now(),
  };
}

export function normalizeMessData(raw: Partial<MessData> | null | undefined, fallbackName = 'আমার মেস'): MessData {
  const base = defaultData(false, fallbackName);
  const d = { ...base, ...(raw || {}) } as MessData;
  delete d.isDefault;

  d.config = { ...base.config, ...(raw?.config || {}) };
  if (!/^\d{4}-\d{2}$/.test(String(d.config.month || ''))) {
    d.config.month = currentMonth();
  }
  if (typeof d.config.fixedCostEnabled !== 'boolean') {
    d.config.fixedCostEnabled = Number(d.config.fixedCost || 0) > 0;
  }
  d.config.adminPasswordHash = String(d.config.adminPasswordHash || '');

  const cleanMembers = Array.isArray(d.members)
    ? d.members.map(m => {
        if (typeof m === 'string') return { name: m };
        return {
          name: String(m.name || '').trim(),
          leftMonth: m.leftMonth ? String(m.leftMonth).trim() : undefined,
          joinedMonth: m.joinedMonth ? String(m.joinedMonth).trim() : undefined,
        };
      }).filter(m => m.name)
    : [];
  d.members = cleanMembers.length ? cleanMembers : base.members;

  const cleanMeals: Record<string, Record<string, { count: number }>> = {};
  if (d.meals && typeof d.meals === 'object') {
    for (const [dt, dayObj] of Object.entries(d.meals)) {
      if (!dt || !dayObj || typeof dayObj !== 'object') continue;
      cleanMeals[dt] = {};
      for (const [mem, val] of Object.entries(dayObj)) {
        const mName = String(mem || '').trim();
        if (!mName) continue;
        cleanMeals[dt][mName] = { count: Math.max(0, Number((val as { count?: number })?.count) || 0) };
      }
    }
  }
  d.meals = cleanMeals;

  d.transactions = Array.isArray(d.transactions)
    ? d.transactions
        .filter(t => t && typeof t === 'object')
        .map(t => ({
          id: String(t.id || uid()),
          type: t.type === 'deposit' ? 'deposit' : 'expense',
          date: String(t.date || today()),
          amount: Math.max(0, Number(t.amount) || 0),
          note: String(t.note || ''),
          member: String(t.member || ''),
          payer: String(t.payer || ''),
          directPersonal: Boolean(t.directPersonal),
          createdAt: Number(t.createdAt) || Date.now(),
        }))
    : [];

  d.revision = Number(raw?.revision) || 0;
  d.syncId = String(raw?.syncId || '');
  d.updatedAt = Number(raw?.updatedAt) || 0;
  return d;
}

export function mealsForMember(data: MessData, member: string, month = data.config.month || currentMonth()): number {
  let n = 0;
  const cleanMember = String(member || '').trim().toLowerCase();
  for (const [date, all] of Object.entries(data.meals)) {
    if (date.slice(0, 7) === month && all && typeof all === 'object') {
      for (const [mName, val] of Object.entries(all)) {
        if (mName.trim().toLowerCase() === cleanMember) {
          n += Number((val as { count?: number })?.count || 0);
        }
      }
    }
  }
  return n;
}

export function allMeals(data: MessData, month = data.config.month || currentMonth()): number {
  let n = 0;
  if (data.meals && typeof data.meals === 'object') {
    for (const [date, dayObj] of Object.entries(data.meals)) {
      if (getTransactionMonth(date) === month && dayObj && typeof dayObj === 'object') {
        for (const val of Object.values(dayObj)) {
          n += Number((val as { count?: number })?.count || 0);
        }
      }
    }
  }
  return n;
}

export function getTransactionMonth(dateStr: string): string {
  if (!dateStr) return currentMonth();
  const s = String(dateStr).trim();
  if (/^\d{4}-\d{1,2}/.test(s)) {
    const parts = s.split('-');
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    return `${y}-${m}`;
  }
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(s)) {
    const parts = s.split(/[-/]/);
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}`;
  }
  return s.slice(0, 7);
}

export function getActiveMembersForMonth(data: MessData, month: string): Member[] {
  const monthMembersMap = new Map<string, Member>();

  // 1. Members in data.members
  (data.members || []).forEach(m => {
    if (!m || !m.name) return;
    const cleanName = m.name.trim();
    if (!cleanName) return;

    // If member left starting from a specific month, exclude them from this and future months
    if (m.leftMonth && month >= m.leftMonth) {
      return;
    }
    // If member joined in a future month, exclude them from past months
    if (m.joinedMonth && month < m.joinedMonth) {
      return;
    }
    monthMembersMap.set(cleanName.toLowerCase(), m);
  });

  // 2. Also include any member who has recorded meals in this specific month
  if (data.meals && typeof data.meals === 'object') {
    for (const [date, dayObj] of Object.entries(data.meals)) {
      if (getTransactionMonth(date) === month && dayObj && typeof dayObj === 'object') {
        for (const [mName, val] of Object.entries(dayObj)) {
          const count = Number((val as { count?: number })?.count) || 0;
          const cleanName = mName.trim();
          const lower = cleanName.toLowerCase();
          if (cleanName && count > 0 && !monthMembersMap.has(lower)) {
            monthMembersMap.set(lower, { name: cleanName });
          }
        }
      }
    }
  }

  // 3. Also include any member who has recorded transactions in this specific month
  if (Array.isArray(data.transactions)) {
    for (const tx of data.transactions) {
      if (getTransactionMonth(tx.date) === month) {
        const rawPayer = String(tx.payer || tx.member || '').trim();
        if (rawPayer) {
          const lower = rawPayer.toLowerCase();
          if (!monthMembersMap.has(lower)) {
            monthMembersMap.set(lower, { name: rawPayer });
          }
        }
      }
    }
  }

  return Array.from(monthMembersMap.values());
}

export function calculateTotals(data: MessData, targetMonth = data.config.month || currentMonth()): TotalsSummary {
  const monthTx = data.transactions.filter(t => getTransactionMonth(t.date) === targetMonth);
  const tx = [...monthTx].sort((a, b) =>
    (a.date || '').localeCompare(b.date || '') ||
    (a.type === b.type ? 0 : a.type === 'deposit' ? -1 : 1) ||
    ((a.createdAt || 0) - (b.createdAt || 0))
  );

  let deposits = 0;
  let expenses = 0;
  const memberDeposit: Record<string, number> = {};
  const memberMarket: Record<string, number> = {};
  const memberRawMarket: Record<string, number> = {};
  const txMeta: Record<string, { fromPool: number; ownPocket: number; poolAfter: number }> = {};

  const activeMembers = getActiveMembersForMonth(data, targetMonth);
  activeMembers.forEach(m => {
    memberDeposit[m.name] = 0;
    memberMarket[m.name] = 0;
    memberRawMarket[m.name] = 0;
  });

  for (const item of tx) {
    const amt = Number(item.amount || 0);
    const rawPayer = String(item.payer || item.member || '').trim();
    const matched = activeMembers.find(m => m.name.trim().toLowerCase() === rawPayer.toLowerCase());
    const payer = matched ? matched.name : rawPayer;

    if (!payer) continue;

    if (item.type === 'deposit') {
      deposits += amt;
      memberDeposit[payer] = (memberDeposit[payer] || 0) + amt;
      txMeta[item.id] = { fromPool: 0, ownPocket: 0, poolAfter: expenses };
    } else {
      expenses += amt;
      memberRawMarket[payer] = (memberRawMarket[payer] || 0) + amt;
      memberMarket[payer] = (memberMarket[payer] || 0) + amt;
      txMeta[item.id] = { fromPool: 0, ownPocket: amt, poolAfter: expenses };
    }
  }

  let allTimeExpenses = 0;
  let allTimeDeposits = 0;
  for (const item of (data.transactions || [])) {
    const amt = Number(item.amount || 0);
    if (item.type === 'deposit') {
      allTimeDeposits += amt;
    } else {
      allTimeExpenses += amt;
    }
  }

  const meals = allMeals(data, targetMonth);
  const rate = meals ? expenses / meals : 0;

  return {
    tx,
    deposits,
    expenses,
    allTimeExpenses,
    allTimeDeposits,
    meals,
    rate,
    cash: deposits - expenses,
    ownPocketTotal: expenses,
    memberDeposit,
    memberMarket,
    memberRawMarket,
    txMeta,
  };
}

export function calculateMemberBalance(
  data: MessData,
  member: string,
  totals: TotalsSummary,
  targetMonth = data.config.month || currentMonth()
): MemberBalance {
  const cleanMemberName = String(member || '').trim();
  const cashDeposit = Number(totals.memberDeposit[cleanMemberName] || 0);
  const market = Number(totals.memberRawMarket[cleanMemberName] || totals.memberMarket[cleanMemberName] || 0);

  // চূড়ান্ত হিসাবের টেবিলে জমা = ক্যাশ জমা + বাজার খরচ (যা সদস্য নিজে করেছেন)
  const deposit = Number((cashDeposit + market).toFixed(2));

  const ownMeals = mealsForMember(data, cleanMemberName, targetMonth);
  const food = Number((ownMeals * totals.rate).toFixed(2));
  const monthActiveMembers = getActiveMembersForMonth(data, targetMonth);
  const memberCount = monthActiveMembers.length || data.members.length || 1;
  const fixed = (data.config.fixedCostEnabled ? Number(data.config.fixedCost || 0) : 0) / memberCount;
  const totalCost = Number((food + (data.config.fixedCostEnabled ? fixed : 0)).toFixed(2));

  // ব্যালান্স = মোট জমা - মোট খরচ
  const balance = Number((deposit - totalCost).toFixed(2));

  return {
    deposit,
    cashDeposit,
    market,
    rawMarket: market,
    meals: ownMeals,
    food,
    fixed: data.config.fixedCostEnabled ? fixed : 0,
    totalCost,
    balance,
  };
}

export function downloadBlob(content: string, name: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function sanitizeTransactionInput(input: {
  amount: number | string;
  note?: string;
  payer?: string;
  member?: string;
  date?: string;
}): { valid: boolean; amount: number; note: string; payer: string; date: string; error?: string } {
  const cleanAmount = Math.max(0, Number(input.amount) || 0);
  if (!cleanAmount || cleanAmount <= 0) {
    return { valid: false, amount: 0, note: '', payer: '', date: '', error: 'INVALID_AMOUNT' };
  }
  const cleanNote = String(input.note || '').trim().slice(0, 300);
  const cleanPayer = String(input.payer || input.member || '').trim().slice(0, 100);
  const cleanDate = String(input.date || today()).trim();

  return {
    valid: true,
    amount: Number(cleanAmount.toFixed(2)),
    note: cleanNote,
    payer: cleanPayer,
    date: cleanDate,
  };
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  totals: TotalsSummary,
  lang: 'bn' | 'en' = 'bn',
  currency: CurrencyCode = 'BDT'
): string {
  const currencySymbol = CURRENCIES[currency]?.symbol || '৳';
  const headers = lang === 'en'
    ? ['ID', 'Date', 'Type', 'Payer/Member', `Amount (${currencySymbol})`, 'Note']
    : ['আইডি', 'তারিখ', 'ধরণ', 'সদস্য/প্রদানকারী', `পরিমাণ (${currencySymbol})`, 'বিবরণ'];

  const rows = transactions.map(t => {
    const typeLabel = lang === 'en' ? 'Expense' : 'বাজার খরচ';
    const payer = t.payer || t.member || (lang === 'en' ? 'Member' : 'সদস্য');
    const safeNote = `"${(t.note || '').replace(/"/g, '""')}"`;
    return [t.id, t.date, typeLabel, `"${payer.replace(/"/g, '""')}"`, t.amount.toFixed(2), safeNote].join(',');
  });

  const totalLabel = lang === 'en' ? 'TOTAL EXPENSES' : 'সর্বমোট বাজার খরচ';
  const footerRow = ['', '', totalLabel, '', totals.expenses.toFixed(2), ''].join(',');

  return ['\uFEFF' + headers.join(','), ...rows, footerRow].join('\n');
}

