import { useState, useEffect, useRef } from 'react'
import { api } from '../api'
import { ACT, OC_COLORS } from '../data'

export default function Scout() {
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [activeGame, setActiveGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [actions, setActions] = useState([])
  const [sets, setSets] = useState([])
  const [selPlayer, setSelPlayer] = useState(null)
  const [selAction, setSelAction] = useState(null)
  const [currentSet, setCurrentSet] = useState(1)
  const [timer, setTimer] = useState(0)
  const [running, setRunning] = useState(false)
  const [undoStack, setUndoStack] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    api.getGames().then(g => setGames(g.filter(x => x.status !== 'done')))
    api.getTeams().then(setTeams)
  }, [])

  const startScout = async (game) => {
    await api.updateGame(game.id, { status: 'live' })
    const team = teams.find(t => t.id === game.team_id)
    setPlayers(team?.players || [])
    const s = await api.getSets(game.id)
    if (s.length === 0) {
      const newSets = await api.updateSet(game.id, { set_number: 1, us: 0, them: 0 })
      setSets(newSets)
    } else {
      setSets(s)
      setCurrentSet(s.length)
    }
    const acts = await api.getActions(game.id)
    setActions(acts)
    setActiveGame({ ...game, status: 'live' })
    setTimer(0)
    setRunning(false)
    setUndoStack([])
    setSelPlayer(null)
    setSelAction(null)
  }

  const exitScout = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setActiveGame(null)
    setRunning(false)
    api.getGames().then(g => setGames(g.filter(x => x.status !== 'done')))
  }

  const toggleTimer = () => {
    if (running) {
      clearInterval(timerRef.current)
      setRunning(false)
    } else {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
      setRunning(true)
    }
  }

  const recordOutcome = async (outcome) => {
    if (!selPlayer || !selAction || !activeGame) return
    const { id: actionId } = await api.addAction(activeGame.id, {
      player_id: selPlayer, action_key: selAction, outcome, set_number: currentSet, timestamp: timer,
    })
    const isPoint = outcome === 'Ace' || outcome === 'Ponto'
    const isError = outcome === 'Erro'
    const cur = sets.find(s => s.set_number === currentSet) || { us: 0, them: 0 }
    if (isPoint || isError) {
      const newSets = await api.updateSet(activeGame.id, {
        set_number: currentSet, us: cur.us + (isPoint ? 1 : 0), them: cur.them + (isError ? 1 : 0),
      })
      setSets(newSets)
    }
    setUndoStack(u => [...u, { actionId, scored: isPoint ? 'us' : isError ? 'them' : null }])
    const acts = await api.getActions(activeGame.id)
    setActions(acts)
    setSelAction(null)
  }

  const addOpponentPoint = async () => {
    if (!activeGame) return
    const cur = sets.find(s => s.set_number === currentSet) || { us: 0, them: 0 }
    const newSets = await api.updateSet(activeGame.id, { set_number: currentSet, us: cur.us, them: cur.them + 1 })
    setSets(newSets)
    setUndoStack(u => [...u, { actionId: null, scored: 'them' }])
  }

  const undo = async () => {
    if (undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    if (last.actionId) await api.deleteAction(last.actionId)
    if (last.scored) {
      const cur = sets.find(s => s.set_number === currentSet) || { us: 0, them: 0 }
      await api.updateSet(activeGame.id, {
        set_number: currentSet,
        us: cur.us - (last.scored === 'us' ? 1 : 0),
        them: cur.them - (last.scored === 'them' ? 1 : 0),
      })
      const s = await api.getSets(activeGame.id)
      setSets(s)
    }
    const acts = await api.getActions(activeGame.id)
    setActions(acts)
    setUndoStack(u => u.slice(0, -1))
  }

  const nextSet = async () => {
    const newSetNum = currentSet + 1
    const newSets = await api.updateSet(activeGame.id, { set_number: newSetNum, us: 0, them: 0 })
    setSets(newSets)
    setCurrentSet(newSetNum)
    setTimer(0)
  }

  const endGame = async () => {
    if (!confirm('Finalizar jogo?')) return
    await api.updateGame(activeGame.id, { status: 'done' })
    if (timerRef.current) clearInterval(timerRef.current)
    exitScout()
  }

  const mm = String(Math.floor(timer / 60)).padStart(2, '0')
  const ss = String(timer % 60).padStart(2, '0')
  const curSet = sets.find(s => s.set_number === currentSet) || { us: 0, them: 0 }

  if (!activeGame) {
    return (
      <>
        <b style={{ fontSize: 14, display: 'block', marginBottom: 10 }}>Selecione um jogo</b>
        {games.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>📋 Nenhum pendente</div>}
        {games.map(g => (
          <div key={g.id} className="cd" style={{ cursor: 'pointer', borderLeft: `3px solid ${g.team_color}`, padding: 10 }} onClick={() => startScout(g)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{g.team_name}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>vs</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{g.opponent}</span>
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              {g.date ? new Date(g.date + 'T12:00:00').toLocaleDateString('pt-BR') : 'A definir'}
              {g.time ? ` ${g.time.substring(0, 5)}` : ''} · {g.tournament}
            </div>
          </div>
        ))}
      </>
    )
  }

  const sortedPlayers = [...players].sort((a, b) => a.number - b.number)

  return (
    <div className="sa">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <button className="bt bg bsm" onClick={exitScout}>← Jogos</button>
        <span style={{ fontSize: 10, color: '#64748b' }}>Set {currentSet}</span>
        <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'monospace' }}>{mm}:{ss}</span>
        <div style={{ display: 'flex', gap: 3 }}>
          <button className="bt bg bsm" onClick={toggleTimer}>{running ? '⏸' : '▶'}</button>
          <button className="bt bg bsm" onClick={undo}>↩</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>{activeGame.team_name}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#c9a84c' }}>{curSet.us}</div>
        </div>
        <div style={{ fontSize: 14, color: '#64748b' }}>×</div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>{activeGame.opponent}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#94a3b8' }}>{curSet.them}</div>
        </div>
      </div>

      {sets.length > 1 && (
        <div style={{ textAlign: 'center', marginTop: 3, fontSize: 10, color: '#64748b' }}>
          Sets: {sets.map(s => `${s.us}-${s.them}`).join(' | ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: 5, marginTop: 7, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="bt bg bsm" style={{ fontSize: 10 }} onClick={addOpponentPoint}>+1 Adv</button>
        <button className="bt bo bsm" style={{ fontSize: 10 }} onClick={nextSet}>Próx Set</button>
        <button className="bt bd bsm" style={{ fontSize: 10 }} onClick={endGame}>Fim</button>
      </div>

      <div style={{ padding: '8px 0 4px' }}>
        <span className="lb">Atleta</span>
        <div className="ga" style={{ marginTop: 3 }}>
          {sortedPlayers.map(p => (
            <button key={p.id} className={`pb ${selPlayer === p.id ? 'on' : ''}`}
              style={selPlayer === p.id ? { borderColor: activeGame.team_color, background: activeGame.team_color + '20' } : {}}
              onClick={() => { setSelPlayer(p.id); setSelAction(null) }}>
              <div className="pbn">{p.number}</div>
              <div className="pbnm">{p.name.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {selPlayer && (
        <div style={{ padding: '0 0 4px' }}>
          <span className="lb">Fundamento</span>
          <div className="g3" style={{ marginTop: 3 }}>
            {Object.entries(ACT).map(([k, a]) => (
              <button key={k} className={`ab ${selAction === k ? 'on' : ''}`} onClick={() => setSelAction(k)}>
                {a.i} {a.l}
              </button>
            ))}
          </div>
        </div>
      )}

      {selPlayer && selAction && (
        <div style={{ padding: '0 0 4px' }}>
          <span className="lb">Resultado</span>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ACT[selAction].o.length}, 1fr)`, gap: 4, marginTop: 3 }}>
            {ACT[selAction].o.map(oc => (
              <button key={oc} className="bt" onClick={() => recordOutcome(oc)}
                style={{ justifyContent: 'center', background: OC_COLORS[oc] + '20', color: OC_COLORS[oc], border: `1px solid ${OC_COLORS[oc]}40` }}>
                {oc}
              </button>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ padding: '8px 0' }}>
          <span className="lb">Últimas</span>
          {actions.slice(-5).reverse().map(a => (
            <div key={a.id} style={{ fontSize: 10, color: '#94a3b8', padding: '2px 0', display: 'flex', gap: 6 }}>
              <span style={{ fontWeight: 800 }}>#{a.player_number}</span>
              <span>{ACT[a.action_key]?.l || a.action_key}</span>
              <span style={{ color: OC_COLORS[a.outcome] || '#94a3b8', fontWeight: 700 }}>{a.outcome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
