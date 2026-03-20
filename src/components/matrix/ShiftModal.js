import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { STATUS, STATUS_LABELS } from '../../constants/theme';
import styles from './ShiftModal.module.css';

function deriveStatusLocal(completedShiftsArr, requiredShifts, position) {
  const count = completedShiftsArr.length;
  if (count === 0) return STATUS.NOT_STARTED;
  if (count < requiredShifts) return STATUS.IN_PROGRESS;

  const recertMonths = position?.recertifyAfterMonths ?? null;
  if (recertMonths != null) {
    const sorted = [...completedShiftsArr].sort(
      (a, b) => new Date(a.completedDate + 'T00:00:00') - new Date(b.completedDate + 'T00:00:00')
    );
    const nth = sorted[requiredShifts - 1];
    if (nth?.completedDate) {
      const expiry = new Date(nth.completedDate + 'T00:00:00');
      expiry.setMonth(expiry.getMonth() + recertMonths);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (today > expiry) return STATUS.NEEDS_RECERT;
    }
  }
  return STATUS.TRAINED;
}

function StarRating({ value, onChange }) {
  return (
    <div className={styles.starRating} role="group" aria-label="Shift rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.star} ${(value ?? 0) >= star ? styles.starFilled : styles.starEmpty}`}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function TagSelector({ value, onChange }) {
  const opts = [
    { val: null, label: 'None' },
    { val: 'needs_training', label: 'Needs Training' },
    { val: 'practice_only', label: 'Practice Only' },
  ];
  return (
    <div className={styles.tagSelector} role="group" aria-label="Training tag">
      {opts.map((o) => (
        <button
          key={String(o.val)}
          type="button"
          className={`${styles.tagOption} ${value === o.val ? styles.tagOptionActive : ''} ${o.val ? styles[`tag_${o.val}`] : ''}`}
          onClick={() => onChange(o.val)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ShiftModal({ isOpen, onClose, trainee, position, record, shifts, onUpsertShift, onUpsertRecord, trainees }) {
  const posRequired = position?.requiredShifts ?? 3;
  const [localRequired, setLocalRequired] = useState(record?.requiredShifts ?? posRequired);
  const [localTargetDate, setLocalTargetDate] = useState(record?.targetDate ?? '');
  const [localTag, setLocalTag] = useState(record?.tag ?? null);

  useEffect(() => {
    if (isOpen) {
      setLocalRequired(record?.requiredShifts ?? posRequired);
      setLocalTargetDate(record?.targetDate ?? '');
      setLocalTag(record?.tag ?? null);
    }
  }, [isOpen, record, posRequired]);

  if (!trainee || !position) return null;

  const trainers = (trainees || []).filter(
    (t) => t.role === 'Trainer' || t.role === 'Team Lead'
  );

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

  function handleTrainerChange(shiftNumber, trainerId) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { trainerId: trainerId || null });
  }

  function handleRatingChange(shiftNumber, rating) {
    const existing = getShift(shiftNumber);
    const newRating = existing?.rating === rating ? null : rating;
    onUpsertShift(trainee.id, position.id, shiftNumber, { rating: newRating });
  }

  function handleRequiredChange(e) {
    const val = Math.max(1, Number(e.target.value));
    setLocalRequired(val);
    onUpsertRecord(trainee.id, position.id, { requiredShifts: val });
  }

  function handleTargetDateChange(e) {
    const val = e.target.value || null;
    setLocalTargetDate(e.target.value);
    onUpsertRecord(trainee.id, position.id, { targetDate: val });
  }

  function handleTagChange(newTag) {
    setLocalTag(newTag);
    onUpsertRecord(trainee.id, position.id, { tag: newTag });
  }

  const completedShifts = shifts.filter((s) => s.completedDate);
  const completedCount = completedShifts.length;
  const status = deriveStatusLocal(completedShifts, localRequired, position);

  const statusColorClass = {
    [STATUS.NOT_STARTED]: styles.statusNotStarted,
    [STATUS.IN_PROGRESS]: styles.statusInProgress,
    [STATUS.TRAINED]: styles.statusTrained,
    [STATUS.NEEDS_RECERT]: styles.statusNeedsRecert,
  }[status];

  const ratedShifts = shifts.filter((s) => s.rating != null);
  const avgRating = ratedShifts.length > 0
    ? (ratedShifts.reduce((sum, s) => sum + s.rating, 0) / ratedShifts.length).toFixed(1)
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${trainee.name} — ${position.name}`}
    >
      <div className={styles.container}>
        {/* Required shifts + target date row */}
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

        {/* Target date + tag row */}
        <div className={styles.metaRow}>
          <div className={styles.metaField}>
            <label className={styles.metaLabel} htmlFor="target-date">Target date:</label>
            <input
              id="target-date"
              type="date"
              className={styles.targetDateInput}
              value={localTargetDate}
              onChange={handleTargetDateChange}
            />
          </div>
          <div className={styles.metaField}>
            <label className={styles.metaLabel}>Tag:</label>
            <TagSelector value={localTag} onChange={handleTagChange} />
          </div>
        </div>

        {/* Competencies */}
        {position?.competencies?.length > 0 && (
          <div className={styles.competencies}>
            <div className={styles.competenciesHeader}>
              <span className={styles.competenciesLabel}>Competencies</span>
              <span className={styles.competenciesCount}>
                {(record?.checkedCompetencies ?? []).length}/{position.competencies.length} signed off
              </span>
            </div>
            <ul className={styles.compList}>
              {position.competencies.map(comp => {
                const checked = (record?.checkedCompetencies ?? []).includes(comp.id);
                return (
                  <li key={comp.id} className={`${styles.compItem} ${checked ? styles.compChecked : ''}`}
                    onClick={() => {
                      const current = record?.checkedCompetencies ?? [];
                      const updated = checked
                        ? current.filter(id => id !== comp.id)
                        : [...current, comp.id];
                      onUpsertRecord(trainee.id, position.id, { checkedCompetencies: updated });
                    }}>
                    <span className={`${styles.compCheckbox} ${checked ? styles.compCheckboxChecked : ''}`}>{checked ? '✓' : ''}</span>
                    <span>{comp.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Shift list */}
        <div className={styles.shiftList}>
          {Array.from({ length: localRequired }, (_, i) => i + 1).map((num) => {
            const shift = getShift(num);
            const done = !!shift?.completedDate;
            return (
              <div key={num} className={`${styles.shiftRow} ${done ? styles.shiftDone : ''}`}>
                <div className={styles.shiftRowMain}>
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
                <div className={styles.shiftRowExtras}>
                  {trainers.length > 0 && (
                    <select
                      className={styles.trainerSelect}
                      value={shift?.trainerId || ''}
                      onChange={(e) => handleTrainerChange(num, e.target.value)}
                    >
                      <option value="">Trainer...</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                  <StarRating
                    value={shift?.rating ?? 0}
                    onChange={(r) => handleRatingChange(num, r)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className={`${styles.statusFooter} ${statusColorClass}`}>
          {completedCount} of {localRequired} shifts complete
          <span className={styles.statusLabel}> — {STATUS_LABELS[status]}</span>
          {avgRating != null && (
            <span className={styles.avgRating}> · Avg {avgRating} ★</span>
          )}
        </div>
      </div>
    </Modal>
  );
}
