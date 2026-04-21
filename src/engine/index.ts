/**
 * 工作流引擎主类
 */

import type { ProjectState, StageNumber } from '../types/index.js';
import { ProjectManager } from '../storage/project.js';
import { getStage } from './stages.js';

export class WorkflowEngine {
  private projects: ProjectManager;

  constructor() {
    this.projects = new ProjectManager();
  }

  async createProject(params: {
    name: string;
    userIdea: string;
    projectPath: string;
  }): Promise<ProjectState> {
    return this.projects.create(params);
  }

  async getProject(id: string): Promise<ProjectState | null> {
    return this.projects.get(id);
  }

  async listProjects(): Promise<ProjectState[]> {
    return this.projects.list();
  }

  async getCurrentStage(projectId: string) {
    const project = await this.projects.get(projectId);
    if (!project) return null;
    return getStage(project.currentStage);
  }

  async advanceStage(projectId: string): Promise<StageNumber | null> {
    const project = await this.projects.get(projectId);
    if (!project) return null;
    if (project.currentStage >= 7) return null;

    const nextStage = (project.currentStage + 1) as StageNumber;
    await this.projects.updateStage(projectId, nextStage, 'not_started');
    return nextStage;
  }

  getProjectManager(): ProjectManager {
    return this.projects;
  }
}
