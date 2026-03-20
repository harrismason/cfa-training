import { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import styles from './SettingsPage.module.css';

const RULES_SNIPPET = `{
  "rules": {
    "stores": {
      "$storeId": {
        ".read": true,
        ".write": true
      }
    }
  }
}`;

export default function SettingsPage() {
  const {
    firebaseConnected, firebaseStoreId,
    connectFirebase, disconnectFirebase,
    exportData, importData,
  } = useAppContext();

  // Cloud sync form
  const [configText, setConfigText] = useState('');
  const [storeCodeInput, setStoreCodeInput] = useState('');
  const [connectStatus, setConnectStatus] = useState(null); // null | 'success' | 'error' | 'invalid-json'

  // Accordions
  const [showSetup, setShowSetup] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Restore
  const fileInputRef = useRef(null);
  const [restorePending, setRestorePending] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);

  function handleConnect() {
    setConnectStatus(null);
    let config;
    try {
      config = JSON.parse(configText.trim());
    } catch {
      setConnectStatus('invalid-json');
      return;
    }
    const code = storeCodeInput.trim();
    if (!code) { setConnectStatus('no-code'); return; }
    const ok = connectFirebase(config, code);
    setConnectStatus(ok ? 'success' : 'error');
  }

  function handleDisconnect() {
    disconnectFirebase();
    setConnectStatus(null);
  }

  function handleRestoreFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setRestorePending(data);
        setShowRestoreConfirm(true);
      } catch {
        alert('Invalid backup file — could not parse JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function confirmRestore() {
    if (restorePending) importData(restorePending);
    setRestorePending(null);
    setShowRestoreConfirm(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage cloud sync, data backup, and app preferences.</p>
      </div>

      <div className={styles.sections}>

        {/* ── Cloud Sync ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>☁️</span>
            <h2 className={styles.cardTitle}>Cloud Sync</h2>
            <div className={`${styles.statusBadge} ${firebaseConnected ? styles.statusOn : styles.statusOff}`}>
              {firebaseConnected ? '● Connected' : '○ Local only'}
            </div>
          </div>

          {firebaseConnected ? (
            <div className={styles.connectedState}>
              <p className={styles.connectedMsg}>
                Syncing live to store: <strong>{firebaseStoreId}</strong>
              </p>
              <p className={styles.connectedSub}>
                All changes are written to Firebase Realtime Database in real time. Other devices
                with the same store code will see updates instantly.
              </p>
              <button className={styles.dangerBtn} onClick={handleDisconnect}>
                Disconnect from Firebase
              </button>
            </div>
          ) : (
            <div className={styles.connectForm}>
              <p className={styles.helpText}>
                Connect to Firebase Realtime Database to sync data across devices. Your data is
                always saved locally — Firebase is an optional layer on top.
              </p>

              <label className={styles.label}>
                Firebase Config <span className={styles.labelNote}>(paste the firebaseConfig object JSON)</span>
              </label>
              <textarea
                className={styles.codeArea}
                rows={8}
                spellCheck={false}
                placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "databaseURL": "...",\n  "projectId": "...",\n  ...\n}'}
                value={configText}
                onChange={e => setConfigText(e.target.value)}
              />

              <label className={styles.label}>
                Store Code <span className={styles.labelNote}>(any unique identifier for this location, e.g. "store-42")</span>
              </label>
              <input
                className={styles.textInput}
                type="text"
                placeholder="store-42"
                value={storeCodeInput}
                onChange={e => setStoreCodeInput(e.target.value)}
              />

              {connectStatus === 'invalid-json' && (
                <p className={styles.errorMsg}>⚠ Could not parse Firebase config — make sure it's valid JSON.</p>
              )}
              {connectStatus === 'no-code' && (
                <p className={styles.errorMsg}>⚠ Please enter a Store Code.</p>
              )}
              {connectStatus === 'error' && (
                <p className={styles.errorMsg}>⚠ Firebase connection failed — check your config and try again.</p>
              )}
              {connectStatus === 'success' && (
                <p className={styles.successMsg}>✓ Connected successfully!</p>
              )}

              <button className={styles.primaryBtn} onClick={handleConnect}>
                Connect to Firebase
              </button>
            </div>
          )}

          {/* Setup accordion */}
          <button className={styles.accordion} onClick={() => setShowSetup(v => !v)}>
            <span>📖 How to set up Firebase (step-by-step)</span>
            <span className={styles.accordionChevron}>{showSetup ? '▲' : '▼'}</span>
          </button>
          {showSetup && (
            <ol className={styles.setupSteps}>
              <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className={styles.link}>console.firebase.google.com</a></li>
              <li>Click <strong>Add project</strong> → give it any name → continue through the prompts (you can disable Analytics).</li>
              <li>On the project overview, click the <strong>&lt;/&gt;</strong> (Web) icon to register a web app → give it a nickname → click <strong>Register app</strong>.</li>
              <li>Copy the <code>firebaseConfig</code> object shown on screen and paste it in the box above.</li>
              <li>In the left sidebar go to <strong>Build → Realtime Database</strong> → click <strong>Create database</strong> → choose a region → start in <strong>Test mode</strong>.</li>
              <li>Copy the database URL (looks like <code>https://your-project-default-rtdb.firebaseio.com</code>) and make sure it appears in the config you pasted.</li>
              <li>Replace the default security rules with the rules shown below, then click <strong>Publish</strong>.</li>
              <li>Enter a Store Code above (any short identifier) and click <strong>Connect to Firebase</strong>.</li>
            </ol>
          )}

          {/* Rules accordion */}
          <button className={styles.accordion} onClick={() => setShowRules(v => !v)}>
            <span>🔒 Firebase Security Rules</span>
            <span className={styles.accordionChevron}>{showRules ? '▲' : '▼'}</span>
          </button>
          {showRules && (
            <div className={styles.rulesWrap}>
              <p className={styles.rulesNote}>
                Paste these rules in <strong>Realtime Database → Rules</strong> and click <strong>Publish</strong>.
                For a production environment, restrict access with authentication instead of open read/write.
              </p>
              <pre className={styles.codeBlock}>{RULES_SNIPPET}</pre>
            </div>
          )}
        </section>

        {/* ── Data ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>💾</span>
            <h2 className={styles.cardTitle}>Data</h2>
          </div>
          <p className={styles.helpText}>
            Export all data to a JSON backup file, or import a previously exported backup.
            Importing replaces all current data (you can Undo immediately after).
          </p>
          <div className={styles.dataActions}>
            <button className={styles.primaryBtn} onClick={exportData}>
              💾 Export Backup
            </button>
            <button className={styles.secondaryBtn} onClick={() => fileInputRef.current?.click()}>
              📂 Import Backup
            </button>
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
              <p className={styles.confirmMsg}>
                ⚠ This will replace <strong>all</strong> current data with the backup. Continue?
              </p>
              <div className={styles.confirmActions}>
                <button className={styles.dangerBtn} onClick={confirmRestore}>Yes, restore backup</button>
                <button className={styles.secondaryBtn} onClick={() => setShowRestoreConfirm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </section>

        {/* ── About ── */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>ℹ️</span>
            <h2 className={styles.cardTitle}>About</h2>
          </div>
          <div className={styles.aboutContent}>
            <div className={styles.aboutLogo}>
              <div className={styles.aboutLogoBox}>L</div>
              <div>
                <div className={styles.aboutCompany}>Lucent Technologies</div>
                <div className={styles.aboutProduct}>CFA Training Tracker</div>
              </div>
            </div>
            <p className={styles.aboutDesc}>
              A comprehensive training management tool for Chick-fil-A operators and trainers.
              Track trainee progress, schedule upcoming training shifts, and analyze team
              performance — all in one place.
            </p>
            <dl className={styles.aboutMeta}>
              <dt>Storage</dt>
              <dd>Browser localStorage (always) {firebaseConnected && '+ Firebase Realtime Database'}</dd>
              <dt>Offline</dt>
              <dd>Fully functional without internet — data is never lost</dd>
            </dl>
          </div>
        </section>

      </div>
    </div>
  );
}
