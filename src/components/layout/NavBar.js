import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ConfirmDialog from '../shared/ConfirmDialog';
import styles from './NavBar.module.css';

export default function NavBar() {
  const { undo, canUndo, exportData, importData } = useAppContext();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo]);

  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setPendingData(data);
        setConfirmRestore(true);
      } catch { alert('Invalid backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🐄</div>
        <span className={styles.brandName}>CFA Training Tracker</span>
      </div>
      <div className={styles.links}>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/matrix"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Training Matrix
        </NavLink>
        <NavLink
          to="/trainees"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Trainees
        </NavLink>
        <NavLink
          to="/trainers"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Trainers
        </NavLink>
        <NavLink
          to="/paths"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Paths
        </NavLink>
        <NavLink
          to="/positions"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Positions
        </NavLink>
      </div>
      <div className={styles.actions}>
        <button className={styles.navIconBtn} onClick={exportData} title="Backup data">💾</button>
        <button className={styles.navIconBtn} onClick={() => fileInputRef.current?.click()} title="Restore from backup">📂</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{display:'none'}} onChange={handleRestoreFile} />
        <button
          className={`${styles.undoBtn} ${!canUndo ? styles.undoBtnDisabled : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo last action (Ctrl+Z)"
        >
          ⟲ Undo
        </button>
      </div>
      <ConfirmDialog
        isOpen={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        onConfirm={() => { importData(pendingData); setConfirmRestore(false); }}
        title="Restore Backup"
        message="This will replace ALL current data with the backup. This cannot be undone (well, you can use Undo immediately after). Continue?"
      />
    </nav>
  );
}
