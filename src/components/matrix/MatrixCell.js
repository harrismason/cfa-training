import { STATUS, STATUS_LABELS } from '../../constants/theme';
import styles from './MatrixCell.module.css';

export default function MatrixCell({ trainee, position, completedCount, requiredShifts, status, onCellClick }) {
  const allDone = status === STATUS.TRAINED;

  return (
    <td
      className={`${styles.cell} ${styles[status]}`}
      onClick={() => onCellClick(trainee, position)}
      title={`${trainee.name} — ${position.name}: ${completedCount}/${requiredShifts} shifts (${STATUS_LABELS[status]})`}
    >
      <div className={styles.indicator}>
        {allDone
          ? <span className={styles.iconTrained}>✓</span>
          : <span className={styles.progress}>{completedCount}/{requiredShifts}</span>
        }
      </div>
    </td>
  );
}
