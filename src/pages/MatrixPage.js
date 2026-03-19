import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TrainingMatrix from '../components/matrix/TrainingMatrix';
import MatrixLegend from '../components/matrix/MatrixLegend';
import ShiftModal from '../components/matrix/ShiftModal';
import Button from '../components/shared/Button';
import { STATUS, CATEGORIES } from '../constants/theme';
import styles from './MatrixPage.module.css';

const ALL = 'All';

export default function MatrixPage() {
  const {
    trainees, positions, recordMap, shifts,
    upsertRecord, upsertShift, getShiftsForRecord,
    deriveStatus, getCompletedShiftCount,
  } = useAppContext();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const filteredTrainees = useMemo(
    () => trainees.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [trainees, search]
  );

  const filteredPositions = useMemo(
    () => categoryFilter === ALL ? positions : positions.filter((p) => p.category === categoryFilter),
    [positions, categoryFilter]
  );

  // Stats derived from shifts
  const stats = useMemo(() => {
    const total = trainees.length * positions.length;
    if (total === 0) return null;
    let trained = 0;
    let inProgress = 0;
    trainees.forEach((t) => {
      positions.forEach((p) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        const status = deriveStatus(t.id, p.id, required);
        if (status === STATUS.TRAINED) trained++;
        else if (status === STATUS.IN_PROGRESS) inProgress++;
      });
    });
    const pct = total > 0 ? Math.round((trained / total) * 100) : 0;
    return { total, trained, inProgress, pct };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, recordMap, deriveStatus]);

  function handleCellClick(trainee, position) {
    setSelectedTrainee(trainee);
    setSelectedPosition(position);
    setModalOpen(true);
  }

  function handleUpsertShift(traineeId, positionId, shiftNumber, fields) {
    upsertShift(traineeId, positionId, shiftNumber, fields);
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
        <Button variant="secondary" onClick={exportCSV} disabled={!trainees.length || !positions.length}>
          ↓ Export CSV
        </Button>
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

      <MatrixLegend />

      <TrainingMatrix
        trainees={filteredTrainees}
        positions={filteredPositions}
        recordMap={recordMap}
        shifts={shifts}
        deriveStatus={deriveStatus}
        getCompletedShiftCount={getCompletedShiftCount}
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
      />
    </PageContainer>
  );
}
