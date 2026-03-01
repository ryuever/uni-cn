/**
 * Registry mock fixtures for browser-memfs tests.
 * These match the shadcn-vue registry responses that produce
 * the expected outputs in the data files.
 */

export const REGISTRY_URL = 'https://ui.shadcn.com/r';

export const REGISTRY_INDEX = [
  {
    name: 'button',
    type: 'registry:ui',
    dependencies: ['reka-ui'],
    files: [
      { path: 'ui/button/Button.vue', type: 'registry:ui' },
      { path: 'ui/button/index.ts', type: 'registry:ui' },
    ],
  },
  {
    name: 'utils',
    type: 'registry:lib',
    dependencies: ['clsx', 'tailwind-merge'],
    files: [{ path: 'lib/utils.ts', type: 'registry:lib' }],
  },
];

export const STYLE_INDEX = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'index',
  type: 'registry:style',
  dependencies: [
    'class-variance-authority',
    'lucide-vue-next',
  ],
  devDependencies: [
    'tw-animate-css',
  ],
  registryDependencies: ['utils'],
  files: [],
  tailwind: {
    config: {},
  },
  cssVars: {},
};

export const STYLE_UTILS = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'utils',
  type: 'registry:lib',
  dependencies: ['clsx', 'tailwind-merge'],
  files: [
    {
      path: 'lib/utils.ts',
      content: `import type { ClassValue } from "clsx"
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
      type: 'registry:lib',
      target: '',
    },
  ],
};

export const STYLE_BUTTON = {
  $schema: 'https://ui.shadcn.com/schema/registry-item.json',
  name: 'button',
  type: 'registry:ui',
  dependencies: ['reka-ui'],
  registryDependencies: [],
  files: [
    {
      path: 'ui/button/Button.vue',
      content: `<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="variant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
`,
      type: 'registry:ui',
      target: '',
    },
    {
      path: 'ui/button/index.ts',
      content: `import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-9 px-4 py-2 has-[>svg]:px-3",
        "sm": "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        "lg": "h-10 rounded-md px-6 has-[>svg]:px-4",
        "icon": "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
`,
      type: 'registry:ui',
      target: '',
    },
  ],
};

export const COLORS_NEUTRAL = {
  inlineColors: {
    light: {} as Record<string, string>,
    dark: {} as Record<string, string>,
  },
  cssVars: {
    light: {
      background: '0 0% 100%',
      foreground: '0 0% 3.9%',
    },
    dark: {
      background: '0 0% 3.9%',
      foreground: '0 0% 98%',
    },
  },
  cssVarsV4: {
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.145 0 0)',
      card: 'oklch(1 0 0)',
      'card-foreground': 'oklch(0.145 0 0)',
      popover: 'oklch(1 0 0)',
      'popover-foreground': 'oklch(0.145 0 0)',
      primary: 'oklch(0.205 0 0)',
      'primary-foreground': 'oklch(0.985 0 0)',
      secondary: 'oklch(0.97 0 0)',
      'secondary-foreground': 'oklch(0.205 0 0)',
      muted: 'oklch(0.97 0 0)',
      'muted-foreground': 'oklch(0.556 0 0)',
      accent: 'oklch(0.97 0 0)',
      'accent-foreground': 'oklch(0.205 0 0)',
      destructive: 'oklch(0.577 0.245 27.325)',
      border: 'oklch(0.922 0 0)',
      input: 'oklch(0.922 0 0)',
      ring: 'oklch(0.708 0 0)',
      'chart-1': 'oklch(0.646 0.222 41.116)',
      'chart-2': 'oklch(0.6 0.118 184.704)',
      'chart-3': 'oklch(0.398 0.07 227.392)',
      'chart-4': 'oklch(0.828 0.189 84.429)',
      'chart-5': 'oklch(0.769 0.188 70.08)',
      radius: '0.625rem',
      sidebar: 'oklch(0.985 0 0)',
      'sidebar-foreground': 'oklch(0.145 0 0)',
      'sidebar-primary': 'oklch(0.205 0 0)',
      'sidebar-primary-foreground': 'oklch(0.985 0 0)',
      'sidebar-accent': 'oklch(0.97 0 0)',
      'sidebar-accent-foreground': 'oklch(0.205 0 0)',
      'sidebar-border': 'oklch(0.922 0 0)',
      'sidebar-ring': 'oklch(0.708 0 0)',
    },
    dark: {
      background: 'oklch(0.145 0 0)',
      foreground: 'oklch(0.985 0 0)',
      card: 'oklch(0.205 0 0)',
      'card-foreground': 'oklch(0.985 0 0)',
      popover: 'oklch(0.205 0 0)',
      'popover-foreground': 'oklch(0.985 0 0)',
      primary: 'oklch(0.922 0 0)',
      'primary-foreground': 'oklch(0.205 0 0)',
      secondary: 'oklch(0.269 0 0)',
      'secondary-foreground': 'oklch(0.985 0 0)',
      muted: 'oklch(0.269 0 0)',
      'muted-foreground': 'oklch(0.708 0 0)',
      accent: 'oklch(0.269 0 0)',
      'accent-foreground': 'oklch(0.985 0 0)',
      destructive: 'oklch(0.704 0.191 22.216)',
      border: 'oklch(1 0 0 / 10%)',
      input: 'oklch(1 0 0 / 15%)',
      ring: 'oklch(0.556 0 0)',
      'chart-1': 'oklch(0.488 0.243 264.376)',
      'chart-2': 'oklch(0.696 0.17 162.48)',
      'chart-3': 'oklch(0.769 0.188 70.08)',
      'chart-4': 'oklch(0.627 0.265 303.9)',
      'chart-5': 'oklch(0.645 0.246 16.439)',
      sidebar: 'oklch(0.205 0 0)',
      'sidebar-foreground': 'oklch(0.985 0 0)',
      'sidebar-primary': 'oklch(0.488 0.243 264.376)',
      'sidebar-primary-foreground': 'oklch(0.985 0 0)',
      'sidebar-accent': 'oklch(0.269 0 0)',
      'sidebar-accent-foreground': 'oklch(0.985 0 0)',
      'sidebar-border': 'oklch(1 0 0 / 10%)',
      'sidebar-ring': 'oklch(0.556 0 0)',
    },
  },
  inlineColorsTemplate: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n',
  cssVarsTemplate: '',
};

export const ICONS_INDEX = {};
