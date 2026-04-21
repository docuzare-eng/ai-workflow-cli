#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { WorkflowEngine } from './engine/index.js';
import { GeminiExecutor } from './executors/index.js';
import {
  runStage0Questions,
  runStage0Report,
  displayR0Questions,
} from './engine/stage-runner.js';
import { collectAnswers, confirm } from './ui/interactive.js';
import { initProjectDirectory, saveArtifactWithCommit } from './utils/project-init.js';

const program = new Command();

program
  .name('ai-workflow')
  .description('AI-driven project workflow automation')
  .version('0.1.0');

// ============================================================
// start 命令
// ============================================================

program
  .command('start')
  .description('Start a new project with an idea')
  .argument('<idea>', 'Your project idea (in quotes)')
  .option('-n, --name <name>', 'Project name (auto-generated if not provided)')
  .action(async (idea: string, options: { name?: string }) => {
    await runStartCommand(idea, options);
  });

// ============================================================
// list 命令
// ============================================================

program
  .command('list')
  .description('List all projects')
  .action(async () => {
    const engine = new WorkflowEngine();
    const projects = await engine.listProjects();
    if (projects.length === 0) {
      console.log(chalk.gray('\nNo projects yet. Use `ai-workflow start "<idea>"` to create one.\n'));
      return;
    }
    console.log(chalk.cyan.bold(`\n📋 Projects (${projects.length}):\n`));
    for (const p of projects) {
      console.log(chalk.white(`  ${p.name}`));
      console.log(chalk.gray(`    ID:     ${p.id.slice(0, 8)}...`));
      console.log(chalk.gray(`    Stage:  ${p.currentStage} (${p.stageStatus})`));
      console.log(chalk.gray(`    Tokens: ${p.stats.totalTokens}`));
      console.log(chalk.gray(`    Cost:   $${p.stats.totalCostUsd.toFixed(6)}`));
      console.log(chalk.gray(`    Path:   ${p.projectPath}`));
      console.log();
    }
  });

// ============================================================
// show 命令
// ============================================================

program
  .command('show')
  .description('Show a project and its latest report')
  .argument('<name-or-id>', 'Project name or ID prefix')
  .action(async (nameOrId: string) => {
    const engine = new WorkflowEngine();
    const projects = await engine.listProjects();
    const project = projects.find(
      (p) => p.name === nameOrId || p.id.startsWith(nameOrId)
    );
    if (!project) {
      console.log(chalk.red(`\n❌ Project not found: ${nameOrId}\n`));
      return;
    }

    console.log(chalk.cyan.bold(`\n📂 ${project.name}\n`));
    console.log(chalk.gray(`  ID:     ${project.id}`));
    console.log(chalk.gray(`  Path:   ${project.projectPath}`));
    console.log(chalk.gray(`  Stage:  ${project.currentStage} (${project.stageStatus})`));
    console.log(chalk.gray(`  Tokens: ${project.stats.totalTokens}`));
    console.log(chalk.gray(`  Cost:   $${project.stats.totalCostUsd.toFixed(6)}`));
    console.log();

    // 尝试读取可行性报告
    const reportPath = resolve(project.projectPath, '.ai-workflow/01-feasibility/FEASIBILITY_REPORT.md');
    try {
      const content = await readFile(reportPath, 'utf-8');
      console.log(chalk.cyan.bold('📄 Feasibility Report:\n'));
      console.log(content);
    } catch {
      console.log(chalk.gray('(No feasibility report yet)\n'));
    }
  });

// ============================================================
// start 命令实现
// ============================================================

