import { useState, useEffect } from 'react'
import { api } from '../api'
import { POS } from '../data'

export default function Config() {
  const [sub, setSub] = useState('teams')
  const [teams, setTeams] = useState([])
  const [games, setGames] = useState([])
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState({})
  const [showNewGame, setShowNewGame] = useState(false)

  const load = () => {
    api.getTeams().then(setTeams)
    api.getGames().then(setGames)
  }
  useEffect(load, [])

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const addPlayer = async (teamId, form) => {
    const name = form.get('name'), number = parseInt(form.get('number')), position = form.get('position')
    if (!name || !number) return
    await api.addPlayer(teamId, { name, number, position })
    load()
  }

  const deletePlayer = async (id) => {
    await api.deletePlayer(id)
    load()
  }

  const addGame = async (e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    await api.addGame({
      team_id: fd.get('team_id'), tournament: fd.get('tournament') || 'Avulso',
      date: fd.get('date'), time: fd.get('time'),
      opponent: fd.get('opponent'), location: fd.get('location'),
    })
    e.target.reset()
    setShowNewGame(false)
    load()
  }

  const deleteGame = async (id) => {
    if (!confirm('Remover jogo?')) return
    await api.deleteGame(id)
    load()
  }

  const editGame = async (g) => {
    const date = prompt('Data (AAAA-MM-DD):', g.date || '')
    if (date === null) return
    const time = prompt('Horário (HH:MM):', g.time || '')
    if (time === null) return
    await api.updateGame(g.id, { date, time })
    load()
  }

  const filteredGames = filter === 'all' ? games : games.filter(g => g.team_id === filter)

  const grouped = {}
  for (const g of filteredGames) {
    const k = g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '📌 A Definir'
    if (!grouped[k]) grouped[k] = []
    grouped[k].push(g)
  }

  return (
    <>
      <div className="stb">
        <button className={sub === 'teams' ? 'on' : ''} onClick={() => setSub('teams')}>👥 Equipes</button>
        <button className={sub === 'games' ? 'on' : ''} onClick={() => setSub('games')}>📅 Jogos</button>
      </div>

      {sub === 'teams' && teams.map(t => (
        <div key={t.id} className="cd" style={{ borderLeft: `3px solid ${t.color}`, padding: 0, overflow: 'hidden' }}>
          <div onClick={() => toggleExpand(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }}>
            <div style={{ flex: 1, fontWeight: 700 }}>{t.name}</div>
            <span className="badge" style={{ background: t.color + '20', color: t.color }}>{t.players.length} atletas</span>
            <span className="badge" style={{ background: '#c9a84c20', color: '#c9a84c' }}>{t.gameCount} jogos</span>
          </div>
          {expanded[t.id] && (
            <div style={{ padding: '0 12px 12px', borderTop: '1px solid #1e293b' }}>
              <form onSubmit={(e) => { e.preventDefault(); addPlayer(t.id, new FormData(e.target)); e.target.reset() }} style={{ display: 'flex', gap: 4, margin: '8px 0' }}>
                <input name="number" type="number" placeholder="Nº" style={{ width: 48 }} required />
                <input name="name" placeholder="Nome" style={{ flex: 1 }} required />
                <select name="position" style={{ width: 100 }}>
                  {POS.map(p => <option key={p}>{p}</option>)}
                </select>
                <button type="submit" className="bt bs bsm">✓</button>
              </form>
              {t.players.length === 0 && <div style={{ color: '#64748b', fontSize: 11, textAlign: 'center', padding: 8 }}>Nenhuma atleta</div>}
              {t.players.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
                  <span style={{ background: t.color + '30', color: t.color, fontWeight: 800, fontSize: 12, padding: '2px 6px', borderRadius: 4, minWidth: 28, textAlign: 'center' }}>{p.number}</span>
                  <span style={{ flex: 1, fontSize: 12 }}>{p.name}</span>
                  <span style={{ fontSize: 9, color: '#64748b' }}>{p.position}</span>
                  <button className="bt bd bsm" onClick={() => deletePlayer(p.id)} style={{ padding: '2px 5px', fontSize: 9 }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {sub === 'games' && (
        <>
          <div className="rw" style={{ marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <span className="lb">Filtrar</span>
              <select value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">Todas</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button className="bt bp bsm" onClick={() => setShowNewGame(!showNewGame)}>+ Novo Jogo</button>
          </div>

          {showNewGame && (
            <form className="cd" style={{ borderColor: 'rgba(201,168,76,.3)' }} onSubmit={addGame}>
              <b>📅 Novo Jogo</b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <div className="rw">
                  <div style={{ flex: 1 }}><span className="lb">Data</span><input name="date" type="date" /></div>
                  <div style={{ flex: 1 }}><span className="lb">Hora</span><input name="time" type="time" /></div>
                </div>
                <div><span className="lb">Equipe</span>
                  <select name="team_id">{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                </div>
                <div className="rw">
                  <div style={{ flex: 1 }}><span className="lb">Adversário</span><input name="opponent" required /></div>
                  <div style={{ flex: 1 }}><span className="lb">Local</span><input name="location" /></div>
                </div>
                <div><span className="lb">Torneio</span><input name="tournament" /></div>
                <button type="submit" className="bt bp" style={{ width: '100%', justifyContent: 'center' }}>Criar Jogo</button>
              </div>
            </form>
          )}

          {Object.entries(grouped).map(([month, gs]) => (
            <div key={month}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', letterSpacing: 1, padding: '5px 3px', margin: '8px 0 5px', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' }}>{month}</div>
              {gs.map(g => {
                const statusColor = g.status === 'done' ? '#10b981' : g.status === 'live' ? '#eab308' : '#64748b'
                const statusLabel = g.status === 'done' ? '✓ Fim' : g.status === 'live' ? '● LIVE' : 'Pend'
                return (
                  <div key={g.id} className="cd" style={{ padding: '9px 11px', borderLeft: `3px solid ${g.team_color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ fontWeight: 800, fontSize: 13 }}>{g.opponent}</span>
                          <span style={{ fontSize: 9, color: '#64748b' }}>({g.team_name})</span>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                          {g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}
                          {g.time ? ` ${g.time.substring(0, 5)}` : ''} · {g.tournament} · {g.location}
                        </div>
                        <div style={{ marginTop: 3 }}>
                          <span className="badge" style={{ background: statusColor + '20', color: statusColor }}>{statusLabel}</span>
                          {g.sets && g.sets.length > 0 && (
                            <span className="badge" style={{ background: '#c9a84c20', color: '#c9a84c', marginLeft: 4 }}>
                              {g.sets.map(s => `${s.us}-${s.them}`).join('/')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="bt bg bsm" style={{ padding: '3px 5px' }} onClick={() => editGame(g)}>✏️</button>
                        <button className="bt bg bsm" style={{ padding: '3px 5px' }} onClick={() => deleteGame(g.id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </>
      )}
    </>
  )
}
