import { STATUS_LABELS } from '../../constants/theme';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
