import { createId } from '@x-oasis/di';

export const ICwdServiceId = createId('cwd-service');
export interface ICwdService {
  cwd(): string;
}

export const ITempDirServiceId = createId('temp-dir-service');
export interface ITempDirService {
  tmpdir(): string;
}

export const IExitServiceId = createId('exit-service');
export interface IExitService {
  exit(code: number): never;
}
