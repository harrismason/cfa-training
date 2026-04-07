import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TrainingMatrix from '../components/matrix/TrainingMatrix';
import MatrixLegend from '../components/matrix/MatrixLegend';
import ShiftModal from '../components/matrix/ShiftModal';
import InsightsPanel from '../components/matrix/InsightsPanel';
import BulkAssignModal from '../components/matrix/BulkAssignModal';
import TraineeReport from '../components/trainees/TraineeReport';
import Button from '../components/shared/Button';
import { STATUS, CATEGORIES } from '../constants/theme';
import styles from './MatrixPage.module.css';

const ALL = 'All';

export default function MatrixPage() {
  const {
    trainees, positions, records, recordMap, shifts,
    upsertRecord, upsertShift, getShiftsForRecord,
    deriveStatus, getCompletedShiftCount, getPracticeShiftCount,
  } = useAppContext();

  // Basic filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL);

  // Advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [statusFilter, setStatusFilter] = useState(new Set()); // empty = show all
  const [tagFilter, setTagFilter] = useState(ALL);   // All | needs_training | practice_only | unassigned
  const [trainerFilter, setTrainerFilter] = useState('');  // trainerId or ''
  const [sortMode, setSortMode] = useState('name');  // name | pct | status
  const [hideFullyTrained, setHideFullyTrained] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reportTrainee, setReportTrainee] = useState(null);

  // Trainers for filter dropdown
  const trainers = useMemo(
    () => trainees.filter((t) => t.role === 'Trainer' || t.role === 'Team Lead'),
    [trainees]
  );

  // Per-trainee completion % (needed for sort + hide fully trained)
  const traineeCompletionPctMap = useMemo(() => {
    const map = new Map();
    trainees.forEach((t) => {
      let trained = 0;
      positions.forEach((p) => {
        const rec = recordMap.get(`${t.id}::${p.id}`);
        const required = rec?.requiredShifts ?? p.requiredShifts ?? 3;
        if (deriveStatus(t.id, p.id, required) === STATUS.TRAINED) trained++;
      });
      map.set(t.id, positions.length > 0 ? Math.round((trained / positions.length) * 100) : 0);
    });
    return map;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, recordMap, deriveStatus, shifts]);

  const filteredTrainees = useMemo(() => {
    let result = trainees.filter((t) =>
      t.role !== 'Trainer' && t.role !== 'Team Lead' &&
      t.name.toLowerCase().includes(search.toLowerCase())
    );

    // Tag filter: show trainees who have at least one record matching tag
    if (tagFilter !== ALL) {
      result = result.filter((t) => {
        if (tagFilter === 'unassigned') {
          return !records.some((r) => r.traineeId === t.id && r.tag);
        }
        return records.some((r) => r.traineeId === t.id && r.tag === tagFilter);
      });
    }

    // Trainer filter: show trainees who have at least one shift with this trainer
    if (trainerFilter) {
      result = result.filter((t) =>
        shifts.some((s) => s.traineeId === t.id && s.trainerId === trainerFilter)
      );
    }

    // Status filter: show trainees who have at least one position matching any selected status
    if (statusFilter.size > 0) {
      result = result.filter((t) =>
        positions.some((p) => {
          const rec = recordMap.get(`${t.id}::${p.id}`);
          const required = rec?.requiredShifts ?? p.requiredShifts ?? 3;
          return statusFilter.has(deriveStatus(t.id, p.id, required));
        })
      );
    }

    // Hide fully trained
    if (hideFullyTrained) {
      result = result.filter((t) => (traineeCompletionPctMap.get(t.id) ?? 0) < 100);
    }

    // Sort
    if (sortMode === 'pct') {
      result = [...result].sort((a, b) => (traineeCompletionPctMap.get(b.id) ?? 0) - (traineeCompletionPctMap.get(a.id) ?? 0));
    } else if (sortMode === 'status') {
      const statusOrder = { [STATUS.IN_PROGRESS]: 0, [STATUS.NEEDS_RECERT]: 1, [STATUS.NOT_STARTED]: 2, [STATUS.TRAINED]: 3 };
      result = [...result].sort((a, b) => {
        const aMin = Math.min(...positions.map((p) => {
          const rec = recordMap.get(`${a.id}::${p.id}`);
          const req = rec?.requiredShifts ?? p.requiredShifts ?? 3;
          return statusOrder[deriveStatus(a.id, p.id, req)] ?? 99;
        }));
        const bMin = Math.min(...positions.map((p) => {
          const rec = recordMap.get(`${b.id}::${p.id}`);
          const req = rec?.requiredShifts ?? p.requiredShifts ?? 3;
          return statusOrder[deriveStatus(b.id, p.id, req)] ?? 99;
        }));
        return aMin - bMin;
      });
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, search, tagFilter, trainerFilter, statusFilter, hideFullyTrained, sortMode, records, shifts, positions, recordMap, deriveStatus, traineeCompletionPctMap]);

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

  // Count active advanced filters
  const activeFilterCount = [
    statusFilter.size > 0,
    tagFilter !== ALL,
    !!trainerFilter,
    hideFullyTrained,
    sortMode !== 'name',
  ].filter(Boolean).length;

  function toggleStatusFilter(status) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function clearAdvancedFilters() {
    setStatusFilter(new Set());
    setTagFilter(ALL);
    setTrainerFilter('');
    setHideFullyTrained(false);
    setSortMode('name');
  }

  function handleCellClick(trainee, position) {
    setSelectedTrainee(trainee);
    setSelectedPosition(position);
    setModalOpen(true);
  }

  function handleTraineeClick(trainee) {
    setReportTrainee(trainee);
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

  const STATUS_FILTER_OPTIONS = [
    { value: STATUS.NOT_STARTED, label: 'Not Started', color: '#9E9E9E' },
    { value: STATUS.IN_PROGRESS, label: 'In Progress', color: '#F57C00' },
    { value: STATUS.TRAINED,     label: 'Trained',     color: '#2E7D32' },
    { value: STATUS.NEEDS_RECERT,label: 'Needs Recert',color: '#7B1FA2' },
  ];

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

      {/* Search + category */}
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
        <button
          className={`${styles.advancedToggle} ${showAdvanced ? styles.advancedToggleOpen : ''}`}
          onClick={() => setShowAdvanced((o) => !o)}
        >
          Filters {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
          <span className={styles.chevron}>{showAdvanced ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div className={styles.advancedRow}>
            <span className={styles.advancedLabel}>Status:</span>
            <div className={styles.statusChips}>
              {STATUS_FILTER_OPTIONS.map(({ value, label, color }) => (
                <button
                  key={value}
                  className={`${styles.statusChip} ${statusFilter.has(value) ? styles.statusChipActive : ''}`}
                  style={statusFilter.has(value) ? { background: color, borderColor: color, color: '#fff' } : { borderColor: color, color: color }}
                  onClick={() => toggleStatusFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.advancedRow}>
            <span className={styles.advancedLabel}>Tag:</span>
            <div className={styles.tagChips}>
              {[
                { val: ALL, label: 'All' },
                { val: 'needs_training', label: 'Needs Training' },
                { val: 'practice_only', label: 'Practice Only' },
                { val: 'unassigned', label: 'Unassigned' },
              ].map(({ val, label }) => (
                <button
                  key={val}
                  className={`${styles.tagChip} ${tagFilter === val ? styles.tagChipActive : ''}`}
                  onClick={() => setTagFilter(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.advancedRow}>
            <span className={styles.advancedLabel}>Trainer:</span>
            <select
              className={styles.advancedSelect}
              value={trainerFilter}
              onChange={(e) => setTrainerFilter(e.target.value)}
            >
              <option value="">Any Trainer</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <span className={styles.advancedLabel} style={{ marginLeft: '1rem' }}>Sort:</span>
            <select
              className={styles.advancedSelect}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value)}
            >
              <option value="name">Name A–Z</option>
              <option value="pct">Completion % ↓</option>
              <option value="status">Needs Attention First</option>
            </select>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={hideFullyTrained}
                onChange={(e) => setHideFullyTrained(e.target.checked)}
              />
              Hide fully trained
            </label>

            {activeFilterCount > 0 && (
              <button className={styles.clearFilters} onClick={clearAdvancedFilters}>
                Clear all filters
              </button>
            )}
          </div>

          <div className={styles.filterResults}>
            Showing {filteredTrainees.length} of {trainees.length} trainees
          </div>
        </div>
      )}

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
        getPracticeShiftCount={getPracticeShiftCount}
        traineeCompletionMap={traineeCompletionMap}
        onCellClick={handleCellClick}
        onTraineeClick={handleTraineeClick}
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

      <TraineeReport
        isOpen={!!reportTrainee}
        onClose={() => setReportTrainee(null)}
        trainee={reportTrainee}
      />
    </PageContainer>
  );
}
