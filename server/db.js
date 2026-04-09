import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = process.env.DB_PATH || './data/voleiscout.db';
mkdirSync(dirname(DB_PATH), { recursive: true });

const SQL = await initSqlJs();
let db;

if (existsSync(DB_PATH)) {
  const buf = readFileSync(DB_PATH);
  db = new SQL.Database(buf);
} else {
  db = new SQL.Database();
}

function save() {
  const data = db.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

// Helper: run + save
function run(sql, params = []) {
  db.run(sql, params);
  save();
}

// Helper: get all rows
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: get one row
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// Init tables
db.run(`
  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL, rs INTEGER DEFAULT 0
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS players (
    id TEXT PRIMARY KEY, team_id TEXT NOT NULL, name TEXT NOT NULL,
    number INTEGER NOT NULL, position TEXT NOT NULL
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY, team_id TEXT NOT NULL, tournament TEXT, date TEXT,
    time TEXT, opponent TEXT NOT NULL, location TEXT, status TEXT DEFAULT 'pending'
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS game_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT, game_id TEXT NOT NULL,
    set_number INTEGER NOT NULL, us INTEGER DEFAULT 0, them INTEGER DEFAULT 0
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS actions (
    id TEXT PRIMARY KEY, game_id TEXT NOT NULL, player_id TEXT NOT NULL,
    action_key TEXT NOT NULL, outcome TEXT NOT NULL,
    set_number INTEGER NOT NULL, timestamp INTEGER DEFAULT 0
  )
`);

// Seed
const count = get('SELECT COUNT(*) as c FROM teams');
if (count.c === 0) {
  const teams = [
    ['t1', 'C-RS', '#38bdf8', 1], ['t2', 'C-S', '#a78bfa', 0],
    ['t3', 'C2', '#f59e0b', 0], ['t4', 'D1', '#10b981', 0],
    ['t5', 'D2-RS', '#f97316', 1], ['t6', 'D-RS', '#ec4899', 1],
    ['t7', 'ADULTO-RS', '#06b6d4', 1], ['t8', 'MASC', '#6366f1', 0],
  ];
  for (const [id, name, color, rs] of teams) {
    db.run('INSERT INTO teams (id, name, color, rs) VALUES (?, ?, ?, ?)', [id, name, color, rs]);
  }

  const TM = { 'C-RS': 't1', 'C- S': 't2', 'C-S': 't2', 'C2': 't3', 'D1': 't4', 'D2 - RS': 't5', 'D2-RS': 't5', 'D- RS': 't6', 'D-RS': 't6', 'ADULTO-RS': 't7', 'ADULTO - RS': 't7', 'MASCULINO': 't8', 'MASC': 't8' };
  const games = [
    ['Indiano','2026-03-28','17:30','D2 - RS','INDIANO','CRINGE'],
    ['Taça SP','2026-03-29','13:30','ADULTO-RS','BHANN','APAV/NOVA GERAÇÃO'],
    ['SindClube','2026-03-31','21:00','D1','TCP','TCP'],
    ['SindClube','2026-03-31','21:00','D2-RS','TCP','TCP'],
    ['SindClube','2026-04-02','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-04-07','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-04-07','21:00','D2-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-04-09','21:00','C-RS','SindClube','AABB'],
    ['Indiano','2026-04-11','17:30','D2 - RS','INDIANO','A DEFINIR'],
    ['SindClube','2026-04-14','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-04-14','21:00','D2-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-04-16','21:00','C-RS','SindClube','A DEFINIR'],
    ['Indiano','2026-04-25','17:30','D2 - RS','INDIANO','A DEFINIR'],
    ['SindClube','2026-04-28','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-04-28','21:00','D2-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-04-30','21:00','C-RS','SindClube','A DEFINIR'],
    ['Indiano','2026-05-09','17:30','D2 - RS','INDIANO','A DEFINIR'],
    ['SindClube','2026-05-05','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-05-05','21:00','D2-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-05-07','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-05-12','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-05-14','21:00','C-RS','SindClube','A DEFINIR'],
    ['Indiano','2026-05-23','17:30','D2 - RS','INDIANO','A DEFINIR'],
    ['SindClube','2026-05-19','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-05-19','21:00','D2-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-05-21','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-05-26','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-05-28','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-06-02','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-06-04','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-06-09','21:00','D1','SindClube','A DEFINIR'],
    ['SindClube','2026-06-11','21:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-06-21','10:00','C-RS','SindClube','CAMPO BELO-M'],
    ['SindClube','2026-06-21','11:00','C-S','SindClube','CAMPO BELO-T'],
    ['SindClube','2026-06-21','14:00','ADULTO-RS','SindClube','CAMPO BELO'],
    ['SindClube','2026-06-21','15:00','MASCULINO','SindClube','CAMPO BELO'],
    ['SindClube','2026-08-15','10:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-08-15','11:00','C-S','SindClube','A DEFINIR'],
    ['SindClube','2026-08-15','14:00','C2','SindClube','A DEFINIR'],
    ['SindClube','2026-08-15','15:00','ADULTO-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-08-15','16:00','MASCULINO','SindClube','A DEFINIR'],
    ['SindClube','2026-09-20','10:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-09-20','11:00','C-S','SindClube','A DEFINIR'],
    ['SindClube','2026-09-20','14:00','C2','SindClube','A DEFINIR'],
    ['SindClube','2026-09-20','15:00','ADULTO-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-09-20','16:00','MASCULINO','SindClube','A DEFINIR'],
    ['SindClube','2026-10-18','10:00','C-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-10-18','11:00','C-S','SindClube','A DEFINIR'],
    ['SindClube','2026-10-18','14:00','C2','SindClube','A DEFINIR'],
    ['SindClube','2026-10-18','15:00','ADULTO-RS','SindClube','A DEFINIR'],
    ['SindClube','2026-10-18','16:00','MASCULINO','SindClube','A DEFINIR'],
    ['SindClube','2026-11-22','10:00','D- RS','SindClube','A DEFINIR'],
    ['SindClube','2026-11-22','14:00','D2 - RS','SindClube','A DEFINIR'],
  ];
  for (let i = 0; i < games.length; i++) {
    const [tor, dt, tm, cat, loc, opp] = games[i];
    const tid = TM[cat] || 't1';
    db.run('INSERT INTO games (id, tournament, date, time, team_id, location, opponent) VALUES (?, ?, ?, ?, ?, ?, ?)', [`g${i}`, tor, dt, tm, tid, loc, opp]);
  }
  save();
}

export default { run, all, get, save };
