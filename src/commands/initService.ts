import {
  InitCommandService,
  InitCommandServiceId,
  PromptForMinimalConfigService,
  PromptForMinimalConfigServiceId,
} from '@/commands/init';
import { Container, Registry } from '@x-oasis/di';
import {
  PreFlightInitService,
  PreFlightInitServiceId,
} from '@/preflights/preflight-init';
import {
  RegistryGetThemeService,
  RegistryGetThemeServiceId,
  RegistryResolveItemsTreeService,
  RegistryResolveItemsTreeServiceId,
} from '@/registry/api';
import { FileSystemServiceId } from '@/services/file-system/constants';
import { NodeFileSystem } from '@/services/file-system/NodeFileSystem';
import {
  AddComponentsService,
  AddComponentsServiceId,
  AddProjectComponentsService,
  AddProjectComponentsServiceId,
  AddWorkspaceComponentsService,
  AddWorkspaceComponentsServiceId,
} from '@/utils/add-components';
import {
  GetPackageInfoService,
  GetPackageInfoServiceId,
} from '@/utils/get-package-info';
import {
  GetProjectConfigService,
  GetProjectConfigServiceId,
  GetProjectInfoService,
  GetProjectInfoServiceId,
  GetProjectTailwindVersionFromConfigService,
  GetProjectTailwindVersionFromConfigServiceId,
  GetTailwindCssFileService,
  GetTailwindCssFileServiceId,
  GetTailwindVersionService,
  GetTailwindVersionServiceId,
  GetTsConfigService,
  GetTsConfigServiceId,
} from '@/utils/get-project-info';
import {
  TransformersService,
  TransformersServiceId,
} from '@/utils/transformers';
import {
  TransformTwPrefixService,
  TransformTwPrefixServiceId,
} from '@/utils/transformers/transform-tw-prefix';
import {
  UpdateCssService,
  UpdateCssServiceId,
} from '@/utils/updaters/update-css';
import {
  TransformCssVarsService,
  TransformCssVarsServiceId,
  UpdateCssVarsService,
  UpdateCssVarsServiceId,
} from '@/utils/updaters/update-css-vars';
import {
  ResolveImportsService,
  ResolveImportsServiceId,
  UpdateFilesService,
  UpdateFilesServiceId,
} from '@/utils/updaters/update-files';
import {
  AddTailwindConfigThemeService,
  AddTailwindConfigThemeServiceId,
  CreateSourceFileService,
  CreateSourceFileServiceId,
  ParseObjectLiteralService,
  ParseObjectLiteralServiceId,
  TransformTailwindConfigService,
  TransformTailwindConfigServiceId,
  UpdateTailwindConfigService,
  UpdateTailwindConfigServiceId,
} from '@/utils/updaters/update-tailwind-config';
import {
  TransformTailwindContentService,
  TransformTailwindContentServiceId,
  UpdateTailwindContentService,
  UpdateTailwindContentServiceId,
} from '@/utils/updaters/update-tailwind-content';

export const initServiceModules = new Registry((bind) => {
  // bind(AddCommandServiceId).to(AddCommandService);
  bind(InitCommandServiceId).to(InitCommandService);
  bind(PromptForMinimalConfigServiceId).to(PromptForMinimalConfigService);
  // bind(PreFlightAddServiceId).to(PreFlightAddService);
  bind(PreFlightInitServiceId).to(PreFlightInitService);
  bind(RegistryResolveItemsTreeServiceId).to(RegistryResolveItemsTreeService);
  bind(RegistryGetThemeServiceId).to(RegistryGetThemeService);
  bind(AddComponentsServiceId).to(AddComponentsService);
  bind(AddProjectComponentsServiceId).to(AddProjectComponentsService);
  bind(AddWorkspaceComponentsServiceId).to(AddWorkspaceComponentsService);
  bind(GetPackageInfoServiceId).to(GetPackageInfoService);
  bind(GetProjectConfigServiceId).to(GetProjectConfigService);
  bind(GetProjectInfoServiceId).to(GetProjectInfoService);
  bind(GetProjectTailwindVersionFromConfigServiceId).to(
    GetProjectTailwindVersionFromConfigService
  );
  bind(GetTailwindCssFileServiceId).to(GetTailwindCssFileService);
  bind(GetTailwindVersionServiceId).to(GetTailwindVersionService);
  bind(GetTsConfigServiceId).to(GetTsConfigService);
  bind(TransformersServiceId).to(TransformersService);
  bind(TransformTwPrefixServiceId).to(TransformTwPrefixService);
  bind(TransformCssVarsServiceId).to(TransformCssVarsService);
  bind(UpdateCssVarsServiceId).to(UpdateCssVarsService);
  bind(TransformTailwindContentServiceId).to(TransformTailwindContentService);
  bind(UpdateTailwindContentServiceId).to(UpdateTailwindContentService);
  bind(ResolveImportsServiceId).to(ResolveImportsService);
  bind(UpdateFilesServiceId).to(UpdateFilesService);
  bind(TransformTailwindConfigServiceId).to(TransformTailwindConfigService);
  bind(AddTailwindConfigThemeServiceId).to(AddTailwindConfigThemeService);
  bind(CreateSourceFileServiceId).to(CreateSourceFileService);
  bind(ParseObjectLiteralServiceId).to(ParseObjectLiteralService);
  bind(UpdateTailwindConfigServiceId).to(UpdateTailwindConfigService);
  bind(UpdateCssServiceId).to(UpdateCssService);
  bind(FileSystemServiceId).to(NodeFileSystem);
});