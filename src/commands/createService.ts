import {
  CreateCommandService,
  CreateCommandServiceId,
} from '@/commands/create';
import { Registry } from '@x-oasis/di';
import { FileSystemServiceId } from '@/services/file-system/constants';
import { NodeFileSystem } from '@/services/file-system/NodeFileSystem';
import {
  ICwdServiceId,
  IExitServiceId,
  ITempDirServiceId,
  NodeCwdService,
  NodeExitService,
  NodeTempDirService,
} from '@/services/env';
import {
  CreateTemplateFilesService,
  CreateTemplateFilesServiceId,
} from '@/utils/updaters/create-template-files';

export const createServiceModules = new Registry((bind) => {
  bind(CreateCommandServiceId).to(CreateCommandService);
  bind(CreateTemplateFilesServiceId).to(CreateTemplateFilesService);
  bind(FileSystemServiceId).to(NodeFileSystem);
  bind(ICwdServiceId).to(NodeCwdService);
  bind(ITempDirServiceId).to(NodeTempDirService);
  bind(IExitServiceId).to(NodeExitService);
});