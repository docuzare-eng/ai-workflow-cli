/**
 * 7 个工作流阶段的定义
 */

import type { StageDefinition } from '../types/index.js';

export const STAGES: StageDefinition[] = [
  {
    number: 0,
    name: '可行性验证',
    role: 'R0',
    description: '评估项目是否值得做',
    requiredInputs: [],
    expectedOutputs: ['01-feasibility/FEASIBILITY_REPORT.md'],
  },
  {
    number: 1,
    name: '构想打磨',
    role: 'R1',
    description: '打磨产品愿景和 MVP 范围',
    requiredInputs: ['01-feasibility/FEASIBILITY_REPORT.md'],
    expectedOutputs: ['02-vision/VISION.md'],
  },
  {
    number: 2,
    name: '需求规格化',
    role: 'R2',
    description: '拆解用户故事和验收标准',
    requiredInputs: ['02-vision/VISION.md'],
    expectedOutputs: [
      '03-requirements/REQUIREMENTS.md',
      '03-requirements/USER_STORIES.md',
    ],
  },
  {
    number: 3,
    name: '架构设计',
    role: 'R3',
    description: '设计系统架构',
    requiredInputs: ['03-requirements/USER_STORIES.md'],
    expectedOutputs: [
      '04-architecture/ARCHITECTURE.md',
      '04-architecture/TECH_STACK.md',
    ],
  },
  {
    number: 4,
    name: '骨架搭建',
    role: 'R4',
    description: '搭建项目骨架',
    requiredInputs: ['04-architecture/ARCHITECTURE.md'],
    expectedOutputs: ['05-skeleton/SKELETON_REPORT.md'],
  },
  {
    number: 5,
    name: '功能开发',
    role: 'R5',
    description: '实现功能',
    requiredInputs: ['04-architecture/ARCHITECTURE.md'],
    expectedOutputs: ['06-development/'],
  },
  {
    number: 6,
    name: '质量保障',
    role: 'R6',
    description: '测试和质量审核',
    requiredInputs: ['06-development/'],
    expectedOutputs: ['07-quality/TEST_STRATEGY.md'],
  },
  {
    number: 7,
    name: '发布迭代',
    role: 'R7',
    description: '部署和迭代',
    requiredInputs: ['07-quality/'],
    expectedOutputs: ['08-iteration/DEPLOYMENT.md'],
  },
];

export function getStage(number: number): StageDefinition | undefined {
  return STAGES.find((s) => s.number === number);
}