async function runStartCommand(idea: string, options: { name?: string }): Promise<void> {
  console.log(chalk.cyan.bold('\n🚀 AI Workflow CLI\n'));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error(chalk.red('❌ GEMINI_API_KEY not set in .env'));
    process.exit(1);
  }

  const executor = new GeminiExecutor(apiKey, process.env.DEFAULT_MODEL);
  const engine = new WorkflowEngine();

  const projectName =
    options.name ||
    `project-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}`;
  const projectPath = resolve('projects', projectName);

  console.log(chalk.yellow('📝 你的想法：'));
  console.log(chalk.white(`   ${idea}`));
  console.log();

  // 1. 创建项目状态
  const project = await engine.createProject({
    name: projectName,
    userIdea: idea,
    projectPath,
  });

  // 2. 初始化项目目录 + Git
  console.log(chalk.cyan('📁 正在初始化项目目录...'));
  const initResult = await initProjectDirectory({
    projectPath,
    projectName,
    userIdea: idea,
    projectId: project.id,
  });
  console.log(chalk.green(`✅ 项目目录已创建: ${projectPath}`));
  if (initResult.created) {
    console.log(chalk.gray(`   Git 初始化: ${initResult.gitCommit.slice(0, 7)}`));
  }
  console.log();

  // 3. Stage 0 - 提问
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  Stage 0: 可行性验证 — R0'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();

  const q = await runStage0Questions(executor, project);
  if (!q.success || !q.parsed) {
    console.log(chalk.red('❌ R0 提问阶段失败'));
    console.log(chalk.gray(q.output));
    process.exit(1);
  }

  displayR0Questions(q);

  // 4. 是否继续
  const wantsToAnswer = await confirm('回答这些问题以获得完整的可行性报告？', true);
  if (!wantsToAnswer) {
    console.log(chalk.yellow('\n已跳过。项目已保存，下次可通过 `pnpm dev list` 查看。\n'));
    return;
  }

  // 5. 收集回答
  const answers = await collectAnswers(q.parsed.questions);

  // 6. 产出报告
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  R0 正在产出可行性报告...'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();

  const r = await runStage0Report(executor, project, q.parsed.questions, answers);
  if (!r.success || !r.report) {
    console.log(chalk.red('❌ R0 报告产出失败'));
    console.log(chalk.gray(r.output));
    process.exit(1);
  }

  // 7. 保存 + 自动 commit
  const reportContent = buildReportWithMeta(r.report, project, q, r);
  const commit = await saveArtifactWithCommit({
    projectPath,
    relativePath: '.ai-workflow/01-feasibility/FEASIBILITY_REPORT.md',
    content: reportContent,
    commitMessage: `feat(stage-0): add feasibility report\n\nR0 produced via ${process.env.DEFAULT_MODEL || 'gemini'}`,
  });

  console.log(chalk.green(`✅ 报告已保存并提交`));
  console.log(chalk.gray(`   Commit: ${commit.slice(0, 7)}`));
  console.log();

  // 8. 展示报告
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  📄 可行性报告'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log();
  console.log(r.report);
  console.log();

  // 9. 总结
  const updated = await engine.getProject(project.id);
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('  📊 Stage 0 总结'));
  console.log(chalk.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.gray(`   Total Tokens: ${updated?.stats.totalTokens}`));
  console.log(chalk.gray(`   Total Cost:   $${updated?.stats.totalCostUsd.toFixed(6)}`));
  console.log(chalk.gray(`   Project:      ${projectPath}`));
  console.log();
  console.log(chalk.green.bold('✅ Stage 0 完成！'));
  console.log();
  console.log(chalk.gray(`下次可用: pnpm dev show ${projectName}`));
  console.log();
}

function buildReportWithMeta(
  report: string,
  project: { id: string; name: string; userIdea: string },
  q: { tokensUsed: number; costUsd: number },
  r: { tokensUsed: number; costUsd: number }
): string {
  const totalTokens = q.tokensUsed + r.tokensUsed;
  const totalCost = q.costUsd + r.costUsd;

  return `---
generated_at: ${new Date().toISOString()}
generated_by: R0 (${process.env.DEFAULT_MODEL || 'gemini'})
project_id: ${project.id}
project_name: ${project.name}
stage: 0
tokens_used: ${totalTokens}
cost_usd: ${totalCost.toFixed(6)}
---

> **用户的原始想法**
> ${project.userIdea}

${report}
`;
}

// ============================================================

program.parseAsync().catch((err) => {
  console.error(chalk.red('\n❌ Error:'), err instanceof Error ? err.message : err);
  process.exit(1);
});
