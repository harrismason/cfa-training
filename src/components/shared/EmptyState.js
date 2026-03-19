import Button from './Button';
import styles from './EmptyState.module.css';

export default function EmptyState({ icon = '📋', message, actionLabel, onAction }) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>{icon}</div>
      <p className={styles.message}>{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
