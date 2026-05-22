import 'server-only';

import { getAllDecryptedDashboardKeys } from '@/lib/dashboard-key-records';
import { getRouteAiProxyMode, fetchDirectUsageEventsAll, fetchUsageEventsAll } from '../upstream/client';
import { resolveUserKey } from '../keys/registry';
import { syncUsageLedgerFromRows } from './usageLedger';
import { operatorSessionService } from '../session';
import { resolveRange } from '../routes/range';
import { aggregateUsage } from '../routes/aggregate';
import { fingerprint } from '../keys/fingerprint';

const activeKeysInMemory = new Set<string>();
let schedulerStarted = false;
let timeoutId: NodeJS.Timeout | null = null;

export function registerActiveKeyForScheduler(apiKey: string) {
  if (apiKey && apiKey.startsWith('sk-')) {
    activeKeysInMemory.add(apiKey);
  }
}

async function collectAsync<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const rows: T[] = [];
  for await (const row of iterable) {
    rows.push(row);
  }
  return rows;
}

export async function runIngestOnce() {
  const proxyMode = getRouteAiProxyMode();
  
  // 1. Get all active keys from Supabase db and in-memory registry
  const dbKeys = await getAllDecryptedDashboardKeys().catch(() => []);
  const keys = Array.from(new Set([...dbKeys, ...activeKeysInMemory]));
  
  const lookupRange = resolveRange('7d');

  for (const apiKey of keys) {
    try {
      if (proxyMode === 'direct') {
        const directRows = await collectAsync(fetchDirectUsageEventsAll(apiKey, lookupRange));
        const fallbackCtx = await resolveUserKey(apiKey);
        const directCtx = {
          ...fallbackCtx,
          identifierForRows: directRows.length > 0 ? (directRows[0].keyIdentifier || '__direct_key__') : '__direct_key__',
        };
        const summary = aggregateUsage(directRows, directCtx);
        await syncUsageLedgerFromRows(apiKey, directRows, summary.credit, 'direct');
      } else {
        const session = await operatorSessionService.getSession();
        const operatorCtx = await resolveUserKey(apiKey, session);
        const operatorRows = await collectAsync(
          fetchUsageEventsAll(session, lookupRange, operatorCtx.identifierForRows)
        );
        const summary = aggregateUsage(operatorRows, operatorCtx);
        await syncUsageLedgerFromRows(apiKey, operatorRows, summary.credit, 'operator');
      }
      
      console.log(`[Ledger Scheduler] Synced usage for key fingerprint: ${fingerprint(apiKey).slice(0, 16)}`);
    } catch (error) {
      console.warn(`[Ledger Scheduler] Failed to sync usage for key fingerprint: ${fingerprint(apiKey).slice(0, 16)}`, error);
    }
  }
}

export function startBackgroundScheduler() {
  if (schedulerStarted) {
    return;
  }
  schedulerStarted = true;
  console.log('[Ledger Scheduler] Starting background ingest scheduler loop (30s interval)...');
  
  async function tick() {
    try {
      await runIngestOnce();
    } catch (e) {
      console.error('[Ledger Scheduler] Error in background tick:', e);
    } finally {
      if (schedulerStarted) {
        timeoutId = setTimeout(tick, 30_000);
      }
    }
  }
  
  timeoutId = setTimeout(tick, 30_000);
}

export function stopBackgroundScheduler() {
  schedulerStarted = false;
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  console.log('[Ledger Scheduler] Background ingest scheduler stopped.');
}

export async function getPlaintextKeyByFp(fpValue: string): Promise<string | null> {
  const dbKeys = await getAllDecryptedDashboardKeys().catch(() => []);
  const keys = Array.from(new Set([...dbKeys, ...activeKeysInMemory]));
  
  for (const apiKey of keys) {
    if (fingerprint(apiKey) === fpValue) {
      return apiKey;
    }
  }
  return null;
}

export async function runSyncForKey(apiKey: string): Promise<void> {
  const proxyMode = getRouteAiProxyMode();
  const lookupRange = resolveRange('7d');
  
  if (proxyMode === 'direct') {
    const directRows = await collectAsync(fetchDirectUsageEventsAll(apiKey, lookupRange));
    const fallbackCtx = await resolveUserKey(apiKey);
    const directCtx = {
      ...fallbackCtx,
      identifierForRows: directRows.length > 0 ? (directRows[0].keyIdentifier || '__direct_key__') : '__direct_key__',
    };
    const summary = aggregateUsage(directRows, directCtx);
    await syncUsageLedgerFromRows(apiKey, directRows, summary.credit, 'direct');
  } else {
    const session = await operatorSessionService.getSession();
    const operatorCtx = await resolveUserKey(apiKey, session);
    const operatorRows = await collectAsync(
      fetchUsageEventsAll(session, lookupRange, operatorCtx.identifierForRows)
    );
    const summary = aggregateUsage(operatorRows, operatorCtx);
    await syncUsageLedgerFromRows(apiKey, operatorRows, summary.credit, 'operator');
  }
  console.log(`[Ledger Scheduler] Synchronously synced usage for key fingerprint: ${fingerprint(apiKey).slice(0, 16)}`);
}
