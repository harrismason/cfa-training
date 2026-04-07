import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { ROLE_COLORS } from '../constants/theme';
import styles from './LoginPage.module.css';

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function LoginPage() {
  const { trainees, preferences, login, authSession, currentUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  // True when an email-authenticated user hasn't picked their trainee profile yet.
  // In this mode we skip the manager option and the role-selection step.
  const isTraineePick = !!(authSession && (!currentUser || !currentUser.id));

  const [step, setStep] = useState('pick'); // 'pick' | 'role' | 'pin'
  const [selected, setSelected] = useState(null); // trainee object or 'manager'
  const [accessLevel, setAccessLevel] = useState('member');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  // All hooks must run before any early return
  if (navigator.userAgent.includes('Electron')) return <Navigate to="/dashboard" replace />;

  function handlePickTrainee(trainee) {
    if (isTraineePick) {
      // Email-auth members: skip role selection, go straight to member access
      login({ id: trainee.id, name: trainee.name, role: trainee.role, accessLevel: 'member' });
      navigate(from, { replace: true });
      return;
    }
    setSelected(trainee);
    setAccessLevel('member');
    setStep('role');
  }

  function handlePickManager() {
    setSelected('manager');
    setPin('');
    setPinError('');
    setStep('pin');
  }

  function handleRoleContinue() {
    login({
      id: selected.id,
      name: selected.name,
      role: selected.role,
      accessLevel,
    });
    navigate(from, { replace: true });
  }

  function handlePinSubmit(e) {
    e.preventDefault();
    if (pin === preferences.managerPin) {
      login({ id: null, name: 'Manager', role: 'Manager', accessLevel: 'manager' });
      navigate(from, { replace: true });
    } else {
      setPinError('Incorrect PIN. Try again.');
      setPin('');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>CFA</div>
          <h1 className={styles.title}>Training Tracker</h1>
          <p className={styles.subtitle}>
            {step === 'pick' && (isTraineePick ? 'Select your profile' : 'Who are you?')}
            {step === 'role' && `Welcome, ${selected?.name}`}
            {step === 'pin' && 'Manager Access'}
          </p>
        </div>

        {/* Step 1 — Pick identity */}
        {step === 'pick' && (
          <div className={styles.body}>
            <div className={styles.sectionLabel}>Team Members</div>
            <div className={styles.traineeList}>
              {trainees.map(t => {
                const rc = ROLE_COLORS[t.role] || ROLE_COLORS['Team Member'];
                return (
                  <button key={t.id} className={styles.traineeBtn} onClick={() => handlePickTrainee(t)}>
                    <div className={styles.traineeAvatar} style={{ backgroundColor: rc.avatar }}>
                      {t.photoUrl
                        ? <img src={t.photoUrl} alt={t.name} className={styles.avatarImg} />
                        : getInitials(t.name)
                      }
                    </div>
                    <div className={styles.traineeInfo}>
                      <span className={styles.traineeName}>{t.name}</span>
                      <span className={styles.traineeRole} style={{ background: rc.bg, color: rc.text }}>{t.role}</span>
                    </div>
                    <span className={styles.chevron}>›</span>
                  </button>
                );
              })}
              {trainees.length === 0 && (
                <p className={styles.emptyMsg}>No team members added yet.</p>
              )}
            </div>

            {!isTraineePick && <div className={styles.divider} />}

            {!isTraineePick && <button className={styles.managerBtn} onClick={handlePickManager}>
              <span className={styles.lockIcon}>🔐</span>
              <div className={styles.traineeInfo}>
                <span className={styles.traineeName}>Manager Access</span>
                <span className={styles.traineeSubtext}>Full control — requires PIN</span>
              </div>
              <span className={styles.chevron}>›</span>
            </button>}
          </div>
        )}

        {/* Step 2 — Choose access level */}
        {step === 'role' && selected && selected !== 'manager' && (
          <div className={styles.body}>
            <p className={styles.rolePrompt}>How are you accessing the app today?</p>
            <div className={styles.roleOptions}>
              <button
                className={`${styles.roleBtn} ${accessLevel === 'member' ? styles.roleBtnActive : ''}`}
                onClick={() => setAccessLevel('member')}
              >
                <span className={styles.roleIcon}>👤</span>
                <div>
                  <div className={styles.roleTitle}>Team Member</div>
                  <div className={styles.roleDesc}>View my own progress only</div>
                </div>
              </button>
              <button
                className={`${styles.roleBtn} ${accessLevel === 'trainer' ? styles.roleBtnActive : ''}`}
                onClick={() => setAccessLevel('trainer')}
              >
                <span className={styles.roleIcon}>🏅</span>
                <div>
                  <div className={styles.roleTitle}>Trainer</div>
                  <div className={styles.roleDesc}>View matrix, complete shifts</div>
                </div>
              </button>
            </div>

            <div className={styles.stepActions}>
              <button className={styles.backBtn} onClick={() => setStep('pick')}>← Back</button>
              <button className={styles.primaryBtn} onClick={handleRoleContinue}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Manager PIN */}
        {step === 'pin' && (
          <div className={styles.body}>
            <p className={styles.rolePrompt}>Enter your 4-digit manager PIN</p>
            <form className={styles.pinForm} onSubmit={handlePinSubmit}>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                className={`${styles.pinInput} ${pinError ? styles.pinInputError : ''}`}
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError(''); }}
                placeholder="• • • •"
                autoFocus
              />
              {pinError && <p className={styles.pinError}>{pinError}</p>}
              <div className={styles.stepActions}>
                <button type="button" className={styles.backBtn} onClick={() => setStep('pick')}>← Back</button>
                <button type="submit" className={styles.primaryBtn} disabled={!pin}>Unlock →</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
