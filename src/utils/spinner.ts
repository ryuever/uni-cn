import ora, { type Options } from 'ora';
import { notifyLog } from '@/utils/log-hook';

export function spinner(
  text: Options['text'],
  options?: {
    silent?: boolean;
  }
) {
  const textStr = typeof text === 'string' ? text : '';
  const instance = ora({
    text,
    isSilent: options?.silent,
  });

  const origSucceed = instance.succeed.bind(instance);
  const origFail = instance.fail.bind(instance);
  const origInfo = instance.info.bind(instance);

  instance.succeed = (newText?: string) => {
    notifyLog({ type: 'spinner', status: 'succeed', text: newText ?? textStr });
    return origSucceed(newText);
  };
  instance.fail = (newText?: string) => {
    notifyLog({ type: 'spinner', status: 'fail', text: newText ?? textStr });
    return origFail(newText);
  };
  instance.info = (newText?: string) => {
    notifyLog({ type: 'spinner', status: 'info', text: newText ?? textStr });
    return origInfo(newText);
  };

  return instance;
}
