#!/usr/bin/env node
import { Command } from 'commander';
import { VERSION } from '@kintsugi/core';
import { registerInitCommand } from './commands/init.js';
import { registerExtractCommand } from './commands/extract.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerListCommand } from './commands/list.js';
import { registerAgentBriefCommand } from './commands/agent-brief.js';

const program = new Command();
program.name('kintsugi').description('AI-native content annotation framework').version(VERSION);

registerInitCommand(program);
registerExtractCommand(program);
registerValidateCommand(program);
registerListCommand(program);
registerAgentBriefCommand(program);

program.parse();
