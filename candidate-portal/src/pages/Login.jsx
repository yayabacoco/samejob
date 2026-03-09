import { useState } from 'react'
import { signIn } from '../lib/api'

const C = { bg: "#F8FAFC", card: "#FFFFFF", border: "#E2E8F0", acc: "#0369A1", t1: "#0F172A", t2: "#475569", t3: "#94A3B8", err: "#DC2626", wh: "#fff" }
const IS = { width: "100%", background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: 8, padding: "11px 13px", color: C.t1, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const session = await signIn(email, password)
      onLogin(session)
    } catch {
      setError('Email ou mot de passe incorrect')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg, fontFamily: "'Inter',-apple-system,sans-serif" }}>
      <div style={{ width: 400, background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, padding: 36, boxShadow: '0 8px 32px rgba(108,92,231,.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.acc, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: C.wh, margin: '0 auto 14px' }}>SJ</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: C.t1 }}>Espace Candidat</h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: C.t2 }}>Same Job — Suivez vos candidatures</p>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" required style={IS} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, color: C.t3, textTransform: 'uppercase', letterSpacing: .5, display: 'block', marginBottom: 4 }}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={IS} />
          </div>
          {error && <div style={{ background: C.err + '12', border: `1px solid ${C.err}33`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: C.err, marginBottom: 14 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', background: C.acc, color: C.wh, border: 'none', borderRadius: 10, padding: '13px 20px', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: 11, color: C.t3, marginTop: 20 }}>Accès réservé aux candidats suivis par Same Job</p>
      </div>
    </div>
  )
}
