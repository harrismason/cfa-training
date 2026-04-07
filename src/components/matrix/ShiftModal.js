import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { STATUS, STATUS_LABELS } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import styles from './ShiftModal.module.css';

function deriveStatusLocal(trainingShifts, requiredShifts, position) {
  const count = trainingShifts.length;
  if (count === 0) return STATUS.NOT_STARTED;
  if (count < requiredShifts) return STATUS.IN_PROGRESS;

  const recertMonths = position?.recertifyAfterMonths ?? null;
  if (recertMonths != null) {
    const sorted = [...trainingShifts].sort(
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
  const { addComment, deleteComment, getCommentsForRecord, preferences, currentUser } = useAppContext();
  const posRequired = position?.requiredShifts ?? 3;
  const posRequiredPractice = position?.requiredPracticeShifts ?? 0;
  const [localRequired, setLocalRequired] = useState(record?.requiredShifts ?? posRequired);
  const [localPracticeRequired, setLocalPracticeRequired] = useState(record?.requiredPracticeShifts ?? posRequiredPractice);
  const [editingRequired, setEditingRequired] = useState(false);
  const [editingPracticeRequired, setEditingPracticeRequired] = useState(false);
  const [localTargetDate, setLocalTargetDate] = useState(record?.targetDate ?? '');
  const [localTag, setLocalTag] = useState(record?.tag ?? null);
  const [shiftTab, setShiftTab] = useState('training');

  // Comments state
  const [commentText, setCommentText] = useState('');

  // Practice shift add form state
  const [practiceDate, setPracticeDate] = useState('');
  const [practiceNotes, setPracticeNotes] = useState('');
  const [practiceTrainer, setPracticeTrainer] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalRequired(record?.requiredShifts ?? posRequired);
      setLocalPracticeRequired(record?.requiredPracticeShifts ?? posRequiredPractice);
      setEditingRequired(false);
      setEditingPracticeRequired(false);
      setLocalTargetDate(record?.targetDate ?? '');
      setLocalTag(record?.tag ?? null);
      setShiftTab('training');
      setCommentText('');
      setPracticeDate('');
      setPracticeNotes('');
      setPracticeTrainer('');
    }
  // Only re-initialize when the modal opens — not on every record update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!trainee || !position) return null;

  const trainers = (trainees || []).filter(
    (t) => t.role === 'Trainer' || t.role === 'Team Lead'
  );

  // Separate training vs practice shifts
  const trainingShifts = shifts.filter((s) => s.completedDate && (s.shiftType === 'training' || !s.shiftType));
  const practiceShifts = shifts.filter((s) => s.shiftType === 'practice');

  function getTrainingShift(shiftNumber) {
    return shifts.find((s) => s.shiftNumber === shiftNumber && (s.shiftType === 'training' || !s.shiftType)) || null;
  }

  function handleToggle(shiftNumber) {
    const existing = getTrainingShift(shiftNumber);
    const alreadyDone = existing?.completedDate;
    onUpsertShift(trainee.id, position.id, shiftNumber, {
      completedDate: alreadyDone ? null : new Date().toISOString().split('T')[0],
      shiftType: 'training',
    });
  }

  function handleDateChange(shiftNumber, date) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { completedDate: date || null, shiftType: 'training' });
  }

  function handleNotesChange(shiftNumber, notes) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { notes, shiftType: 'training' });
  }

  function handleTrainerChange(shiftNumber, trainerId) {
    onUpsertShift(trainee.id, position.id, shiftNumber, { trainerId: trainerId || null, shiftType: 'training' });
  }

  function handleRatingChange(shiftNumber, rating) {
    const existing = getTrainingShift(shiftNumber);
    const newRating = existing?.rating === rating ? null : rating;
    onUpsertShift(trainee.id, position.id, shiftNumber, { rating: newRating, shiftType: 'training' });
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

  function handleAddPractice() {
    if (!practiceDate) return;
    // Use a unique negative-style shiftNumber for practice (null shiftNumber)
    const practiceId = crypto.randomUUID();
    onUpsertShift(trainee.id, position.id, null, {
      id: practiceId,
      completedDate: practiceDate,
      notes: practiceNotes,
      trainerId: practiceTrainer || null,
      shiftType: 'practice',
      shiftNumber: null,
    });
    setPracticeDate('');
    setPracticeNotes('');
    setPracticeTrainer('');
  }

  function handleDeletePractice(shift) {
    // Delete by setting completedDate to null and marking deleted
    onUpsertShift(trainee.id, position.id, shift.shiftNumber, {
      completedDate: null,
      shiftType: 'practice',
      _deleted: true,
    });
  }

  const status = deriveStatusLocal(trainingShifts, localRequired, position);

  const statusColorClass = {
    [STATUS.NOT_STARTED]: styles.statusNotStarted,
    [STATUS.IN_PROGRESS]: styles.statusInProgress,
    [STATUS.TRAINED]: styles.statusTrained,
    [STATUS.NEEDS_RECERT]: styles.statusNeedsRecert,
  }[status];

  const ratedShifts = trainingShifts.filter((s) => s.rating != null);
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
        {/* Required shifts — click-to-edit */}
        <div className={styles.editableCountRow}>
          <div className={styles.editableCountGroup}>
            <span className={styles.editableLabel}>Required training:</span>
            {editingRequired ? (
              <div className={styles.inlineEditWrap}>
                <input
                  type="number"
                  min="1"
                  max="20"
                  autoFocus
                  className={styles.inlineEditInput}
                  value={localRequired}
                  onChange={e => setLocalRequired(Math.max(1, Number(e.target.value) || 1))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setEditingRequired(false);
                      onUpsertRecord(trainee.id, position.id, { requiredShifts: localRequired });
                    }
                  }}
                  onBlur={() => {
                    setEditingRequired(false);
                    onUpsertRecord(trainee.id, position.id, { requiredShifts: localRequired });
                  }}
                />
                <button type="button" className={styles.confirmEditBtn} onMouseDown={() => {
                  setEditingRequired(false);
                  onUpsertRecord(trainee.id, position.id, { requiredShifts: localRequired });
                }}>✓</button>
              </div>
            ) : (
              <>
                <span className={styles.editableCount}>{localRequired}</span>
                <button type="button" className={styles.editPencilBtn} onClick={() => setEditingRequired(true)} title="Edit required training shifts">✎</button>
              </>
            )}
          </div>
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

        {/* Tab switcher: Training / Practice / Comments */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tab} ${shiftTab === 'training' ? styles.tabActive : ''}`}
            onClick={() => setShiftTab('training')}
          >
            Training Shifts
            <span className={styles.tabBadge}>{trainingShifts.length}/{localRequired}</span>
          </button>
          <button
            type="button"
            className={`${styles.tab} ${shiftTab === 'practice' ? styles.tabActive : ''} ${styles.tabPractice}`}
            onClick={() => setShiftTab('practice')}
          >
            Practice Shifts
            <span className={styles.tabBadge}>{practiceShifts.length}</span>
          </button>
          <button
            type="button"
            className={`${styles.tab} ${shiftTab === 'comments' ? styles.tabActive : ''} ${styles.tabComments}`}
            onClick={() => setShiftTab('comments')}
          >
            Notes
            {trainee && position && getCommentsForRecord(trainee.id, position.id).length > 0 && (
              <span className={styles.tabBadge}>{getCommentsForRecord(trainee.id, position.id).length}</span>
            )}
          </button>
        </div>

        {/* Training tab */}
        {shiftTab === 'training' && (
          <div className={styles.shiftList}>
            {Array.from({ length: localRequired }, (_, i) => i + 1).map((num) => {
              const shift = getTrainingShift(num);
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
        )}

        {/* Practice tab */}
        {shiftTab === 'practice' && (
          <div className={styles.practiceSection}>
            <p className={styles.practiceNote}>
              Practice sessions are tracked separately and do <strong>not</strong> count toward certification.
            </p>

            {/* Required practice sessions — click-to-edit */}
            <div className={styles.editableCountRow}>
              <div className={styles.editableCountGroup}>
                <span className={styles.editableLabel}>Required practice:</span>
                {editingPracticeRequired ? (
                  <div className={styles.inlineEditWrap}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      autoFocus
                      className={styles.inlineEditInput}
                      value={localPracticeRequired}
                      onChange={e => setLocalPracticeRequired(Math.max(0, Number(e.target.value) || 0))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          setEditingPracticeRequired(false);
                          onUpsertRecord(trainee.id, position.id, { requiredPracticeShifts: localPracticeRequired });
                        }
                      }}
                      onBlur={() => {
                        setEditingPracticeRequired(false);
                        onUpsertRecord(trainee.id, position.id, { requiredPracticeShifts: localPracticeRequired });
                      }}
                    />
                    <button type="button" className={styles.confirmEditBtn} onMouseDown={() => {
                      setEditingPracticeRequired(false);
                      onUpsertRecord(trainee.id, position.id, { requiredPracticeShifts: localPracticeRequired });
                    }}>✓</button>
                  </div>
                ) : (
                  <>
                    <span className={styles.editableCount}>{localPracticeRequired === 0 ? 'None' : localPracticeRequired}</span>
                    <button type="button" className={styles.editPencilBtn} onClick={() => setEditingPracticeRequired(true)} title="Edit required practice sessions">✎</button>
                  </>
                )}
              </div>
              {localPracticeRequired > 0 && (
                <span className={styles.practiceProgress}>
                  {practiceShifts.length} of {localPracticeRequired} complete
                </span>
              )}
            </div>

            {/* Add practice shift form */}
            <div className={styles.practiceAddRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={practiceDate}
                onChange={(e) => setPracticeDate(e.target.value)}
              />
              <input
                type="text"
                className={styles.notesInput}
                value={practiceNotes}
                onChange={(e) => setPracticeNotes(e.target.value)}
                placeholder="Notes..."
              />
              {trainers.length > 0 && (
                <select
                  className={styles.trainerSelect}
                  value={practiceTrainer}
                  onChange={(e) => setPracticeTrainer(e.target.value)}
                >
                  <option value="">Trainer...</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className={styles.addPracticeBtn}
                onClick={handleAddPractice}
                disabled={!practiceDate}
              >
                + Add
              </button>
            </div>

            {/* Practice shift list */}
            {practiceShifts.length === 0 ? (
              <p className={styles.emptyPractice}>No practice sessions recorded yet.</p>
            ) : (
              <div className={styles.shiftList}>
                {practiceShifts.map((shift, idx) => {
                  const trainerName = trainers.find(t => t.id === shift.trainerId)?.name;
                  return (
                    <div key={shift.id || idx} className={`${styles.shiftRow} ${styles.practiceRow}`}>
                      <div className={styles.shiftRowMain}>
                        <span className={styles.practiceDot}>●</span>
                        <span className={styles.shiftLabel}>Practice</span>
                        <span className={styles.dateInput} style={{ border: 'none', background: 'transparent', color: 'var(--color-text-muted)' }}>
                          {shift.completedDate}
                        </span>
                        {shift.notes && <span className={styles.notesInput} style={{ border: 'none', background: 'transparent' }}>{shift.notes}</span>}
                        {trainerName && <span className={styles.practiceTrainerLabel}>w/ {trainerName}</span>}
                        <button type="button" className={styles.deleteShiftBtn} onClick={() => handleDeletePractice(shift)}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Comments tab */}
        {shiftTab === 'comments' && (() => {
          const recordComments = getCommentsForRecord(trainee.id, position.id)
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const authorName = currentUser?.name || preferences?.managerName || 'Manager';

          function handleAddComment() {
            if (!commentText.trim()) return;
            addComment(trainee.id, position.id, commentText.trim(), authorName);
            setCommentText('');
          }

          function formatRelativeTime(isoStr) {
            const diff = Date.now() - new Date(isoStr).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 1) return 'just now';
            if (mins < 60) return `${mins}m ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs}h ago`;
            const days = Math.floor(hrs / 24);
            if (days < 7) return `${days}d ago`;
            return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }

          return (
            <div className={styles.commentsSection}>
              {recordComments.length === 0 ? (
                <p className={styles.emptyPractice}>No notes yet. Add a note below.</p>
              ) : (
                <ul className={styles.commentList}>
                  {recordComments.map(c => (
                    <li key={c.id} className={styles.commentItem}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>{c.author}</span>
                        <span className={styles.commentTime}>{formatRelativeTime(c.createdAt)}</span>
                        <button
                          type="button"
                          className={styles.deleteShiftBtn}
                          onClick={() => deleteComment(c.id)}
                          title="Delete note"
                        >✕</button>
                      </div>
                      <p className={styles.commentText}>{c.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              <div className={styles.commentAddRow}>
                <textarea
                  className={styles.commentTextarea}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a note or observation..."
                  rows={3}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddComment();
                  }}
                />
                <button
                  type="button"
                  className={styles.addPracticeBtn}
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  Add Note
                </button>
              </div>
            </div>
          );
        })()}

        <div className={`${styles.statusFooter} ${statusColorClass}`}>
          {trainingShifts.length} of {localRequired} training shifts complete
          <span className={styles.statusLabel}> — {STATUS_LABELS[status]}</span>
          {practiceShifts.length > 0 && (
            <span className={styles.practiceCount}> · {practiceShifts.length} practice</span>
          )}
          {avgRating != null && (
            <span className={styles.avgRating}> · Avg {avgRating} ★</span>
          )}
        </div>
      </div>
    </Modal>
  );
}
