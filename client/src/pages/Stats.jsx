import { useState, useEffect } from 'react'
import { api } from '../api'
import { ACT } from '../data'

export default function Stats() {
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [actions, setActions] = useState([])
  const [filterTeam, setFilterTeam] = useState('all')
  const [filterGame, setFilterGame] = useState('all')

  useEffect(() => {
    api.getTeams().then(setTeams)
    api.getGames().then(g => setGames(g.filter(x => x.status === 'done')))
  }, [])

  useEffect(() => {
    const tid = filterTeam === 'all' ? null : filterTeam
    const gid = filterGame === 'all' ? null : filterGame
    api.getStats(tid, gid).then(setActions)
  }, [filterTeam, filterGame])

  if (games.length === 0 && actions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
        <div>Nenhum jogo finalizado</div>
      </div>
    )
  }

  const pts = actions.filter(a => a.outcome === 'Ace' || a.outcome === 'Ponto').length
  const errs = actions.filter(a => a.outcome === 'Erro').length

  // Group by player
  const byPlayer = {}
  for (const a of actions) {
    if (!byPlayer[a.player_id]) byPlayer[a.player_id] = { name: a.player_name, number: a.player_number, color: a.team_color, total: 0, byAction: {} }
    const p = byPlayer[a.player_id]
    p.total++
    if (!p.byAction[a.action_key]) p.byAction[a.action_key] = { total: 0, outcomes: {} }
    p.byAction[a.action_key].total++
    p.byAction[a.action_key].outcomes[a.outcome] = (p.byAction[a.action_key].outcomes[a.outcome] || 0) + 1
  }

  const playerStats = Object.values(byPlayer).sort((a, b) => b.total - a.total)

  const eff = (p, ak, pos, neg) => {
    const x = p.byAction[ak]
    if (!x || !x.total) return '—'
    let pv = 0, nv = 0
    for (const o of pos) pv += (x.outcomes[o] || 0)
    for (const o of neg) nv += (x.outcomes[o] || 0)
    return Math.round((pv - nv) / x.total * 100) + '%'
  }

  const exportWhatsApp = () => {
    let t = `🏐 *ASV — RELATÓRIO GERAL*\n${games.length} jogos\n\n`
    for (const g of games) {
      t += `*${g.team_name} vs ${g.opponent}* · ${g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString('pt-BR') : ''}\n`
      if (g.sets?.length) t += `Sets: ${g.sets.map(s => `${s.us}-${s.them}`).join('/')}\n`
      t += '\n'
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank')
  }

  return (
    <>
      <div className="cd" style={{ padding: 9, marginBottom: 10 }}>
        <div className="rw">
          <div style={{ flex: 1 }}>
            <span className="lb">Equipe</span>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
              <option value="all">Todas</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <span className="lb">Jogo</span>
            <select value={filterGame} onChange={e => setFilterGame(e.target.value)}>
              <option value="all">Todos</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.team_name} vs {g.opponent}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
        {[['Ações', actions.length, '#c9a84c'], ['Pontos', pts, '#10b981'], ['Erros', errs, '#ef4444']].map(([label, val, color]) => (
          <div key={label} className="cd" style={{ textAlign: 'center', padding: 10, background: color + '10' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color }}>{val}</div>
            <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="cd" style={{ overflow: 'auto' }}>
        <b style={{ fontSize: 11, display: 'block', marginBottom: 7 }}>Por Atleta</b>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                {['Atleta', 'Ações', 'Atq%', 'Saq%', 'Rec%', 'Bloq', 'Err'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {playerStats.map(p => {
                const recA = p.byAction.recepcao?.outcomes?.A || 0
                const blkPts = p.byAction.bloqueio?.outcomes?.Ponto || 0
                let totalErr = 0
                Object.values(p.byAction).forEach(a => totalErr += (a.outcomes.Erro || 0))
                return (
                  <tr key={p.number + p.name}>
                    <td><span style={{ fontWeight: 800, color: p.color }}>#{p.number}</span> {p.name.split(' ')[0]}</td>
                    <td style={{ fontWeight: 700 }}>{p.total}</td>
                    <td style={{ fontWeight: 700 }}>{eff(p, 'ataque', ['Ponto'], ['Erro', 'Bloq'])}</td>
                    <td style={{ fontWeight: 700 }}>{eff(p, 'saque', ['Ace'], ['Erro'])}</td>
                    <td style={{ fontWeight: 700 }}>{p.byAction.recepcao ? Math.round(recA / p.byAction.recepcao.total * 100) + '%' : '—'}</td>
                    <td>{blkPts}</td>
                    <td style={{ color: '#ef4444' }}>{totalErr}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <button className="bt bp" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={exportWhatsApp}>
        📤 Exportar Tudo (WhatsApp)
      </button>
    </>
  )
}
