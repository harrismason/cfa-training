import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ConfirmDialog from '../shared/ConfirmDialog';
import { useState } from 'react';
import styles from './NavBar.module.css';

const NAV_LINKS = [
  { to: '/dashboard',  icon: '🏠', label: 'Dashboard'       },
  { to: '/analytics',  icon: '📊', label: 'Analytics'       },
  { to: '/matrix',     icon: '📋', label: 'Training Matrix' },
  { to: '/trainees',   icon: '👥', label: 'Trainees'        },
  { to: '/trainers',   icon: '🏅', label: 'Trainers'        },
  { to: '/paths',      icon: '🛤️',  label: 'Paths'           },
  { to: '/planner',    icon: '📅', label: 'Planner'         },
  { to: '/positions',  icon: '📍', label: 'Positions'       },
  { to: '/settings',   icon: '⚙️',  label: 'Settings'        },
];

export default function NavBar() {
  const { undo, canUndo, exportData, importData, firebaseConnected } = useAppContext();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const fileInputRef = useRef(null);

  // Global Ctrl/Cmd+Z listener
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
      {/* ── Brand ── */}
      <div className={styles.brand}>
        <div className={styles.brandLogoWrap}>
          <span className={styles.brandLogoLetter}>L</span>
        </div>
        <div className={styles.brandCompany}>Lucent Technologies</div>
        <div className={styles.brandProduct}>CFA Training Tracker</div>
      </div>

      {/* ── Nav links ── */}
      <div className={styles.links}>
        {NAV_LINKS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.linkActive : ''}`
            }
          >
            <span className={styles.linkIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>

      {/* ── Bottom actions ── */}
      <div className={styles.actions}>
        <button className={styles.navIconBtn} onClick={exportData} title="Backup data to JSON">
          <span>💾</span><span>Backup Data</span>
        </button>
        <button className={styles.navIconBtn} onClick={() => fileInputRef.current?.click()} title="Restore from backup">
          <span>📂</span><span>Restore</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleRestoreFile}
        />
        <div className={styles.navIconBtn} style={{ cursor: 'default', pointerEvents: 'none' }}>
          <span>☁️</span>
          <span>Cloud Sync</span>
          <div className={`${styles.syncDot} ${firebaseConnected ? styles.syncDotOn : styles.syncDotOff}`} />
        </div>
        <button
          className={`${styles.undoBtn} ${!canUndo ? styles.undoBtnDisabled : ''}`}
          onClick={undo}
          disabled={!canUndo}
          title="Undo last action (Ctrl+Z)"
        >
          <span>⟲</span><span>Undo</span>
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
