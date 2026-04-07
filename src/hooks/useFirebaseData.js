import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { getDb, isFirebaseReady } from '../firebase/firebase';

/**
 * Drop-in replacement for useLocalStorage that also syncs with Firebase RTDB.
 * Falls back to localStorage-only when storeId is empty or Firebase is not ready.
 *
 * @param {string} localKey   - localStorage key (e.g. 'cfa_trainees')
 * @param {*}      initial    - initial/default value
 * @param {string} storeId    - Firebase store path segment; sync disabled when falsy
 */
export function useFirebaseData(localKey, initial, storeId) {
  // Boot from localStorage immediately — no loading flash
  const [value, setValueState] = useState(() => {
    try {
      const item = window.localStorage.getItem(localKey);
      return item !== null ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  // Keep a ref so Firebase listener can compare without stale closure
  const valueRef = useRef(value);
  valueRef.current = value;

  // Subscribe to Firebase changes
  useEffect(() => {
    if (!storeId || !isFirebaseReady()) return;
    const db = getDb();
    if (!db) return;

    const rtdbKey = localKey.replace(/^cfa_/, '');
    const dataRef = ref(db, `stores/${storeId}/${rtdbKey}`);

    const unsub = onValue(dataRef, (snapshot) => {
      const remote = snapshot.val();
      if (remote === null) return; // nothing in Firebase yet — keep local
      // Only update if different to avoid infinite loops
      if (JSON.stringify(remote) !== JSON.stringify(valueRef.current)) {
        setValueState(remote);
        try { window.localStorage.setItem(localKey, JSON.stringify(remote)); } catch {}
      }
    });

    return unsub;
  }, [localKey, storeId]); // re-subscribe when storeId changes

  // Setter — writes localStorage + Firebase
  const setValueAndSync = useCallback((newValueOrUpdater) => {
    setValueState(prev => {
      const next = typeof newValueOrUpdater === 'function'
        ? newValueOrUpdater(prev)
        : newValueOrUpdater;

      // Always persist locally
      try { window.localStorage.setItem(localKey, JSON.stringify(next)); } catch {}

      // Push to Firebase if connected
      if (storeId && isFirebaseReady()) {
        const db = getDb();
        if (db) {
          const rtdbKey = localKey.replace(/^cfa_/, '');
          set(ref(db, `stores/${storeId}/${rtdbKey}`), next).catch(console.error);
        }
      }

      return next;
    });
  }, [localKey, storeId]);

  return [value, setValueAndSync];
}
