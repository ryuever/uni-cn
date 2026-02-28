import { injectable } from '@x-oasis/di';
import type { ICwdService } from './types';

@injectable()
export class NodeCwdService implements ICwdService {
  cwd(): string {
    return typeof process !== 'undefined' ? process.cwd() : '/';
  }
}
