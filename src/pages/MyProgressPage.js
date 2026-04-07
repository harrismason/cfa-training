import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import { STATUS, STATUS_LABELS, STATUS_COLORS, ROLE_COLORS } from '../constants/theme';
import styles from './MyProgressPage.module.css';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MyProgressPage() {
  const {
    currentUser,
    trainees,
    positions,
    records,
    plannedShifts,
    deriveStatus,
    getCompletedShiftCount,
    getOnboardingProgress,
    checklistItems,
    checklistProgress,
  } = useAppContext();

  const trainee = trainees.find(t => t.id === currentUser?.id);
  const roleColor = ROLE_COLORS[trainee?.role] || ROLE_COLORS['Team Member'];

  // Positions with a record for this trainee
  const myRecords = useMemo(() => {
    if (!trainee) return [];
    return records.filter(r => r.traineeId === trainee.id);
  }, [records, trainee]);

  const myPositions = useMemo(() => {
    return myRecords.map(r => {
      const pos = positions.find(p => p.id === r.positionId);
      if (!pos) return null;
      const status = deriveStatus(trainee.id, pos.id, pos.requiredShifts || 3);
      const completed = getCompletedShiftCount(trainee.id, pos.id);
      const required = pos.requiredShifts || 3;
      return { ...pos, status, completed, required, record: r };
    }).filter(Boolean);
  }, [myRecords, positions, trainee, deriveStatus, getCompletedShiftCount]);

  // Upcoming planned shifts
  const upcomingShifts = useMemo(() => {
    if (!trainee) return [];
    return plannedShifts
      .filter(s => s.traineeId === trainee.id && !s.completedAt)
      .sort((a, b) => (a.scheduledDate || '').localeCompare(b.scheduledDate || ''));
  }, [plannedShifts, trainee]);

  const ob = trainee ? getOnboardingProgress(trainee.id) : { pct: 0, completed: 0, total: 0 };

  const trainedCount = myPositions.filter(p => p.status === STATUS.TRAINED).length;
  const totalPositions = myPositions.length;
  const overallPct = totalPositions ? Math.round((trainedCount / totalPositions) * 100) : 0;

  if (!trainee) {
    return (
      <PageContainer>
        <div className={styles.noTrainee}>
          <p>Your account isn't linked to a team member profile. Ask your manager for help.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Profile header */}
      <div className={styles.profileCard}>
        <div className={styles.avatar} style={{ backgroundColor: roleColor.avatar }}>
          {trainee.photoUrl
            ? <img src={trainee.photoUrl} alt={trainee.name} className={styles.avatarImg} />
            : getInitials(trainee.name)
          }
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{trainee.name}</h1>
          <span className={styles.roleBadge} style={{ background: roleColor.bg, color: roleColor.text }}>
            {trainee.role}
          </span>
          {trainee.startDate && (
            <span className={styles.startDate}>Started {formatDate(trainee.startDate)}</span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: '#2E7D32' }}>{trainedCount}</div>
          <div className={styles.statLabel}>Positions Trained</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: '#1565C0' }}>{totalPositions}</div>
          <div className={styles.statLabel}>Assigned Positions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum} style={{ color: '#E65100' }}>{ob.pct}%</div>
          <div className={styles.statLabel}>Onboarding Complete</div>
        </div>
      </div>

      {/* Training Progress */}
      {myPositions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Training Progress</h2>
            <span className={styles.sectionSub}>{trainedCount} of {totalPositions} positions certified</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${overallPct}%` }} />
          </div>
          <div className={styles.positionList}>
            {myPositions.map(pos => (
              <div key={pos.id} className={styles.positionRow}>
                <div className={styles.positionName}>{pos.name}</div>
                <div className={styles.positionMeta}>
                  <span className={styles.shiftCount}>{pos.completed} / {pos.required} shifts</span>
                  <span
                    className={styles.statusBadge}
                    style={{ background: STATUS_COLORS[pos.status] + '22', color: STATUS_COLORS[pos.status] }}
                  >
                    {STATUS_LABELS[pos.status]}
                  </span>
                </div>
                <div className={styles.positionBar}>
                  <div
                    className={styles.positionBarFill}
                    style={{
                      width: `${Math.min(100, (pos.completed / pos.required) * 100)}%`,
                      backgroundColor: STATUS_COLORS[pos.status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Shifts */}
      {upcomingShifts.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Upcoming Shifts</h2>
          <div className={styles.shiftList}>
            {upcomingShifts.slice(0, 5).map(s => {
              const pos = positions.find(p => p.id === s.positionId);
              return (
                <div key={s.id} className={styles.shiftRow}>
                  <div className={styles.shiftDate}>{formatDate(s.scheduledDate) || 'TBD'}</div>
                  <div className={styles.shiftPos}>{pos?.name || 'Unknown Position'}</div>
                  {s.notes && <div className={styles.shiftNotes}>{s.notes}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Onboarding Checklist */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Onboarding Checklist</h2>
          <span className={styles.sectionSub}>{ob.completed} of {ob.total} items</span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${ob.pct}%`,
              backgroundColor: ob.pct === 100 ? '#2E7D32' : '#E65100',
            }}
          />
        </div>
        <div className={styles.checklistItems}>
          {checklistItems.slice().sort((a,b) => a.order - b.order).map(item => {
            const prog = checklistProgress.find(p => p.traineeId === trainee.id && p.itemId === item.id);
            const done = prog?.completed || false;
            return (
              <div key={item.id} className={`${styles.checkItem} ${done ? styles.checkItemDone : ''}`}>
                <span className={styles.checkIcon}>{done ? '✓' : '○'}</span>
                <span className={styles.checkLabel}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
