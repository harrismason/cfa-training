import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

let _db = null;

export function initFirebase(config) {
  try {
    // If an app already exists, delete it first so we can re-init with new config
    if (getApps().length > 0) {
      getApps().forEach(app => deleteApp(app));
    }
    const app = initializeApp(config);
    _db = getDatabase(app);
    return { app, db: _db };
  } catch (e) {
    console.error('Firebase init failed:', e);
    _db = null;
    return null;
  }
}

export function teardownFirebase() {
  try {
    if (getApps().length > 0) {
      getApps().forEach(app => deleteApp(app));
    }
  } catch {}
  _db = null;
}

export function getDb() {
  return _db;
}

export function isFirebaseReady() {
  return _db !== null;
}
