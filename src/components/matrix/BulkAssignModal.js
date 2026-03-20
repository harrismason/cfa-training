import { useState } from 'react';
import styles from './BulkAssignModal.module.css';

const TAGS = [
  { val: 'needs_training', label: 'Needs Training' },
  { val: 'practice_only', label: 'Practice Only' },
];

export default function BulkAssignModal({ isOpen, onClose, trainees, positions, onBulkAssign }) {
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedTag, setSelectedTag] = useState('needs_training');
  const [checkedIds, setCheckedIds] = useState([]);

  if (!isOpen) return null;

  function toggle(id) {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (checkedIds.length === trainees.length) {
      setCheckedIds([]);
    } else {
      setCheckedIds(trainees.map((t) => t.id));
    }
  }

  function handleConfirm() {
    if (!selectedPosition || checkedIds.length === 0) return;
    onBulkAssign(selectedPosition, selectedTag, checkedIds);
    onClose();
    setCheckedIds([]);
    setSelectedPosition('');
  }

  function handleClose() {
    onClose();
    setCheckedIds([]);
    setSelectedPosition('');
  }

  const allChecked = checkedIds.length === trainees.length && trainees.length > 0;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2 className={styles.title}>Bulk Assign Training</h2>
          <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">✕</button>
        </div>

        <div className={styles.body}>
          {/* Position selector */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Position</label>
            <select
              className={styles.select}
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
            >
              <option value="">Select a position...</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>

          {/* Tag selector */}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Assign as</label>
            <div className={styles.tagRow}>
              {TAGS.map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  className={`${styles.tagBtn} ${selectedTag === val ? styles.tagBtnActive : ''} ${styles[`tag_${val}`]}`}
                  onClick={() => setSelectedTag(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Trainee checklist */}
          <div className={styles.field}>
            <div className={styles.traineeHeader}>
              <label className={styles.fieldLabel}>
                Trainees{checkedIds.length > 0 ? ` (${checkedIds.length} selected)` : ''}
              </label>
              <button
                type="button"
                className={styles.selectAllBtn}
                onClick={toggleAll}
              >
                {allChecked ? 'Deselect all' : 'Select all'}
              </button>
            </div>
            <ul className={styles.traineeList}>
              {trainees.map((t) => {
                const checked = checkedIds.includes(t.id);
                return (
                  <li
                    key={t.id}
                    className={`${styles.traineeItem} ${checked ? styles.traineeChecked : ''}`}
                    onClick={() => toggle(t.id)}
                  >
                    <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                      {checked ? '✓' : ''}
                    </span>
                    <span className={styles.traineeName}>{t.name}</span>
                    <span className={styles.traineeRole}>{t.role}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedPosition || checkedIds.length === 0}
          >
            Assign{checkedIds.length > 0 ? ` (${checkedIds.length})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
