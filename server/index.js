import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());

const publicDir = join(__dirname, 'public');
if (existsSync(publicDir)) app.use(express.static(publicDir));

// --- TEAMS ---
app.get('/api/teams', (req, res) => {
  const teams = db.all('SELECT * FROM teams ORDER BY id');
  for (const t of teams) {
    t.players = db.all('SELECT * FROM players WHERE team_id = ? ORDER BY number', [t.id]);
    t.gameCount = db.get('SELECT COUNT(*) as c FROM games WHERE team_id = ?', [t.id]).c;
  }
  res.json(teams);
});

app.post('/api/teams/:id/players', (req, res) => {
  const { name, number, position } = req.body;
  const id = `p${Date.now()}`;
  db.run('INSERT INTO players (id, team_id, name, number, position) VALUES (?, ?, ?, ?, ?)', [id, req.params.id, name, number, position]);
  res.json({ id, team_id: req.params.id, name, number, position });
});

app.delete('/api/players/:id', (req, res) => {
  db.run('DELETE FROM players WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- GAMES ---
app.get('/api/games', (req, res) => {
  let sql = 'SELECT g.*, t.name as team_name, t.color as team_color FROM games g JOIN teams t ON g.team_id = t.id';
  const params = [];
  if (req.query.team_id) { sql += ' WHERE g.team_id = ?'; params.push(req.query.team_id); }
  sql += ' ORDER BY g.date, g.time';
  const games = db.all(sql, params);
  for (const g of games) {
    g.sets = db.all('SELECT * FROM game_sets WHERE game_id = ? ORDER BY set_number', [g.id]);
  }
  res.json(games);
});

app.post('/api/games', (req, res) => {
  const { team_id, tournament, date, time, opponent, location } = req.body;
  const id = `g${Date.now()}`;
  db.run('INSERT INTO games (id, team_id, tournament, date, time, opponent, location) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, team_id, tournament || 'Avulso', date || '', time || '', opponent, location || '']);
  res.json({ id });
});

app.put('/api/games/:id', (req, res) => {
  const { date, time, status } = req.body;
  if (date !== undefined) db.run('UPDATE games SET date = ? WHERE id = ?', [date, req.params.id]);
  if (time !== undefined) db.run('UPDATE games SET time = ? WHERE id = ?', [time, req.params.id]);
  if (status !== undefined) db.run('UPDATE games SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ ok: true });
});

app.delete('/api/games/:id', (req, res) => {
  db.run('DELETE FROM game_sets WHERE game_id = ?', [req.params.id]);
  db.run('DELETE FROM actions WHERE game_id = ?', [req.params.id]);
  db.run('DELETE FROM games WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- SETS ---
app.get('/api/games/:id/sets', (req, res) => {
  res.json(db.all('SELECT * FROM game_sets WHERE game_id = ? ORDER BY set_number', [req.params.id]));
});

app.put('/api/games/:id/sets', (req, res) => {
  const { set_number, us, them } = req.body;
  const existing = db.get('SELECT id FROM game_sets WHERE game_id = ? AND set_number = ?', [req.params.id, set_number]);
  if (existing) {
    db.run('UPDATE game_sets SET us = ?, them = ? WHERE id = ?', [us, them, existing.id]);
  } else {
    db.run('INSERT INTO game_sets (game_id, set_number, us, them) VALUES (?, ?, ?, ?)', [req.params.id, set_number, us, them]);
  }
  res.json(db.all('SELECT * FROM game_sets WHERE game_id = ? ORDER BY set_number', [req.params.id]));
});

// --- ACTIONS ---
app.get('/api/games/:id/actions', (req, res) => {
  res.json(db.all(`
    SELECT a.*, p.name as player_name, p.number as player_number
    FROM actions a JOIN players p ON a.player_id = p.id
    WHERE a.game_id = ? ORDER BY a.id
  `, [req.params.id]));
});

app.post('/api/games/:id/actions', (req, res) => {
  const { player_id, action_key, outcome, set_number, timestamp } = req.body;
  const id = `a${Date.now()}`;
  db.run('INSERT INTO actions (id, game_id, player_id, action_key, outcome, set_number, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, req.params.id, player_id, action_key, outcome, set_number, timestamp || 0]);
  res.json({ id });
});

app.delete('/api/actions/:id', (req, res) => {
  db.run('DELETE FROM actions WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// --- STATS ---
app.get('/api/stats', (req, res) => {
  let sql = `
    SELECT a.*, p.name as player_name, p.number as player_number, p.team_id,
           t.name as team_name, t.color as team_color
    FROM actions a
    JOIN players p ON a.player_id = p.id
    JOIN teams t ON p.team_id = t.id
    JOIN games g ON a.game_id = g.id
    WHERE g.status = 'done'
  `;
  const params = [];
  if (req.query.team_id) { sql += ' AND p.team_id = ?'; params.push(req.query.team_id); }
  if (req.query.game_id) { sql += ' AND a.game_id = ?'; params.push(req.query.game_id); }
  res.json(db.all(sql, params));
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = join(publicDir, 'index.html');
  if (existsSync(indexPath)) res.sendFile(indexPath);
  else res.status(404).send('Not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
