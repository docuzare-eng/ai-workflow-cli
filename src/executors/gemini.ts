/**
 * Gemini API 执行器
 * 通过 Google Generative AI SDK 调用 Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseExecutor } from './base.js';
import type { ExecutorTask, ExecutorResult } from '../types/index.js';

export class GeminiExecutor extends BaseExecutor {
  name = 'gemini';
  private client: GoogleGenerativeAI;
  private defaultModel: string;

  constructor(apiKey: string, defaultModel = 'gemini-2.0-flash-exp') {
    super();
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.defaultModel = defaultModel;
  }

  async execute(task: ExecutorTask): Promise<ExecutorResult> {
    const startTime = Date.now();
    const modelName = task.model || this.defaultModel;

    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: task.maxTokens ?? 8000,
        temperature: task.temperature ?? 0.7,
      },
    });

    const fullPrompt = this.buildFullPrompt(task);

    try {
      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const content = response.text();

      // 获取 token 使用量
      const usage = response.usageMetadata;
      const inputTokens = usage?.promptTokenCount ?? 0;
      const outputTokens = usage?.candidatesTokenCount ?? 0;

      return {
        content,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens,
        },
        model: modelName,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Gemini API call failed: ${msg}`);
    }
  }
}
