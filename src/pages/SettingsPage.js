import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getSupabase } from '../lib/supabase';
import styles from './SettingsPage.module.css';


const ACCENT_OPTIONS = [
  { key: 'red',    label: 'Red',    color: '#E4002B' },
  { key: 'blue',   label: 'Blue',   color: '#1565C0' },
  { key: 'green',  label: 'Green',  color: '#2E7D32' },
  { key: 'purple', label: 'Purple', color: '#6A1B9A' },
  { key: 'orange', label: 'Orange', color: '#E65100' },
];

const ADMIN_EMAIL = 'harris.mason.paul@gmail.com';

const SECTIONS = [
  { id: 'team',        label: 'Team Info' },
  { id: 'appearance',  label: 'Appearance' },
  { id: 'defaults',    label: 'Training Defaults' },
  { id: 'matrix',      label: 'Training Matrix' },
  { id: 'planner',     label: 'Shift Planner' },
  { id: 'sync',        label: 'Account' },
  { id: 'permissions', label: 'User Permissions' },
  { id: 'migrate',     label: 'Sync to Cloud' },
  { id: 'data',        label: 'Data Management' },
  { id: 'access',      label: 'Access Control' },
  { id: 'qr',          label: 'QR Check-In' },
  { id: 'checklist',   label: 'Onboarding Checklist' },
  { id: 'about',       label: 'About' },
];

const MIGRATE_KEYS = [
  'cfa_trainees', 'cfa_records', 'cfa_shifts', 'cfa_positions',
  'cfa_planned_shifts', 'cfa_goals', 'cfa_paths', 'cfa_checklist_items',
  'cfa_checklist_progress', 'cfa_training_templates', 'cfa_comments', 'cfa_prefs',
];

