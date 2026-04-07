import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { onAuthStateChange, getSession, signOut as supabaseSignOut } from '../lib/supabase';
import { SEED_POSITIONS } from '../constants/seeds';
import { STATUS, DEFAULT_CHECKLIST_ITEMS, DEFAULT_TEMPLATES } from '../constants/theme';

const AppContext = createContext(null);

const ADMIN_EMAIL = 'harris.mason.paul@gmail.com';

const DEFAULT_PREFS = {
  storeName: 'CFA Training Tracker',
  storeNumber: '',
  managerName: '',
  darkMode: false,
  accentColor: 'blue',
  density: 'normal',
  defaultRequiredShifts: 3,
  defaultRequiredPracticeShifts: 0,
  matrixDefaultSort: 'name',
  matrixHideFullyTrained: false,
  matrixShowPracticePills: true,
  plannerDefaultView: 'week',
  plannerShowCompleted: true,
  authEnabled: true,
  managerPin: '8357',
  checkInBaseUrl: '',
};

const ACCENT_COLORS = {
  red:    { primary: '#E4002B', dark: '#B8001E', light: 'rgba(228,0,43,0.1)' },
  blue:   { primary: '#1E3A8A', dark: '#1e3070', light: 'rgba(30,58,138,0.1)' },
  green:  { primary: '#2E7D32', dark: '#1B5E20', light: 'rgba(46,125,50,0.1)' },
  purple: { primary: '#6A1B9A', dark: '#4A148C', light: 'rgba(106,27,154,0.1)' },
  orange: { primary: '#E65100', dark: '#BF360C', light: 'rgba(230,81,0,0.1)' },
};

