import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  doc,
  getDoc,
  getDocFromCache,
  getDocFromServer,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  increment,
  serverTimestamp,
  Firestore,
  Unsubscribe,
  DocumentReference,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { MessData } from '../types';
import { getMessKey, getMainDocPath, normalizeCodeString } from '../utils/helpers';

export const firebaseConfig = firebaseConfigData;

const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)';

// Initialize Firebase App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with persistent modular cache across tabs
export const db: Firestore = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    }, dbId);
  } catch {
    return getFirestore(app, dbId);
  }
})();

export const auth = getAuth(app);

const FIRESTORE_REST_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents`;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot
export async function testConnectionOnBoot() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is currently offline or waiting for connection.');
    }
  }
}
testConnectionOnBoot();

export function getClientInstanceId(): string {
  try {
    let id = sessionStorage.getItem('mess_client_id');
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('mess_client_id', id);
    }
    return id;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Convert JS to Firestore REST value
export function toFirestoreValue(val: unknown): Record<string, unknown> {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      if (k && v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Convert Firestore REST value to JS
export function fromFirestoreValue(v: unknown): unknown {
  if (!v || typeof v !== 'object') return null;
  const obj = v as Record<string, unknown>;
  if ('stringValue' in obj) return obj.stringValue;
  if ('booleanValue' in obj) return Boolean(obj.booleanValue);
  if ('integerValue' in obj) return Number(obj.integerValue);
  if ('doubleValue' in obj) return Number(obj.doubleValue);
  if ('nullValue' in obj) return null;
  if ('timestampValue' in obj) return obj.timestampValue;
  if ('arrayValue' in obj) {
    const values = ((obj.arrayValue as Record<string, unknown>)?.values as unknown[]) || [];
    return values.map(fromFirestoreValue);
  }
  if ('mapValue' in obj) {
    const res: Record<string, unknown> = {};
    const fields = ((obj.mapValue as Record<string, unknown>)?.fields as Record<string, unknown>) || {};
    for (const [k, sub] of Object.entries(fields)) {
      res[k] = fromFirestoreValue(sub);
    }
    return res;
  }
  return null;
}

export async function restGetDoc(docPath: string): Promise<{
  ok: boolean;
  exists: boolean;
  data: unknown;
  updateTime?: string;
  status: number;
  error?: string;
}> {
  const url = `${FIRESTORE_REST_BASE}/${docPath}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;

  const restPromise = (async () => {
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (res.status === 200) {
      const json = await res.json();
      const parsed = fromFirestoreValue({ mapValue: { fields: json.fields || {} } });
      return { ok: true, exists: true, data: parsed, updateTime: json.updateTime || '', status: 200 };
    }
    if (res.status === 404) {
      return { ok: true, exists: false, data: null, status: 404 };
    }
    let errMsg = '';
    try {
      const errJson = await res.json();
      errMsg = errJson?.error?.message || '';
    } catch {}
    return { ok: false, exists: false, data: null, status: res.status, error: errMsg || `HTTP_${res.status}` };
  })();

  const sdkPromise = (async () => {
    const pathParts = docPath.split('/');
    if (pathParts.length % 2 === 0) {
      const docRef = doc(db, pathParts[0], ...pathParts.slice(1));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ok: true, exists: true, data: snap.data(), status: 200 };
      }
      return { ok: true, exists: false, data: null, status: 404 };
    }
    throw new Error('Invalid path');
  })();

  try {
    const result = await Promise.race([
      restPromise.catch(() => null),
      sdkPromise.catch(() => null),
    ]);
    if (result && result.ok) {
      return result;
    }
    return await restPromise.catch(() => sdkPromise.catch(() => ({ ok: false, exists: false, data: null, status: 0, error: 'NETWORK_ERROR' })));
  } catch {
    try {
      return await restPromise;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'NETWORK_ERROR';
      return { ok: false, exists: false, data: null, status: 0, error: msg };
    }
  }
}

