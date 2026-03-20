import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import { STATUS } from '../constants/theme';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { trainees, positions, recordMap, shifts, deriveStatus } = useAppContext();

  const stats = useMemo(() => {
    const total = trainees.length * positions.length;
    if (total === 0) return null;
    let trained = 0;
    let inProgress = 0;
    let overdue = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    trainees.forEach((t) => {
      positions.forEach((p) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        const s = deriveStatus(t.id, p.id, required);
        if (s === STATUS.TRAINED) trained++;
        else if (s === STATUS.IN_PROGRESS) inProgress++;
        if (
          record?.targetDate &&
          s !== STATUS.TRAINED &&
          s !== STATUS.NEEDS_RECERT
        ) {
          if (new Date(record.targetDate + 'T00:00:00') < today) overdue++;
        }
      });
    });
    return {
      total,
      trained,
      inProgress,
      overdue,
      pct: Math.round((trained / total) * 100),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, recordMap, deriveStatus]);

  // Recent activity: last 8 completed shifts across all trainees
  const recentActivity = useMemo(() => {
    return [...shifts]
      .filter((s) => s.completedDate)
      .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))
      .slice(0, 8)
      .map((s) => ({
        ...s,
        traineeName: trainees.find((t) => t.id === s.traineeId)?.name ?? '?',
        positionName: positions.find((p) => p.id === s.positionId)?.name ?? '?',
      }));
  }, [shifts, trainees, positions]);

  // Positions where every trainee is NOT_STARTED
  const needsAttention = useMemo(() => {
    if (trainees.length === 0) return [];
    return positions.filter((p) =>
      trainees.every((t) => {
        const record = recordMap.get(`${t.id}::${p.id}`);
        const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
        return deriveStatus(t.id, p.id, required) === STATUS.NOT_STARTED;
      })
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, trainees, recordMap, deriveStatus]);

  const isEmpty = trainees.length === 0 || positions.length === 0;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Dashboard</h1>
        {stats && (
          <p className={styles.subtitle}>
            {trainees.length} trainee{trainees.length !== 1 ? 's' : ''} · {positions.length} position{positions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isEmpty ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>📋</div>
          <p className={styles.emptyMsg}>
            Add some <Link to="/trainees" className={styles.emptyLink}>trainees</Link> and{' '}
            <Link to="/positions" className={styles.emptyLink}>positions</Link> to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardNum}>{trainees.length}</div>
              <div className={styles.cardLabel}>Trainees</div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardNum}>{positions.length}</div>
              <div className={styles.cardLabel}>Positions</div>
            </div>
            <div className={`${styles.card} ${styles.cardGreen}`}>
              <div className={styles.cardNum}>{stats?.pct ?? 0}%</div>
              <div className={styles.cardLabel}>Trained</div>
              {stats && stats.inProgress > 0 && (
                <div className={styles.cardSub}>{stats.inProgress} in progress</div>
              )}
            </div>
            <div className={`${styles.card} ${stats?.overdue > 0 ? styles.cardRed : ''}`}>
              <div className={styles.cardNum}>{stats?.overdue ?? 0}</div>
              <div className={styles.cardLabel}>Overdue</div>
            </div>
          </div>

          {/* Progress bar */}
          {stats && (
            <div className={styles.progressWrap}>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {stats.trained} of {stats.total} trained
              </span>
            </div>
          )}

          <div className={styles.columns}>
            {/* Recent activity */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Recent Activity</h2>
              {recentActivity.length === 0 ? (
                <p className={styles.empty}>No shifts recorded yet.</p>
              ) : (
                <ul className={styles.activityList}>
                  {recentActivity.map((s) => (
                    <li key={s.id} className={styles.activityItem}>
                      <span className={styles.activityDate}>{s.completedDate}</span>
                      <span className={styles.activityName}>{s.traineeName}</span>
                      <span className={styles.activitySep}>→</span>
                      <span className={styles.activityPos}>{s.positionName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Needs attention */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {needsAttention.length === 0 ? '🎉 All Positions Started' : '⚠️ Positions Not Started'}
              </h2>
              {needsAttention.length === 0 ? (
                <p className={styles.empty}>Every position has at least one shift logged.</p>
              ) : (
                <ul className={styles.attentionList}>
                  {needsAttention.map((p) => (
                    <li key={p.id} className={styles.attentionItem}>
                      <span className={styles.attentionDot} />
                      <span className={styles.attentionName}>{p.name}</span>
                      <span className={styles.attentionCat}>{p.category}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </PageContainer>
  );
}
