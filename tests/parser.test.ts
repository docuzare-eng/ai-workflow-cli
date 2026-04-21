import { describe, it, expect } from 'vitest';
import { parseR0Questions, parseR0Report, extractTag } from '../src/utils/parser.js';

describe('extractTag', () => {
  it('提取简单标签', () => {
    const text = '<thinking>hello</thinking>';
    expect(extractTag(text, 'thinking')).toBe('hello');
  });

  it('标签不存在时返回 undefined', () => {
    expect(extractTag('no tags', 'missing')).toBeUndefined();
  });

  it('支持多行内容', () => {
    const text = '<questions>\n1. Q1\n2. Q2\n</questions>';
    expect(extractTag(text, 'questions')).toBe('1. Q1\n2. Q2');
  });
});

describe('parseR0Questions', () => {
  it('解析标准 R0 输出', () => {
    const output = `<thinking>My analysis</thinking>
<questions>
1. What is the target user?
2. What's the budget?
3. What's the timeline?
</questions>
<initial_assessment>Looks promising</initial_assessment>`;

    const parsed = parseR0Questions(output);
    expect(parsed.thinking).toBe('My analysis');
    expect(parsed.questions).toHaveLength(3);
    expect(parsed.questions[0]).toBe('What is the target user?');
    expect(parsed.initialAssessment).toBe('Looks promising');
  });

  it('缺少标签时的降级', () => {
    const parsed = parseR0Questions('random text');
    expect(parsed.questions).toEqual([]);
    expect(parsed.thinking).toBeUndefined();
  });
});

describe('parseR0Report', () => {
  it('提取报告内容', () => {
    const output = '<report># Report\n\nContent here</report>';
    const parsed = parseR0Report(output);
    expect(parsed.report).toContain('# Report');
  });

  it('没有 report 标签时用原文', () => {
    const parsed = parseR0Report('raw content');
    expect(parsed.report).toBe('raw content');
  });
});
