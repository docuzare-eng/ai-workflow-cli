/**
 * 核心类型定义
 * 整个系统的数据模型基础
 */

// ============================================================
// 项目与状态
// ============================================================

/** 工作流阶段编号 */
export type StageNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 阶段执行状态 */
export type StageStatus =
  | 'not_started'     // 未开始
  | 'in_progress'     // 进行中
  | 'awaiting_human'  // 等待人工决策
  | 'gate_check'      // 门禁审查中
  | 'completed'       // 已完成
  | 'failed';         // 失败

/** 项目完整状态 */
export interface ProjectState {
  id: string;
  name: string;
  userIdea: string;
  projectPath: string;        // 项目在文件系统中的路径
  currentStage: StageNumber;
  stageStatus: StageStatus;
  createdAt: Date;
  updatedAt: Date;
  stats: ProjectStats;
}

/** 项目统计 */
export interface ProjectStats {
  totalTokens: number;
  totalCostUsd: number;
  stageTimings: Record<number, number>;  // stage -> milliseconds
}

// ============================================================
// AI 执行器
// ============================================================

/** AI 执行器接口——所有 AI 提供商统一实现这个 */
export interface Executor {
  name: string;
  execute(task: ExecutorTask): Promise<ExecutorResult>;
}

/** 发给执行器的任务 */
export interface ExecutorTask {
  role: string;                    // R0, R1, ...
  systemPrompt: string;            // 系统提示词（角色定义）
  userMessage: string;             // 用户输入
  context?: string;                // 附加上下文（相关文档）
  model?: string;                  // 可选：指定模型
  maxTokens?: number;
  temperature?: number;
}

/** 执行器返回的结果 */
export interface ExecutorResult {
  content: string;                 // AI 的响应文本
  tokensUsed: TokenUsage;
  model: string;
  durationMs: number;
}

/** Token 使用量 */
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

// ============================================================
// 工作流阶段
// ============================================================

/** 单个工作流阶段定义 */
export interface StageDefinition {
  number: StageNumber;
  name: string;                    // "可行性评估"
  role: string;                    // "R0"
  description: string;
  requiredInputs: string[];        // 所需的输入文件
  expectedOutputs: string[];       // 预期产出文件
}

// ============================================================
// 门禁系统（Gate）
// ============================================================

/** 门禁审查结果 */
export interface GateResult {
  stage: StageNumber;
  decision: 'pass' | 'conditional_pass' | 'fail';
  checkedItems: GateCheckItem[];
  issues: string[];
  timestamp: Date;
}

/** 单个门禁检查项 */
export interface GateCheckItem {
  id: string;
  description: string;
  severity: 'required' | 'recommended' | 'optional';  // 🔴🟡🟢
  passed: boolean;
  note?: string;
}

// ============================================================
// 人工决策
// ============================================================

/** 需要用户决策的问题 */
export interface HumanDecision {
  id: string;
  stage: StageNumber;
  question: string;
  options?: DecisionOption[];
  recommendedOption?: string;
  reasoning?: string;              // AI 给出的推理
  createdAt: Date;
  answeredAt?: Date;
  answer?: string;
}

/** 决策选项 */
export interface DecisionOption {
  id: string;
  label: string;
  description?: string;
}

// ============================================================
// 产出物（Artifact）
// ============================================================

/** 项目产出物（文档、代码等） */
export interface Artifact {
  path: string;                    // 相对项目路径的位置
  content: string;
  metadata: ArtifactMetadata;
}

/** 产出物元数据 */
export interface ArtifactMetadata {
  generatedAt: Date;
  generatedBy: string;             // "R0 (gemini-2.0-flash-exp)"
  stage: StageNumber;
  cost?: number;
  tokensUsed?: number;
}

// ============================================================
// 自愈机制（预留接口，批次 8 之后实现）
// ============================================================

/** 自愈引擎接口——工作流自愈 */
export interface WorkflowHealingEngine {
  onStageComplete(state: ProjectState, stage: StageNumber): Promise<HealingReport | null>;
  onProjectComplete(state: ProjectState): Promise<HealingReport | null>;
}

/** 机制进化引擎接口 */
export interface ArchitectureEvolutionEngine {
  onProjectComplete(state: ProjectState): Promise<EvolutionReport | null>;
}

/** 自愈报告 */
export interface HealingReport {
  type: 'workflow_healing' | 'architecture_evolution';
  triggerStage?: StageNumber;
  source: 'ai_analysis' | 'user_submission';      // 被动 vs 主动
  suggestedChanges: SuggestedChange[];
  tokensUsed: TokenUsage;
  createdAt: Date;
}

/** 进化报告（机制进化专用） */
export interface EvolutionReport extends HealingReport {
  type: 'architecture_evolution';
  anonymizedProjectMetrics: Record<string, unknown>;
}

/** 建议的改动 */
export interface SuggestedChange {
  targetFile: string;              // 要改的文件（相对仓库路径）
  changeType: 'modify' | 'add' | 'remove';
  reasoning: string;
  proposedDiff: string;
}

// ============================================================
// 贡献积分（预留）
// ============================================================

export type ContributionType = 'active' | 'passive';
export type ContributionStatus = 'pending' | 'accepted' | 'rejected';

export interface Contribution {
  id: string;
  type: ContributionType;
  status: ContributionStatus;
  prUrl?: string;
  score: number;                   // 积分
  submittedAt: Date;
}

// ============================================================
// 配置
// ============================================================

export interface AppConfig {
  ai: AIConfig;
  healing: HealingConfig;
  logging: LoggingConfig;
}

export interface AIConfig {
  provider: 'gemini' | 'anthropic' | 'openai' | 'claude_code';
  apiKey: string;
  defaultModel: string;
}

export interface HealingConfig {
  workflowHealingEnabled: boolean;   // 默认 false
  architectureEvolutionEnabled: boolean;  // 强制 true
  healingBrainOverride?: AIConfig;   // 可选：独立配置自愈大脑
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
}
