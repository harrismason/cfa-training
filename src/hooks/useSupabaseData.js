import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabase, isSupabaseReady } from '../lib/supabase';

/**
 * Drop-in replacement for useFirebaseData that syncs with Supabase.
 * Falls back to localStorage-only when storeId is empty or Supabase is not ready.
 *
 * Uses a single `store_data` table with schema:
 *   store_data(store_id TEXT, key TEXT, value JSONB, updated_at TIMESTAMPTZ)
 *
 * @param {string} localKey  - localStorage key (e.g. 'cfa_trainees')
 * @param {*}      initial   - initial/default value
 * @param {string} storeId   - store identifier; sync disabled when falsy
 */
export function useSupabaseData(localKey, initial, storeId) {
  // Boot from localStorage immediately — no loading flash, works offline
  const [value, setValueState] = useState(() => {
    try {
      const item = window.localStorage.getItem(localKey);
      return item !== null ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  // Keep a ref so the Realtime listener can compare without stale closure
  const valueRef = useRef(value);
  valueRef.current = value;

  // Subscribe to Supabase Realtime changes for this store+key
  useEffect(() => {
    if (!storeId || !isSupabaseReady()) return;
    const sb = getSupabase();
    if (!sb) return;

    // Initial fetch — pull whatever is already in Supabase for this key
    sb.from('store_data')
      .select('value')
      .eq('store_id', storeId)
      .eq('key', localKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { console.error(`[useSupabaseData] fetch error for ${localKey}:`, error); return; }
        if (!data) return; // nothing stored yet — keep local data
        const remote = data.value;
        if (JSON.stringify(remote) !== JSON.stringify(valueRef.current)) {
          setValueState(remote);
          try { window.localStorage.setItem(localKey, JSON.stringify(remote)); } catch {}
        }
      });

    // Realtime subscription — listen for changes from other devices
    const channel = sb
      .channel(`store_data:${storeId}:${localKey}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'store_data',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          // Only handle the key we care about
          if (payload.new?.key !== localKey) return;
          const remote = payload.new?.value;
          if (remote === undefined || remote === null) return;
          if (JSON.stringify(remote) !== JSON.stringify(valueRef.current)) {
            setValueState(remote);
            try { window.localStorage.setItem(localKey, JSON.stringify(remote)); } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [localKey, storeId]);

  // Queue for Supabase sync — set inside setState updater, flushed by effect
  const syncQueueRef = useRef(null);

  // Setter — writes localStorage synchronously, queues Supabase sync
  const setValueAndSync = useCallback((newValueOrUpdater) => {
    setValueState(prev => {
      const next = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : newValueOrUpdater;
      try { window.localStorage.setItem(localKey, JSON.stringify(next)); } catch {}
      syncQueueRef.current = next; // queue for effect below — NO async here
      return next;
    });
  }, [localKey]);

  // Flush queued Supabase upsert after each state commit (safe: outside updater)
  useEffect(() => {
    if (syncQueueRef.current === null) return;
    if (!storeId || !isSupabaseReady()) { syncQueueRef.current = null; return; }
    const valueToSync = syncQueueRef.current;
    syncQueueRef.current = null;
    const sb = getSupabase();
    if (sb) {
      Promise.resolve(
        sb.from('store_data').upsert(
          { store_id: storeId, key: localKey, value: valueToSync, updated_at: new Date().toISOString() },
          { onConflict: 'store_id,key' }
        )
      ).catch(console.error);
    }
  }, [value, storeId, localKey]);

  return [value, setValueAndSync];
}
