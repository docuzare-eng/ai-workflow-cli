/**
 * 项目初始化：创建目录结构、README、.gitignore
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { GitHelper } from './git.js';

const PROJECT_STRUCTURE = [
  '.ai-workflow/00-meta',
  '.ai-workflow/01-feasibility',
  '.ai-workflow/02-vision',
  '.ai-workflow/03-requirements',
  '.ai-workflow/04-architecture',
  '.ai-workflow/05-skeleton',
  '.ai-workflow/06-development',
  '.ai-workflow/07-quality',
  '.ai-workflow/08-iteration',
  '.ai-workflow/meta',
];

export interface ProjectInitParams {
  projectPath: string;
  projectName: string;
  userIdea: string;
  projectId: string;
}

export async function initProjectDirectory(params: ProjectInitParams): Promise<{
  created: boolean;
  gitCommit: string;
}> {
  const { projectPath, projectName, userIdea, projectId } = params;

  // 1. 创建所有目录
  for (const dir of PROJECT_STRUCTURE) {
    await mkdir(resolve(projectPath, dir), { recursive: true });
  }

  // 2. 创建 README.md
  const readme = `# ${projectName}

> AI-workflow managed project

## 想法

${userIdea}

## 项目状态

此项目由 \`ai-workflow-cli\` 管理。

- 当前阶段：Stage 0 (可行性验证)
- 项目 ID：\`${projectId}\`

## 工作流阶段

- [ ] Stage 0: 可行性验证
- [ ] Stage 1: 构想打磨
- [ ] Stage 2: 需求规格化
- [ ] Stage 3: 架构设计
- [ ] Stage 4: 骨架搭建
- [ ] Stage 5: 功能开发
- [ ] Stage 6: 质量保障
- [ ] Stage 7: 发布迭代

## 文件结构

- \`.ai-workflow/\` — AI 工作流产出物
  - \`01-feasibility/\` — 可行性报告
  - \`02-vision/\` — 产品愿景
  - \`03-requirements/\` — 需求规格
  - ...（后续阶段）

## 使用

\`\`\`bash
# 查看当前状态
ai-workflow show ${projectName}

# 推进到下一阶段（未来）
ai-workflow advance ${projectName}
\`\`\`
`;

  await writeFile(resolve(projectPath, 'README.md'), readme, 'utf-8');

  // 3. 创建 .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
*.log

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/

# Secrets
.env
.env.local
*.pem
*.key
`;
  await writeFile(resolve(projectPath, '.gitignore'), gitignore, 'utf-8');

  // 4. Git 初始化 + 首次提交
  const git = new GitHelper(projectPath);
  const wasInitialized = await git.initIfNeeded();
  await git.ensureUserConfig();
  const commit = await git.commit(
    `chore: initialize project ${projectName}\n\nCreated by ai-workflow-cli`,
    ['.']
  );

  return {
    created: wasInitialized,
    gitCommit: commit,
  };
}

/** 保存 stage 产出物，并自动 commit */
export async function saveArtifactWithCommit(params: {
  projectPath: string;
  relativePath: string;
  content: string;
  commitMessage: string;
}): Promise<string> {
  const { projectPath, relativePath, content, commitMessage } = params;

  const fullPath = resolve(projectPath, relativePath);
  await mkdir(resolve(fullPath, '..'), { recursive: true });
  await writeFile(fullPath, content, 'utf-8');

  const git = new GitHelper(projectPath);
  const commit = await git.commit(commitMessage, [relativePath]);
  return commit;
}
