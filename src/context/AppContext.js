import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SEED_POSITIONS } from '../constants/seeds';
import { STATUS } from '../constants/theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [trainees, setTrainees] = useLocalStorage('cfa_trainees', []);
  const [positions, setPositions] = useLocalStorage('cfa_positions', SEED_POSITIONS);
  const [records, setRecords] = useLocalStorage('cfa_records', []);
  const [shifts, setShifts] = useLocalStorage('cfa_shifts', []);

  // --- Trainee mutations ---
  function addTrainee(data) {
    const newTrainee = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    setTrainees((prev) => [...prev, newTrainee]);
    return newTrainee;
  }

  function updateTrainee(id, data) {
    setTrainees((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  }

  function deleteTrainee(id) {
    setTrainees((prev) => prev.filter((t) => t.id !== id));
    setRecords((prev) => prev.filter((r) => r.traineeId !== id));
    setShifts((prev) => prev.filter((s) => s.traineeId !== id));
  }

  // --- Position mutations ---
  function addPosition(data) {
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
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  }

  function deletePosition(id) {
    setPositions((prev) => prev.filter((p) => p.id !== id));
    setRecords((prev) => prev.filter((r) => r.positionId !== id));
    setShifts((prev) => prev.filter((s) => s.positionId !== id));
  }

  // --- Record mutations ---
  function upsertRecord(traineeId, positionId, fields) {
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

  // Derive status from completed shifts vs required
  function deriveStatus(traineeId, positionId, requiredShifts) {
    const completed = shifts.filter(
      (s) => s.traineeId === traineeId && s.positionId === positionId && s.completedDate
    ).length;
    if (completed === 0) return STATUS.NOT_STARTED;
    if (completed >= requiredShifts) return STATUS.TRAINED;
    return STATUS.IN_PROGRESS;
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
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
