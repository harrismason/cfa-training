import { createContext, useContext, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SEED_POSITIONS } from '../constants/seeds';
import { STATUS } from '../constants/theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [trainees, setTrainees] = useLocalStorage('cfa_trainees', []);
  const [positions, setPositions] = useLocalStorage('cfa_positions', SEED_POSITIONS);
  const [records, setRecords] = useLocalStorage('cfa_records', []);
  const [shifts, setShifts] = useLocalStorage('cfa_shifts', []);
  const [goals, setGoals] = useLocalStorage('cfa_goals', []);
  const [paths, setPaths] = useLocalStorage('cfa_paths', []);

  // --- Undo stack ---
  const undoStackRef = useRef([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushUndo() {
    undoStackRef.current = [
      ...undoStackRef.current.slice(-19),
      { trainees, positions, records, shifts, goals, paths },
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

  // --- Backup / Restore ---
  function exportData() {
    const data = { trainees, positions, records, shifts, goals, paths, exportedAt: new Date().toISOString() };
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

  // Derive status from completed shifts vs required (including recertification)
  function deriveStatus(traineeId, positionId, requiredShifts) {
    const completedShifts = shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId && s.completedDate
    );
    const count = completedShifts.length;
    if (count === 0) return STATUS.NOT_STARTED;
    if (count < requiredShifts) return STATUS.IN_PROGRESS;

    // Trained — check recertification using position's recertifyAfterMonths
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
      (s) => s.traineeId === traineeId && s.positionId === positionId && s.completedDate
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
    exportData,
    importData,
    addGoal,
    updateGoal,
    deleteGoal,
    addPath,
    updatePath,
    deletePath,
    undo,
    canUndo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
