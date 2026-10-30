import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import { MessData, MessConfig, Transaction, SyncState, SavedMess, MemberBalance, TotalsSummary, Member } from '../types';
import {
  today,
  currentMonth,
  uid,
  normalizeCodeString,
  getMessKey,
  computeFingerprint,
  normalizeMessData,
  defaultData,
  calculateTotals,
  calculateMemberBalance,
  getMainDocPath,
  bnMonths,
  sanitizeTransactionInput,
  isMonthEditable,
  getActiveMembersForMonth,
} from '../utils/helpers';
import {
  restGetDoc,
  restSetDoc,
  fetchRemoteMess,
  testFirestoreConnection,
  getClientInstanceId,
  subscribeToMess,
  updateMonthlySummary,
  updateRunningSummaryAtomic,
} from '../services/firebaseSync';

interface MessContextType {
  messCode: string;
  messName: string;
  data: MessData;
  activeTab: 'home' | 'meals' | 'market' | 'history' | 'report';
  setActiveTab: (tab: 'home' | 'meals' | 'market' | 'history' | 'report') => void;
  canGoBack: boolean;
  goBack: () => void;
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (val: boolean) => void;
  syncState: SyncState;
  syncStatusText: string;
  firebaseError: { title: string; desc: string } | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  savedMesses: SavedMess[];

  // Modals state
  isAuthModalOpen: boolean;
  isEntryModalOpen: boolean;
  entryModalData: { type: 'deposit' | 'expense'; id?: string } | null;
  isAdminGateOpen: boolean;
  adminGateMode: 'login' | 'setup' | 'change';
  isSettingsOpen: boolean;
  isQuickSettingsOpen: boolean;
  isReportEditOpen: boolean;
  reportEditMember: string | null;
  confirmModal: { isOpen: boolean; message: string; onConfirm: () => void } | null;

  // Actions
  handleAuth: (name: string, code: string, mode: 'login' | 'create') => Promise<boolean>;
  switchMess: () => void;
  deleteMess: () => void;
  requestLeave: (memberName: string) => void;
  handleLeaveRequest: (memberName: string, approve: boolean) => void;
  syncNow: () => Promise<void>;
  updateMealCount: (date: string, member: string, count: number) => void;
  quickSetMeals: (date: string, count: number) => void;
  saveTransaction: (txData: {
    id?: string;
    type: 'deposit' | 'expense';
    date: string;
    amount: number;
    note: string;
    member?: string;
    payer?: string;
  }) => void;
  deleteTransaction: (id: string) => void;
  resetCurrentMonth: () => void;
  startNewMonth: () => void;
  transferBalances: () => void;
  saveSettings: (config: MessConfig, members: Member[], draftItems: { orig: string; name: string }[]) => void;
  saveReportEdit: (origMember: string, newName: string, deposit: number, market: number, meals: number) => void;
  testFirebase: () => Promise<{ ok: boolean; statusText: string; details: string; ms: number }>;
  lockAdmin: () => void;

  // Modal helpers
  openEntry: (type: 'deposit' | 'expense', id?: string) => void;
  closeEntry: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openQuickSettings: () => void;
  closeQuickSettings: () => void;
  openAdminGate: (mode?: 'login' | 'setup' | 'change', nextAction?: () => void) => void;
  closeAdminGate: () => void;
  unlockAdminAndProceed: () => void;
  openReportEdit: (member: string) => void;
  closeReportEdit: () => void;
  askConfirm: (message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;

  // Active calculation month
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  availableMonths: string[];

  // Totals & balances
  totals: TotalsSummary;
  getMemberBalance: (member: string) => MemberBalance;
}

const MessContext = createContext<MessContextType | undefined>(undefined);

export const MessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<'home' | 'meals' | 'market' | 'history' | 'report'>('home');
  const [tabHistory, setTabHistory] = useState<('home' | 'meals' | 'market' | 'history' | 'report')[]>(['home']);
  const tabHistoryRef = useRef<('home' | 'meals' | 'market' | 'history' | 'report')[]>(['home']);
  const [messCode, setMessCode] = useState<string>(() => {
    try {
      return localStorage.getItem('mess_manager_code') || '';
    } catch {
      return '';
    }
  });
  const [messName, setMessName] = useState<string>(() => {
    try {
      return localStorage.getItem('mess_manager_name') || '';
    } catch {
      return '';
    }
  });

  const [data, setData] = useState<MessData>(() => {
    try {
      const code = localStorage.getItem('mess_manager_code');
      if (code) {
        const raw = localStorage.getItem(getMessKey(code));
        if (raw) {
          const parsed = JSON.parse(raw);
          // Migration: if members is string[], map to Member[]
          if (parsed.members && typeof parsed.members[0] === 'string') {
            parsed.members = parsed.members.map((m: string) => ({ name: m, code: '' }));
          }
          return normalizeMessData(parsed);
        }
      }
    } catch {}
    return defaultData(true, 'আমার মেস');
  });

