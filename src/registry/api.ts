/* eslint-disable prefer-const */
import { createId, inject, injectable } from '@x-oasis/di';
import {
  iconsSchema,
  registryBaseColorSchema,
  registryIndexSchema,
  registryItemSchema,
  registryResolvedItemsTreeSchema,
  stylesSchema,
} from '@/registry/schema';
import {
  type Config,
  getTargetStyleFromConfig,
} from '@/utils/get-config';
import { handleError } from '@/utils/handle-error';
import { logger } from '@/utils/logger';
import { buildTailwindThemeColorsFromCssVars } from '@/utils/updaters/update-tailwind-config';

import { z } from 'zod';

import path from 'pathe';

import deepmerge from 'deepmerge';
import { ofetch } from 'ofetch';

import {
  isDelightlessWorkspaceProject,
  resolveDelightlessProjectName,
} from '../utils/delightless-env';
import type { GetProjectTailwindVersionFromConfigService } from '../utils/get-project-info';
import { GetProjectTailwindVersionFromConfigServiceId } from '../utils/get-project-info';
import { highlighter } from '../utils/highlighter';

const REGISTRY_URL =
  (typeof process !== 'undefined' && process.env?.REGISTRY_URL) ??
  'https://shadcn-vue.com/r';

export const RegistryGetThemeServiceId = createId(
  'registry-get-theme-service-id'
);

/** ProxyAgent is Node-only; in browser we use native fetch (dispatcher: undefined) */
let _agent: InstanceType<typeof import('undici').ProxyAgent> | undefined | null =
  null;
async function getAgent() {
  if (_agent !== null) return _agent;
  if (
    typeof window !== 'undefined' ||
    typeof process === 'undefined' ||
    !process.env?.https_proxy
  ) {
    _agent = undefined;
    return undefined;
  }
  try {
    const { ProxyAgent } = await import('undici');
    _agent = new ProxyAgent(process.env.https_proxy);
  } catch {
    _agent = undefined;
  }
  return _agent;
}

const registryCache = new Map<string, Promise<any>>();

export async function getRegistryIndex() {
  try {
    const [result] = await fetchRegistry(['index.json']);

    return registryIndexSchema.parse(result);
  } catch (error) {
    logger.error('\n');
    handleError(error);
  }
}

export async function getRegistryStyles() {
  try {
    const [result] = await fetchRegistry(['styles/index.json']);

    return stylesSchema.parse(result);
  } catch (error) {
    logger.error('\n');
    handleError(error);
    return [];
  }
}

export async function getRegistryIcons() {
  try {
    // const [result] = await fetchRegistry(['icons/index.json']);

    const [result] = await fetchRegistry([
      'https://ui.shadcn.com/r/icons/index.json',
    ]);
    return iconsSchema.parse(result);
  } catch (error) {
    handleError(error);
    return {};
  }
}

export async function getRegistryTemplates(
  templateName: string,
  style: string
) {
  try {
    const [result] = await fetchRegistry([
      isUrl(templateName)
        ? templateName
        : `styles/${style}/${templateName}.json`,
    ]);

    // TODO: 暂时先使用ItemSchema解析，后续需要使用TemplatesSchema解析a
    return registryItemSchema.parse(result);
  } catch (error) {
    handleError(error);
    return {};
  }
}

export async function getRegistryItem(name: string, style: string) {
  try {
    const [result] = await fetchRegistry([
      isUrl(name) ? name : `styles/${style}/${name}.json`,
    ]);

    return registryItemSchema.parse(result);
  } catch (error) {
    logger.break();
    handleError(error);
    return null;
  }
}

export const BASE_COLORS = [
  {
    name: 'neutral',
    label: 'Neutral',
  },
  {
    name: 'gray',
    label: 'Gray',
  },
  {
    name: 'zinc',
    label: 'Zinc',
  },
  {
    name: 'stone',
    label: 'Stone',
  },
  {
    name: 'slate',
    label: 'Slate',
  },
] as const;

export async function getRegistryBaseColors() {
  return BASE_COLORS;
}

export async function getRegistryBaseColor(baseColor: string) {
  try {
    const [result] = await fetchRegistry([`colors/${baseColor}.json`]);
    // const [result] = await fetchRegistry([
    //   `https://ui.shadcn.com/r/colors/neutral.json`,
    // ]);

    return registryBaseColorSchema.parse(result);
  } catch (error) {
    handleError(error);
  }
}

export async function resolveTree(
  index: z.infer<typeof registryIndexSchema>,
  names: string[]
) {
  const tree: z.infer<typeof registryIndexSchema> = [];

  for (const name of names) {
    const entry = index.find((entry) => entry.name === name);

    if (!entry) {
      continue;
    }

    tree.push(entry);

    if (entry.registryDependencies) {
      const dependencies = await resolveTree(index, entry.registryDependencies);
      tree.push(...dependencies);
    }
  }

  return tree.filter(
    (component, index, self) =>
      self.findIndex((c) => c.name === component.name) === index
  );
}

