import { injectable } from '@x-oasis/di';
import type { ICwdService } from './types';

@injectable()
export class BrowserCwdService implements ICwdService {
  constructor(private readonly root: string = '/') {}

  cwd(): string {
    return this.root;
  }
}
