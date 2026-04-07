import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import styles from './CheckInPage.module.css';

export default function CheckInPage() {
  const [searchParams] = useSearchParams();
  const prefilledTraineeId = searchParams.get('traineeId') || '';

  const { trainees, positions, addCompletedShift } = useAppContext();

  const [traineeId, setTraineeId] = useState(prefilledTraineeId);
  const [positionId, setPositionId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState('training');
  const [trainerName, setTrainerName] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const selectedTrainee = trainees.find(t => t.id === traineeId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!traineeId) { setError('Please select a team member.'); return; }
    if (!positionId) { setError('Please select a position.'); return; }
    if (!date) { setError('Please enter a date.'); return; }
    setError('');
    addCompletedShift(traineeId, positionId, date, shiftType, trainerName || null, notes);
    setSuccess(true);
  }

  function handleAnother() {
    setPositionId('');
    setDate(new Date().toISOString().split('T')[0]);
    setShiftType('training');
    setTrainerName('');
    setNotes('');
    setSuccess(false);
    setError('');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>CFA</div>
          <h1 className={styles.title}>Training Check-In</h1>
          <p className={styles.subtitle}>Log a completed training or practice shift</p>
        </div>

        {success ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Shift Logged!</div>
            <p className={styles.successMsg}>
              <strong>{shiftType === 'training' ? 'Training' : 'Practice'}</strong> shift recorded for{' '}
              <strong>{selectedTrainee?.name}</strong> on <strong>{date}</strong>.
            </p>
            <div className={styles.successActions}>
              <button className={styles.primaryBtn} onClick={handleAnother}>
                Log Another Shift
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Team Member */}
            <div className={styles.field}>
              <label className={styles.label}>Team Member *</label>
              <select
                className={styles.select}
                value={traineeId}
                onChange={e => setTraineeId(e.target.value)}
                required
              >
                <option value="">Select team member…</option>
                {trainees.map(t => (
                  <option key={t.id} value={t.id}>{t.name} — {t.role}</option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div className={styles.field}>
              <label className={styles.label}>Position *</label>
              <select
                className={styles.select}
                value={positionId}
                onChange={e => setPositionId(e.target.value)}
                required
              >
                <option value="">Select position…</option>
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className={styles.field}>
              <label className={styles.label}>Date *</label>
              <input
                type="date"
                className={styles.input}
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            {/* Shift Type */}
            <div className={styles.field}>
              <label className={styles.label}>Shift Type</label>
              <div className={styles.radioGroup}>
                <label className={`${styles.radioLabel} ${shiftType === 'training' ? styles.radioActive : ''}`}>
                  <input
                    type="radio"
                    name="shiftType"
                    value="training"
                    checked={shiftType === 'training'}
                    onChange={() => setShiftType('training')}
                  />
                  <span>🎓 Training</span>
                  <small className={styles.radioHint}>Counts toward certification</small>
                </label>
                <label className={`${styles.radioLabel} ${shiftType === 'practice' ? styles.radioActive : ''}`}>
                  <input
                    type="radio"
                    name="shiftType"
                    value="practice"
                    checked={shiftType === 'practice'}
                    onChange={() => setShiftType('practice')}
                  />
                  <span>🔁 Practice</span>
                  <small className={styles.radioHint}>Extra reps, not counted</small>
                </label>
              </div>
            </div>

            {/* Trainer Name */}
            <div className={styles.field}>
              <label className={styles.label}>Trainer Name (optional)</label>
              <input
                type="text"
                className={styles.input}
                value={trainerName}
                onChange={e => setTrainerName(e.target.value)}
                placeholder="Who trained them?"
              />
            </div>

            {/* Notes */}
            <div className={styles.field}>
              <label className={styles.label}>Notes (optional)</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any comments about this shift..."
                rows={3}
              />
            </div>

            {error && <div className={styles.errorMsg}>{error}</div>}

            <button type="submit" className={styles.primaryBtn}>
              ✓ Log Shift
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
