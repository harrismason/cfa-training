import { NavLink } from 'react-router-dom';
import styles from './NavBar.module.css';

export default function NavBar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🐄</div>
        <span className={styles.brandName}>CFA Training Tracker</span>
      </div>
      <div className={styles.links}>
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
    </nav>
  );
}
