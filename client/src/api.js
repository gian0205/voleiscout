const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
}

export const api = {
  getTeams: () => request('/teams'),
  addPlayer: (teamId, data) => request(`/teams/${teamId}/players`, { method: 'POST', body: data }),
  deletePlayer: (id) => request(`/players/${id}`, { method: 'DELETE' }),

  getGames: (teamId) => request('/games' + (teamId ? `?team_id=${teamId}` : '')),
  addGame: (data) => request('/games', { method: 'POST', body: data }),
  updateGame: (id, data) => request(`/games/${id}`, { method: 'PUT', body: data }),
  deleteGame: (id) => request(`/games/${id}`, { method: 'DELETE' }),

  getSets: (gameId) => request(`/games/${gameId}/sets`),
  updateSet: (gameId, data) => request(`/games/${gameId}/sets`, { method: 'PUT', body: data }),

  getActions: (gameId) => request(`/games/${gameId}/actions`),
  addAction: (gameId, data) => request(`/games/${gameId}/actions`, { method: 'POST', body: data }),
  deleteAction: (id) => request(`/actions/${id}`, { method: 'DELETE' }),

  getStats: (teamId, gameId) => {
    const p = new URLSearchParams();
    if (teamId) p.set('team_id', teamId);
    if (gameId) p.set('game_id', gameId);
    const q = p.toString();
    return request('/stats' + (q ? `?${q}` : ''));
  },
};
