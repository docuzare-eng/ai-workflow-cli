# ai-workflow-cli

> AI 驱动的项目工作流自动化引擎

## 这是什么？

一个命令行工具。你输入一个项目想法，它会调度 AI 角色（当前是 R0 可行性分析师）帮你走完每个阶段，最终产出一个完整的项目。

**目标**：把软件开发从"vibe coding"变成**有结构、可追溯、高质量**的过程。

## 当前能力（v0.1 MVP）

- ✅ Stage 0：可行性验证（R0 可行性分析师）
- ⏳ Stage 1-7：规划中

### Stage 0 做什么

1. 你输入一个想法
2. R0 提出 3-5 个澄清问题
3. 你在终端回答
4. R0 产出完整的可行性报告（🟢 Go / 🟡 Conditional / 🔴 No-Go）
5. 自动保存到项目目录，自动 Git 提交

## 技术栈

- TypeScript + Node.js 20+
- Google Gemini API（默认）
- sql.js（跨平台 SQLite）
- commander + inquirer + chalk

## 架构
┌─────────────────────────────────┐
│  UI 层 (CLI)                     │
├─────────────────────────────────┤
│  编排层 (WorkflowEngine)         │
├─────────────────────────────────┤
│  执行器层 (Gemini / Claude / ...)│
├─────────────────────────────────┤
│  存储层 (SQLite + Git + File)    │
└─────────────────────────────────┘

核心概念：

- **7 个工作流阶段**（Stage 0-7）
- **12 个 AI 角色**（R0-R11）
- **双自愈机制**：工作流自愈 + 机制进化（规划中）

详见 [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

## 安装使用

### 前提

- Node.js >= 20
- pnpm
- 一个 Gemini API Key（[免费申请](https://aistudio.google.com/app/apikey)）

### 启动

```bash
# 克隆
git clone https://github.com/YOUR_USERNAME/ai-workflow-cli
cd ai-workflow-cli

# 装依赖
pnpm install

# 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 GEMINI_API_KEY

# 启动
pnpm dev start "你的项目想法"
```

### 命令

```bash
# 启动新项目
pnpm dev start "<你的想法>" [--name 项目名]

# 列出所有项目
pnpm dev list

# 查看具体项目
pnpm dev show <项目名>
```

## 示例

```bash
$ pnpm dev start "我想做一个为独立开发者设计的任务管理工具" --name dev-tasks

📝 你的想法：
   我想做一个为独立开发者设计的任务管理工具

📁 项目目录已创建: /workspaces/ai-workflow-cli/projects/dev-tasks
   Git 初始化: 47ac1d1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stage 0: 可行性验证 — R0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ R0 想问你：
  1. 目标用户是哪类独立开发者？
  2. 相比 Todoist/Notion 的差异化是什么？
  3. 你自己会付费吗？多少钱？
  ...

[回答后...]

📄 可行性报告：🟡 Conditional Go
```

## 产品路线图

### 已完成
- [x] v0.1 MVP（Stage 0 可行性评估 + Gemini API）

### 开发中
- [ ] Stage 1-3（愿景、需求、架构）
- [ ] 自愈机制（工作流自愈 + 机制进化）
- [ ] 贡献积分系统

### 未来
- [ ] Claude Code 执行器（订阅用户可用）
- [ ] MCP Server 集成
- [ ] 桌面面板（Tauri + React）
- [ ] 经验库（向量数据库）
- [ ] Web 版 + 社区

## 工作流仓库

方法论、角色 Prompt、模板、门禁清单维护在独立仓库：

https://github.com/docuzare-eng/ai-workflow-system

## 设计哲学

### 高质量 > 花架子

不追求"看起来能用"，追求"真的可靠"：

- 证据链 + 双重验证
- 优雅失败处理
- 完整审计日志
- 渐进信任模式
- 真实性测试

### 人机协作

- AI 做体力活（文档、代码、格式化）
- 人做关键决策（方向、边界、品味）
- 关键节点必须人工审批

## License

MIT
