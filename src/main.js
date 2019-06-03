import chalk from 'chalk';
import fs from 'fs';
import ncp from 'ncp';
import path from 'path';
import { promisify } from 'util';

const access = promisify(fs.access);
const copy = promisify(ncp);

async function copyTemplateFiles(options) {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false
  });
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

  console.log('Copy project files');

  await copyTemplateFiles(options);

  console.log('%s Project ready', chalk.green.bold('DONE'));

  return true;
}