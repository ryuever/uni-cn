import { injectable } from '@x-oasis/di';
import { tmpdir as nodeTmpdir } from 'node:os';
import type { ITempDirService } from './types';

@injectable()
export class NodeTempDirService implements ITempDirService {
  tmpdir(): string {
    return nodeTmpdir();
  }
}
