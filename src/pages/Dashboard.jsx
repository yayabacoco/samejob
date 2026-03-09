import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const TABS = ['companies', 'candidates', 'missions']

const TAB_LABELS = {
  companies: '🏢 Entreprises',
  candidates: '👤 Candidats',
  missions: '📋 Missions',
}

export default function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState('companies')
  const [data, setData] = useState({ companies: [], candidates: [], missions: [] })
  const [loading, setLoading] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    TABS.forEach(tab => fetchTable(tab))
  }, [])

  async function fetchTable(table) {
    setLoading(prev => ({ ...prev, [table]: true }))
    setErrors(prev => ({ ...prev, [table]: null }))

    const { data: rows, error } = await supabase.from(table).select('*').limit(100)

    if (error) {
      setErrors(prev => ({ ...prev, [table]: error.message }))
    } else {
      setData(prev => ({ ...prev, [table]: rows || [] }))
    }
    setLoading(prev => ({ ...prev, [table]: false }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  const currentData = data[activeTab] || []
  const columns = currentData.length > 0 ? Object.keys(currentData[0]) : []

  return (
    <div style={styles.layout}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={{ fontSize: '1.5rem' }}>🎯</span>
          <div>
            <div style={styles.brandName}>Same Job</div>
            <div style={styles.brandSub}>Chasseur de Têtes</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.navItem,
                ...(activeTab === tab ? styles.navItemActive : {}),
              }}
            >
              {TAB_LABELS[tab]}
              <span style={{
                ...styles.badge,
                background: activeTab === tab ? '#7c3aed' : '#2e2b5a',
              }}>
                {data[tab]?.length ?? '…'}
              </span>
            </button>
          ))}
        </nav>

        <div style={styles.userSection}>
          <div style={styles.userEmail}>{session.user.email}</div>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={styles.main}>
        <header style={styles.header}>
          <h2 style={styles.pageTitle}>{TAB_LABELS[activeTab]}</h2>
          <button onClick={() => fetchTable(activeTab)} style={styles.refreshBtn}>
            ↻ Actualiser
          </button>
        </header>

        {errors[activeTab] && (
          <div style={styles.errorBanner}>
            ⚠️ {errors[activeTab]}
          </div>
        )}

        {loading[activeTab] ? (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : currentData.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p>Aucune donnée dans la table <strong>{activeTab}</strong></p>
            <p style={{ color: '#a09cc0', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Créez la table dans Supabase pour commencer.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col} style={styles.th}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    {columns.map(col => (
                      <td key={col} style={styles.td}>
                        {row[col] === null ? (
                          <span style={{ color: '#4a4770' }}>null</span>
                        ) : typeof row[col] === 'object' ? (
                          JSON.stringify(row[col])
                        ) : (
                          String(row[col])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0d0d1a',
  },
  sidebar: {
    width: '260px',
    background: '#12122a',
    borderRight: '1px solid #2e2b5a',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1rem',
    gap: '1.5rem',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0 0.5rem',
  },
  brandName: {
    fontWeight: '700',
    fontSize: '1.1rem',
    background: 'linear-gradient(90deg, #a855f7, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  brandSub: {
    fontSize: '0.7rem',
    color: '#a09cc0',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    flex: 1,
  },
  navItem: {
    background: 'transparent',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#a09cc0',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    background: 'rgba(124, 58, 237, 0.15)',
    color: '#f1f0ff',
    borderLeft: '3px solid #7c3aed',
  },
  badge: {
    borderRadius: '12px',
    padding: '0.15rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#f1f0ff',
  },
  userSection: {
    borderTop: '1px solid #2e2b5a',
    paddingTop: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  userEmail: {
    fontSize: '0.8rem',
    color: '#a09cc0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  signOutBtn: {
    background: 'transparent',
    border: '1px solid #2e2b5a',
    borderRadius: '6px',
    color: '#a09cc0',
    padding: '0.5rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    marginLeft: '260px',
    flex: 1,
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#f1f0ff',
  },
  refreshBtn: {
    background: 'rgba(124, 58, 237, 0.1)',
    border: '1px solid #7c3aed',
    borderRadius: '8px',
    color: '#a855f7',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  errorBanner: {
    background: 'rgba(248, 113, 113, 0.1)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f87171',
    fontSize: '0.875rem',
  },
  loadingWrap: {
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '4rem',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid #2e2b5a',
    borderTop: '3px solid #7c3aed',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    textAlign: 'center',
    paddingTop: '4rem',
    color: '#f1f0ff',
  },
  tableWrap: {
    background: '#1a1a35',
    border: '1px solid #2e2b5a',
    borderRadius: '12px',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.875rem',
  },
  th: {
    padding: '0.875rem 1rem',
    textAlign: 'left',
    color: '#a09cc0',
    fontWeight: '600',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #2e2b5a',
    background: '#12122a',
  },
  td: {
    padding: '0.875rem 1rem',
    color: '#f1f0ff',
    borderBottom: '1px solid #1e1e3a',
    maxWidth: '250px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  trEven: {
    background: 'transparent',
  },
  trOdd: {
    background: 'rgba(124, 58, 237, 0.03)',
  },
}
