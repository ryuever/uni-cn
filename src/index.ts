#!/usr/bin/env node
import { add } from '@/delightless-vue/commands/add';
// import { build } from '@/delightless-vue/commands/build';
// import { diff } from '@/delightless-vue/commands/diff';
// import { info } from '@/delightless-vue/commands/info';
import { init } from '@/delightless-vue/commands/init';

// import { migrate } from '@/delightless-vue/commands/migrate';

import { Command } from 'commander';

// import packageJson from '../package.json';

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

async function main() {
  const program = new Command()
    .name('delightless-vue')
    .description('add components and dependencies to your project')
    .version(
      // packageJson.version || '1.0.0',
      '1.0.0',
      '-v, --version',
      'display the version number'
    );

  program.addCommand(init).addCommand(add);
  // .addCommand(diff)
  // .addCommand(migrate)
  // .addCommand(info)
  // .addCommand(build);

  program.parse();
}

main();

export * from './registry/api';
