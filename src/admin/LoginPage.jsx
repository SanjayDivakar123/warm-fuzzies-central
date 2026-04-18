import { useEffect, useState } from 'react';
import { getJson, postJson } from '../lib/api.js';

function redirect(path) {
  window.history.replaceState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getJson('/api/admin/session')
      .then(() => {
        if (active) {
          redirect('/admin');
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await postJson('/api/admin/login', { password });
      redirect('/admin');
    } catch (submitError) {
      setError(submitError.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card panel" onSubmit={handleSubmit}>
        <div className="eyebrow">Jax Admin</div>
        <h1 className="admin-login-title">Sanjay Control Access</h1>
        <p className="subtle">
          Enter the admin password to unlock the protected command dashboard.
        </p>
        <label className="field-label" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          className="text-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter admin password"
        />
        {error ? <div className="admin-error-banner">{error}</div> : null}
        <button className="primary-action" type="submit" disabled={loading}>
          {loading ? 'Unlocking...' : 'Unlock Admin'}
        </button>
      </form>
    </div>
  );
}
