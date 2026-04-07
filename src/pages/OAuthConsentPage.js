import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './OAuthConsentPage.module.css';

const SCOPE_LABELS = {
  openid:  'Confirm your identity',
  profile: 'Read your profile information',
  email:   'Access your email address',
};

function getClientLabel(clientId) {
  if (!clientId) return 'An external application';
  return clientId
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function OAuthConsentPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const clientId    = params.get('client_id');
  const redirectUri = params.get('redirect_uri');
  const scope       = params.get('scope') || '';
  const state       = params.get('state');

  const hasOAuthParams = !!(clientId && redirectUri && state);
  const scopes = scope ? scope.split(' ').filter(Boolean) : [];

  const [storeCode, setStoreCode] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  function handleAllow(e) {
    e.preventDefault();
    const code = storeCode.trim();
    if (!code) {
      setError('Please enter a store code.');
      return;
    }
    setError('');
    setLoading(true);

    // Save store code — same key used by the existing connectSupabase flow
    try { window.localStorage.setItem('cfa_store_id', code); } catch {}

    if (hasOAuthParams) {
      const approvalUrl = new URL(
        'https://xcklsgpwvkbofaxzjevu.supabase.co/auth/v1/oauth/authorize'
      );
      approvalUrl.searchParams.set('approved', 'true');
      approvalUrl.searchParams.set('state', state);
      window.location.href = approvalUrl.toString();
    } else {
      navigate('/dashboard');
    }
  }

  function handleDeny() {
    if (hasOAuthParams) {
      const errorUrl = new URL(redirectUri);
      errorUrl.searchParams.set('error', 'access_denied');
      errorUrl.searchParams.set('error_description', 'User denied access');
      if (state) errorUrl.searchParams.set('state', state);
      window.location.href = errorUrl.toString();
    } else {
      navigate('/');
    }
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

        {/* Body */}
        <form className={styles.body} onSubmit={handleAllow} noValidate>

          {/* Requesting app info */}
          {hasOAuthParams && (
            <div className={styles.appInfoBox}>
              <div className={styles.appInfoTitle}>
                <span className={styles.appInfoIcon}>&#128274;</span>
                Authorization Request
              </div>
              <p className={styles.appInfoDesc}>
                <strong>{getClientLabel(clientId)}</strong> is requesting access to your store data.
              </p>
              {scopes.length > 0 && (
                <ul className={styles.scopeList}>
                  {scopes.map(s => (
                    <li key={s} className={styles.scopeItem}>
                      <span className={styles.scopeCheck}>&#10003;</span>
                      {SCOPE_LABELS[s] ?? s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Store code picker */}
          <div className={styles.fieldSection}>
            <label className={styles.fieldLabel} htmlFor="storeCode">
              Store Code
            </label>
            <p className={styles.fieldHint}>
              Enter the store code you set up in Settings &rsaquo; Cloud Sync (e.g.&nbsp;&ldquo;store-42&rdquo;).
            </p>
            <input
              id="storeCode"
              className={`${styles.storeInput} ${error ? styles.storeInputError : ''}`}
              type="text"
              placeholder="e.g. store-42"
              value={storeCode}
              onChange={e => { setStoreCode(e.target.value); setError(''); }}
              autoFocus
              autoComplete="off"
              spellCheck={false}
              disabled={loading}
            />
            {error && <p className={styles.errorMsg}>{error}</p>}
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.denyBtn}
              onClick={handleDeny}
              disabled={loading}
            >
              Deny
            </button>
            <button
              type="submit"
              className={styles.allowBtn}
              disabled={loading}
            >
              {loading ? 'Connecting\u2026' : 'Connect & Allow'}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className={styles.footer}>
          By connecting, you allow access to store data associated with the code you enter.
          Only connect to stores you manage.
        </div>
      </div>
    </div>
  );
}
