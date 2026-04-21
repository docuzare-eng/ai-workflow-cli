/**
 * Git 操作工具
 */

import simpleGit, { type SimpleGit } from 'simple-git';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export class GitHelper {
  private git: SimpleGit;
  private workDir: string;

  constructor(workDir: string) {
    this.workDir = resolve(workDir);
    this.git = simpleGit(this.workDir);
  }

  /** 检查目录是否已经是 Git 仓库 */
  async isRepo(): Promise<boolean> {
    try {
      return await this.git.checkIsRepo();
    } catch {
      return false;
    }
  }

  /** 初始化 Git 仓库（如果还不是） */
  async initIfNeeded(): Promise<boolean> {
    if (await this.isRepo()) return false;
    await this.git.init();
    return true;
  }

  /** 添加并提交（单个或全部） */
  async commit(message: string, files?: string[]): Promise<string> {
    if (files && files.length > 0) {
      await this.git.add(files);
    } else {
      await this.git.add('.');
    }

    // 检查有没有待提交的变更
    const status = await this.git.status();
    if (status.files.length === 0) {
      return '(no changes to commit)';
    }

    const result = await this.git.commit(message);
    return result.commit;
  }

  /** 配置用户信息（首次初始化时可能需要） */
  async ensureUserConfig(): Promise<void> {
    try {
      const name = await this.git.getConfig('user.name', 'local');
      const email = await this.git.getConfig('user.email', 'local');
      if (!name.value) {
        await this.git.addConfig('user.name', 'AI Workflow', false, 'local');
      }
      if (!email.value) {
        await this.git.addConfig('user.email', 'ai-workflow@local', false, 'local');
      }
    } catch {
      // ignore
    }
  }

  static exists(path: string): boolean {
    return existsSync(resolve(path, '.git'));
  }
}
