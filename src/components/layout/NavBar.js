import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ConfirmDialog from '../shared/ConfirmDialog';
import styles from './NavBar.module.css';

const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [
      { to: '/dashboard',   label: 'Dashboard',       level: 'trainer' },
      { to: '/analytics',   label: 'Analytics',       level: 'trainer' },
    ],
  },
  {
    label: 'Training',
    links: [
      { to: '/matrix',      label: 'Training Matrix', level: 'trainer' },
      { to: '/onboarding',  label: 'Onboarding',      level: 'trainer' },
      { to: '/paths',       label: 'Paths',           level: 'trainer' },
    ],
  },
  {
    label: 'Team',
    links: [
      { to: '/trainees',    label: 'Trainees',        level: 'trainer' },
      { to: '/trainers',    label: 'Trainers',        level: 'trainer' },
    ],
  },
  {
    label: 'Planning',
    links: [
      { to: '/planner',     label: 'Planner',         level: 'trainer' },
    ],
  },
  {
    label: 'Admin',
    links: [
      { to: '/positions',   label: 'Positions',       level: 'manager' },
      { to: '/templates',   label: 'Templates',       level: 'manager' },
      { to: '/settings',    label: 'Settings',        level: 'manager' },
    ],
  },
  {
    label: 'My Progress',
    links: [
      { to: '/my-progress', label: 'My Progress',     level: 'member' },
    ],
  },
];

const LEVEL_ORDER = { member: 0, trainer: 1, manager: 2 };

export default function NavBar() {
  const { undo, canUndo, exportData, importData, supabaseConnected, currentUser, preferences, logout } = useAppContext();
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [collapsed, setCollapsed] = useState(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);
  const fileInputRef = useRef(null);

  const myLevel = !preferences.authEnabled ? 2 : (LEVEL_ORDER[currentUser?.accessLevel] ?? 0);

  // Close mobile nav on route change / resize
  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768) setMobileOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Keyboard undo shortcut
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

  function toggleGroup(label) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className={styles.hamburger}
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarTop : ''}`} />
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarMid : ''}`} />
        <span className={`${styles.hamburgerBar} ${mobileOpen ? styles.hamburgerBarBot : ''}`} />
      </button>

      {/* Backdrop — mobile only */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={closeMobile} aria-hidden="true" />
      )}

      <nav className={`${styles.nav} ${mobileOpen ? styles.navOpen : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandLogoWrap}>
            <span className={styles.brandLogoLetter}>L</span>
          </div>
          <div className={styles.brandCompany}>Lucent Technologies</div>
          <div className={styles.brandProduct}>CFA Training Tracker</div>
        </div>

        {/* User chip */}
        {preferences.authEnabled && currentUser && (
          <div className={styles.userChip}>
            <span className={styles.userName}>{currentUser.name}</span>
            <span className={styles.userLevel}>{currentUser.accessLevel}</span>
          </div>
        )}

        {/* Nav groups */}
        <div className={styles.links}>
          {NAV_GROUPS.map((group) => {
            const visibleLinks = group.links.filter(l => LEVEL_ORDER[l.level] <= myLevel);
            if (!visibleLinks.length) return null;

            const isCollapsed = collapsed.has(group.label);

            return (
              <div key={group.label} className={styles.navGroup}>
                <button
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(group.label)}
                >
                  <span className={styles.groupLabel}>{group.label}</span>
                  <span className={`${styles.groupChevron} ${isCollapsed ? styles.groupChevronCollapsed : ''}`}>›</span>
                </button>
                {!isCollapsed && (
                  <div className={styles.groupLinks}>
                    {visibleLinks.map(({ to, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `${styles.link} ${isActive ? styles.linkActive : ''}`
                        }
                      >
                        {label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom actions */}
        <div className={styles.actions}>
          {myLevel >= 2 && (
            <>
              <button className={styles.navIconBtn} onClick={exportData} title="Backup data to JSON">
                Backup Data
              </button>
              <button className={styles.navIconBtn} onClick={() => fileInputRef.current?.click()} title="Restore from backup">
                Restore
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleRestoreFile}
          />
          <div className={styles.navIconBtn} style={{ cursor: 'default', pointerEvents: 'none' }}>
            Cloud Sync
            <div className={`${styles.syncDot} ${supabaseConnected ? styles.syncDotOn : styles.syncDotOff}`} />
          </div>
          <button
            className={`${styles.undoBtn} ${!canUndo ? styles.undoBtnDisabled : ''}`}
            onClick={undo}
            disabled={!canUndo}
            title="Undo last action (Ctrl+Z)"
          >
            Undo
          </button>
          {preferences.authEnabled && currentUser && (
            <button className={styles.logoutBtn} onClick={logout} title="Log out">
              Log Out
            </button>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmRestore}
          onClose={() => setConfirmRestore(false)}
          onConfirm={() => { importData(pendingData); setConfirmRestore(false); }}
          title="Restore Backup"
          message="This will replace ALL current data with the backup. This cannot be undone (well, you can use Undo immediately after). Continue?"
        />
      </nav>
    </>
  );
}