export async function restSetDoc(docPath: string, payload: unknown): Promise<{
  ok: boolean;
  updateTime?: string;
  status: number;
  error?: string;
}> {
  // First attempt via official SDK
  try {
    const pathParts = docPath.split('/');
    if (pathParts.length % 2 === 0) {
      const docRef = doc(db, pathParts[0], ...pathParts.slice(1));
      await setDoc(docRef, payload as Record<string, unknown>);
      return { ok: true, updateTime: new Date().toISOString(), status: 200 };
    }
  } catch (e: unknown) {
    console.debug('SDK setDoc failed, falling back to REST:', e);
  }

  // REST fallback
  const url = `${FIRESTORE_REST_BASE}/${docPath}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
  const converted = toFirestoreValue(payload);
  const fields = ((converted as Record<string, unknown>)?.mapValue as Record<string, unknown>)?.fields || {};
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
      cache: 'no-store',
      keepalive: true,
    });
    if (res.status === 200) {
      const json = await res.json();
      return { ok: true, updateTime: json.updateTime || '', status: 200 };
    }
    let errMsg = '';
    try {
      const errJson = await res.json();
      errMsg = errJson?.error?.message || '';
    } catch {}
    return { ok: false, status: res.status, error: errMsg || `HTTP_${res.status}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'NETWORK_ERROR';
    return { ok: false, status: 0, error: msg };
  }
}

// Cache-first document fetcher for static/config docs
export async function getDocCacheFirst(docRef: DocumentReference) {
  try {
    const snap = await getDocFromCache(docRef);
    if (snap.exists()) {
      return snap;
    }
  } catch {}
  return await getDocFromServer(docRef);
}

// Safe transaction runner with offline connectivity pre-check (Point 5)
export async function runSafeTransaction<T>(
  updateFunction: (transaction: any) => Promise<T>,
  offlineFallback?: () => Promise<T> | T
): Promise<T | null> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    console.warn('Network offline: bypassing runTransaction to prevent unhandled rejection.');
    if (offlineFallback) {
      return await offlineFallback();
    }
    return null;
  }
  try {
    return await runTransaction(db, updateFunction);
  } catch (error) {
    console.warn('runTransaction failed, falling back:', error);
    if (offlineFallback) {
      return await offlineFallback();
    }
    throw error;
  }
}

// Atomic running summary update with Firestore increment() (Points 5 & 6)
export async function updateRunningSummaryAtomic(
  code: string,
  month: string,
  deltas: {
    expenseDelta?: number;
    depositDelta?: number;
    mealsDelta?: number;
    member?: string;
  }
): Promise<void> {
  if (!code || !month) return;
  try {
    const key = encodeURIComponent(getMessKey(code));
    const summaryRef = doc(db, 'messes_v3', key, 'summaries', month);
    const cycleRef = doc(db, 'messes_v3', key, 'summaries', 'current_cycle');

    const updatePayload: Record<string, unknown> = {
      month,
      updatedAt: serverTimestamp(),
    };

    if (deltas.expenseDelta && deltas.expenseDelta !== 0) {
      updatePayload.totalExpenses = increment(deltas.expenseDelta);
    }
    if (deltas.depositDelta && deltas.depositDelta !== 0) {
      updatePayload.totalDeposits = increment(deltas.depositDelta);
    }
    if (deltas.mealsDelta && deltas.mealsDelta !== 0) {
      updatePayload.totalMeals = increment(deltas.mealsDelta);
    }
    if (deltas.member) {
      const sanitizedMember = deltas.member.replace(/[~*/[\]]/g, '_');
      if (deltas.expenseDelta && deltas.expenseDelta !== 0) {
        updatePayload[`memberStats.${sanitizedMember}.expense`] = increment(deltas.expenseDelta);
      }
      if (deltas.depositDelta && deltas.depositDelta !== 0) {
        updatePayload[`memberStats.${sanitizedMember}.deposit`] = increment(deltas.depositDelta);
      }
      if (deltas.mealsDelta && deltas.mealsDelta !== 0) {
        updatePayload[`memberStats.${sanitizedMember}.meals`] = increment(deltas.mealsDelta);
      }
    }

    await setDoc(summaryRef, updatePayload, { merge: true });
    await setDoc(cycleRef, { activeMonth: month, ...updatePayload }, { merge: true });
  } catch (e) {
    console.debug('Atomic summary increment queued in local cache:', e);
  }
}

// 1-Read Summary Fetcher using cache-first pattern (Point 6)
export async function getSummaryDocCacheFirst(code: string, month: string) {
  try {
    const key = encodeURIComponent(getMessKey(code));
    const summaryRef = doc(db, 'messes_v3', key, 'summaries', month);
    return await getDocCacheFirst(summaryRef);
  } catch {
    return null;
  }
}

