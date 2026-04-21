/**
 * 命令行交互工具
 */

import inquirer from 'inquirer';
import chalk from 'chalk';

/**
 * 依次询问用户一组问题，收集回答
 */
export async function collectAnswers(questions: string[]): Promise<string[]> {
  console.log(chalk.yellow.bold('📝 请依次回答以下问题：'));
  console.log(chalk.gray('(每个问题回答后按回车。不想答可以留空)'));
  console.log();

  const answers: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    const { answer } = await inquirer.prompt<{ answer: string }>([
      {
        type: 'input',
        name: 'answer',
        message: chalk.cyan(`[${i + 1}/${questions.length}] ${questions[i]}`),
      },
    ]);
    answers.push(answer.trim());
    console.log();
  }

  return answers;
}

/** 让用户确认一个选择 */
export async function confirm(message: string, defaultYes = true): Promise<boolean> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: defaultYes,
    },
  ]);
  return confirmed;
}

/** 让用户选择一个选项 */
export async function choose<T extends string>(
  message: string,
  choices: { name: string; value: T }[]
): Promise<T> {
  const { chosen } = await inquirer.prompt<{ chosen: T }>([
    {
      type: 'list',
      name: 'chosen',
      message,
      choices,
    },
  ]);
  return chosen;
}