export async function fetchTree(
  style: string,
  tree: z.infer<typeof registryIndexSchema>
) {
  try {
    const paths = tree.map((item) => `styles/${style}/${item.name}.json`);
    const result = await fetchRegistry(paths);
    return registryIndexSchema.parse(result);
  } catch (error) {
    handleError(error);
  }
}

export async function getItemTargetPath(
  config: Config,
  item: Pick<z.infer<typeof registryItemSchema>, 'type'>,
  override?: string
) {
  if (override) {
    return override;
  }

  if (item.type === 'registry:ui') {
    return config.resolvedPaths.ui ?? config.resolvedPaths.components;
  }

  const [parent, type] = item.type?.split(':') ?? [];
  if (!(parent in config.resolvedPaths)) {
    return null;
  }

  return path.join(
    config.resolvedPaths[parent as keyof typeof config.resolvedPaths],
    type
  );
}

export async function fetchRegistry(paths: string[]) {
  try {
    const dispatcher = await getAgent();
    const results = await Promise.all(
      paths.map(async (path) => {
        const url = getRegistryUrl(path);

        // Check cache first
        if (registryCache.has(url)) {
          return registryCache.get(url);
        }

        // Store the promise in the cache before awaiting
        const fetchPromise = ofetch(url, {
          dispatcher,
          parseResponse: JSON.parse,
        }).catch((error) => {
          // Handle ofetch errors
          const status = error.status || error.statusCode;

          if (status === 401) {
            throw new Error(
              `You are not authorized to access the component at ${highlighter.info(
                url
              )}.\nIf this is a remote registry, you may need to authenticate.`
            );
          }

          if (status === 404) {
            throw new Error(
              `The component at ${highlighter.info(
                url
              )} was not found.\nIt may not exist at the registry. Please make sure it is a valid component.`
            );
          }

          if (status === 403) {
            throw new Error(
              `You do not have access to the component at ${highlighter.info(
                url
              )}.\nIf this is a remote registry, you may need to authenticate or a token.`
            );
          }

          const message =
            error.data?.error ||
            error.message ||
            `HTTP ${status || 'Unknown'} Error`;
          throw new Error(
            `Failed to fetch from ${highlighter.info(url)}.\n${message}`
          );
        });

        registryCache.set(url, fetchPromise);
        return fetchPromise;
      })
    );

    return results;
  } catch (error) {
    logger.error('\n');
    handleError(error);
    return [];
  }
}

export const RegistryResolveItemsTreeServiceId = createId(
  'registry-resolve-items-tree-service-id'
);
@injectable()
export class RegistryGetThemeService {
  constructor(
    @inject(GetProjectTailwindVersionFromConfigServiceId)
    private readonly getProjectTailwindVersionFromConfigService: GetProjectTailwindVersionFromConfigService
  ) {}

  async registryGetTheme(name: string, config: Config) {
    const [baseColor, tailwindVersion] = await Promise.all([
      getRegistryBaseColor(name),
      this.getProjectTailwindVersionFromConfigService.getProjectTailwindVersionFromConfig(
        config
      ),
    ]);
    if (!baseColor) {
      return null;
    }

    // TODO: Move this to the registry i.e registry:theme.
    const theme = {
      name,
      type: 'registry:theme',
      tailwind: {
        config: {
          theme: {
            extend: {
              borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
              },
              colors: {},
            },
          },
        },
      },
      cssVars: {
        theme: {},
        light: {
          radius: '0.5rem',
        },
        dark: {},
      },
    } satisfies z.infer<typeof registryItemSchema>;

    if (config.tailwind.cssVariables) {
      theme.tailwind.config.theme.extend.colors = {
        ...theme.tailwind.config.theme.extend.colors,
        ...buildTailwindThemeColorsFromCssVars(baseColor.cssVars.dark ?? {}),
      };
      theme.cssVars = {
        theme: {
          ...baseColor.cssVars.theme,
          ...theme.cssVars.theme,
        },
        light: {
          ...baseColor.cssVars.light,
          ...theme.cssVars.light,
        },
        dark: {
          ...baseColor.cssVars.dark,
          ...theme.cssVars.dark,
        },
      };

      if (tailwindVersion === 'v4' && baseColor.cssVarsV4) {
        theme.cssVars = {
          theme: {
            ...baseColor.cssVarsV4.theme,
            ...theme.cssVars.theme,
          },
          light: {
            ...theme.cssVars.light,
            ...baseColor.cssVarsV4.light,
          },
          dark: {
            ...theme.cssVars.dark,
            ...baseColor.cssVarsV4.dark,
          },
        };
      }
    }

    return theme;
  }
}
@injectable()
export class RegistryResolveItemsTreeService {
  constructor(
    @inject(RegistryGetThemeServiceId)
    private readonly registryGetThemeService: RegistryGetThemeService
  ) {}

