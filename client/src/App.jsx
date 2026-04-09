import { useState } from 'react'
import Config from './pages/Config'
import Scout from './pages/Scout'
import Stats from './pages/Stats'

export default function App() {
  const [tab, setTab] = useState('config')

  return (
    <>
      <header>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🏐
        </div>
        <div style={{ flex: 1 }}>
          <div className="htitle">ASSOCIAÇÃO SCOLA</div>
          <div className="hsub">de Voleibol — Scout App</div>
        </div>
      </header>

      <div className="tab">
        {tab === 'config' && <Config />}
        {tab === 'scout' && <Scout />}
        {tab === 'stats' && <Stats />}
      </div>

      <nav>
        {[['config', '⚙️', 'Config'], ['scout', '📋', 'Scout'], ['stats', '📊', 'Stats']].map(([k, icon, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            <span className="ic">{icon}</span>{label}
          </button>
        ))}
      </nav>
    </>
  )
}
