/**
 * SQLite 数据库管理（使用 sql.js，纯 JS 实现）
 * 无需原生编译，完全跨平台
 */

import initSqlJs, { type Database } from 'sql.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_DB_PATH = '.runtime/state.db';

let dbInstance: Database | null = null;
let dbPath: string = DEFAULT_DB_PATH;

export async function getDb(path: string = DEFAULT_DB_PATH): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbPath = resolve(path);
  const dir = dirname(dbPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();

  return dbInstance;
}

/** 每次写操作后调用，把内存数据库写入文件 */
export function saveDb(): void {
  if (!dbInstance) return;
  const data = dbInstance.export();
  writeFileSync(dbPath, Buffer.from(data));
}

export function closeDb(): void {
  if (dbInstance) {
    saveDb();
    dbInstance.close();
    dbInstance = null;
  }
}

function initSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      user_idea TEXT NOT NULL,
      project_path TEXT NOT NULL,
      current_stage INTEGER NOT NULL DEFAULT 0,
      stage_status TEXT NOT NULL DEFAULT 'not_started',
      total_tokens INTEGER NOT NULL DEFAULT 0,
      total_cost_usd REAL NOT NULL DEFAULT 0,
      stage_timings TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      stage INTEGER,
      role TEXT,
      event_type TEXT NOT NULL,
      model TEXT,
      tokens_in INTEGER,
      tokens_out INTEGER,
      duration_ms INTEGER,
      cost_usd REAL,
      details TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS human_decisions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      stage INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT,
      recommended_option TEXT,
      reasoning TEXT,
      answer TEXT,
      created_at TEXT NOT NULL,
      answered_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gate_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      stage INTEGER NOT NULL,
      decision TEXT NOT NULL,
      checked_items TEXT NOT NULL,
      issues TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checkpoints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      stage INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      git_commit TEXT,
      created_at TEXT NOT NULL
    )
  `);
}