function ToggleSwitch({ checked, onChange, id }) {
  return (
    <label className={styles.toggleWrap} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <span className={styles.toggleTrack}>
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div className={styles.segmented}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.segBtn} ${value === opt.value ? styles.segBtnActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function NumberStepper({ value, min = 0, max = 20, onChange }) {
  return (
    <div className={styles.stepper}>
      <button type="button" className={styles.stepBtn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span className={styles.stepValue}>{value}</span>
      <button type="button" className={styles.stepBtn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

export default function SettingsPage() {
  const {
    preferences, updatePreferences,
    supabaseConnected, storeId, setStoreId, authSession, fullSignOut,
    exportData, importData,
    checklistItems, addChecklistItem, updateChecklistItem, deleteChecklistItem,
    trainees,
    userPermissions, setUserPermission, removeUserPermission,
  } = useAppContext();

  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('team');

  // New permission form state
  const [newPermEmail, setNewPermEmail] = useState('');
  const [newPermRole, setNewPermRole] = useState('trainer');
  const [newPermTrainee, setNewPermTrainee] = useState('');
  const [permError, setPermError] = useState('');

  // Cloud migration state
  const [migrating, setMigrating]       = useState(false);
  const [migrateResults, setMigrateResults] = useState([]);
  const [migrateDone, setMigrateDone]   = useState(false);

  async function handleMigrateToCloud() {
    if (!storeId) return;
    const sb = getSupabase();
    setMigrating(true);
    setMigrateDone(false);
    setMigrateResults([]);

    for (const key of MIGRATE_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setMigrateResults(p => [...p, { key, status: 'skipped' }]);
        continue;
      }
      let value;
      try { value = JSON.parse(raw); } catch {
        setMigrateResults(p => [...p, { key, status: 'error', msg: 'parse error' }]);
        continue;
      }
      const { error } = await sb.from('store_data').upsert(
        { store_id: storeId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'store_id,key' }
      );
      setMigrateResults(p => [...p, { key, status: error ? 'error' : 'ok', msg: error?.message }]);
    }
    setMigrating(false);
    setMigrateDone(true);
  }

  // (Cloud sync form removed — Supabase is now always connected)

  // Restore
  const fileInputRef = useRef(null);
  const [restorePending, setRestorePending] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  // Team info local state (save on blur)
  const [storeName, setStoreName] = useState(preferences.storeName ?? '');
  const [storeNumber, setStoreNumber] = useState(preferences.storeNumber ?? '');
  const [managerName, setManagerName] = useState(preferences.managerName ?? '');
  const [checkInBaseUrl, setCheckInBaseUrl] = useState(preferences.checkInBaseUrl ?? '');



  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setRestorePending(data);
        setShowRestoreConfirm(true);
      } catch { alert('Invalid backup file — could not parse JSON.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmRestore() {
    if (restorePending) importData(restorePending);
    setRestorePending(null);
    setShowRestoreConfirm(false);
  }

  function renderSection() {
    switch (activeSection) {

      case 'team':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Team Info</h2>
            </div>
            <p className={styles.helpText}>Your store details appear in the About section and future branding.</p>
            <div className={styles.fieldGrid}>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Store Name</label>
                <input
                  className={styles.textInput}
                  type="text"
                  value={storeName}
                  placeholder="e.g. Chick-fil-A Lakewood"
                  onChange={e => setStoreName(e.target.value)}
                  onBlur={() => updatePreferences({ storeName })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Store Number</label>
                <input
                  className={styles.textInput}
                  style={{ maxWidth: 160 }}
                  type="text"
                  value={storeNumber}
                  placeholder="e.g. 01234"
                  onChange={e => setStoreNumber(e.target.value)}
                  onBlur={() => updatePreferences({ storeNumber })}
                />
              </div>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Operator / Manager</label>
                <input
                  className={styles.textInput}
                  type="text"
                  value={managerName}
                  placeholder="e.g. Jane Smith"
                  onChange={e => setManagerName(e.target.value)}
                  onBlur={() => updatePreferences({ managerName })}
                />
              </div>
            </div>
          </section>
        );

      case 'appearance':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Appearance</h2>
            </div>
            <div className={styles.prefRows}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Dark Mode</div>
                  <div className={styles.prefDesc}>Switch to a dark color scheme throughout the app</div>
                </div>
                <ToggleSwitch
                  id="dark-mode"
                  checked={preferences.darkMode ?? false}
                  onChange={v => updatePreferences({ darkMode: v })}
                />
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Accent Color</div>
                  <div className={styles.prefDesc}>Changes buttons, active tabs, and highlighted elements</div>
                </div>
                <div className={styles.accentSwatches}>
                  {ACCENT_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      className={`${styles.swatch} ${preferences.accentColor === opt.key ? styles.swatchActive : ''}`}
                      style={{ background: opt.color }}
                      onClick={() => updatePreferences({ accentColor: opt.key })}
                      title={opt.label}
                      aria-label={`${opt.label} accent`}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>UI Density</div>
                  <div className={styles.prefDesc}>Controls spacing throughout cards, lists, and navigation</div>
                </div>
                <SegmentedControl
                  value={preferences.density ?? 'normal'}
                  options={[
                    { value: 'compact',  label: 'Compact' },
                    { value: 'normal',   label: 'Normal' },
                    { value: 'spacious', label: 'Spacious' },
                  ]}
                  onChange={v => updatePreferences({ density: v })}
                />
              </div>
            </div>
          </section>
        );

      case 'defaults':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Training Defaults</h2>
            </div>
            <p className={styles.helpText}>
              Global fallback values used when no position-level or trainee-level override has been set.
              You can override these per position (Positions page) or per trainee (Training Matrix — click a cell).
            </p>
            <div className={styles.prefRows}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Default Required Training Shifts</div>
                  <div className={styles.prefDesc}>How many training shifts needed for certification</div>
                </div>
                <NumberStepper
                  value={preferences.defaultRequiredShifts ?? 3}
                  min={1}
                  max={20}
                  onChange={v => updatePreferences({ defaultRequiredShifts: v })}
                />
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Default Required Practice Sessions</div>
                  <div className={styles.prefDesc}>Target practice sessions before a trainee is practice-ready (0 = no target)</div>
                </div>
                <NumberStepper
                  value={preferences.defaultRequiredPracticeShifts ?? 0}
                  min={0}
                  max={20}
                  onChange={v => updatePreferences({ defaultRequiredPracticeShifts: v })}
                />
              </div>
            </div>
          </section>
        );

      case 'matrix':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Training Matrix</h2>
            </div>
            <div className={styles.prefRows}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Default Sort Order</div>
                  <div className={styles.prefDesc}>How trainees are sorted when you first open the matrix</div>
                </div>
                <SegmentedControl
                  value={preferences.matrixDefaultSort ?? 'name'}
                  options={[
                    { value: 'name',   label: 'Name' },
                    { value: 'pct',    label: 'Progress' },
                    { value: 'status', label: 'Status' },
                  ]}
                  onChange={v => updatePreferences({ matrixDefaultSort: v })}
                />
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Hide Fully Trained by Default</div>
                  <div className={styles.prefDesc}>Automatically collapse trainees who are 100% trained across all positions</div>
                </div>
                <ToggleSwitch
                  id="hide-trained"
                  checked={preferences.matrixHideFullyTrained ?? false}
                  onChange={v => updatePreferences({ matrixHideFullyTrained: v })}
                />
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Show Practice Count Pill</div>
                  <div className={styles.prefDesc}>Display "3p" practice indicator badge on matrix cells</div>
                </div>
                <ToggleSwitch
                  id="practice-pills"
                  checked={preferences.matrixShowPracticePills ?? true}
                  onChange={v => updatePreferences({ matrixShowPracticePills: v })}
                />
              </div>
            </div>
          </section>
        );

      case 'planner':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Shift Planner</h2>
            </div>
            <div className={styles.prefRows}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Default Calendar View</div>
                  <div className={styles.prefDesc}>Which view mode the Planner opens in</div>
                </div>
                <SegmentedControl
                  value={preferences.plannerDefaultView ?? 'week'}
                  options={[
                    { value: 'week',  label: 'Week' },
                    { value: 'month', label: 'Month' },
                  ]}
                  onChange={v => updatePreferences({ plannerDefaultView: v })}
                />
              </div>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <div className={styles.prefLabel}>Show Completed Shifts</div>
                  <div className={styles.prefDesc}>Display completed shifts alongside pending ones on the planner</div>
                </div>
                <ToggleSwitch
                  id="show-completed"
                  checked={preferences.plannerShowCompleted ?? true}
                  onChange={v => updatePreferences({ plannerShowCompleted: v })}
                />
              </div>
            </div>
          </section>
        );

      case 'permissions':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>User Permissions</h2>
            </div>
            <p className={styles.helpText}>
              Control what each person can see and do. By default everyone who logs in gets
              read-only member access. Grant Trainer or Manager role to give full access.
            </p>

            {/* Hardcoded admin row */}
            <table className={styles.permTable}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Linked Trainee</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.permRowAdmin}>
                  <td>{ADMIN_EMAIL}</td>
                  <td><span className={styles.roleBadge} data-role="manager">Manager</span></td>
                  <td>—</td>
                  <td><span className={styles.permAdminNote}>Admin</span></td>
                </tr>
                {Object.entries(userPermissions).map(([email, perm]) => (
                  <tr key={email}>
                    <td>{email}</td>
                    <td>
                      <span className={styles.roleBadge} data-role={perm.role}>
                        {perm.role.charAt(0).toUpperCase() + perm.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      {perm.traineeId
                        ? (trainees.find(t => t.id === perm.traineeId)?.name || perm.traineeId)
                        : '—'}
                    </td>
                    <td>
                      <button
                        className={styles.permRemoveBtn}
                        onClick={() => removeUserPermission(email)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add permission form */}
            <div className={styles.permForm}>
              <h3 className={styles.permFormTitle}>Grant Access</h3>
              <div className={styles.permFormRow}>
                <input
                  className={styles.textInput}
                  type="email"
                  placeholder="user@example.com"
                  value={newPermEmail}
                  onChange={e => { setNewPermEmail(e.target.value); setPermError(''); }}
                />
                <select
                  className={styles.permSelect}
                  value={newPermRole}
                  onChange={e => setNewPermRole(e.target.value)}
                >
                  <option value="trainer">Trainer</option>
                  <option value="manager">Manager</option>
                </select>
                <select
                  className={styles.permSelect}
                  value={newPermTrainee}
                  onChange={e => setNewPermTrainee(e.target.value)}
                >
                  <option value="">No trainee link</option>
                  {trainees.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <button
                  className={styles.primaryBtn}
                  onClick={() => {
                    const email = newPermEmail.trim().toLowerCase();
                    if (!email || !email.includes('@')) {
                      setPermError('Enter a valid email address.');
                      return;
                    }
                    if (email === ADMIN_EMAIL) {
                      setPermError('Admin email cannot be modified.');
                      return;
                    }
                    setUserPermission(email, newPermRole, newPermTrainee || null);
                    setNewPermEmail('');
                    setNewPermRole('trainer');
                    setNewPermTrainee('');
                    setPermError('');
                  }}
                >
                  Add
                </button>
              </div>
              {permError && <p className={styles.permError}>{permError}</p>}
            </div>
          </section>
        );

      case 'sync':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Account</h2>
              <div className={`${styles.statusBadge} ${styles.statusOn}`}>
                Connected
              </div>
            </div>
            <div className={styles.connectedState}>
              {authSession?.user?.email && (
                <p className={styles.connectedMsg}>
                  Signed in as <strong>{authSession.user.email}</strong>
                </p>
              )}
              {storeId && (
                <p className={styles.connectedSub}>
                  Store: <strong>{storeId}</strong>
                </p>
              )}
              <button
                className={styles.secondaryBtn}
                onClick={() => { setStoreId(''); navigate('/store-code'); }}
              >
                Change Store Code
              </button>
              <button className={styles.dangerBtn} onClick={fullSignOut}>
                Sign Out
              </button>
            </div>
          </section>
        );

      case 'migrate':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sync Local Data to Cloud</h2>
            </div>
            <p className={styles.helpText}>
              Run this <strong>once</strong> on the device where your training data lives (e.g. your local browser).
              It uploads all trainees, shifts, records, notes, and settings to Supabase so every device
              sees the same data.
            </p>
            {!storeId && (
              <p style={{ color: 'var(--color-danger, #c00)', marginBottom: 12 }}>
                No store code set. Go to the Account section first.
              </p>
            )}
            <div className={styles.dataActions}>
              <button
                className={styles.primaryBtn}
                onClick={handleMigrateToCloud}
                disabled={migrating || !storeId}
              >
                {migrating ? 'Uploading…' : 'Sync Local Data to Cloud'}
              </button>
            </div>
            {migrateResults.length > 0 && (
              <ul className={styles.migrateList}>
                {migrateResults.map(r => (
                  <li key={r.key} className={styles.migrateRow}>
                    <span className={styles.migrateKey}>{r.key.replace('cfa_', '')}</span>
                    <span className={
                      r.status === 'ok'      ? styles.migrateOk :
                      r.status === 'skipped' ? styles.migrateSkip :
                      styles.migrateErr
                    }>
                      {r.status === 'ok'      ? '✓ uploaded' :
                       r.status === 'skipped' ? '— empty, skipped' :
                       `✗ ${r.msg || 'error'}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {migrateDone && (
              <p className={styles.migrateSuccess}>
                Done! Open lucentnexus.com — your data will load from the cloud automatically.
              </p>
            )}
          </section>
        );

      case 'data':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Data Management</h2>
            </div>
            <p className={styles.helpText}>
              Export all data to a JSON backup file, or import a previously exported backup.
              Importing replaces all current data (you can Undo immediately after).
            </p>
            <div className={styles.dataActions}>
              <button className={styles.primaryBtn} onClick={exportData}>Export Backup</button>
              <button className={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()}>Import Backup</button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleRestoreFile}
              />
            </div>
            {showRestoreConfirm && (
              <div className={styles.confirmBox}>
                <p className={styles.confirmMsg}>This will replace <strong>all</strong> current data with the backup. Continue?</p>
                <div className={styles.confirmActions}>
                  <button className={styles.dangerBtn} onClick={confirmRestore}>Yes, restore backup</button>
                  <button className={styles.secondaryBtn} onClick={() => setShowRestoreConfirm(false)}>Cancel</button>
                </div>
              </div>
            )}
          </section>
        );

      case 'access':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Access Control</h2>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.row}>
                <div className={styles.rowLabel}>
                  <div className={styles.rowTitle}>Require Login</div>
                  <div className={styles.rowDesc}>Team members must select their name when opening the app. Manager access requires a PIN.</div>
                </div>
                <ToggleSwitch
                  id="auth-enabled"
                  checked={!!preferences.authEnabled}
                  onChange={v => updatePreferences({ authEnabled: v })}
                />
              </div>
              {preferences.authEnabled && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Manager PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    className={styles.fieldInput}
                    style={{ maxWidth: '140px', letterSpacing: '0.25em' }}
                    value={preferences.managerPin ?? '1234'}
                    onChange={e => updatePreferences({ managerPin: e.target.value })}
                    placeholder="1234"
                  />
                  <p className={styles.fieldHint}>PIN is stored locally on this device. Do not use a sensitive PIN.</p>
                </div>
              )}
            </div>
          </section>
        );

      case 'qr':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>QR Check-In</h2>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.rowDesc}>
                The QR Code feature generates a link that team members can scan with their phone
                to log a training shift. Since this app runs on your computer, you need to enter
                the web address where the app is also hosted so phones can reach the check-in page.
              </p>
              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>Check-In Base URL</label>
                <input
                  className={styles.textInput}
                  type="url"
                  value={checkInBaseUrl}
                  placeholder="https://your-app.example.com"
                  onChange={e => setCheckInBaseUrl(e.target.value)}
                  onBlur={() => updatePreferences({ checkInBaseUrl: checkInBaseUrl.trim() })}
                />
              </div>
              <p className={styles.fieldHint}>
                Leave blank if you haven't deployed the app to a web server yet.
                Without this, QR codes will show a warning and won't work on phones.
              </p>
            </div>
          </section>
        );

      case 'checklist':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Onboarding Checklist</h2>
            </div>
            <div className={styles.cardBody}>
              <p className={styles.rowDesc}>Customize the checklist that all new hires must complete. Changes apply to all team members.</p>
              <div className={styles.checklistEditor}>
                {[...checklistItems].sort((a,b) => a.order - b.order).map((item) => (
                  <div key={item.id} className={styles.checklistEditorRow}>
                    <input
                      className={styles.checklistEditorInput}
                      value={item.label}
                      onChange={e => updateChecklistItem(item.id, { label: e.target.value })}
                      placeholder="Item label..."
                    />
                    <select
                      className={styles.checklistEditorSelect}
                      value={item.category}
                      onChange={e => updateChecklistItem(item.id, { category: e.target.value })}
                    >
                      {['Paperwork','Certifications','Uniform','Training','Orientation'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <label className={styles.checklistEditorReq} title="Required">
                      <input
                        type="checkbox"
                        checked={!!item.required}
                        onChange={e => updateChecklistItem(item.id, { required: e.target.checked })}
                      />
                      Req
                    </label>
                    <button
                      className={styles.checklistEditorDel}
                      onClick={() => deleteChecklistItem(item.id)}
                      title="Remove item"
                    >x</button>
                  </div>
                ))}
              </div>
              <button
                className={styles.addChecklistBtn}
                onClick={() => addChecklistItem({ label: '', category: 'Orientation', required: false })}
              >
                + Add Item
              </button>
            </div>
          </section>
        );

      case 'about':
        return (
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>About</h2>
            </div>
            <div className={styles.aboutContent}>
              <div className={styles.aboutLogo}>
                <div className={styles.aboutLogoBox}>L</div>
                <div>
                  <div className={styles.aboutCompany}>Lucent Technologies</div>
                  <div className={styles.aboutProduct}>{preferences.storeName || 'CFA Training Tracker'}</div>
                </div>
              </div>
              {preferences.storeNumber && (
                <p className={styles.aboutStoreLine}>Store #{preferences.storeNumber}{preferences.managerName ? ` · ${preferences.managerName}` : ''}</p>
              )}
              <p className={styles.aboutDesc}>
                A comprehensive training management tool for Chick-fil-A operators and trainers.
                Track trainee progress, schedule upcoming training shifts, and analyze team
                performance — all in one place.
              </p>
              <dl className={styles.aboutMeta}>
                <dt>Storage</dt>
                <dd>Browser localStorage (always) {supabaseConnected && '+ Supabase (cloud sync active)'}</dd>
                <dt>Offline</dt>
                <dd>Fully functional without internet — data is never lost</dd>
                <dt>Accent Color</dt>
                <dd style={{ textTransform: 'capitalize' }}>{preferences.accentColor ?? 'Red'}</dd>
                <dt>Theme</dt>
                <dd>{preferences.darkMode ? 'Dark' : 'Light'}</dd>
              </dl>
            </div>
          </section>
        );

      default:
        return null;
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Customize the app, configure training defaults, and manage your data.</p>
      </div>

      <div className={styles.settingsLayout}>
        <nav className={styles.settingsSideNav}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`${styles.sideNavBtn} ${activeSection === s.id ? styles.sideNavBtnActive : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className={styles.settingsContent}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
