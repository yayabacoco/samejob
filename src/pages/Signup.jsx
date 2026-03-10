import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { signUpCabinet } from '../lib/api'

const INVITE = import.meta.env.VITE_SIGNUP_INVITE

export default function Signup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({ cabinetName: '', fullName: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const validInvite = !INVITE || params.get('invite') === INVITE

  if (!validInvite) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <span style={s.icon}>🔒</span>
          <h2 style={{ color: '#f1f0ff', margin: '1rem 0 0.5rem' }}>Accès restreint</h2>
          <p style={{ color: '#a09cc0', fontSize: 14 }}>Ce lien d'invitation n'est pas valide.</p>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signUpCabinet(form)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={s.page}>
        <div style={s.card}>
          <span style={s.icon}>📧</span>
          <h2 style={{ color: '#f1f0ff', margin: '1rem 0 0.5rem' }}>Vérifiez votre email</h2>
          <p style={{ color: '#a09cc0', fontSize: 14, lineHeight: 1.7, marginBottom: '0.75rem' }}>
            Un email de confirmation a été envoyé à <strong style={{ color: '#f1f0ff' }}>{form.email}</strong>.
          </p>
          <p style={{ color: '#a09cc0', fontSize: 14, lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.
          </p>
          <button onClick={() => navigate('/login')} style={{ ...s.btn, background: '#2e2b5a', color: '#a09cc0' }}>
            Aller à la connexion →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={s.icon}>🎯</span>
          <h1 style={s.title}>Same Job</h1>
          <p style={s.sub}>Créer votre cabinet</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Nom du cabinet" value={form.cabinetName}
            onChange={v => setForm(f => ({ ...f, cabinetName: v }))}
            placeholder="Ex: Executive Search Paris" />

          <Field label="Votre nom complet" value={form.fullName}
            onChange={v => setForm(f => ({ ...f, fullName: v }))}
            placeholder="Prénom Nom" />

          <Field label="Email professionnel" type="email" value={form.email}
            onChange={v => setForm(f => ({ ...f, email: v }))}
            placeholder="vous@cabinet.com" />

          <Field label="Mot de passe" type="password" value={form.password}
            onChange={v => setForm(f => ({ ...f, password: v }))}
            placeholder="8 caractères minimum" />

          {error && <div style={s.err}>{error}</div>}

          <button type="submit" disabled={loading} style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Création...' : 'Créer mon cabinet'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: 13, color: '#a09cc0' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#a855f7', textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#a09cc0' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={type === 'password' ? 8 : undefined}
        style={s.input}
        onFocus={e => e.target.style.borderColor = '#7c3aed'}
        onBlur={e => e.target.style.borderColor = '#2e2b5a'}
      />
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    background: '#1a1a35', border: '1px solid #2e2b5a', borderRadius: 16,
    padding: '2.5rem', width: '100%', maxWidth: 420,
    boxShadow: '0 25px 50px rgba(124, 58, 237, 0.15)',
    textAlign: 'left',
  },
  icon: { fontSize: '2.5rem', display: 'block', textAlign: 'center' },
  title: {
    fontSize: '1.8rem', fontWeight: 700,
    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    marginBottom: '0.25rem', textAlign: 'center',
  },
  sub: { color: '#a09cc0', fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' },
  input: {
    background: '#12122a', border: '1px solid #2e2b5a', borderRadius: 8,
    padding: '0.75rem 1rem', color: '#f1f0ff', fontSize: '1rem',
    outline: 'none', transition: 'border-color 0.2s', width: '100%',
    boxSizing: 'border-box',
  },
  err: {
    background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
    borderRadius: 8, padding: '0.75rem 1rem', color: '#f87171', fontSize: 13,
  },
  btn: {
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff',
    border: 'none', borderRadius: 8, padding: '0.875rem', fontSize: '1rem',
    fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: '0.5rem',
  },
}
