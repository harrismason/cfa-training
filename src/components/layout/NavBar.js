import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import styles from './NavBar.module.css';

export default function NavBar() {
  const { undo, canUndo } = useAppContext();

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
          to="/positions"
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.linkActive : ''}`
          }
        >
          Positions
        </NavLink>
      </div>
      <button
        className={`${styles.undoBtn} ${!canUndo ? styles.undoBtnDisabled : ''}`}
        onClick={undo}
        disabled={!canUndo}
        title="Undo last action (Ctrl+Z)"
      >
        ⟲ Undo
      </button>
    </nav>
  );
}
