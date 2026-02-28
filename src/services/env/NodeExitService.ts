import { injectable } from '@x-oasis/di';
import type { IExitService } from './types';

@injectable()
export class NodeExitService implements IExitService {
  exit(code: number): never {
    if (typeof process !== 'undefined') {
      process.exit(code);
    }
    throw new Error(`Exit with code ${code}`);
  }
}
