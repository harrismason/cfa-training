import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { STATUS, STATUS_LABELS } from '../../constants/theme';
import styles from './ShiftModal.module.css';

function deriveStatusLocal(completedCount, requiredShifts) {
  if (completedCount === 0) return STATUS.NOT_STARTED;
  if (completedCount >= requiredShifts) return STATUS.TRAINED;
  return STATUS.IN_PROGRESS;
}

export default function ShiftModal({ isOpen, onClose, trainee, position, record, shifts, onUpsertShift, onUpsertRecord }) {
  const posRequired = position?.requiredShifts ?? 3;
  // Per-trainee override stored in record.requiredShifts, fallback to position default
  const [localRequired, setLocalRequired] = useState(record?.requiredShifts ?? posRequired);

  // Reset when modal opens for a new trainee/position
  useEffect(() => {
    if (isOpen) {
      setLocalRequired(record?.requiredShifts ?? posRequired);
    }
  }, [isOpen, record, posRequired]);

  if (!trainee || !position) return null;

  function getShift(shiftNumber) {
    return shifts.find((s) => s.shiftNumber === shiftNumber) || null;
  }

  function handleToggle(shiftNumber) {
    const existing = getShift(shiftNumber);
    const alreadyDone = existing?.completedDate;
    onUpsertShift(trainee.id, position.id, shiftNumber, {
      completedDate: alreadyDone ? null : new Date().toISOString().split('T')[0],
    });
  }

  function handleDateChange(shiftNumber, date) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { completedDate: date || null });
  }

  function handleNotesChange(shiftNumber, notes) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { notes });
  }

  function handleRequiredChange(e) {
    const val = Math.max(1, Number(e.target.value));
    setLocalRequired(val);
    onUpsertRecord(trainee.id, position.id, { requiredShifts: val });
  }

  const completedCount = shifts.filter((s) => s.completedDate).length;
  const status = deriveStatusLocal(completedCount, localRequired);

  const statusColorClass = {
    [STATUS.NOT_STARTED]: styles.statusNotStarted,
    [STATUS.IN_PROGRESS]: styles.statusInProgress,
    [STATUS.TRAINED]: styles.statusTrained,
  }[status];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${trainee.name} — ${position.name}`}
    >
      <div className={styles.container}>
        <div className={styles.requiredRow}>
          <label className={styles.requiredLabel} htmlFor="shift-required">
            Required practice shifts:
          </label>
          <input
            id="shift-required"
            type="number"
            min="1"
            max="20"
            className={styles.requiredInput}
            value={localRequired}
            onChange={handleRequiredChange}
          />
        </div>

        <div className={styles.shiftList}>
          {Array.from({ length: localRequired }, (_, i) => i + 1).map((num) => {
            const shift = getShift(num);
            const done = !!shift?.completedDate;
            return (
              <div key={num} className={`${styles.shiftRow} ${done ? styles.shiftDone : ''}`}>
                <button
                  type="button"
                  className={`${styles.checkbox} ${done ? styles.checkboxChecked : ''}`}
                  onClick={() => handleToggle(num)}
                  aria-label={`Toggle shift ${num}`}
                >
                  {done ? '✓' : ''}
                </button>
                <span className={styles.shiftLabel}>Shift {num}</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={shift?.completedDate || ''}
                  onChange={(e) => handleDateChange(num, e.target.value)}
                  placeholder="Date"
                />
                <input
                  type="text"
                  className={styles.notesInput}
                  value={shift?.notes || ''}
                  onChange={(e) => handleNotesChange(num, e.target.value)}
                  placeholder="Notes from this session..."
                />
              </div>
            );
          })}
        </div>

        <div className={`${styles.statusFooter} ${statusColorClass}`}>
          {completedCount} of {localRequired} shifts complete
          <span className={styles.statusLabel}> — {STATUS_LABELS[status]}</span>
        </div>
      </div>
    </Modal>
  );
}
