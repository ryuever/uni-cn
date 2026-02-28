import { injectable } from '@x-oasis/di';
import type { IExitService } from './types';

@injectable()
export class BrowserExitService implements IExitService {
  exit(code: number): never {
    throw new Error(`Exit with code ${code}`);
  }
}
