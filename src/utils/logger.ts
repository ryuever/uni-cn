import { highlighter } from '@/utils/highlighter';
import { notifyLog } from '@/utils/log-hook';

import consola from 'consola';

export const logger = {
  error(...args: unknown[]) {
    const text = args.join(' ');
    notifyLog({ type: 'log', status: 'error', text });
    consola.log(highlighter.error(text));
  },
  warn(...args: unknown[]) {
    const text = args.join(' ');
    notifyLog({ type: 'log', status: 'warn', text });
    consola.log(highlighter.warn(text));
  },
  info(...args: unknown[]) {
    const text = args.join(' ');
    notifyLog({ type: 'log', status: 'info', text });
    consola.log(highlighter.info(text));
  },
  success(...args: unknown[]) {
    const text = args.join(' ');
    notifyLog({ type: 'log', status: 'log', text });
    consola.log(highlighter.success(text));
  },
  log(...args: unknown[]) {
    const text = args.join(' ');
    notifyLog({ type: 'log', status: 'log', text });
    consola.log(text);
  },
  break() {
    notifyLog({ type: 'log', status: 'break', text: '' });
    consola.log('');
  },
};
