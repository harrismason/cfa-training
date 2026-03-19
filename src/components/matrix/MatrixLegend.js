import { STATUS, STATUS_LABELS } from '../../constants/theme';
import styles from './MatrixLegend.module.css';

const ITEMS = [
  { status: STATUS.NOT_STARTED, icon: '○' },
  { status: STATUS.IN_PROGRESS, icon: '◐' },
  { status: STATUS.TRAINED, icon: '●' },
];

export default function MatrixLegend() {
  return (
    <div className={styles.legend}>
      <span className={styles.label}>Legend:</span>
      {ITEMS.map(({ status, icon }) => (
        <span key={status} className={`${styles.item} ${styles[status]}`}>
          {icon} {STATUS_LABELS[status]}
        </span>
      ))}
      <span className={styles.hint}>Click a cell to cycle status</span>
    </div>
  );
}
