import Button from '../shared/Button';
import styles from './PositionCard.module.css';

const CATEGORY_COLORS = {
  FOH: { bg: '#E3F2FD', color: '#1565C0' },
  'Drive Thru': { bg: '#E8F5E9', color: '#2E7D32' },
  Other: { bg: '#F3E5F5', color: '#6A1B9A' },
};

export default function PositionCard({ position, onEdit, onDelete }) {
  const colors = CATEGORY_COLORS[position.category] || CATEGORY_COLORS.Other;
  const requiredShifts = position.requiredShifts ?? 3;
  return (
    <div className={styles.card}>
      <div className={styles.info}>
        <div className={styles.header}>
          <span className={styles.name}>{position.name}</span>
          <span
            className={styles.category}
            style={{ backgroundColor: colors.bg, color: colors.color }}
          >
            {position.category}
          </span>
          <span className={styles.shifts}>{requiredShifts} shift{requiredShifts !== 1 ? 's' : ''} required</span>
          {position.recertifyAfterMonths != null && (
            <span className={styles.recert}>↻ Recert every {position.recertifyAfterMonths}mo</span>
          )}
        </div>
        {position.description && (
          <p className={styles.description}>{position.description}</p>
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => onEdit(position)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(position)}>Delete</Button>
      </div>
    </div>
  );
}
