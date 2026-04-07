import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../lib/supabase';
import styles from './EmailLoginPage.module.css';

export default function EmailLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success, Supabase redirects the browser to /store-code — no navigate() needed.
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { error: authError } = isSignUp
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Success — navigate to store code selection
      navigate('/store-code', { replace: true });
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
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
        <form className={styles.body} onSubmit={handleSubmit} noValidate>
          <h2 className={styles.formTitle}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          <button
            type="button"
            className={styles.googleBtn}
            onClick={handleGoogle}
            disabled={loading || googleLoading}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Redirecting...' : 'Continue with Google'}
          </button>

          <div className={styles.divider}>or</div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              autoFocus
              autoComplete="email"
              disabled={loading}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={loading}
            />
          </div>

          {error && <p className={styles.errorMsg}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className={styles.switchRow}>
            <span className={styles.switchText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              className={styles.switchBtn}
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              disabled={loading}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
