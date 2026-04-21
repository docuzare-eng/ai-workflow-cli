/**
 * Prompt 加载器
 * 从本地文件加载角色 Prompt（未来会支持从 GitHub 加载）
 */

import { readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROMPTS_DIR = resolve(__dirname, 'roles');

const ROLE_FILE_MAP: Record<string, string> = {
  R0: 'R0-feasibility-analyst.md',
};

export async function loadRolePrompt(role: string): Promise<string> {
  const filename = ROLE_FILE_MAP[role];
  if (!filename) {
    throw new Error(`Unknown role: ${role}. Available: ${Object.keys(ROLE_FILE_MAP).join(', ')}`);
  }

  const filepath = resolve(PROMPTS_DIR, filename);
  try {
    return await readFile(filepath, 'utf-8');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load prompt for ${role} from ${filepath}: ${msg}`);
  }
}