export function AppProvider({ children }) {
  const isElectron = navigator.userAgent.includes('Electron');

  // Preferences (persisted in localStorage) — always merged with DEFAULT_PREFS so new fields are never undefined
  const [_rawPrefs, setPreferences] = useLocalStorage('cfa_prefs', DEFAULT_PREFS);

  // One-time migration: if stored accent is still the old default 'red', switch to 'blue'
  const migratedPrefs = (() => {
    if (_rawPrefs && _rawPrefs.accentColor === 'red' && !_rawPrefs._blueMigrated) {
      return { ..._rawPrefs, accentColor: 'blue', _blueMigrated: true };
    }
    return _rawPrefs;
  })();

  if (migratedPrefs !== _rawPrefs) {
    setPreferences(migratedPrefs);
  }

  const preferences = { ...DEFAULT_PREFS, ...migratedPrefs };

  function updatePreferences(updates) {
    setPreferences(prev => ({ ...prev, ...updates }));
  }

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', preferences.darkMode ? 'dark' : 'light');
  }, [preferences.darkMode]);

  // Apply accent color
  useEffect(() => {
    const accent = ACCENT_COLORS[preferences.accentColor] || ACCENT_COLORS.red;
    document.documentElement.style.setProperty('--color-primary', accent.primary);
    document.documentElement.style.setProperty('--color-primary-dark', accent.dark);
    document.documentElement.style.setProperty('--color-primary-light', accent.light);
  }, [preferences.accentColor]);

  // Apply density
  useEffect(() => {
    document.documentElement.setAttribute('data-density', preferences.density ?? 'normal');
  }, [preferences.density]);

  // Supabase Auth session — skipped entirely in Electron (desktop uses local-only mode)
  const [authSession, setAuthSession] = useState(isElectron ? {} : null);
  const [authLoading, setAuthLoading] = useState(!isElectron);

  useEffect(() => {
    if (isElectron) return;
    getSession().then(session => { setAuthSession(session); setAuthLoading(false); });
    const { data: { subscription } } = onAuthStateChange((_event, session) => {
      setAuthSession(session);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [isElectron]);

  // Store ID (persisted in localStorage)
  const [storeId, setStoreIdStored] = useLocalStorage('cfa_store_id', '');
  const supabaseConnected = true;

  // All data arrays — useSupabaseData falls back to localStorage-only when storeId is empty
  const [trainees, setTrainees] = useSupabaseData('cfa_trainees', [], storeId);
  const [positions, setPositions] = useSupabaseData('cfa_positions', SEED_POSITIONS, storeId);
  const [records, setRecords] = useSupabaseData('cfa_records', [], storeId);
  const [shifts, setShifts] = useSupabaseData('cfa_shifts', [], storeId);
  const [goals, setGoals] = useSupabaseData('cfa_goals', [], storeId);
  const [paths, setPaths] = useSupabaseData('cfa_paths', [], storeId);
  const [plannedShifts, setPlannedShifts] = useSupabaseData('cfa_planned_shifts', [], storeId);
  const [checklistItems, setChecklistItems] = useSupabaseData('cfa_checklist_items', DEFAULT_CHECKLIST_ITEMS, storeId);
  const [checklistProgress, setChecklistProgress] = useSupabaseData('cfa_checklist_progress', [], storeId);
  const [trainingTemplates, setTrainingTemplates] = useSupabaseData('cfa_training_templates', DEFAULT_TEMPLATES, storeId);
  const [comments, setComments] = useSupabaseData('cfa_comments', [], storeId);
  // User permission overrides — { 'email': { role: 'trainer'|'manager', traineeId: string|null } }
  const [userPermissions, setUserPermissionsRaw] = useSupabaseData('cfa_user_permissions', {}, storeId);

  // Current user (sessionStorage only — clears when app closes, never synced to Firebase)
  // In Electron, default to a manager user if none is stored so the app works without login
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('cfa_current_user'));
      if (stored) return stored;
      if (navigator.userAgent.includes('Electron')) {
        return { name: 'Manager', role: 'Manager', accessLevel: 'manager' };
      }
      return null;
    } catch {
      return navigator.userAgent.includes('Electron')
        ? { name: 'Manager', role: 'Manager', accessLevel: 'manager' }
        : null;
    }
  });
  function login(userObj) {
    sessionStorage.setItem('cfa_current_user', JSON.stringify(userObj));
    setCurrentUser(userObj);
  }
  function logout() {
    sessionStorage.removeItem('cfa_current_user');
    setCurrentUser(null);
  }

  async function fullSignOut() {
    await supabaseSignOut();
    setStoreIdStored('');
    logout();
  }

  // --- Email-based role resolution ---
  // Auto-sets currentUser whenever auth session, store, or permissions change.
  // Runs after every relevant change; only writes state when the resolved value differs.
  useEffect(() => {
    if (isElectron) return;
    if (authLoading) return;
    if (!authSession) { logout(); return; }
    if (!storeId) return;

    const email = authSession.user?.email;
    if (!email) return;
    const uid = authSession.user?.id;

    let accessLevel, traineeId, name, role;

    if (email === ADMIN_EMAIL) {
      accessLevel = 'manager';
      traineeId = null;
      name = 'Admin';
      role = 'Manager';
    } else if (userPermissions[email]) {
      const perm = userPermissions[email];
      accessLevel = perm.role;
      traineeId = perm.traineeId || null;
      role = perm.role === 'manager' ? 'Manager' : 'Trainer';
      name = perm.role === 'manager' ? 'Manager' : 'Trainer';
    } else {
      accessLevel = 'member';
      traineeId = null;
      role = 'Team Member';
      name = email.split('@')[0];
    }

    // Use the actual trainee name when we have a linked profile
    if (traineeId) {
      const t = trainees.find(tr => tr.id === traineeId);
      if (t) name = t.name;
    }

    const resolved = { id: traineeId, name, role, accessLevel };
    setCurrentUser(prev => {
      if (JSON.stringify(prev) === JSON.stringify(resolved)) return prev;
      sessionStorage.setItem('cfa_current_user', JSON.stringify(resolved));
      return resolved;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isElectron, authLoading, authSession, storeId, userPermissions, trainees]);

  // --- User permission management (admin only) ---
  function setUserPermission(email, role, traineeId = null) {
    setUserPermissionsRaw(prev => ({
      ...prev,
      [email]: { role, traineeId: traineeId || null },
    }));
  }

  function removeUserPermission(email) {
    setUserPermissionsRaw(prev => {
      const next = { ...prev };
      delete next[email];
      return next;
    });
  }

  // --- Undo stack ---
  const undoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushUndo() {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-19),
      { trainees, positions, records, shifts, goals, paths, plannedShifts, checklistItems, checklistProgress, trainingTemplates, comments },
    ];
    setCanUndo(true);
  }

  function undo() {
    if (undoStackRef.current.length === 0) return;
    const snapshot = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setTrainees(snapshot.trainees);
    setPositions(snapshot.positions);
    setRecords(snapshot.records);
    setShifts(snapshot.shifts);
    if (snapshot.goals) setGoals(snapshot.goals);
    if (snapshot.paths) setPaths(snapshot.paths);
    if (snapshot.plannedShifts) setPlannedShifts(snapshot.plannedShifts);
    if (snapshot.checklistItems) setChecklistItems(snapshot.checklistItems);
    if (snapshot.checklistProgress) setChecklistProgress(snapshot.checklistProgress);
    if (snapshot.trainingTemplates) setTrainingTemplates(snapshot.trainingTemplates);
    if (snapshot.comments) setComments(snapshot.comments);
    setCanUndo(undoStackRef.current.length > 0);
  }

  // --- Trainee mutations ---
  function addTrainee(data) {
    pushUndo();
    const newTrainee = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    setTrainees((prev) => [...prev, newTrainee]);
    return newTrainee;
  }

  function updateTrainee(id, data) {
    pushUndo();
    setTrainees((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  }

  function deleteTrainee(id) {
    pushUndo();
    setTrainees((prev) => prev.filter((t) => t.id !== id));
    setRecords((prev) => prev.filter((r) => r.traineeId !== id));
    setShifts((prev) => prev.filter((s) => s.traineeId !== id));
  }

  // --- Position mutations ---
  function addPosition(data) {
    pushUndo();
    const newPosition = {
      id: crypto.randomUUID(),
      requiredShifts: 3,
      ...data,
      sortOrder: positions.length + 1,
      createdAt: new Date().toISOString(),
    };
    setPositions((prev) => [...prev, newPosition]);
    return newPosition;
  }

  function updatePosition(id, data) {
    pushUndo();
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }

  function deletePosition(id) {
    pushUndo();
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setRecords((prev) => prev.filter((r) => r.positionId !== id));
    setShifts((prev) => prev.filter((s) => s.positionId !== id));
  }

  // --- Record mutations ---
  function upsertRecord(traineeId, positionId, fields) {
    pushUndo();
    setRecords((prev) => {
      const existing = prev.find(
        (r) => r.traineeId === traineeId && r.positionId === positionId
      );
      if (existing) {
        return prev.map((r) =>
          r.traineeId === traineeId && r.positionId === positionId
            ? { ...r, ...fields, updatedAt: new Date().toISOString() }
            : r
        );
      } else {
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            traineeId,
            positionId,
            notes: '',
            ...fields,
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });
  }

  // --- Shift mutations ---
  function upsertShift(traineeId, positionId, shiftNumber, fields) {
    pushUndo();
    setShifts((prev) => {
      const existing = prev.find(
        (s) => s.traineeId === traineeId && s.positionId === positionId && s.shiftNumber === shiftNumber
      );
      if (existing) {
        return prev.map((s) =>
          s.traineeId === traineeId && s.positionId === positionId && s.shiftNumber === shiftNumber
            ? { ...s, ...fields }
            : s
        );
      } else {
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            traineeId,
            positionId,
            shiftNumber,
            completedDate: null,
            notes: '',
            ...fields,
            createdAt: new Date().toISOString(),
          },
        ];
      }
    });
  }

  function getShiftsForRecord(traineeId, positionId) {
    return shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId
    );
  }

  // --- Comment mutations ---
  function addComment(traineeId, positionId, text, author) {
    setComments(prev => [...prev, {
      id: crypto.randomUUID(),
      traineeId,
      positionId,
      text,
      author,
      createdAt: new Date().toISOString(),
    }]);
  }

  function deleteComment(id) {
    pushUndo();
    setComments(prev => prev.filter(c => c.id !== id));
  }

  function getCommentsForRecord(traineeId, positionId) {
    return comments.filter(c => c.traineeId === traineeId && c.positionId === positionId);
  }

  // --- Backup / Restore ---
  function exportData() {
    const data = { trainees, positions, records, shifts, goals, paths, plannedShifts, checklistItems, checklistProgress, trainingTemplates, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfa-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(data) {
    pushUndo();
    if (data.trainees) setTrainees(data.trainees);
    if (data.positions) setPositions(data.positions);
    if (data.records) setRecords(data.records);
    if (data.shifts) setShifts(data.shifts);
    if (data.goals) setGoals(data.goals);
    if (data.paths) setPaths(data.paths);
    if (data.plannedShifts) setPlannedShifts(data.plannedShifts);
    if (data.checklistItems) setChecklistItems(data.checklistItems);
    if (data.checklistProgress) setChecklistProgress(data.checklistProgress);
    if (data.trainingTemplates) setTrainingTemplates(data.trainingTemplates);
  }

  // --- Goal mutations ---
  function addGoal(data) {
    pushUndo();
    setGoals(prev => [...prev, { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }]);
  }
  function updateGoal(id, data) {
    pushUndo();
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  }
  function deleteGoal(id) {
    pushUndo();
    setGoals(prev => prev.filter(g => g.id !== id));
  }

  // --- Path mutations ---
  function addPath(data) {
    pushUndo();
    setPaths(prev => [...prev, { id: crypto.randomUUID(), ...data, createdAt: new Date().toISOString() }]);
  }
  function updatePath(id, data) {
    pushUndo();
    setPaths(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }
  function deletePath(id) {
    pushUndo();
    setPaths(prev => prev.filter(p => p.id !== id));
  }

  // --- Planned Shift mutations ---
  function addPlannedShift(data) {
    pushUndo();
    setPlannedShifts(prev => [
      ...prev,
      { id: crypto.randomUUID(), completedAt: null, notes: '', ...data, createdAt: new Date().toISOString() },
    ]);
  }

  function updatePlannedShift(id, data) {
    pushUndo();
    setPlannedShifts(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
  }

  function deletePlannedShift(id) {
    pushUndo();
    setPlannedShifts(prev => prev.filter(s => s.id !== id));
  }

  // --- Checklist Item mutations ---
  function addChecklistItem(data) {
    pushUndo();
    setChecklistItems(p => [...p, { id: crypto.randomUUID(), order: p.length + 1, ...data, createdAt: new Date().toISOString() }]);
  }
  function updateChecklistItem(id, data) {
    pushUndo();
    setChecklistItems(p => p.map(i => i.id === id ? { ...i, ...data } : i));
  }
  function deleteChecklistItem(id) {
    pushUndo();
    setChecklistItems(p => p.filter(i => i.id !== id));
    setChecklistProgress(p => p.filter(cp => cp.itemId !== id));
  }

  // --- Checklist Progress mutations ---
  function setChecklistItemProgress(traineeId, itemId, completed, notes = '') {
    pushUndo();
    setChecklistProgress(prev => {
      const ex = prev.find(p => p.traineeId === traineeId && p.itemId === itemId);
      const updated = { completed, completedAt: completed ? new Date().toISOString() : null, notes };
      if (ex) return prev.map(p => p.traineeId === traineeId && p.itemId === itemId ? { ...p, ...updated } : p);
      return [...prev, { id: crypto.randomUUID(), traineeId, itemId, ...updated }];
    });
  }

  function getOnboardingProgress(traineeId) {
    const total = checklistItems.length;
    if (!total) return { pct: 0, completed: 0, total: 0 };
    const done = checklistProgress.filter(p => p.traineeId === traineeId && p.completed).length;
    return { pct: Math.round((done / total) * 100), completed: done, total };
  }

  // --- Training Template mutations ---
  function addTrainingTemplate(data) {
    pushUndo();
    setTrainingTemplates(p => [...p, { id: crypto.randomUUID(), isBuiltIn: false, ...data, createdAt: new Date().toISOString() }]);
  }
  function updateTrainingTemplate(id, data) {
    pushUndo();
    setTrainingTemplates(p => p.map(t => t.id === id ? { ...t, ...data } : t));
  }
  function deleteTrainingTemplate(id) {
    pushUndo();
    setTrainingTemplates(p => p.filter(t => t.id !== id || t.isBuiltIn));
  }

  function applyTemplateToTrainee(templateId, traineeId, startDate) {
    const tpl = trainingTemplates.find(t => t.id === templateId);
    if (!tpl || !tpl.positionIds.length) return;
    pushUndo();
    const totalDays = tpl.estimatedWeeks * 7;
    const gap = Math.max(1, Math.floor(totalDays / tpl.positionIds.length));
    tpl.positionIds.forEach((positionId, idx) => {
      const d = new Date(startDate + 'T00:00:00');
      d.setDate(d.getDate() + idx * gap);
      setPlannedShifts(p => [...p, {
        id: crypto.randomUUID(),
        traineeId,
        positionId,
        scheduledDate: d.toISOString().split('T')[0],
        trainerId: null,
        notes: `Template: ${tpl.name}`,
        completedAt: null,
        createdAt: new Date().toISOString(),
      }]);
    });
  }

  function copyTrainingPlan(sourceId, targetId) {
    pushUndo();
    const sourceRecords = records.filter(r => r.traineeId === sourceId);
    const sourcePlanned = plannedShifts.filter(s => s.traineeId === sourceId && !s.completedAt);
    sourceRecords.forEach(r =>
      setRecords(p => [...p, { ...r, id: crypto.randomUUID(), traineeId: targetId, updatedAt: new Date().toISOString() }])
    );
    sourcePlanned.forEach(s =>
      setPlannedShifts(p => [...p, { ...s, id: crypto.randomUUID(), traineeId: targetId, completedAt: null, completedDate: null, completedShiftId: null, createdAt: new Date().toISOString() }])
    );
  }

  // Direct completed shift creation (used by QR check-in — no planned shift required)
  function addCompletedShift(traineeId, positionId, completedDate, shiftType = 'training', trainerId = null, notes = '') {
    pushUndo();
    const existingCount = shifts.filter(
      s => s.traineeId === traineeId && s.positionId === positionId &&
           s.completedDate && (s.shiftType === 'training' || !s.shiftType)
    ).length;
    const shiftNumber = shiftType === 'training' ? existingCount + 1 : null;
    setShifts(p => [...p, {
      id: crypto.randomUUID(),
      traineeId, positionId, shiftNumber, shiftType, completedDate,
      trainerId, notes, rating: null, createdAt: new Date().toISOString(),
    }]);
    const existing = records.find(r => r.traineeId === traineeId && r.positionId === positionId);
    if (!existing) {
      setRecords(p => [...p, { id: crypto.randomUUID(), traineeId, positionId, tag: 'needs_training', notes: '', updatedAt: new Date().toISOString() }]);
    }
  }

  // Atomically creates a real completed shift + marks planned shift done (ONE undo entry)
  // shiftType: 'training' (counts toward cert) | 'practice' (tracked separately, no cert progress)
  function completePlannedShift(id, completedDate, shiftType = 'training') {
    const ps = plannedShifts.find(s => s.id === id);
    if (!ps) return;
    pushUndo();
    // Only training shifts count toward shiftNumber sequencing
    const existingTrainingCount = shifts.filter(
      s => s.traineeId === ps.traineeId && s.positionId === ps.positionId &&
           s.completedDate && (s.shiftType === 'training' || !s.shiftType)
    ).length;
    const shiftNumber = shiftType === 'training' ? existingTrainingCount + 1 : null;
    const newShiftId = crypto.randomUUID();
    setShifts(prev => [
      ...prev,
      {
        id: newShiftId,
        traineeId: ps.traineeId,
        positionId: ps.positionId,
        shiftNumber,
        shiftType,
        completedDate,
        trainerId: ps.trainerId ?? null,
        notes: ps.notes ?? '',
        rating: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    setPlannedShifts(prev =>
      prev.map(s => s.id === id ? { ...s, completedAt: new Date().toISOString(), completedDate, completedShiftId: newShiftId } : s)
    );
    // Auto-create a record with needs_training tag if none exists (Feature 5)
    const existingRecord = records.find(
      r => r.traineeId === ps.traineeId && r.positionId === ps.positionId
    );
    if (!existingRecord) {
      setRecords(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          traineeId: ps.traineeId,
          positionId: ps.positionId,
          tag: 'needs_training',
          notes: '',
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
  }

  // Removes a completed planned shift and rolls back the training record it created
  function uncompleteShift(plannedShiftId) {
    const ps = plannedShifts.find(s => s.id === plannedShiftId);
    if (!ps || !ps.completedAt) return;
    pushUndo();
    if (ps.completedShiftId) {
      setShifts(prev => prev.filter(s => s.id !== ps.completedShiftId));
    } else {
      // Fallback for legacy records that don't have completedShiftId stored
      setShifts(prev => {
        const candidates = prev.filter(
          s => s.traineeId === ps.traineeId &&
               s.positionId === ps.positionId &&
               s.completedDate === ps.completedDate
        );
        if (candidates.length === 0) return prev;
        const toRemoveId = candidates[candidates.length - 1].id;
        return prev.filter(s => s.id !== toRemoveId);
      });
    }
    setPlannedShifts(prev => prev.map(s => s.id === plannedShiftId
      ? { ...s, completedAt: null, completedDate: null, completedShiftId: null }
      : s));
  }

  // Derive status from TRAINING shifts only (practice shifts don't count toward cert)
  function deriveStatus(traineeId, positionId, requiredShifts) {
    const completedShifts = shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId &&
             s.completedDate && (s.shiftType === 'training' || !s.shiftType)
    );
    const count = completedShifts.length;
    if (count === 0) return STATUS.NOT_STARTED;
    if (count < requiredShifts) return STATUS.IN_PROGRESS;

    const pos = positions.find((p) => p.id === positionId);
    if (pos?.recertifyAfterMonths != null) {
      const sorted = [...completedShifts].sort(
        (a, b) => new Date(a.completedDate + 'T00:00:00') - new Date(b.completedDate + 'T00:00:00')
      );
      const nthShift = sorted[requiredShifts - 1];
      if (nthShift?.completedDate) {
        const expiry = new Date(nthShift.completedDate + 'T00:00:00');
        expiry.setMonth(expiry.getMonth() + pos.recertifyAfterMonths);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (today > expiry) return STATUS.NEEDS_RECERT;
      }
    }
    return STATUS.TRAINED;
  }

  function getCompletedShiftCount(traineeId, positionId) {
    return shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId &&
             s.completedDate && (s.shiftType === 'training' || !s.shiftType)
    ).length;
  }

  function getPracticeShiftCount(traineeId, positionId) {
    return shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId &&
             s.completedDate && s.shiftType === 'practice'
    ).length;
  }

  // O(1) lookup map: "traineeId::positionId" -> record
  const recordMap = useMemo(() => {
    const map = new Map();
    records.forEach((r) => map.set(`${r.traineeId}::${r.positionId}`, r));
    return map;
  }, [records]);

  function getRecord(traineeId, positionId) {
    return recordMap.get(`${traineeId}::${positionId}`) || null;
  }

  // Sorted positions by sortOrder
  const sortedPositions = useMemo(
    () => [...positions].sort((a, b) => a.sortOrder - b.sortOrder),
    [positions]
  );

  const value = {
    trainees,
    positions: sortedPositions,
    records,
    recordMap,
    shifts,
    goals,
    paths,
    plannedShifts,
    addTrainee,
    updateTrainee,
    deleteTrainee,
    addPosition,
    updatePosition,
    deletePosition,
    upsertRecord,
    getRecord,
    upsertShift,
    getShiftsForRecord,
    deriveStatus,
    getCompletedShiftCount,
    getPracticeShiftCount,
    exportData,
    importData,
    addGoal,
    updateGoal,
    deleteGoal,
    addPath,
    updatePath,
    deletePath,
    addPlannedShift,
    updatePlannedShift,
    deletePlannedShift,
    completePlannedShift,
    uncompleteShift,
    addCompletedShift,
    undo,
    canUndo,
    // Checklists
    checklistItems,
    checklistProgress,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    setChecklistItemProgress,
    getOnboardingProgress,
    // Training Templates
    trainingTemplates,
    addTrainingTemplate,
    updateTrainingTemplate,
    deleteTrainingTemplate,
    applyTemplateToTrainee,
    copyTrainingPlan,
    // Comments
    comments,
    addComment,
    deleteComment,
    getCommentsForRecord,
    // Auth
    authSession,
    authLoading,
    currentUser,
    login,
    logout,
    fullSignOut,
    // User permissions
    userPermissions,
    setUserPermission,
    removeUserPermission,
    // Preferences
    preferences,
    updatePreferences,
    // Supabase
    supabaseConnected,
    storeId,
    setStoreId: setStoreIdStored,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
