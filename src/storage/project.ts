/**
 * 项目状态的增删改查（sql.js 版）
 */

import { randomUUID } from 'node:crypto';
import { getDb, saveDb } from './db.js';
import type { ProjectState, StageNumber, StageStatus } from '../types/index.js';

export class ProjectManager {
  async create(params: {
    name: string;
    userIdea: string;
    projectPath: string;
  }): Promise<ProjectState> {
    const now = new Date();
    const id = randomUUID();

    const state: ProjectState = {
      id,
      name: params.name,
      userIdea: params.userIdea,
      projectPath: params.projectPath,
      currentStage: 0,
      stageStatus: 'not_started',
      createdAt: now,
      updatedAt: now,
      stats: {
        totalTokens: 0,
        totalCostUsd: 0,
        stageTimings: {},
      },
    };

    const db = await getDb();
    db.run(
      `INSERT INTO projects (
        id, name, user_idea, project_path, current_stage, stage_status,
        total_tokens, total_cost_usd, stage_timings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        state.id,
        state.name,
        state.userIdea,
        state.projectPath,
        state.currentStage,
        state.stageStatus,
        state.stats.totalTokens,
        state.stats.totalCostUsd,
        JSON.stringify(state.stats.stageTimings),
        now.toISOString(),
        now.toISOString(),
      ]
    );
    saveDb();

    return state;
  }

  async get(id: string): Promise<ProjectState | null> {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
    stmt.bind([id]);
    if (!stmt.step()) {
      stmt.free();
      return null;
    }
    const row = stmt.getAsObject();
    stmt.free();
    return this.rowToState(row);
  }

  async list(): Promise<ProjectState[]> {
    const db = await getDb();
    const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
    const rows: ProjectState[] = [];
    while (stmt.step()) {
      rows.push(this.rowToState(stmt.getAsObject()));
    }
    stmt.free();
    return rows;
  }

  async updateStage(id: string, stage: StageNumber, status: StageStatus): Promise<void> {
    const db = await getDb();
    db.run(
      `UPDATE projects
       SET current_stage = ?, stage_status = ?, updated_at = ?
       WHERE id = ?`,
      [stage, status, new Date().toISOString(), id]
    );
    saveDb();
  }

  async addUsage(id: string, tokens: number, costUsd: number): Promise<void> {
    const db = await getDb();
    db.run(
      `UPDATE projects
       SET total_tokens = total_tokens + ?,
           total_cost_usd = total_cost_usd + ?,
           updated_at = ?
       WHERE id = ?`,
      [tokens, costUsd, new Date().toISOString(), id]
    );
    saveDb();
  }

  async recordStageTiming(id: string, stage: StageNumber, durationMs: number): Promise<void> {
    const state = await this.get(id);
    if (!state) return;
    state.stats.stageTimings[stage] = durationMs;

    const db = await getDb();
    db.run(
      `UPDATE projects SET stage_timings = ?, updated_at = ? WHERE id = ?`,
      [JSON.stringify(state.stats.stageTimings), new Date().toISOString(), id]
    );
    saveDb();
  }

  private rowToState(row: Record<string, unknown>): ProjectState {
    return {
      id: String(row.id),
      name: String(row.name),
      userIdea: String(row.user_idea),
      projectPath: String(row.project_path),
      currentStage: Number(row.current_stage) as StageNumber,
      stageStatus: String(row.stage_status) as StageStatus,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
      stats: {
        totalTokens: Number(row.total_tokens),
        totalCostUsd: Number(row.total_cost_usd),
        stageTimings: JSON.parse(String(row.stage_timings)),
      },
    };
  }
}
