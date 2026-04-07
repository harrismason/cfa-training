import { useRef, useState } from 'react';
import { ROLES, ROLE_COLORS } from '../../constants/theme';
import Button from '../shared/Button';
import styles from './TraineeForm.module.css';

const EMPTY = { name: '', startDate: '', role: 'Team Member', notes: '', photoUrl: null };

function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const SIZE = 80;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        // Crop to square from center
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, SIZE, SIZE);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function TraineeForm({ initialValues = {}, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY, ...initialValues });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setValues((prev) => ({ ...prev, photoUrl: compressed }));
  }

  function handleRemovePhoto() {
    setValues((prev) => ({ ...prev, photoUrl: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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

  const roleColor = ROLE_COLORS[values.role] || ROLE_COLORS['Team Member'];
  const initials = values.name
    ? values.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Photo upload */}
      <div className={styles.photoSection}>
        <div
          className={styles.photoCircle}
          style={{ backgroundColor: roleColor.avatar }}
          onClick={() => fileInputRef.current?.click()}
          title="Click to upload photo"
        >
          {values.photoUrl
            ? <img src={values.photoUrl} alt="preview" className={styles.photoImg} />
            : <span className={styles.photoInitials}>{initials}</span>
          }
          <div className={styles.photoOverlay}>📷</div>
        </div>
        <div className={styles.photoMeta}>
          <button type="button" className={styles.photoBtn} onClick={() => fileInputRef.current?.click()}>
            Upload Photo
          </button>
          {values.photoUrl && (
            <button type="button" className={styles.removeBtn} onClick={handleRemovePhoto}>
              Remove
            </button>
          )}
          <span className={styles.photoHint}>80×80px, JPEG compressed</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
      </div>

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
