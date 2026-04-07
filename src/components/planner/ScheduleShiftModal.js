import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import styles from './ScheduleShiftModal.module.css';

const TODAY = new Date().toISOString().split('T')[0];

export default function ScheduleShiftModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = {},
  defaultDate = TODAY,
  trainees = [],
  positions = [],
  trainers = [],
}) {
  const [form, setForm] = useState({
    traineeId: '',
    positionId: '',
    scheduledDate: defaultDate,
    scheduledTime: '',
    trainerId: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      setForm({
        traineeId: initialValues.traineeId ?? '',
        positionId: initialValues.positionId ?? '',
        scheduledDate: initialValues.scheduledDate ?? defaultDate,
        scheduledTime: initialValues.scheduledTime ?? '',
        trainerId: initialValues.trainerId ?? '',
        notes: initialValues.notes ?? '',
      });
    }
  }, [isOpen, initialValues, defaultDate]);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.traineeId || !form.positionId || !form.scheduledDate) return;
    onSubmit({
      traineeId: form.traineeId,
      positionId: form.positionId,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime || null,
      trainerId: form.trainerId || null,
      notes: form.notes,
    });
    onClose();
  }

  const isEdit = !!initialValues.id;
  const sortedTrainees = [...trainees].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Planned Shift' : 'Schedule Training Shift'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Trainee *</label>
          <select
            className={styles.select}
            value={form.traineeId}
            onChange={e => set('traineeId', e.target.value)}
            required
          >
            <option value="">Select trainee…</option>
            {sortedTrainees.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Position *</label>
          <select
            className={styles.select}
            value={form.positionId}
            onChange={e => set('positionId', e.target.value)}
            required
          >
            <option value="">Select position…</option>
            {positions.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.category ? ` (${p.category})` : ''}</option>
            ))}
          </select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Date *</label>
            <input
              type="date"
              className={styles.input}
              value={form.scheduledDate}
              onChange={e => set('scheduledDate', e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Time <span className={styles.optional}>(optional)</span></label>
            <input
              type="time"
              className={styles.input}
              value={form.scheduledTime}
              onChange={e => set('scheduledTime', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Trainer <span className={styles.optional}>(optional)</span></label>
          <select
            className={styles.select}
            value={form.trainerId}
            onChange={e => set('trainerId', e.target.value)}
          >
            <option value="">No trainer assigned</option>
            {trainers.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notes <span className={styles.optional}>(optional)</span></label>
          <textarea
            className={styles.textarea}
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any prep notes or context…"
          />
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={!form.traineeId || !form.positionId || !form.scheduledDate}
          >
            {isEdit ? 'Save Changes' : 'Schedule Shift'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
