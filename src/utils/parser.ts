/**
 * AI 输出解析
 */

export interface ParsedR0Output {
  thinking?: string;
  questions: string[];
  initialAssessment?: string;
  raw: string;
}

export interface ParsedR0Report {
  report: string;  // 完整的 markdown 内容
  raw: string;
}

export function extractTag(text: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

export function parseR0Questions(aiOutput: string): ParsedR0Output {
  const thinking = extractTag(aiOutput, 'thinking');
  const questionsBlock = extractTag(aiOutput, 'questions');
  const initialAssessment = extractTag(aiOutput, 'initial_assessment');

  const questions: string[] = [];
  if (questionsBlock) {
    const lines = questionsBlock.split('\n');
    for (const line of lines) {
      const match = line.trim().match(/^\d+[.、)]\s*(.+)$/);
      if (match) {
        questions.push(match[1].trim());
      }
    }
  }

  return {
    thinking,
    questions,
    initialAssessment,
    raw: aiOutput,
  };
}

export function parseR0Report(aiOutput: string): ParsedR0Report {
  const report = extractTag(aiOutput, 'report') || aiOutput;
  return {
    report,
    raw: aiOutput,
  };
}
