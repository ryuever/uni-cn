import { injectable } from '@x-oasis/di';
import type { ITempDirService } from './types';

@injectable()
export class BrowserTempDirService implements ITempDirService {
  constructor(private readonly tmpRoot: string = '/tmp') {}

  tmpdir(): string {
    return this.tmpRoot;
  }
}
