import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import styles from './CompleteShiftDialog.module.css';

export default function CompleteShiftDialog({ isOpen, onClose, plannedShift, traineeName, positionName, onConfirm }) {
  const [completedDate, setCompletedDate] = useState('');

  useEffect(() => {
    if (isOpen && plannedShift) {
      setCompletedDate(plannedShift.scheduledDate ?? new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, plannedShift]);

  if (!plannedShift) return null;

  function handleConfirm() {
    if (!completedDate) return;
    onConfirm(plannedShift.id, completedDate);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Shift Complete">
      <div className={styles.body}>
        <div className={styles.info}>
          <span className={styles.checkIcon}>✓</span>
          <div>
            <div className={styles.trainee}>{traineeName}</div>
            <div className={styles.position}>{positionName}</div>
            {plannedShift.scheduledDate && (
              <div className={styles.scheduled}>Scheduled: {plannedShift.scheduledDate}</div>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Completed on</label>
          <input
            type="date"
            className={styles.input}
            value={completedDate}
            onChange={e => setCompletedDate(e.target.value)}
          />
        </div>

        <p className={styles.hint}>
          This will log a completed shift on the Training Matrix for {traineeName} → {positionName}.
        </p>
      </div>

      <div className={styles.footer}>
        <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="sm" onClick={handleConfirm} disabled={!completedDate}>
          Mark Complete
        </Button>
      </div>
    </Modal>
  );
}