  const [activeMonth, setActiveMonth] = useState<string>(() => {
    try {
      const code = localStorage.getItem('mess_manager_code');
      if (code) {
        const raw = localStorage.getItem(getMessKey(code));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.config?.month) return parsed.config.month;
        }
      }
    } catch {}
    return currentMonth();
  });

  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const isAdminUnlockedRef = useRef<boolean>(false);
  useEffect(() => {
    isAdminUnlockedRef.current = isAdminUnlocked;
  }, [isAdminUnlocked]);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [syncStatusText, setSyncStatusText] = useState<string>('অনলাইনে সিঙ্ক হয়েছে');
  const [firebaseError, setFirebaseError] = useState<{ title: string; desc: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savedMesses, setSavedMesses] = useState<SavedMess[]>([]);
  const { t } = useLanguage();

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(!messCode);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [entryModalData, setEntryModalData] = useState<{ type: 'deposit' | 'expense'; id?: string } | null>(null);
  const [isAdminGateOpen, setIsAdminGateOpen] = useState<boolean>(false);
  const [adminGateMode, setAdminGateMode] = useState<'login' | 'setup' | 'change'>('login');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState<boolean>(false);
  const [isReportEditOpen, setIsReportEditOpen] = useState<boolean>(false);
  const [reportEditMember, setReportEditMember] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; message: string; onConfirm: () => void } | null>(null);

  const isQuickSettingsOpenRef = useRef(isQuickSettingsOpen);
  const isEntryModalOpenRef = useRef(isEntryModalOpen);
  const isAdminGateOpenRef = useRef(isAdminGateOpen);
  const isSettingsOpenRef = useRef(isSettingsOpen);
  const isReportEditOpenRef = useRef(isReportEditOpen);
  const confirmModalRef = useRef(confirmModal);

  useEffect(() => {
    isQuickSettingsOpenRef.current = isQuickSettingsOpen;
  }, [isQuickSettingsOpen]);
  useEffect(() => {
    isEntryModalOpenRef.current = isEntryModalOpen;
  }, [isEntryModalOpen]);
  useEffect(() => {
    isAdminGateOpenRef.current = isAdminGateOpen;
  }, [isAdminGateOpen]);
  useEffect(() => {
    isSettingsOpenRef.current = isSettingsOpen;
  }, [isSettingsOpen]);
  useEffect(() => {
    isReportEditOpenRef.current = isReportEditOpen;
  }, [isReportEditOpen]);
  useEffect(() => {
    confirmModalRef.current = confirmModal;
  }, [confirmModal]);

  const setActiveTab = useCallback((tab: 'home' | 'meals' | 'market' | 'history' | 'report') => {
    setActiveTabState(prev => {
      if (prev === tab) return prev;
      const nextHist = [...tabHistoryRef.current, tab];
      tabHistoryRef.current = nextHist;
      setTabHistory(nextHist);
      try {
        window.history.pushState({ tab, depth: nextHist.length }, '');
      } catch {}
      return tab;
    });
  }, []);

  const goBack = useCallback(() => {
    // 1. If any modal/drawer is open, close it first
    if (isQuickSettingsOpenRef.current) {
      setIsQuickSettingsOpen(false);
      return;
    }
    if (isEntryModalOpenRef.current) {
      setIsEntryModalOpen(false);
      setEntryModalData(null);
      return;
    }
    if (isAdminGateOpenRef.current) {
      setIsAdminGateOpen(false);
      return;
    }
    if (isSettingsOpenRef.current) {
      setIsSettingsOpen(false);
      return;
    }
    if (isReportEditOpenRef.current) {
      setIsReportEditOpen(false);
      setReportEditMember(null);
      return;
    }
    if (confirmModalRef.current?.isOpen) {
      setConfirmModal(null);
      return;
    }

    // 2. Tab navigation back
    const hist = tabHistoryRef.current;
    if (hist.length > 1) {
      const nextHist = hist.slice(0, -1);
      tabHistoryRef.current = nextHist;
      setTabHistory(nextHist);
      const targetTab = nextHist[nextHist.length - 1];
      setActiveTabState(targetTab);
    } else {
      setActiveTabState('home');
      tabHistoryRef.current = ['home'];
      setTabHistory(['home']);
    }
  }, []);

  const canGoBack = activeTab !== 'home' || tabHistory.length > 1;

  // Browser / Mobile back button listener
  useEffect(() => {
    try {
      if (!window.history.state) {
        window.history.replaceState({ tab: 'home', depth: 1 }, '');
      }
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      // 1. If modal is open, close modal
      if (isQuickSettingsOpenRef.current) {
        setIsQuickSettingsOpen(false);
        return;
      }
      if (isEntryModalOpenRef.current) {
        setIsEntryModalOpen(false);
        setEntryModalData(null);
        return;
      }
      if (isAdminGateOpenRef.current) {
        setIsAdminGateOpen(false);
        return;
      }
      if (isSettingsOpenRef.current) {
        setIsSettingsOpen(false);
        return;
      }
      if (isReportEditOpenRef.current) {
        setIsReportEditOpen(false);
        setReportEditMember(null);
        return;
      }
      if (confirmModalRef.current?.isOpen) {
        setConfirmModal(null);
        return;
      }

      // 2. Otherwise handle tab state
      if (e.state && e.state.tab) {
        setActiveTabState(e.state.tab);
        const cur = tabHistoryRef.current;
        if (cur.length > 1) {
          const next = cur.slice(0, -1);
          tabHistoryRef.current = next;
          setTabHistory(next);
        }
      } else {
        const cur = tabHistoryRef.current;
        if (cur.length > 1) {
          const next = cur.slice(0, -1);
          tabHistoryRef.current = next;
          setTabHistory(next);
          setActiveTabState(next[next.length - 1]);
        } else {
          setActiveTabState('home');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const pendingAdminActionRef = useRef<(() => void) | null>(null);
  const hasUnsyncedEditRef = useRef<boolean>(false);
  const lastServerUpdateTimeRef = useRef<string>('');
  const lastAppliedFingerprintRef = useRef<string>('');
  const syncInFlightRef = useRef<boolean>(false);
  const dataRef = useRef<MessData>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Update saved messes registry
  const refreshSavedMesses = useCallback(() => {
    try {
      const raw = localStorage.getItem('mess_manager_registry');
      let items: SavedMess[] = raw ? JSON.parse(raw) : [];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('mess_') && k !== 'mess_manager_name' && k !== 'mess_manager_code' && k !== 'mess_manager_registry') {
          const b64 = k.slice(5);
          try {
            const decoded = decodeURIComponent(atob(b64));
            if (decoded && !items.some(x => normalizeCodeString(x.code) === normalizeCodeString(decoded))) {
              const d = JSON.parse(localStorage.getItem(k) || '{}');
              items.push({ name: d?.config?.messName || decoded, code: decoded });
            }
          } catch {}
        }
      }
      setSavedMesses(items);
    } catch {
      setSavedMesses([]);
    }
  }, []);

  const saveMessRegistry = useCallback((name: string, code: string) => {
    if (!code) return;
    try {
      const raw = localStorage.getItem('mess_manager_registry');
      const list: SavedMess[] = raw ? JSON.parse(raw) : [];
      const cleanCode = normalizeCodeString(code);
      const filtered = list.filter(x => normalizeCodeString(x.code || '') !== cleanCode);
      filtered.unshift({ name: name || cleanCode, code: code.trim(), lastUsed: Date.now() });
      localStorage.setItem('mess_manager_registry', JSON.stringify(filtered.slice(0, 10)));
      refreshSavedMesses();
    } catch {}
  }, [refreshSavedMesses]);

  // Push to cloud Firestore REST
  const pushToCloud = useCallback(async (customData?: MessData): Promise<boolean> => {
    const curCode = messCode;
    const toSend = customData || dataRef.current;
    if (!curCode || !toSend || toSend.isDefault) return false;

    syncInFlightRef.current = true;
    setSyncState('syncing');
    setSyncStatusText('সিঙ্ক হচ্ছে...');

    const payload = {
      ...normalizeMessData(toSend),
      updatedBy: getClientInstanceId(),
    };
    delete payload.isDefault;

    const docPath = getMainDocPath(curCode);
    try {
      const res = await restSetDoc(docPath, payload);
      if (res.ok) {
        hasUnsyncedEditRef.current = false;
        if (res.updateTime) lastServerUpdateTimeRef.current = res.updateTime;
        lastAppliedFingerprintRef.current = computeFingerprint(payload);
        setSyncState('synced');
        setSyncStatusText('অনলাইনে সিঙ্ক হয়েছে');
        setFirebaseError(null);
        return true;
      }
      if (res.status === 403) {
        setSyncState('error');
        setSyncStatusText('ফায়ারবেস লকড (403)');
        setFirebaseError({
          title: 'ফায়ারবেস সিকিউরিটি রুলস লক হয়ে আছে (403 Permission Denied)',
          desc: 'আপনার Firebase Console → Firestore Database → Rules-এ গিয়ে allow read, write: if true; দিয়ে Publish করুন।',
        });
        return false;
      }
      setSyncState('offline');
      setSyncStatusText('অফলাইনে সেভ, সিঙ্ক বাকি');
      return false;
    } catch {
      setSyncState('offline');
      setSyncStatusText('অফলাইনে সেভ, সিঙ্ক বাকি');
      return false;
    } finally {
      syncInFlightRef.current = false;
    }
  }, [messCode]);

  // Pull from cloud Firestore REST
  const pullFromCloud = useCallback(async (silent = true, forcePull = false): Promise<boolean> => {
    const curCode = messCode;
    if (!curCode) return false;
    if (!silent) {
      setSyncState('syncing');
      setSyncStatusText('সিঙ্ক হচ্ছে...');
    }

    try {
      const docPath = getMainDocPath(curCode);
      const res = await restGetDoc(docPath);

      if (res.status === 403) {
        setSyncState('error');
        setSyncStatusText('ফায়ারবেস লকড (403)');
        setFirebaseError({
          title: 'ফায়ারবেস সিকিউরিটি রুলস লক হয়ে আছে (403 Permission Denied)',
          desc: 'আপনার Firebase Console → Firestore Database → Rules-এ গিয়ে allow read, write: if true; দিয়ে Publish করুন।',
        });
        if (!silent) showToast('ফায়ারবেস Rules লক হয়ে আছে (403 Permission Denied)');
        return false;
      }

      if (res.ok && res.exists && res.data) {
        setFirebaseError(null);
        const remote = res.data as Partial<MessData>;
        const remoteFp = computeFingerprint(remote as MessData);

        if (forcePull || !hasUnsyncedEditRef.current) {
          if (forcePull || remoteFp !== lastAppliedFingerprintRef.current || (res.updateTime && res.updateTime !== lastServerUpdateTimeRef.current)) {
            const normalized = normalizeMessData(remote);
            lastAppliedFingerprintRef.current = remoteFp;
            if (res.updateTime) lastServerUpdateTimeRef.current = res.updateTime;
            hasUnsyncedEditRef.current = false;

            setData(normalized);
            if (normalized.config?.messName) {
              setMessName(normalized.config.messName);
              localStorage.setItem('mess_manager_name', normalized.config.messName);
            }
            localStorage.setItem(getMessKey(curCode), JSON.stringify(normalized));
            saveMessRegistry(normalized.config?.messName || curCode, curCode);
          }
          setSyncState('synced');
          setSyncStatusText(t.onlineSyncedStatus);
          if (!silent) showToast(t.latestLedgerUpdated);
          return true;
        } else {
          return await pushToCloud();
        }
      }

      if (res.ok && !res.exists) {
        setFirebaseError(null);
        const legacy = await fetchRemoteMess(curCode);
        if (legacy && legacy.data) {
          const normalized = normalizeMessData(legacy.data);
          setData(normalized);
          await pushToCloud(normalized);
          if (!silent) showToast(t.latestLedgerUpdated);
          return true;
        }
        if (dataRef.current && !dataRef.current.isDefault) {
          return await pushToCloud(dataRef.current);
        }
        setSyncState('synced');
        setSyncStatusText(t.onlineSyncedStatus);
        return true;
      }
    } catch {}

    setSyncState('offline');
    setSyncStatusText(t.offlineSyncPending);
    if (!silent) showToast(t.serverConnError);
    return false;
  }, [messCode, pushToCloud, showToast, saveMessRegistry, t]);

  // Ref to hold the debounce timeout
  const syncTimeoutRef = useRef<number | null>(null);

  // Persist locally & schedule sync
  const saveAndSync = useCallback((updater: (prev: MessData) => MessData) => {
    setData(prev => {
      const updated = updater(prev);
      const nextData: MessData = {
        ...updated,
        revision: (Number(updated.revision) || 0) + 1,
        updatedAt: Date.now(),
        syncId: uid(),
        updatedBy: getClientInstanceId(),
      };
      delete nextData.isDefault;

      hasUnsyncedEditRef.current = true;
      lastAppliedFingerprintRef.current = computeFingerprint(nextData);

      try {
        localStorage.setItem(getMessKey(messCode), JSON.stringify(nextData));
        saveMessRegistry(nextData.config.messName || messName, messCode);
      } catch {
        showToast('লোকাল স্টোরেজ পূর্ণ');
      }

      // Debounce push
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        pushToCloud(nextData);
      }, 1000);

      return nextData;
    });
  }, [messCode, messName, pushToCloud, saveMessRegistry, showToast]);

  // Initial load & Polling
  useEffect(() => {
    refreshSavedMesses();
    if (messCode) {
      pullFromCloud(true, true);
    }
  }, [messCode]);

  // Real-time listener via Firebase Firestore onSnapshot with explicit cleanup and visibility pause (Points 4 & 5)
  useEffect(() => {
    if (!messCode) return;
    let unsub: (() => void) | null = null;
    let isDisposed = false;

    const startListener = () => {
      if (unsub) {
        unsub();
        unsub = null;
      }
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        // Tab is hidden or in background - pause listener to prevent zombie reads
        return;
      }
      const u = subscribeToMess(
        messCode,
        (remoteData, meta) => {
          if (isDisposed) return;
          if (!hasUnsyncedEditRef.current && remoteData) {
            const fp = computeFingerprint(remoteData as MessData);
            if (fp !== lastAppliedFingerprintRef.current) {
              const normalized = normalizeMessData(remoteData);
              lastAppliedFingerprintRef.current = fp;
              setData(normalized);
            }
          }
          if (meta?.hasPendingWrites) {
            setSyncState('syncing');
            setSyncStatusText('অফলাইনে সেভড · সিঙ্ক অপেক্ষমাণ');
          } else {
            setSyncState('synced');
            setSyncStatusText('অনলাইনে সিঙ্ক হয়েছে');
          }
        },
        err => {
          console.debug('Firestore subscription notice:', err);
        }
      );
      if (u) {
        unsub = u;
      }
    };

    const stopListener = () => {
      if (unsub) {
        unsub();
        unsub = null;
      }
    };

    startListener();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stopListener();
      } else if (document.visibilityState === 'visible') {
        startListener();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isDisposed = true;
      stopListener();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [messCode]);

  // Event-driven online / offline & visibility sync (eliminates aggressive polling to stay within Spark plan)
  useEffect(() => {
    const handleOnline = () => {
      showToast('ইন্টারনেট সংযোগ ফিরে এসেছে');
      if (messCode) {
        if (hasUnsyncedEditRef.current) pushToCloud();
        else pullFromCloud(true, true);
      }
    };
    const handleOffline = () => {
      setSyncState('offline');
      setSyncStatusText('অফলাইন · লোকাল সেভ');
      showToast('ইন্টারনেট সংযোগ বিচ্ছিন্ন · অফলাইন মোড সক্রিয়');
    };
    const handleVisibility = () => {
      if (!messCode) return;
      if (document.visibilityState === 'visible') {
        if (hasUnsyncedEditRef.current) pushToCloud();
        else pullFromCloud(true, false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [messCode, pushToCloud, pullFromCloud, showToast]);

  // Sync now action
  const syncNow = useCallback(async () => {
    if (!messCode) {
      showToast('আগে মেসে লগইন করুন।');
      return;
    }
    setSyncState('syncing');
    setSyncStatusText('সিঙ্ক হচ্ছে...');
    if (hasUnsyncedEditRef.current) {
      const ok = await pushToCloud();
      if (ok) showToast('সিঙ্ক সম্পন্ন হয়েছে');
      else showToast('সিঙ্ক হয়নি');
    } else {
      await pullFromCloud(false, true);
    }
  }, [messCode, pushToCloud, pullFromCloud, showToast]);

  // Auth Handler
  const checkEditPermission = useCallback((date: string) => {
    if (!isMonthEditable(date, isAdminUnlocked)) {
      showToast(t.editOldMonthWarning);
      return false;
    }
    return true;
  }, [isAdminUnlocked, showToast, t]);

  const openAdminGateRef = useRef<((mode?: 'login' | 'setup' | 'change', nextAction?: () => void) => void) | null>(null);

  const checkAdminPermission = useCallback(() => {
    if (dataRef.current.config.adminPasswordHash && !isAdminUnlockedRef.current) {
      showToast('ম্যানেজার সেটিংস লক করা আছে। কোনো পরিবর্তন করতে হলে আগে ম্যানেজার পাসওয়ার্ড দিয়ে আনলক করুন');
      if (openAdminGateRef.current) {
        openAdminGateRef.current('login');
      }
      return false;
    }
    return true;
  }, [showToast]);

  const handleAuth = useCallback(async (name: string, code: string, mode: 'login' | 'create'): Promise<boolean> => {
    const mCode = normalizeCodeString(code);
    if (!mCode) {
      showToast('অনুগ্রহ করে মেস কোডটি লিখুন।');
      return false;
    }
    if (mode === 'create' && !name.trim()) {
      showToast('নতুন মেস তৈরির জন্য মেসের নাম ও মেস কোড উভয়ই দিন।');
      return false;
    }

    try {
      // Check local first
      let localData: MessData | null = null;
      try {
        const raw = localStorage.getItem(getMessKey(mCode));
        if (raw) localData = normalizeMessData(JSON.parse(raw));
      } catch {}

      // Check remote
      const remoteWrap = await fetchRemoteMess(mCode);
      const remoteData = remoteWrap?.data || null;

      let nextData: MessData;
      let nextName = name.trim();

      if (remoteData) {
        nextData = normalizeMessData(remoteData);
        if (nextName && (!nextData.config.messName || nextData.config.messName === 'আমার মেস')) {
          nextData.config.messName = nextName;
        }
        nextName = nextData.config.messName || nextName || mCode;
        lastServerUpdateTimeRef.current = remoteWrap?.updateTime || '';
        lastAppliedFingerprintRef.current = computeFingerprint(nextData);
        hasUnsyncedEditRef.current = false;
      } else if (localData) {
        nextData = normalizeMessData(localData);
        if (nextName && (!nextData.config.messName || nextData.config.messName === 'আমার মেস')) {
          nextData.config.messName = nextName;
        }
        nextName = nextData.config.messName || nextName || mCode;
        hasUnsyncedEditRef.current = true;
      } else {
        nextName = nextName || mCode;
        nextData = defaultData(false, nextName);
        nextData.config.messName = nextName;
        nextData.updatedAt = Date.now();
        nextData.revision = 1;
        nextData.syncId = uid();
        hasUnsyncedEditRef.current = true;
      }

      // If user typed a member code/name during login (when name is not empty in login mode), verify if member exists in mess or prompt/add or restrict
      let isVerifiedMember = true;
      if (mode === 'login' && name.trim()) {
        const inputMem = normalizeCodeString(name);
        const matchedMember = (nextData.members || []).find(m => 
          normalizeCodeString(m.name) === inputMem || 
          normalizeCodeString(m.name).includes(inputMem)
        );
        
        if (!matchedMember) {
          showToast('এই সদস্য কোড বা নামটি এই মেসে তালিকাভুক্ত নয়। ম্যানেজার সেটিংস থেকে সদস্য যোগ করুন।');
          return false;
        } else {
          // Use the stored member name
          nextName = matchedMember.name;
        }
      }

      setMessCode(mCode);
      setMessName(nextName);
      setData(nextData);

      localStorage.setItem('mess_manager_name', nextName);
      localStorage.setItem('mess_manager_code', mCode);
      localStorage.setItem(getMessKey(mCode), JSON.stringify(nextData));
      saveMessRegistry(nextName, mCode);

      setIsAuthModalOpen(false);

      if (!remoteData || hasUnsyncedEditRef.current) {
        await pushToCloud(nextData);
      }
      showToast(
        remoteData
          ? `"${nextName}" মেসে সংযুক্ত হয়েছে`
          : mode === 'create'
          ? 'নতুন মেস সফলভাবে তৈরি হয়েছে'
          : `"${nextName}" মেসে প্রবেশ করা হয়েছে`
      );
      return true;
    } catch {
      showToast('মেসে সংযোগ করতে ব্যর্থ হয়েছে');
      return false;
    }
  }, [pushToCloud, saveMessRegistry, showToast]);

  // Switch Mess
  const switchMess = useCallback(() => {
    setIsSettingsOpen(false);
    localStorage.removeItem('mess_manager_name');
    localStorage.removeItem('mess_manager_code');
    setMessCode('');
    setMessName('');
    setIsAdminUnlocked(false);
    setIsAuthModalOpen(true);
    refreshSavedMesses();
  }, [refreshSavedMesses]);

  // Delete Mess / Account
  const deleteMess = useCallback(() => {
    if (!messCode) return;
    try {
      localStorage.removeItem(getMessKey(messCode));
      const raw = localStorage.getItem('mess_manager_registry');
      if (raw) {
        const list: SavedMess[] = JSON.parse(raw);
        const filtered = list.filter(x => normalizeCodeString(x.code) !== normalizeCodeString(messCode));
        localStorage.setItem('mess_manager_registry', JSON.stringify(filtered));
      }
    } catch {}
    switchMess();
    showToast(t.messDeletedDone);
  }, [messCode, switchMess, showToast, t]);

  // Request Leave Mess
  const requestLeave = useCallback((memberName: string) => {
    if (!messCode || !memberName) return;
    saveAndSync(prev => {
      const currentRequests = prev.pendingLeaveRequests || [];
      if (currentRequests.includes(memberName)) return prev;
      return {
        ...prev,
        pendingLeaveRequests: [...currentRequests, memberName],
      };
    });
    showToast(t.leaveMessRequestedToast);
  }, [saveAndSync, showToast, t]);

  // Handle Leave Request (Approve or Reject)
  const handleLeaveRequest = useCallback((memberName: string, approve: boolean) => {
    if (!messCode || !memberName) return;
    saveAndSync(prev => {
      const pending = (prev.pendingLeaveRequests || []).filter(m => m !== memberName);
      if (!approve) {
        return { ...prev, pendingLeaveRequests: pending };
      }
      // Remove member from members list
      const members = prev.members.filter(m => m.name !== memberName);
      return {
        ...prev,
        members: members.length ? members : prev.members,
        pendingLeaveRequests: pending,
      };
    });
    if (approve) {
      showToast(t.memberLeftToast(memberName));
    } else {
      showToast('আবেদন বাতিল করা হয়েছে');
    }
  }, [saveAndSync, showToast, t]);

  // Update meal count for a day & member
  const updateMealCount = useCallback((date: string, member: string, count: number) => {
    if (!checkEditPermission(date)) return;
    const safeCount = Math.max(0, count);
    const oldVal = Number(dataRef.current?.meals?.[date]?.[member]?.count || 0);
    const mealsDelta = safeCount - oldVal;

    if (messCode && mealsDelta !== 0) {
      updateRunningSummaryAtomic(messCode, date.slice(0, 7), {
        mealsDelta,
        member,
      });
    }

    saveAndSync(prev => {
      const nextMeals = { ...prev.meals };
      if (!nextMeals[date]) nextMeals[date] = {};
      nextMeals[date] = {
        ...nextMeals[date],
        [member]: { count: safeCount },
      };
      return { ...prev, meals: nextMeals };
    });
  }, [saveAndSync, messCode, checkEditPermission]);

  // Quick set all meals
  const quickSetMeals = useCallback((date: string, count: number) => {
    if (!checkEditPermission(date)) return;
    const safeCount = Math.max(0, count);
    const targetMonth = date.slice(0, 7);
    const monthMembers = getActiveMembersForMonth(dataRef.current, targetMonth);
    if (messCode) {
      let totalMealsDelta = 0;
      monthMembers.forEach(m => {
        const oldVal = Number(dataRef.current?.meals?.[date]?.[m.name]?.count || 0);
        totalMealsDelta += (safeCount - oldVal);
      });
      if (totalMealsDelta !== 0) {
        updateRunningSummaryAtomic(messCode, targetMonth, {
          mealsDelta: totalMealsDelta,
        });
      }
    }

    saveAndSync(prev => {
      const nextMeals = { ...prev.meals };
      nextMeals[date] = {};
      const prevMonthMembers = getActiveMembersForMonth(prev, targetMonth);
      prevMonthMembers.forEach(m => {
        nextMeals[date][m.name] = { count: safeCount };
      });
      return { ...prev, meals: nextMeals };
    });
    showToast(t.allMealsUpdatedToast);
  }, [saveAndSync, showToast, messCode, checkEditPermission, t]);

  const getMonthLabel = (m: string) => {
    const [, mo] = m.split('-').map(Number);
    const name = bnMonths[(mo || 1) - 1] || m;
    return name;
  };

  // Add or edit transaction with input sanitization, atomic increment, and offline safety (Points 4, 5, 6, 11)
  const saveTransaction = useCallback((txData: {
    id?: string;
    type: 'deposit' | 'expense';
    date: string;
    amount: number;
    note: string;
    member?: string;
    payer?: string;
  }) => {
    if (!checkEditPermission(txData.date || today())) return;
    const sanitized = sanitizeTransactionInput(txData);
    if (!sanitized.valid) {
      showToast(t.validAmountError);
      return;
    }

    const txMonth = (sanitized.date || today()).slice(0, 7);
    const existing = txData.id ? dataRef.current?.transactions.find(x => x.id === txData.id) : null;
    const oldAmount = existing ? existing.amount : 0;
    const expenseDelta = sanitized.amount - oldAmount;

    // Atomic summary update using Firestore increment()
    if (messCode && expenseDelta !== 0) {
      updateRunningSummaryAtomic(messCode, txMonth, {
        expenseDelta,
        member: sanitized.payer,
      });
    }

    saveAndSync(prev => {
      const isCurrentlyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const tx: Transaction = {
        id: txData.id || uid(),
        type: txData.type,
        date: sanitized.date,
        amount: sanitized.amount,
        note: sanitized.note,
        member: txData.type === 'deposit' ? sanitized.payer || prev.members[0]?.name || '' : '',
        payer: txData.type === 'expense' ? sanitized.payer || prev.members[0]?.name || '' : '',
        directPersonal: existing ? Boolean(existing.directPersonal) : false,
        createdAt: existing?.createdAt || Date.now(),
        isPending: !isCurrentlyOnline,
      };

      let newTxList: Transaction[];
      if (txData.id) {
        newTxList = prev.transactions.map(t => (t.id === txData.id ? tx : t));
      } else {
        newTxList = [...prev.transactions, tx];
      }
      return { ...prev, transactions: newTxList };
    });

    if (txMonth && txMonth !== activeMonth) {
      setActiveMonth(txMonth);
      showToast(t.txAddedToMonth(getMonthLabel(txMonth)));
    } else {
      showToast(t.txSaved);
    }
  }, [saveAndSync, showToast, activeMonth, messCode, checkEditPermission, t]);

  // Delete transaction with atomic summary decrement
  const deleteTransaction = useCallback((id: string) => {
    const existing = dataRef.current?.transactions.find(t => t.id === id);
    if (existing && !checkEditPermission(existing.date || today())) return;
    if (existing && messCode) {
      const txMonth = (existing.date || today()).slice(0, 7);
      updateRunningSummaryAtomic(messCode, txMonth, {
        expenseDelta: -existing.amount,
        member: existing.payer || existing.member,
      });
    }
    saveAndSync(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
    showToast(t.txDeleted);
  }, [saveAndSync, showToast, messCode, checkEditPermission]);

  const transferBalances = useCallback(() => {
    let addedCount = 0;
    saveAndSync(prev => {
      const current = prev.config.month || currentMonth();
      // Calculate previous month string
      const [y, m] = current.split('-').map(Number);
      let prevY = y;
      let prevM = m - 1;
      if (prevM < 1) {
        prevM = 12;
        prevY -= 1;
      }
      const prevMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;

      const prevTotals = calculateTotals(prev, prevMonth);
      const newTransactions = [...prev.transactions];

      const prevMonthMembers = getActiveMembersForMonth(prev, prevMonth);
      prevMonthMembers.forEach(memberObj => {
        const bal = calculateMemberBalance(prev, memberObj.name, prevTotals, prevMonth).balance;
        
        if (Math.abs(bal) >= 0.01) {
          addedCount++;
          // bal > 0 মানে তিনি টাকা পাবেন (জমা / deposit হিসেবে যোগ হবে)
          // bal < 0 মানে তিনি টাকা দিবেন (খরচ বা দেনা হিসেবে যোগ হবে)
          newTransactions.push({
            id: uid(),
            type: bal > 0 ? 'deposit' : 'expense',
            date: today(),
            amount: Math.abs(bal),
            note: `পূর্বের মাসের ব্যালেন্স (${bal > 0 ? 'পাবেন' : 'দিবেন'})`,
            member: bal > 0 ? memberObj.name : '',
            payer: bal < 0 ? memberObj.name : '',
            directPersonal: false,
            createdAt: Date.now(),
            isPending: false,
          });
        }
      });
      
      return {
        ...prev,
        transactions: newTransactions
      };
    });
    if (addedCount > 0) {
      showToast(t.prevMonthBalanceAdded);
    } else {
      showToast(t.noPrevBalance);
    }
  }, [saveAndSync, showToast, t]);

  const startNewMonth = useCallback(() => {
    let nextMonth = '';
    saveAndSync(prev => {
      const current = prev.config.month || currentMonth();
      const [y, m] = current.split('-').map(Number);
      
      // Calculate next month
      let nextY = y;
      let nextM = m + 1;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      
      nextMonth = `${nextY}-${String(nextM).padStart(2, '0')}`;
      
      return {
        ...prev,
        config: { ...prev.config, month: nextMonth }
      };
    });
    if (nextMonth) {
      setActiveMonth(nextMonth);
    }
    showToast(t.newMonthStarted);
  }, [saveAndSync, showToast, t]);

  // Reset month
  const resetCurrentMonth = useCallback(() => {
    saveAndSync(prev => {
      const month = prev.config.month || currentMonth();
      const nextTx = prev.transactions.filter(t => (t.date || '').slice(0, 7) !== month);
      const nextMeals: typeof prev.meals = {};
      for (const [d, all] of Object.entries(prev.meals)) {
        if (d.slice(0, 7) !== month) {
          nextMeals[d] = all;
        }
      }
      return { ...prev, transactions: nextTx, meals: nextMeals };
    });
    showToast(t.monthResetDone);
  }, [saveAndSync, showToast, t]);

  // Settings save
  const saveSettings = useCallback((config: MessConfig, members: Member[], draftItems: { orig: string; name: string }[]) => {
    saveAndSync(prev => {
      let nextMeals = { ...prev.meals };
      let nextTx = [...prev.transactions];

      // Rename members
      draftItems.forEach(item => {
        if (item.orig && item.orig !== item.name && !members.some(m => m.name === item.orig)) {
          const orig = item.orig;
          const newName = item.name;
          const remappedMeals: typeof nextMeals = {};
          for (const [dt, dayObj] of Object.entries(nextMeals)) {
            remappedMeals[dt] = { ...dayObj };
            if (remappedMeals[dt][orig] !== undefined) {
              const prevCount = Number(remappedMeals[dt][newName]?.count || 0);
              const oldCount = Number(remappedMeals[dt][orig]?.count || 0);
              remappedMeals[dt][newName] = { count: prevCount + oldCount };
              delete remappedMeals[dt][orig];
            }
          }
          nextMeals = remappedMeals;
          nextTx = nextTx.map(t => {
            const copy = { ...t };
            if (copy.type === 'deposit' && copy.member === orig) copy.member = newName;
            if (copy.type === 'expense' && copy.payer === orig) copy.payer = newName;
            return copy;
          });
        }
      });

      setMessName(config.messName || 'মেস ম্যানেজার');
      localStorage.setItem('mess_manager_name', config.messName || 'মেস ম্যানেজার');

      return {
        ...prev,
        config: { ...config },
        members,
        meals: nextMeals,
        transactions: nextTx,
      };
    });
    setIsSettingsOpen(false);
    showToast(t.settingsSavedDone);
  }, [saveAndSync, showToast, t]);

  // Save report edit for member
  const saveReportEdit = useCallback((
    origMember: string,
    newName: string,
    newDep: number,
    newMkt: number,
    newMeals: number
  ) => {
    if (!checkAdminPermission()) return;
    const month = dataRef.current.config.month || currentMonth();
    if (!checkEditPermission(`${month}-01`)) return;
    saveAndSync(prev => {
      let members = [...prev.members];
      let meals = { ...prev.meals };
      let txList = [...prev.transactions];

      if (newName !== origMember) {
        members = members.map(m => (m.name === origMember ? { ...m, name: newName } : m));
        // rename
        const remappedMeals: typeof meals = {};
        for (const [dt, dayObj] of Object.entries(meals)) {
          remappedMeals[dt] = { ...dayObj };
          if (remappedMeals[dt][origMember] !== undefined) {
            const prevCount = Number(remappedMeals[dt][newName]?.count || 0);
            const oldCount = Number(remappedMeals[dt][origMember]?.count || 0);
            remappedMeals[dt][newName] = { count: prevCount + oldCount };
            delete remappedMeals[dt][origMember];
          }
        }
        meals = remappedMeals;
        txList = txList.map(t => {
          const c = { ...t };
          if (c.type === 'deposit' && c.member === origMember) c.member = newName;
          if (c.type === 'expense' && c.payer === origMember) c.payer = newName;
          return c;
        });
      }

      const targetMember = newName;
      const month = prev.config.month || currentMonth();
      const defaultDate = today().slice(0, 7) === month ? today() : `${month}-01`;

      // Meal adjustments
      let curMeals = 0;
      for (const [d, all] of Object.entries(meals)) {
        if (d.slice(0, 7) === month) curMeals += Number(all?.[targetMember]?.count || 0);
      }
      const mealDiff = newMeals - curMeals;
      if (Math.abs(mealDiff) > 1e-6) {
        if (mealDiff > 0) {
          if (!meals[defaultDate]) meals[defaultDate] = {};
          const existing = Number(meals[defaultDate][targetMember]?.count || 0);
          meals[defaultDate] = {
            ...meals[defaultDate],
            [targetMember]: { count: existing + mealDiff },
          };
        } else {
          let toRemove = Math.abs(mealDiff);
          const dates = Object.keys(meals)
            .filter(d => d.slice(0, 7) === month)
            .sort()
            .reverse();
          for (const d of dates) {
            if (toRemove <= 0) break;
            const cur = Number(meals[d]?.[targetMember]?.count || 0);
            if (cur > 0) {
              const deduct = Math.min(cur, toRemove);
              meals[d] = {
                ...meals[d],
                [targetMember]: { count: Number((cur - deduct).toFixed(2)) },
              };
              toRemove = Number((toRemove - deduct).toFixed(2));
            }
          }
        }
      }

      // Calculate interim totals
      const interimTotals = calculateTotals({ ...prev, members, meals, transactions: txList }, month);
      const curB = calculateMemberBalance({ ...prev, members, meals, transactions: txList }, targetMember, interimTotals, month);

      // Deposit adjustments
      const depDiff = Number((newDep - curB.deposit).toFixed(2));
      if (Math.abs(depDiff) >= 0.01) {
        if (depDiff > 0) {
          txList.push({
            id: uid(),
            type: 'deposit',
            date: defaultDate,
            member: targetMember,
            payer: '',
            directPersonal: false,
            amount: depDiff,
            note: 'ম্যানেজার সমন্বয় (চূড়ান্ত হিসাব)',
            createdAt: Date.now(),
          });
        } else {
          let rem = Math.abs(depDiff);
          const memberDeps = txList
            .filter(t => t.type === 'deposit' && t.member === targetMember && (t.date || '').slice(0, 7) === month)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          for (const tx of memberDeps) {
            if (rem <= 0) break;
            if (tx.amount <= rem) {
              rem = Number((rem - tx.amount).toFixed(2));
              (tx as { _delete?: boolean })._delete = true;
            } else {
              tx.amount = Number((tx.amount - rem).toFixed(2));
              rem = 0;
            }
          }
          txList = txList.filter(t => !(t as { _delete?: boolean })._delete);
        }
      }

      // Market adjustments
      const interimTotals2 = calculateTotals({ ...prev, members, meals, transactions: txList }, month);
      const afterDepB = calculateMemberBalance({ ...prev, members, meals, transactions: txList }, targetMember, interimTotals2, month);
      const mktDiff = Number((newMkt - afterDepB.market).toFixed(2));

      if (Math.abs(mktDiff) >= 0.01) {
        if (mktDiff > 0) {
          txList.push({
            id: uid(),
            type: 'expense',
            date: defaultDate,
            payer: targetMember,
            member: '',
            amount: mktDiff,
            directPersonal: true,
            note: 'ম্যানেজার সমন্বয় (চূড়ান্ত হিসাব)',
            createdAt: Date.now() + 1,
          });
        } else {
          let rem = Math.abs(mktDiff);
          const memberExps = txList
            .filter(t => t.type === 'expense' && t.payer === targetMember && (t.date || '').slice(0, 7) === month)
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          for (const tx of memberExps) {
            if (rem <= 0) break;
            if (tx.amount <= rem) {
              rem = Number((rem - tx.amount).toFixed(2));
              (tx as { _delete?: boolean })._delete = true;
            } else {
              tx.amount = Number((tx.amount - rem).toFixed(2));
              rem = 0;
            }
          }
          txList = txList.filter(t => !(t as { _delete?: boolean })._delete);
        }
      }

      return {
        ...prev,
        members,
        meals,
        transactions: txList,
      };
    });
    setIsReportEditOpen(false);
    showToast(`${newName}-এর চূড়ান্ত হিসাব আপডেট হয়েছে`);
  }, [saveAndSync, showToast, checkEditPermission, checkAdminPermission]);

  // Test Firebase connection
  const testFirebase = useCallback(async () => {
    return await testFirestoreConnection(messCode, data);
  }, [messCode, data]);

  const lockAdmin = useCallback(() => {
    isAdminUnlockedRef.current = false;
    setIsAdminUnlocked(false);
    setIsSettingsOpen(false);
    showToast('ম্যানেজার অপশন লক করা হয়েছে');
  }, [showToast]);

  const pushModalHistory = useCallback(() => {
    try {
      window.history.pushState({ isModal: true }, '');
    } catch {}
  }, []);

  // Modal controls
  const openEntry = useCallback((type: 'deposit' | 'expense', id?: string) => {
    pushModalHistory();
    setEntryModalData({ type, id });
    setIsEntryModalOpen(true);
  }, [pushModalHistory]);

  const closeEntry = useCallback(() => {
    setIsEntryModalOpen(false);
    setEntryModalData(null);
  }, []);

  const openAdminGate = useCallback((mode: 'login' | 'setup' | 'change' = 'login', nextAction?: () => void) => {
    pushModalHistory();
    setAdminGateMode(mode);
    pendingAdminActionRef.current = nextAction || null;
    setIsAdminGateOpen(true);
  }, [pushModalHistory]);

  useEffect(() => {
    openAdminGateRef.current = openAdminGate;
  }, [openAdminGate]);

  const closeAdminGate = useCallback(() => {
    setIsAdminGateOpen(false);
    pendingAdminActionRef.current = null;
  }, []);

  const unlockAdminAndProceed = useCallback(() => {
    isAdminUnlockedRef.current = true;
    setIsAdminUnlocked(true);
    setIsAdminGateOpen(false);
    pendingAdminActionRef.current = null;
    pushModalHistory();
    // User request: "unlock a click korle correct holei manager setting a cole jabe"
    setIsSettingsOpen(true);
  }, [pushModalHistory]);

  const openSettings = useCallback(() => {
    pushModalHistory();
    if (isAdminUnlockedRef.current || isAdminUnlocked) {
      setIsSettingsOpen(true);
    } else {
      const mode = data.config.adminPasswordHash ? 'login' : 'setup';
      openAdminGate(mode, () => setIsSettingsOpen(true));
    }
  }, [isAdminUnlocked, data.config.adminPasswordHash, openAdminGate, pushModalHistory]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const openQuickSettings = useCallback(() => {
    pushModalHistory();
    setIsQuickSettingsOpen(true);
  }, [pushModalHistory]);

  const closeQuickSettings = useCallback(() => {
    setIsQuickSettingsOpen(false);
  }, []);

  const openReportEdit = useCallback((member: string) => {
    pushModalHistory();
    if (!isAdminUnlocked) {
      const mode = data.config.adminPasswordHash ? 'login' : 'setup';
      openAdminGate(mode, () => {
        setReportEditMember(member);
        setIsReportEditOpen(true);
      });
      return;
    }
    setReportEditMember(member);
    setIsReportEditOpen(true);
  }, [isAdminUnlocked, data.config.adminPasswordHash, openAdminGate, pushModalHistory]);

  const closeReportEdit = useCallback(() => {
    setIsReportEditOpen(false);
    setReportEditMember(null);
  }, []);

  const askConfirm = useCallback((message: string, onConfirm: () => void) => {
    pushModalHistory();
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => {
        setConfirmModal(null);
        onConfirm();
      },
    });
  }, [pushModalHistory]);

  const closeConfirm = useCallback(() => {
    setConfirmModal(null);
  }, []);

  // Compute available months dynamically
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = currentMonth();
    set.add(now);

    // Calculate previous month
    const [y, m] = now.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    set.add(prevM);

    if (data.config.month) set.add(data.config.month);
    if (activeMonth) set.add(activeMonth);

    data.transactions.forEach(t => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    });

    Object.keys(data.meals).forEach(d => {
      if (d.length >= 7) set.add(d.slice(0, 7));
    });

    return Array.from(set).sort().reverse();
  }, [data, activeMonth]);

  // Compute live totals for the currently activeMonth
  const totals = useMemo(() => calculateTotals(data, activeMonth), [data, activeMonth]);

  const getMemberBalance = useCallback(
    (member: string) => {
      return calculateMemberBalance(data, member, totals, activeMonth);
    },
    [data, totals, activeMonth]
  );

  // Denormalized Summary Document Synchronization (Point 6)
  useEffect(() => {
    if (!messCode || !activeMonth || data.isDefault) return;
    const memberExpenses: Record<string, number> = {};
    data.members.forEach(m => {
      memberExpenses[m.name] = totals.memberMarket?.[m.name] || 0;
    });
    updateMonthlySummary(messCode, activeMonth, {
      totalExpenses: totals.expenses,
      totalMeals: totals.meals,
      mealRate: totals.rate,
      memberExpenses,
    });
  }, [messCode, activeMonth, totals, data.isDefault, data.members]);

  return (
    <MessContext.Provider
      value={{
        messCode,
        messName,
        data,
        activeTab,
        setActiveTab,
        canGoBack,
        goBack,
        activeMonth,
        setActiveMonth,
        availableMonths,
        isAdminUnlocked,
        setIsAdminUnlocked,
        syncState,
        syncStatusText,
        firebaseError,
        toastMessage,
        showToast,
        savedMesses,
        isAuthModalOpen,
        isEntryModalOpen,
        entryModalData,
        isAdminGateOpen,
        adminGateMode,
        isSettingsOpen,
        isQuickSettingsOpen,
        isReportEditOpen,
        reportEditMember,
        confirmModal,
        handleAuth,
        switchMess,
        deleteMess,
        requestLeave,
        handleLeaveRequest,
        syncNow,
        updateMealCount,
        quickSetMeals,
        saveTransaction,
        deleteTransaction,
        resetCurrentMonth,
        startNewMonth,
        transferBalances,
        saveSettings,
        saveReportEdit,
        testFirebase,
        lockAdmin,
        openEntry,
        closeEntry,
        openSettings,
        closeSettings,
        openQuickSettings,
        closeQuickSettings,
        openAdminGate,
        closeAdminGate,
        unlockAdminAndProceed,
        openReportEdit,
        closeReportEdit,
        askConfirm,
        closeConfirm,
        totals,
        getMemberBalance,
      }}
    >
      {children}
    </MessContext.Provider>
  );
};

export const useMess = () => {
  const context = useContext(MessContext);
  if (!context) {
    throw new Error('useMess must be used within a MessProvider');
  }
  return context;
};
