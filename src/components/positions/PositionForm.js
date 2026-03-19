import { useState } from 'react';
import { CATEGORIES } from '../../constants/theme';
import Button from '../shared/Button';
import styles from '../trainees/TraineeForm.module.css';

const EMPTY = { name: '', category: 'FOH', description: '' };

export default function PositionForm({ initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Position name is required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(values);
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pos-category">Category</label>
        <select id="pos-category" name="category" className={styles.input} value={values.category} onChange={handleChange}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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

      <div className={styles.actions}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {initialValues.id ? 'Save Changes' : 'Add Position'}
        </Button>
      </div>
    </form>
  );
}