  async registryResolveItemsTree(
    names: z.infer<typeof registryItemSchema>['name'][],
    config: Config
  ) {
    try {
      const index = await getRegistryIndex();
      if (!index) {
        return null;
      }

      // If we're resolving the index, we want it to go first.
      if (names.includes('index')) {
        names.unshift('index');
      }

      let registryItems = await resolveRegistryItems(names, config);
      let result = await fetchRegistry(registryItems);
      const payload = z.array(registryItemSchema).parse(result);

      if (!payload) {
        return null;
      }

      // If we're resolving the index, we want to fetch
      // the theme item if a base color is provided.
      // We do this for index only.
      // Other components will ship with their theme tokens.
      if (names.includes('index')) {
        if (config.tailwind.baseColor) {
          const theme = await this.registryGetThemeService.registryGetTheme(
            config.tailwind.baseColor,
            config
          );
          if (theme) {
            payload.unshift(theme);
          }
        }
      }

      // Sort the payload so that registry:theme is always first.
      payload.sort((a, b) => {
        if (a.type === 'registry:theme') {
          return -1;
        }
        return 1;
      });

      let tailwind = {};
      payload.forEach((item) => {
        tailwind = deepmerge(tailwind, item.tailwind ?? {});
      });

      let cssVars = {};
      payload.forEach((item) => {
        cssVars = deepmerge(cssVars, item.cssVars ?? {});
      });

      let css = {};
      payload.forEach((item) => {
        css = deepmerge(css, item.css ?? {});
      });

      let docs = '';
      payload.forEach((item) => {
        if (item.docs) {
          docs += `${item.docs}\n`;
        }
      });

      return registryResolvedItemsTreeSchema.parse({
        dependencies: deepmerge.all(
          payload.map((item) => item.dependencies ?? [])
        ),
        devDependencies: deepmerge.all(
          payload.map((item) => item.devDependencies ?? [])
        ),
        files: deepmerge.all(payload.map((item) => item.files ?? [])),
        tailwind,
        cssVars,
        css,
        docs,
      });
    } catch (error) {
      handleError(error);
      return null;
    }
  }
}

async function resolveRegistryDependencies(
  url: string,
  config: Config
): Promise<string[]> {
  const visited = new Set<string>();
  const payload: string[] = [];

  const style = config.resolvedPaths?.cwd
    ? await getTargetStyleFromConfig(config.resolvedPaths.cwd, config.style)
    : config.style;

  async function resolveDependencies(itemUrl: string) {
    let nextItemUrl = itemUrl;
    if (isDelightlessWorkspaceProject(nextItemUrl)) {
      nextItemUrl = resolveDelightlessProjectName(nextItemUrl) ?? nextItemUrl;
    }

    const url = getRegistryUrl(
      isUrl(nextItemUrl) ? nextItemUrl : `styles/${style}/${nextItemUrl}.json`
    );

    if (visited.has(url)) {
      return;
    }

    visited.add(url);

    try {
      const [result] = await fetchRegistry([url]);
      const item = registryItemSchema.parse(result);
      payload.push(url);

      if (item.registryDependencies) {
        for (const dependency of item.registryDependencies) {
          await resolveDependencies(dependency);
        }
      }
    } catch (error) {
      console.error(
        `Error fetching or parsing registry item at ${nextItemUrl}:`,
        error
      );
    }
  }

  await resolveDependencies(url);
  return Array.from(new Set(payload));
}

export function clearRegistryCache() {
  registryCache.clear();
}

function getRegistryUrl(path: string) {
  if (isUrl(path)) {
    // If the url contains /chat/b/, we assume it's the v0 registry.
    // We need to add the /json suffix if it's missing.
    const url = new URL(path);
    if (url.pathname.match(/\/chat\/b\//) && !url.pathname.endsWith('/json')) {
      url.pathname = `${url.pathname}/json`;
    }

    return url.toString();
  }

  return `${REGISTRY_URL}/${path}`;
}

export function isUrl(path: string) {
  try {
    new URL(path);
    return true;
  } catch (error) {
    return false;
  }
}

// TODO: We're double-fetching here. Use a cache.
export async function resolveRegistryItems(names: string[], config: Config) {
  const registryDependencies: string[] = [];
  for (const name of names) {
    const itemRegistryDependencies = await resolveRegistryDependencies(
      name,
      config
    );
    registryDependencies.push(...itemRegistryDependencies);
  }

  return Array.from(new Set(registryDependencies));
}

export function getRegistryTypeAliasMap() {
  return new Map<string, string>([
    ['registry:ui', 'ui'],
    ['registry:lib', 'lib'],
    ['registry:hook', 'hooks'],
    ['registry:composable', 'composable'],
    ['registry:block', 'components'],
    ['registry:component', 'components'],
  ]);
}

// Track a dependency and its parent.
export function getRegistryParentMap(
  registryItems: z.infer<typeof registryItemSchema>[]
) {
  const map = new Map<string, z.infer<typeof registryItemSchema>>();
  registryItems.forEach((item) => {
    if (!item.registryDependencies) {
      return;
    }

    item.registryDependencies.forEach((dependency) => {
      map.set(dependency, item);
    });
  });
  return map;
}
