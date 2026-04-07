import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import styles from './StoreCodePage.module.css';

export default function StoreCodePage() {
  const navigate = useNavigate();
  const { setStoreId, authSession } = useAppContext();
  const [storeCode, setStoreCode] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const code = storeCode.trim();
    if (!code) {
      setError('Please enter a store code.');
      return;
    }
    setError('');
    setStoreId(code);
    navigate('/dashboard', { replace: true });
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <span className={styles.logoLetter}>L</span>
          </div>
          <div className={styles.brandName}>Lucent Technologies</div>
          <div className={styles.brandSub}>CFA Training Tracker</div>
        </div>

        {/* Back link */}
        <button type="button" className={styles.backLink} onClick={() => navigate(-1)}>
          ← Back to sign in
        </button>

        {/* Body */}
        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.formTitle}>Select Your Store</h2>

          {authSession?.user?.email && (
            <p className={styles.userHint}>
              Signed in as <strong>{authSession.user.email}</strong>
            </p>
          )}

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="storeCode">
              Store Number
            </label>
            <p className={styles.fieldHint}>
              Enter the store number provided by your manager to connect to your store's data.
            </p>
            <input
              id="storeCode"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              type="text"
              placeholder="e.g. 12345"
              value={storeCode}
              onChange={e => { setStoreCode(e.target.value); setError(''); }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
            />
            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>

          <button type="submit" className={styles.submitBtn}>
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
