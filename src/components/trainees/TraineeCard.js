import Button from '../shared/Button';
import styles from './TraineeCard.module.css';

function getInitials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TraineeCard({ trainee, onEdit, onDelete }) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>{getInitials(trainee.name)}</div>
      <div className={styles.info}>
        <div className={styles.name}>{trainee.name}</div>
        <div className={styles.meta}>
          <span className={styles.role}>{trainee.role}</span>
          {trainee.startDate && (
            <span className={styles.date}>Started {formatDate(trainee.startDate)}</span>
          )}
        </div>
        {trainee.notes && <div className={styles.notes}>{trainee.notes}</div>}
      </div>
      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={() => onEdit(trainee)}>Edit</Button>
        <Button variant="danger" size="sm" onClick={() => onDelete(trainee)}>Delete</Button>
      </div>
    </div>
  );
}
