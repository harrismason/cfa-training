import Modal from '../shared/Modal';
import styles from './TraineeReport.module.css';
import { useAppContext } from '../../context/AppContext';
import { STATUS_LABELS } from '../../constants/theme';

export default function TraineeReport({ isOpen, onClose, trainee }) {
  const { positions, shifts, recordMap, deriveStatus, trainees } = useAppContext();

  if (!trainee) return null;

  // Timeline: all completed shifts for this trainee, newest first
  const timeline = shifts
    .filter((s) => s.traineeId === trainee.id && s.completedDate)
    .map((s) => {
      const pos = positions.find((p) => p.id === s.positionId);
      const trainer = trainees.find((t) => t.id === s.trainerId);
      return {
        ...s,
        positionName: pos?.name ?? '—',
        trainerName: trainer?.name ?? null,
      };
    })
    .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate));

  // Per-position status rows
  const positionRows = positions.map((p) => {
    const record = recordMap.get(`${trainee.id}::${p.id}`);
    const required = record?.requiredShifts ?? p.requiredShifts ?? 3;
    const completed = shifts.filter(
      (s) => s.traineeId === trainee.id && s.positionId === p.id && s.completedDate
    ).length;
    const status = deriveStatus(trainee.id, p.id, required);
    return { position: p, status, completed, required, targetDate: record?.targetDate ?? null };
  });

  const trainedCount = positionRows.filter((r) => r.status === 'trained' || r.status === 'needs_recert').length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Training Report — ${trainee.name}`}>
      <div className={styles.container}>
        <div className={`${styles.topBar} noPrint`}>
          <div className={styles.summary}>
            <span className={styles.summaryRole}>{trainee.role}</span>
            <span className={styles.summarySep}>·</span>
            <span className={styles.summaryProgress}>{trainedCount} / {positions.length} positions trained</span>
            {trainee.startDate && (
              <>
                <span className={styles.summarySep}>·</span>
                <span className={styles.summaryDate}>
                  Started {new Date(trainee.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </>
            )}
          </div>
          <button className={styles.printBtn} onClick={() => window.print()}>🖨️ Print</button>
        </div>

        {/* Timeline */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Training Timeline</h3>
          {timeline.length === 0 ? (
            <p className={styles.empty}>No completed shifts yet.</p>
          ) : (
            <ul className={styles.timeline}>
              {timeline.map((s) => (
                <li key={s.id} className={styles.timelineItem}>
                  <span className={styles.timelineDate}>{s.completedDate}</span>
                  <span className={styles.timelinePos}>{s.positionName}</span>
                  {s.trainerName && (
                    <span className={styles.timelineTrainer}>with {s.trainerName}</span>
                  )}
                  {s.rating != null && (
                    <span className={styles.timelineRating}>
                      {'★'.repeat(s.rating)}{'☆'.repeat(5 - s.rating)}
                    </span>
                  )}
                  {s.notes && <span className={styles.timelineNotes}>{s.notes}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Position status table */}
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Position Status</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Position</th>
                <th>Category</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Target Date</th>
              </tr>
            </thead>
            <tbody>
              {positionRows.map(({ position, status, completed, required, targetDate }) => (
                <tr key={position.id} className={`${styles.row} ${styles[`row_${status}`]}`}>
                  <td>{position.name}</td>
                  <td>{position.category}</td>
                  <td>{STATUS_LABELS[status] ?? status}</td>
                  <td>{completed}/{required}</td>
                  <td>{targetDate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </Modal>
  );
}
