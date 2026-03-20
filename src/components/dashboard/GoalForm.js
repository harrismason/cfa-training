import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import styles from './GoalForm.module.css';

const CATEGORIES = [null, 'FOH', 'Drive Thru', 'Other'];
const CAT_LABELS = { null: 'All Positions', 'FOH': 'FOH Only', 'Drive Thru': 'Drive Thru Only', 'Other': 'Other Only' };
const EMPTY = { title: '', targetDate: '', targetPct: 100, category: null };

export default function GoalForm({ isOpen, onClose, onSubmit, initialValues = {} }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });

  function handleChange(e) {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: name === 'targetPct' ? Number(value) : value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!values.title.trim() || !values.targetDate) return;
    onSubmit({ ...values, targetPct: Math.max(1, Math.min(100, values.targetPct)) });
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialValues.id ? 'Edit Goal' : 'Add Goal'}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>Goal Title *</label>
        <input className={styles.input} name="title" value={values.title} onChange={handleChange} placeholder="e.g. 100% FOH trained" required />

        <label className={styles.label}>Target Date *</label>
        <input className={styles.input} type="date" name="targetDate" value={values.targetDate} onChange={handleChange} required />

        <label className={styles.label}>Target Completion %</label>
        <input className={styles.input} type="number" name="targetPct" value={values.targetPct} onChange={handleChange} min="1" max="100" />

        <label className={styles.label}>Applies To</label>
        <div className={styles.catRow}>
          {CATEGORIES.map(cat => (
            <button key={String(cat)} type="button"
              className={`${styles.catBtn} ${values.category === cat ? styles.catBtnActive : ''}`}
              onClick={() => setValues(prev => ({ ...prev, category: cat }))}>
              {CAT_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">Save Goal</Button>
        </div>
      </form>
    </Modal>
  );
}
