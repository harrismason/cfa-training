import { useState } from 'react';
import { STATUS, STATUS_CYCLE, STATUS_LABELS } from '../../constants/theme';
import styles from './MatrixCell.module.css';

export default function MatrixCell({ trainee, position, record, onStatusChange }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = record?.status || STATUS.NOT_STARTED;

  function handleClick() {
    const nextStatus = STATUS_CYCLE[status];
    onStatusChange(trainee.id, position.id, nextStatus, record);
  }

  return (
    <td
      className={`${styles.cell} ${styles[status]}`}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={`${trainee.name} — ${position.name}: ${STATUS_LABELS[status]}`}
    >
      <div className={styles.indicator}>
        {status === STATUS.NOT_STARTED && <span className={styles.iconEmpty}>○</span>}
        {status === STATUS.IN_PROGRESS && <span className={styles.iconProgress}>◐</span>}
        {status === STATUS.TRAINED && <span className={styles.iconTrained}>✓</span>}
      </div>
      {showTooltip && record?.trainedDate && (
        <div className={styles.tooltip}>
          {new Date(record.trainedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </td>
  );
}
