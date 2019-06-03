import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import {projectInstall } from 'pkg-install';

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false
  });
}

async function initGit(options) {
  const result = await execa('git', ['init'], {
    cwd: options.targetDirectory
  });

  if (result.failed) {
    return Promise.reject(new Error('Failed to initialise Git'));
  }

  return;
}

export async function createProject(options) {
  options = {
    ...options,
    targetDirectory: options.targetDirectory || process.cwd()
  };

  const currentFileUrl = import.meta.url;
  let templateDir = path.resolve(
    new URL(currentFileUrl).pathname.substring(1),
    '../../templates',
    options.template.toLowerCase()
  );

  templateDir = templateDir.replace('%20', ' ');

  options.templateDirectory = templateDir;

  try {
    await access(templateDir, fs.constants.R_OK);
  } catch (error) {
    console.error(`${chalk.red.bold('ERROR')} Invalid template name "${templateDir}"`);
    process.exit(1);
  }

  const tasks = new Listr([
    {
      title: 'Copy project files',
      task: () => copyTemplateFiles(options)
    },
    {
      title: 'Initialise Git',
      task: () => initGit(options),
      enabled: () => options.git
    },
    {
      title: 'Install dependencies',
      task: () => projectInstall({
        cwd: options.targetDirectory
      }),
      skip: () => !options.runInstall 
        ? 'Pass --install or --i to automatically install dependencies'
        : undefined
    }
  ]);

  await tasks.run();

  console.log('%s Project ready', chalk.green.bold('DONE'));

  return true;
}