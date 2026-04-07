import { useState, useRef } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import styles from './CsvImportModal.module.css';

const VALID_ROLES = ['Team Member', 'Trainer', 'Team Lead'];

function parseCsv(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const cols = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    cols.forEach((col, i) => { obj[col] = vals[i] ?? ''; });
    return {
      name: obj['name'] || '',
      role: VALID_ROLES.includes(obj['role']) ? obj['role'] : 'Team Member',
      startDate: obj['start date'] || obj['startdate'] || '',
      notes: obj['notes'] || '',
    };
  }).filter(r => r.name.trim());
}

export default function CsvImportModal({ isOpen, onClose, onImport }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target.result);
      if (parsed.length === 0) {
        setError('No valid rows found. Make sure the file has a Name column and at least one data row.');
        setRows([]);
      } else {
        setError('');
        setRows(parsed);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleConfirm() {
    onImport(rows);
    setRows([]);
    setError('');
    onClose();
  }

  function handleClose() {
    setRows([]);
    setError('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Trainees from CSV">
      <div className={styles.container}>
        <p className={styles.hint}>
          CSV columns: <code>Name</code> (required), <code>Role</code>, <code>Start Date</code>, <code>Notes</code>
        </p>
        <button className={styles.fileBtn} onClick={() => fileRef.current?.click()}>
          📄 Choose CSV File
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{display:'none'}} onChange={handleFile} />
        {error && <p className={styles.error}>{error}</p>}
        {rows.length > 0 && (
          <>
            <p className={styles.previewLabel}>{rows.length} trainee{rows.length !== 1 ? 's' : ''} ready to import:</p>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Name</th><th>Role</th><th>Start Date</th><th>Notes</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.name}</td>
                      <td>{r.role}</td>
                      <td>{r.startDate || '—'}</td>
                      <td>{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" size="sm" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" onClick={handleConfirm}>Import {rows.length} Trainee{rows.length !== 1 ? 's' : ''}</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
