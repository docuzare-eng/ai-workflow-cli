/**
 * Stage 运行器
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Executor, ProjectState } from '../types/index.js';
import { loadRolePrompt } from '../prompts/loader.js';
import {
  parseR0Questions,
  parseR0Report,
  type ParsedR0Output,
} from '../utils/parser.js';
import { ProjectManager } from '../storage/project.js';

export interface StageRunResult {
  success: boolean;
  output: string;
  tokensUsed: number;
  costUsd: number;
  durationMs: number;
}

export interface R0QuestionsResult extends StageRunResult {
  parsed?: ParsedR0Output;
}

export interface R0ReportResult extends StageRunResult {
  report?: string;
}

// Gemini 2.5 Flash Lite 定价（粗略估算）
const PRICE_INPUT_PER_M = 0.1;   // $0.10 per 1M input tokens
const PRICE_OUTPUT_PER_M = 0.4;  // $0.40 per 1M output tokens

function calculateCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens * PRICE_INPUT_PER_M + outputTokens * PRICE_OUTPUT_PER_M) / 1_000_000;
}

/**
 * Stage 0 第一步：R0 提问澄清
 */
export async function runStage0Questions(
  executor: Executor,
  state: ProjectState
): Promise<R0QuestionsResult> {
  const startTime = Date.now();

  const spinner = ora('Loading R0 prompt...').start();
  const systemPrompt = await loadRolePrompt('R0');
  spinner.text = 'R0 is analyzing your idea...';

  const userMessage = `用户的项目想法：\n\n${state.userIdea}\n\n请按"阶段 A"的格式提出澄清问题。`;

  const result = await executor.execute({
    role: 'R0',
    systemPrompt,
    userMessage,
    temperature: 0.5,
    maxTokens: 2000,
  });

  spinner.succeed(`R0 提问阶段完成 (${result.tokensUsed.total} tokens, ${result.durationMs}ms)`);

  const parsed = parseR0Questions(result.content);
  const costUsd = calculateCost(result.tokensUsed.input, result.tokensUsed.output);

  const pm = new ProjectManager();
  await pm.addUsage(state.id, result.tokensUsed.total, costUsd);

  return {
    success: parsed.questions.length > 0,
    output: result.content,
    parsed,
    tokensUsed: result.tokensUsed.total,
    costUsd,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Stage 0 第二步：R0 基于用户回答产出报告
 */
export async function runStage0Report(
  executor: Executor,
  state: ProjectState,
  questions: string[],
  answers: string[]
): Promise<R0ReportResult> {
  const startTime = Date.now();

  const spinner = ora('R0 is writing the feasibility report...').start();
  const systemPrompt = await loadRolePrompt('R0');

  // 组装用户的回答上下文
  let qaContext = `用户的项目想法：\n${state.userIdea}\n\n你之前问了这些问题，用户的回答如下：\n\n`;
  for (let i = 0; i < questions.length; i++) {
    qaContext += `问题 ${i + 1}: ${questions[i]}\n`;
    qaContext += `回答: ${answers[i] || '(用户未回答)'}\n\n`;
  }
  qaContext += `现在请按"阶段 B"的格式，输出完整的可行性报告。`;

  const result = await executor.execute({
    role: 'R0',
    systemPrompt,
    userMessage: qaContext,
    temperature: 0.4,
    maxTokens: 4000,
  });

  spinner.succeed(`R0 报告产出完成 (${result.tokensUsed.total} tokens, ${result.durationMs}ms)`);

  const parsed = parseR0Report(result.content);
  const costUsd = calculateCost(result.tokensUsed.input, result.tokensUsed.output);

  const pm = new ProjectManager();
  await pm.addUsage(state.id, result.tokensUsed.total, costUsd);

  return {
    success: !!parsed.report,
    output: result.content,
    report: parsed.report,
    tokensUsed: result.tokensUsed.total,
    costUsd,
    durationMs: Date.now() - startTime,
  };
}

/** 展示 R0 问题 */
export function displayR0Questions(result: R0QuestionsResult): void {
  if (!result.parsed) return;

  console.log();
  if (result.parsed.thinking) {
    console.log(chalk.cyan.bold('💭 R0 的思考：'));
    console.log(chalk.gray(result.parsed.thinking));
    console.log();
  }

  console.log(chalk.cyan.bold('❓ R0 想问你：'));
  result.parsed.questions.forEach((q, i) => {
    console.log(chalk.white(`  ${i + 1}. ${q}`));
  });
  console.log();

  if (result.parsed.initialAssessment) {
    console.log(chalk.cyan.bold('🎯 初步判断：'));
    console.log(chalk.white(result.parsed.initialAssessment));
    console.log();
  }
}
