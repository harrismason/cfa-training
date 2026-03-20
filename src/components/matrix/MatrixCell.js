import { STATUS, STATUS_LABELS } from '../../constants/theme';
import styles from './MatrixCell.module.css';

export default function MatrixCell({ trainee, position, completedCount, requiredShifts, status, onCellClick, tag, isOverdue }) {
  const allDone = status === STATUS.TRAINED;
  const needsRecert = status === STATUS.NEEDS_RECERT;

  return (
    <td
      className={`${styles.cell} ${styles[status]} ${isOverdue ? styles.overdue : ''}`}
      onClick={() => onCellClick(trainee, position)}
      title={`${trainee.name} — ${position.name}: ${completedCount}/${requiredShifts} shifts (${STATUS_LABELS[status]})`}
    >
      <div className={styles.indicator}>
        {allDone
          ? <span className={styles.iconTrained}>✓</span>
          : needsRecert
            ? <span className={styles.iconNeedsRecert}>↻</span>
            : <span className={styles.progress}>{completedCount}/{requiredShifts}</span>
        }
      </div>
      {tag && (
        <span
          className={`${styles.tagDot} ${styles[`tagDot_${tag}`]}`}
          title={tag === 'needs_training' ? 'Needs Training' : 'Practice Only'}
        />
      )}
    </td>
  );
}
