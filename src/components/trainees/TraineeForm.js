import { useState } from 'react';
import { ROLES } from '../../constants/theme';
import Button from '../shared/Button';
import styles from './TraineeForm.module.css';

const EMPTY = { name: '', startDate: '', role: 'Team Member', notes: '' };

export default function TraineeForm({ initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    onSubmit(values);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">Full Name *</label>
        <input
          id="name"
          name="name"
          className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
          value={values.name}
          onChange={handleChange}
          placeholder="e.g. Jane Smith"
          autoFocus
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="role">Role</label>
          <select id="role" name="role" className={styles.input} value={values.role} onChange={handleChange}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="startDate">Start Date</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            className={styles.input}
            value={values.startDate}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          className={styles.textarea}
          value={values.notes}
          onChange={handleChange}
          placeholder="Optional notes about this trainee..."
          rows={3}
        />
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" type="submit">
          {initialValues.id ? 'Save Changes' : 'Add Trainee'}
        </Button>
      </div>
    </form>
  );
}
