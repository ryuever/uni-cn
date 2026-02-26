import { Container } from "../../src/di";
import { initServiceModules } from "../../src/commands/initService";
import { InitCommandService, InitCommandServiceId } from "../../src/commands/init";
import { MemFileSystem } from "../../src/services/file-system/MemFileSystem";
import { FileSystemServiceId } from "../../src/services/file-system/constants";

const container = new Container();
container.load(initServiceModules);
container.bind(FileSystemServiceId).to(MemFileSystem);

export const initService: InitCommandService =
  container.get(InitCommandServiceId);

initService.runInit({
  cwd: '/project',
  yes: true,
  defaults: true,
  silent: true,
  force: true,
  isNewProject: true,
  style: 'default',
  cssVariables: false,
});
