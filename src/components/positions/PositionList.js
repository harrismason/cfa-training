import PositionCard from './PositionCard';
import EmptyState from '../shared/EmptyState';
import styles from '../trainees/TraineeList.module.css';

export default function PositionList({ positions, onEdit, onDelete, onAdd }) {
  if (!positions.length) {
    return (
      <EmptyState
        icon="📍"
        message="No positions yet. Add training stations to get started."
        actionLabel="Add Position"
        onAction={onAdd}
      />
    );
  }
  return (
    <div className={styles.list}>
      {positions.map((p) => (
        <PositionCard key={p.id} position={p} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
