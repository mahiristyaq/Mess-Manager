export interface Transaction {
  id: string;
  type: 'deposit' | 'expense';
  date: string;
  amount: number;
  note: string;
  member: string; // for deposit
  payer: string;  // for expense
  directPersonal: boolean;
  createdAt: number;
  isPending?: boolean;
}

export type MealsData = Record<string, Record<string, { count: number }>>;

export interface MessConfig {
  messName: string;
  month: string;
  fixedCost: number;
  fixedCostEnabled: boolean;
  adminPasswordHash: string;
}

export interface Member {
  name: string;
  leftMonth?: string;
  joinedMonth?: string;
}

export interface MessData {
  version: number;
  revision: number;
  syncId: string;
  isDefault?: boolean;
  config: MessConfig;
  members: Member[];
  meals: MealsData;
  transactions: Transaction[];
  updatedAt: number;
  updatedBy?: string;
  pendingLeaveRequests?: string[];
}

export interface MemberBalance {
  deposit: number; // মোট জমা (ক্যাশ টাকা + বাজার খরচ)
  cashDeposit?: number; // আলাদা ক্যাশ জমা
  market: number; // বাজার খরচ
  rawMarket: number;
  meals: number;
  food: number;
  fixed: number;
  totalCost: number;
  balance: number;
}

export interface TotalsSummary {
  tx: Transaction[];
  deposits: number;
  expenses: number;
  allTimeExpenses: number;
  allTimeDeposits: number;
  meals: number;
  rate: number;
  cash: number;
  ownPocketTotal: number;
  memberDeposit: Record<string, number>;
  memberMarket: Record<string, number>;
  memberRawMarket: Record<string, number>;
  txMeta: Record<string, { fromPool: number; ownPocket: number; poolAfter: number }>;
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error';

export interface SavedMess {
  name: string;
  code: string;
  lastUsed?: number;
}