// Atomic monthly summary update (Point 6 Denormalization pattern)
export async function updateMonthlySummary(
  code: string,
  month: string,
  summary: {
    totalExpenses: number;
    totalMeals: number;
    mealRate: number;
    memberExpenses: Record<string, number>;
  }
): Promise<void> {
  try {
    const key = encodeURIComponent(getMessKey(code));
    const summaryRef = doc(db, 'messes_v3', key, 'summaries', month);
    const cycleRef = doc(db, 'messes_v3', key, 'summaries', 'current_cycle');
    const payload = {
      ...summary,
      month,
      updatedAt: serverTimestamp(),
    };
    await setDoc(summaryRef, payload, { merge: true });
    await setDoc(cycleRef, payload, { merge: true });
  } catch (e) {
    console.debug('Summary doc write queued in local cache:', e);
  }
}

export interface SnapshotMeta {
  hasPendingWrites: boolean;
  fromCache: boolean;
}

// Real-time listener using SDK with pending-writes metadata support
export function subscribeToMess(
  code: string,
  onData: (data: Partial<MessData>, meta: SnapshotMeta) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  try {
    const docPath = getMainDocPath(code);
    const parts = docPath.split('/');
    const docRef = doc(db, parts[0], ...parts.slice(1));
    return onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      snap => {
        if (snap.exists()) {
          onData(snap.data() as Partial<MessData>, {
            hasPendingWrites: snap.metadata.hasPendingWrites,
            fromCache: snap.metadata.fromCache,
          });
        }
      },
      err => {
        if (onError) onError(err);
      }
    );
  } catch {
    return null;
  }
}

export async function fetchRemoteMess(code: string): Promise<{ data: Partial<MessData>; updateTime: string } | null> {
  const key = encodeURIComponent(getMessKey(code));
  const rawCode = encodeURIComponent(normalizeCodeString(code));
  const paths = [
    `messes_v3/${key}/data/main`,
    `messes_v2/${key}/data/main`,
    `messes/${key}/data/main`,
    `messes_v3/${rawCode}/data/main`,
  ];
  let bestData: Partial<MessData> | null = null;
  let bestStamp = -1;
  let bestUpdateTime = '';

  const results = await Promise.all(paths.map(p => restGetDoc(p)));
  for (const r of results) {
    if (r.ok && r.exists && r.data) {
      const parsedData = r.data as Partial<MessData>;
      const st = Number(parsedData.updatedAt) || 0;
      if (!bestData || st > bestStamp) {
        bestData = parsedData;
        bestStamp = st;
        bestUpdateTime = r.updateTime || '';
      }
    }
  }

  if (bestData) {
    return { data: bestData, updateTime: bestUpdateTime };
  }
  return null;
}

export async function testFirestoreConnection(code: string, currentData?: MessData): Promise<{
  ok: boolean;
  statusText: string;
  details: string;
  ms: number;
}> {
  const start = Date.now();
  const docPath = getMainDocPath(code || 'test');
  const getRes = await restGetDoc(docPath);
  const ms = Date.now() - start;

  if (getRes.ok) {
    let writeOk = true;
    if (code && currentData && !currentData.isDefault) {
      const wRes = await restSetDoc(docPath, currentData);
      writeOk = wRes.ok;
    }
    if (writeOk) {
      return {
        ok: true,
        statusText: `✓ ফায়ারবেস সম্পূর্ণ সচল আছে (${ms}ms)`,
        details: `প্রজেক্ট: ${firebaseConfig.projectId} · ডাটাবেস: ${dbId} · মেস কোড: ${code} · সার্ভার ডেটা: ${getRes.exists ? 'সংরক্ষিত আছে' : 'নতুন মেস'}`,
        ms,
      };
    } else {
      return {
        ok: false,
        statusText: `✕ ফায়ারবেস Write ব্লকড!`,
        details: `Firebase Console → Firestore Database → Rules-এ গিয়ে allow read, write: if true; দিয়ে Publish করুন।`,
        ms,
      };
    }
  } else if (getRes.status === 403) {
    return {
      ok: false,
      statusText: `✕ ফায়ারবেস লক হয়ে আছে (HTTP 403 Permission Denied)`,
      details: `Firebase Security Rules পরীক্ষা করুন।`,
      ms,
    };
  } else if (getRes.status === 404) {
    return {
      ok: false,
      statusText: `✕ ডাটাবেস পাওয়া যায়নি (HTTP 404)`,
      details: getRes.error || 'Database not found',
      ms,
    };
  } else {
    return {
      ok: false,
      statusText: `! সংযোগ সমস্যা (${getRes.error})`,
      details: `ইন্টারনেট সংযোগ চেক করুন।`,
      ms,
    };
  }
}
