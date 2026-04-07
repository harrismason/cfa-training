import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import { useAppContext } from '../../context/AppContext';
import styles from './CopyTrainingPlanModal.module.css';

export default function CopyTrainingPlanModal({ sourceTrainee, isOpen, onClose }) {
  const { trainees, records, plannedShifts, copyTrainingPlan } = useAppContext();
  const [targetId, setTargetId] = useState('');
  const [done, setDone] = useState(false);

  if (!isOpen || !sourceTrainee) return null;

  const otherTrainees = trainees.filter(t => t.id !== sourceTrainee.id);
  const sourceRecords = records.filter(r => r.traineeId === sourceTrainee.id);
  const sourcePending = plannedShifts.filter(s => s.traineeId === sourceTrainee.id && !s.completedAt);

  function handleClose() {
    setDone(false);
    setTargetId('');
    onClose();
  }

  function handleCopy() {
    if (!targetId) return;
    copyTrainingPlan(sourceTrainee.id, targetId);
    setDone(true);
  }

  const targetName = trainees.find(t => t.id === targetId)?.name || '';

  return (
    <Modal title="Copy Training Plan" isOpen={true} onClose={handleClose}>
      {done ? (
        <div className={styles.success}>
          <div className={styles.successIcon}>✓</div>
          <div className={styles.successTitle}>Plan Copied!</div>
          <p className={styles.successMsg}>
            {sourceRecords.length} training records and {sourcePending.length} pending shifts copied to <strong>{targetName}</strong>.
          </p>
          <Button variant="primary" onClick={handleClose}>Done</Button>
        </div>
      ) : (
        <div className={styles.body}>
          <div className={styles.sourceInfo}>
            <span className={styles.label}>Copying from</span>
            <strong className={styles.sourceName}>{sourceTrainee.name}</strong>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statNum}>{sourceRecords.length}</span>
              <span className={styles.statLabel}>Training records</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNum}>{sourcePending.length}</span>
              <span className={styles.statLabel}>Pending shifts</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Copy to</label>
            <select
              className={styles.select}
              value={targetId}
              onChange={e => setTargetId(e.target.value)}
            >
              <option value="">Select a team member…</option>
              {otherTrainees.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
              ))}
            </select>
          </div>

          {targetId && (
            <div className={styles.preview}>
              This will copy {sourceRecords.length} records and {sourcePending.length} pending planned shifts to <strong>{targetName}</strong>. Completed shifts will not be copied.
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleCopy} disabled={!targetId}>
              Copy Plan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
