import { createContext, useContext, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { SEED_POSITIONS } from '../constants/seeds';
import { STATUS } from '../constants/theme';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [trainees, setTrainees] = useLocalStorage('cfa_trainees', []);
  const [positions, setPositions] = useLocalStorage('cfa_positions', SEED_POSITIONS);
  const [records, setRecords] = useLocalStorage('cfa_records', []);

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
  }

  // --- Position mutations ---
  function addPosition(data) {
    const newPosition = {
      id: crypto.randomUUID(),
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
            status: STATUS.NOT_STARTED,
            trainedDate: null,
            trainerId: null,
            notes: '',
            ...fields,
            updatedAt: new Date().toISOString(),
          },
        ];
      }
    });
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
    addTrainee,
    updateTrainee,
    deleteTrainee,
    addPosition,
    updatePosition,
    deletePosition,
    upsertRecord,
    getRecord,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
