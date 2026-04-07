import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import PageContainer from '../components/layout/PageContainer';
import { STATUS } from '../constants/theme';
import styles from './TrainersPage.module.css';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function TrainersPage() {
  const { trainees, positions, records, shifts, deriveStatus } = useAppContext();

  const trainerStats = useMemo(() => {
    const trainers = trainees.filter(t => t.role === 'Trainer' || t.role === 'Team Lead');
    return trainers.map(trainer => {
      const trainerShifts = shifts.filter(s => s.trainerId === trainer.id && s.completedDate);
      const uniqueTraineeIds = [...new Set(trainerShifts.map(s => s.traineeId))];
      const uniqueTrainees = uniqueTraineeIds.map(id => trainees.find(t => t.id === id)).filter(Boolean);
      const ratedShifts = trainerShifts.filter(s => s.rating != null);
      const avgRating = ratedShifts.length > 0
        ? (ratedShifts.reduce((sum, s) => sum + s.rating, 0) / ratedShifts.length).toFixed(1)
        : null;
      const activeAssignments = uniqueTraineeIds.flatMap(tid => {
        return positions.map(p => {
          const hasShift = trainerShifts.some(s => s.traineeId === tid && s.positionId === p.id);
          if (!hasShift) return null;
          const record = records.find(r => r.traineeId === tid && r.positionId === p.id);
          const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
          const status = deriveStatus(tid, p.id, required);
          if (status === STATUS.TRAINED || status === STATUS.NEEDS_RECERT) return null;
          const trainee = trainees.find(t => t.id === tid);
          return { trainee, position: p, status };
        }).filter(Boolean);
      });
      return { trainer, shiftCount: trainerShifts.length, uniqueTrainees, avgRating, activeAssignments };
    }).sort((a, b) => b.shiftCount - a.shiftCount);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainees, positions, records, shifts, deriveStatus]);

  const hasTrainers = trainerStats.length > 0;

  return (
    <PageContainer>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Trainer Workload</h1>
        <p className={styles.subtitle}>{trainerStats.length} trainer{trainerStats.length !== 1 ? 's' : ''} · Trainers and Team Leads only</p>
      </div>

      {!hasTrainers ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>👤</div>
          <p>No Trainers or Team Leads found. Set a team member's role to Trainer or Team Lead to see their workload here.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {trainerStats.map(({ trainer, shiftCount, uniqueTrainees, avgRating, activeAssignments }) => (
            <div key={trainer.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>{getInitials(trainer.name)}</div>
                <div className={styles.cardInfo}>
                  <div className={styles.name}>{trainer.name}</div>
                  <span className={styles.role}>{trainer.role}</span>
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statNum}>{shiftCount}</span>
                    <span className={styles.statLabel}>shifts</span>
                  </div>
                  {avgRating && (
                    <div className={styles.stat}>
                      <span className={styles.statNum}>{avgRating}★</span>
                      <span className={styles.statLabel}>avg rating</span>
                    </div>
                  )}
                </div>
              </div>

              {uniqueTrainees.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Trainees Worked With ({uniqueTrainees.length})</div>
                  <div className={styles.tagList}>
                    {uniqueTrainees.map(t => (
                      <span key={t.id} className={styles.tag}>{t.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {activeAssignments.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionLabel}>Active In-Progress ({activeAssignments.length})</div>
                  <ul className={styles.assignList}>
                    {activeAssignments.map(({ trainee, position }) => (
                      <li key={`${trainee.id}-${position.id}`} className={styles.assignItem}>
                        <span className={styles.assignName}>{trainee.name}</span>
                        <span className={styles.assignPos}>{position.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {shiftCount === 0 && (
                <p className={styles.noActivity}>No training shifts logged yet.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
