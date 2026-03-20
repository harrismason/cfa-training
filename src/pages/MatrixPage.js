import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TrainingMatrix from '../components/matrix/TrainingMatrix';
import MatrixLegend from '../components/matrix/MatrixLegend';
import ShiftModal from '../components/matrix/ShiftModal';
import InsightsPanel from '../components/matrix/InsightsPanel';
import BulkAssignModal from '../components/matrix/BulkAssignModal';
import Button from '../components/shared/Button';
import { STATUS, CATEGORIES } from '../constants/theme';
import styles from './MatrixPage.module.css';

const ALL = 'All';

export default function MatrixPage() {
  const {
    trainees, positions, records, recordMap, shifts,
    upsertRecord, upsertShift, getShiftsForRecord,
    deriveStatus, getCompletedShiftCount,
  } = useAppContext();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);

  const filteredTrainees = useMemo(
    () => trainees.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [trainees, search]
  );

  const filteredPositions = useMemo(
    () => categoryFilter === ALL ? positions : positions.filter((p) => p.category === categoryFilter),
    [positions, categoryFilter]
  );

  // Stats: overall + per-trainee + per-position
  const { stats, traineeStats, positionStats } = useMemo(() => {
    const total = trainees.length * positions.length;
    if (total === 0) return { stats: null, traineeStats: [], positionStats: [] };

    let trained = 0;
    let inProgress = 0;

    const tStats = trainees.map((t) => {
      let tTrained = 0;
      positions.forEach((p) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        const s = deriveStatus(t.id, p.id, required);
        if (s === STATUS.TRAINED) { tTrained++; trained++; }
        else if (s === STATUS.IN_PROGRESS) inProgress++;
      });
      const tPct = positions.length > 0 ? Math.round((tTrained / positions.length) * 100) : 0;
      return { trainee: t, trained: tTrained, total: positions.length, pct: tPct };
    }).sort((a, b) => b.pct - a.pct);

    const pStats = positions.map((p) => {
      let pTrained = 0;
      trainees.forEach((t) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        if (deriveStatus(t.id, p.id, required) === STATUS.TRAINED) pTrained++;
      });
      const pPct = trainees.length > 0 ? Math.round((pTrained / trainees.length) * 100) : 0;
      return { position: p, trained: pTrained, total: trainees.length, pct: pPct };
    }).sort((a, b) => a.pct - b.pct);

    const pct = Math.round((trained / total) * 100);
    return {
      stats: { total, trained, inProgress, pct },
      traineeStats: tStats,
      positionStats: pStats,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, recordMap, deriveStatus]);

  // Trainees actively assigned for training (tagged + not yet TRAINED/NEEDS_RECERT)
  const assignedForTraining = useMemo(() => {
    return records
      .filter((r) => r.tag === 'needs_training')
      .map((r) => {
        const trainee = trainees.find((t) => t.id === r.traineeId);
        const pos = positions.find((p) => p.id === r.positionId);
        if (!trainee || !pos) return null;
        const required = r.requiredShifts ?? pos.requiredShifts ?? 3;
        const status = deriveStatus(r.traineeId, r.positionId, required);
        if (status === STATUS.TRAINED || status === STATUS.NEEDS_RECERT) return null;
        return { trainee, position: pos, status };
      })
      .filter(Boolean);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, trainees, positions, deriveStatus]);

  // Trainee completion % map for mini bars
  const traineeCompletionMap = useMemo(() => {
    const map = new Map();
    traineeStats.forEach(({ trainee, pct }) => map.set(trainee.id, pct));
    return map;
  }, [traineeStats]);

  function handleCellClick(trainee, position) {
    setSelectedTrainee(trainee);
    setSelectedPosition(position);
    setModalOpen(true);
  }

  function handleUpsertShift(traineeId, positionId, shiftNumber, fields) {
    upsertShift(traineeId, positionId, shiftNumber, fields);
  }

  function handleBulkAssign(positionId, tag, traineeIds) {
    traineeIds.forEach((tid) => upsertRecord(tid, positionId, { tag }));
  }

  function exportCSV() {
    const headers = ['Trainee', 'Role', ...positions.map((p) => p.name)];
    const rows = trainees.map((t) => {
      const cells = positions.map((p) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        const completed = getCompletedShiftCount(t.id, p.id);
        const status = deriveStatus(t.id, p.id, required);
        if (status === STATUS.TRAINED) return `Trained (${completed}/${required})`;
        if (status === STATUS.NEEDS_RECERT) return `Needs Recert (${completed}/${required})`;
        if (status === STATUS.IN_PROGRESS) return `In Progress (${completed}/${required})`;
        return 'Not Started';
      });
      return [t.name, t.role, ...cells];
    });
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfa-training-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const modalShifts = selectedTrainee && selectedPosition
    ? getShiftsForRecord(selectedTrainee.id, selectedPosition.id)
    : [];
  const modalRecord = selectedTrainee && selectedPosition
    ? recordMap.get(`${selectedTrainee.id}::${selectedPosition.id}`) || null
    : null;

  return (
    <PageContainer className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Training Matrix</h1>
          {stats && (
            <div className={styles.statsBar}>
              <span>{trainees.length} trainee{trainees.length !== 1 ? 's' : ''}</span>
              <span className={styles.dot}>•</span>
              <span>{positions.length} position{positions.length !== 1 ? 's' : ''}</span>
              <span className={styles.dot}>•</span>
              <span className={styles.pct}>{stats.pct}% trained</span>
              {stats.inProgress > 0 && (
                <>
                  <span className={styles.dot}>•</span>
                  <span className={styles.inProg}>{stats.inProgress} in progress</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setBulkOpen(true)} disabled={!trainees.length || !positions.length}>
            🎯 Bulk Assign
          </Button>
          <Button variant="secondary" onClick={exportCSV} disabled={!trainees.length || !positions.length}>
            ↓ Export CSV
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search trainees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.categoryTabs}>
          {[ALL, ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`${styles.tab} ${categoryFilter === cat ? styles.tabActive : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <InsightsPanel
        isOpen={insightsOpen}
        onToggle={() => setInsightsOpen((o) => !o)}
        stats={stats}
        traineeStats={traineeStats}
        positionStats={positionStats}
        assignedForTraining={assignedForTraining}
      />

      <MatrixLegend />

      <TrainingMatrix
        trainees={filteredTrainees}
        positions={filteredPositions}
        recordMap={recordMap}
        shifts={shifts}
        deriveStatus={deriveStatus}
        getCompletedShiftCount={getCompletedShiftCount}
        traineeCompletionMap={traineeCompletionMap}
        onCellClick={handleCellClick}
      />

      <ShiftModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        trainee={selectedTrainee}
        position={selectedPosition}
        record={modalRecord}
        shifts={modalShifts}
        onUpsertShift={handleUpsertShift}
        onUpsertRecord={upsertRecord}
        trainees={trainees}
      />

      <BulkAssignModal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        trainees={trainees}
        positions={positions}
        onBulkAssign={handleBulkAssign}
      />
    </PageContainer>
  );
}
