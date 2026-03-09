import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login',
    })
    if (error) setError(error.message)
    else setResetDone(true)
    setLoading(false)
  }

  if (resetMode) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎯</span>
            <h1 style={styles.title}>Same Job</h1>
            <p style={styles.subtitle}>Mot de passe oublié</p>
          </div>

          {resetDone ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#a09cc0', fontSize: 14, marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Un lien de réinitialisation a été envoyé à <strong style={{ color: '#f1f0ff' }}>{email}</strong>.
              </p>
              <button onClick={() => { setResetMode(false); setResetDone(false) }} style={styles.button}>
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleReset} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Votre email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  style={styles.input}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#2e2b5a'}
                />
              </div>

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={{ ...styles.button, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Envoi...' : 'Envoyer le lien'}
              </button>

              <button type="button" onClick={() => setResetMode(false)}
                style={{ background: 'none', border: 'none', color: '#a09cc0', fontSize: 13, cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
                ← Retour
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>🎯</span>
          <h1 style={styles.title}>Same Job</h1>
          <p style={styles.subtitle}>Portail Chasseur de Têtes</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#2e2b5a'}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              onFocus={e => e.target.style.borderColor = '#7c3aed'}
              onBlur={e => e.target.style.borderColor = '#2e2b5a'}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13 }}>
          <button onClick={() => setResetMode(true)}
            style={{ background: 'none', border: 'none', color: '#a09cc0', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            Mot de passe oublié ?
          </button>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#1a1a35',
    border: '1px solid #2e2b5a',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 25px 50px rgba(124, 58, 237, 0.15)',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '2rem',
  },
  logoIcon: {
    fontSize: '2.5rem',
    display: 'block',
    marginBottom: '0.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: '#a09cc0',
    fontSize: '0.875rem',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#a09cc0',
  },
  input: {
    background: '#12122a',
    border: '1px solid #2e2b5a',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f1f0ff',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
  },
  error: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f87171',
    fontSize: '0.875rem',
  },
  button: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.875rem',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s',
    marginTop: '0.5rem',
  },
}
