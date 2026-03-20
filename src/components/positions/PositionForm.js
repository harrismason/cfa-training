import { useState } from 'react';
import { CATEGORIES } from '../../constants/theme';
import Button from '../shared/Button';
import styles from '../trainees/TraineeForm.module.css';
import posStyles from './PositionForm.module.css';

const EMPTY = { name: '', category: 'FOH', description: '', requiredShifts: 3, recertifyAfterMonths: null, competencies: [] };

export default function PositionForm({ initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value, type } = e.target;
    setValues((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Position name is required';
    if (!values.requiredShifts || values.requiredShifts < 1) errs.requiredShifts = 'Must be at least 1';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      ...values,
      requiredShifts: Number(values.requiredShifts),
      recertifyAfterMonths: values.recertifyAfterMonths != null ? Number(values.recertifyAfterMonths) : null,
      competencies: (values.competencies || []).filter(c => c.label.trim()),
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="pos-name">Position Name *</label>
        <input
          id="pos-name"
          name="name"
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          value={values.name}
          onChange={handleChange}
          placeholder="e.g. Front Counter"
          autoFocus
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pos-category">Category</label>
          <select id="pos-category" name="category" className={styles.input} value={values.category} onChange={handleChange}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pos-shifts">Required Practice Shifts</label>
          <input
            id="pos-shifts"
            name="requiredShifts"
            type="number"
            min="1"
            max="20"
            className={`${styles.input} ${errors.requiredShifts ? styles.inputError : ''}`}
            value={values.requiredShifts}
            onChange={handleChange}
          />
          {errors.requiredShifts && <span className={styles.error}>{errors.requiredShifts}</span>}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={values.recertifyAfterMonths != null}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, recertifyAfterMonths: e.target.checked ? 6 : null }))
            }
          />
          Requires recertification
        </label>
        {values.recertifyAfterMonths != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
            <input
              name="recertifyAfterMonths"
              type="number"
              min="1"
              max="60"
              className={styles.input}
              style={{ width: '80px' }}
              value={values.recertifyAfterMonths}
              onChange={handleChange}
            />
            <span className={styles.label} style={{ fontWeight: 400, marginBottom: 0 }}>months after training</span>
          </div>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pos-desc">Description</label>
        <textarea
          id="pos-desc"
          name="description"
          className={styles.textarea}
          value={values.description}
          onChange={handleChange}
          placeholder="Optional description of this position..."
          rows={3}
        />
      </div>

      {/* Competencies */}
      <div className={posStyles.competenciesSection}>
        <label className={styles.label}>Competencies</label>
        <p className={posStyles.hint}>Skills to check off during training (optional)</p>
        {values.competencies?.map((comp, i) => (
          <div key={comp.id} className={posStyles.compRow}>
            <input
              className={posStyles.compInput}
              value={comp.label}
              onChange={e => setValues(prev => ({
                ...prev,
                competencies: prev.competencies.map((c, j) => j === i ? { ...c, label: e.target.value } : c)
              }))}
              placeholder={`Skill ${i + 1}`}
            />
            <button type="button" className={posStyles.compRemove}
              onClick={() => setValues(prev => ({ ...prev, competencies: prev.competencies.filter((_, j) => j !== i) }))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className={posStyles.addCompBtn}
          onClick={() => setValues(prev => ({ ...prev, competencies: [...(prev.competencies || []), { id: crypto.randomUUID(), label: '' }] }))}>
          + Add Competency
        </button>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {initialValues.id ? 'Save Changes' : 'Add Position'}
        </Button>
      </div>
    </form>
  );
}
