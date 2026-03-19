import { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import TrainingMatrix from '../components/matrix/TrainingMatrix';
import MatrixLegend from '../components/matrix/MatrixLegend';
import Button from '../components/shared/Button';
import { STATUS, CATEGORIES } from '../constants/theme';
import styles from './MatrixPage.module.css';

const ALL = 'All';

export default function MatrixPage() {
  const { trainees, positions, recordMap, upsertRecord } = useAppContext();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(ALL);

  const filteredTrainees = useMemo(
    () => trainees.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [trainees, search]
  );

  const filteredPositions = useMemo(
    () => categoryFilter === ALL ? positions : positions.filter((p) => p.category === categoryFilter),
    [positions, categoryFilter]
  );

  // Stats
  const stats = useMemo(() => {
    const total = trainees.length * positions.length;
    if (total === 0) return null;
    let trained = 0;
    let inProgress = 0;
    trainees.forEach((t) => {
      positions.forEach((p) => {
        const r = recordMap.get(`${t.id}::${p.id}`);
        if (r?.status === STATUS.TRAINED) trained++;
        else if (r?.status === STATUS.IN_PROGRESS) inProgress++;
      });
    });
    const pct = total > 0 ? Math.round((trained / total) * 100) : 0;
    return { total, trained, inProgress, pct };
  }, [trainees, positions, recordMap]);

  function handleStatusChange(traineeId, positionId, nextStatus) {
    upsertRecord(traineeId, positionId, {
      status: nextStatus,
      trainedDate: nextStatus === STATUS.TRAINED ? new Date().toISOString().split('T')[0] : null,
    });
  }

  function exportCSV() {
    const headers = ['Trainee', 'Role', ...positions.map((p) => p.name)];
    const rows = trainees.map((t) => {
      const cells = positions.map((p) => {
        const r = recordMap.get(`${t.id}::${p.id}`);
        if (!r || r.status === STATUS.NOT_STARTED) return 'Not Started';
        if (r.status === STATUS.IN_PROGRESS) return 'In Progress';
        return 'Trained';
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
        onStatusChange={handleStatusChange}
      />
    </PageContainer>
  );
}
