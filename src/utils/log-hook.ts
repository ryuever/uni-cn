export interface LogEntry {
  type: 'spinner' | 'log';
  status: 'start' | 'succeed' | 'fail' | 'info' | 'log' | 'warn' | 'error' | 'break';
  text: string;
}

export type LogListener = (entry: LogEntry) => void;

let _listener: LogListener | null = null;

export function setLogListener(listener: LogListener | null) {
  _listener = listener;
}

export function notifyLog(entry: LogEntry) {
  _listener?.(entry);
}
