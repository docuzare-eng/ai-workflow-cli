/**
 * 执行器基类
 * 所有 AI 提供商都要继承此类
 */

import type { Executor, ExecutorTask, ExecutorResult } from '../types/index.js';

export abstract class BaseExecutor implements Executor {
  abstract name: string;

  /** 子类必须实现具体的调用逻辑 */
  abstract execute(task: ExecutorTask): Promise<ExecutorResult>;

  /** 构建完整的 prompt（系统提示 + 上下文 + 用户消息） */
  protected buildFullPrompt(task: ExecutorTask): string {
    const parts: string[] = [];

    if (task.systemPrompt) {
      parts.push('# 角色定义\n' + task.systemPrompt);
    }

    if (task.context) {
      parts.push('# 上下文\n' + task.context);
    }

    parts.push('# 当前任务\n' + task.userMessage);

    return parts.join('\n\n---\n\n');
  }
}
