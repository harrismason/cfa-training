import TraineeCard from './TraineeCard';
import EmptyState from '../shared/EmptyState';
import styles from './TraineeList.module.css';

export default function TraineeList({ trainees, onEdit, onDelete, onAdd, onReport }) {
  if (!trainees.length) {
    return (
      <EmptyState
        icon="👤"
        message="No trainees yet. Add your first team member to get started."
        actionLabel="Add Trainee"
        onAction={onAdd}
      />
    );
  }
  return (
    <div className={styles.list}>
      {trainees.map((t) => (
        <TraineeCard key={t.id} trainee={t} onEdit={onEdit} onDelete={onDelete} onReport={onReport} />
      ))}
    </div>
  );
}
