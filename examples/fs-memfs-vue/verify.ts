/**
 * Verify: read content.ts -> populate memfs -> runInitWithVolume -> runAddWithVolume (button) -> assert files exist
 */
import type { Volume } from 'memfs';
import { getPopulatedVolume } from './populate-memfs';
import { runInitWithVolume } from './runInit';
import { runAddWithVolume } from './runAdd';

const ROOT = '/project';

function printTree(vol: Volume, dir: string, prefix = ''): void {
  const entries = vol.readdirSync(dir, { withFileTypes: true }) as Array<{ name: string; isDirectory: () => boolean }>;
  const sorted = entries.sort((a, b) => {
    const aDir = a.isDirectory() ? 0 : 1;
    const bDir = b.isDirectory() ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return a.name.localeCompare(b.name);
  });
  for (let i = 0; i < sorted.length; i++) {
    const ent = sorted[i];
    const isLast = i === sorted.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const name = ent.isDirectory() ? `${ent.name}/` : ent.name;
    console.log(prefix + branch + name);
    if (ent.isDirectory()) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(vol, `${dir}/${ent.name}`, nextPrefix);
    }
  }
}

const { vol, root } = getPopulatedVolume(ROOT);

// Read back and verify key files
const packageJson = vol.readFileSync(`${root}/package.json`, 'utf-8');
const parsed = JSON.parse(packageJson as string);

console.log('[verify] memfs populated successfully');
console.log('[verify] root:', root);
console.log('[verify] package.json name:', parsed.name);

// Run init to add components.json to vol
await runInitWithVolume(vol, root);
console.log('[verify] runInitWithVolume done, components.json added');

// Verify components.json exists
const componentsJson = vol.readFileSync(`${root}/components.json`, 'utf-8');
const componentsConfig = JSON.parse(componentsJson as string);
console.log('[verify] components.json style:', componentsConfig.style);

// Run add button to add button component to vol
await runAddWithVolume(vol, root, ['button']);
console.log('[verify] runAddWithVolume(button) done');

// Verify button component files exist in memfs
const buttonVuePath = `${root}/src/components/ui/button/Button.vue`;
const buttonIndexPath = `${root}/src/components/ui/button/index.ts`;
if (!vol.existsSync(buttonVuePath)) {
  throw new Error(`Expected button component at ${buttonVuePath} but file missing`);
}
if (!vol.existsSync(buttonIndexPath)) {
  throw new Error(`Expected button index at ${buttonIndexPath} but file missing`);
}
const buttonVueContent = vol.readFileSync(buttonVuePath, 'utf-8') as string;
const buttonIndexContent = vol.readFileSync(buttonIndexPath, 'utf-8') as string;
console.log('[verify] button Button.vue exists, length:', buttonVueContent.length);
console.log('[verify] button index.ts exists, length:', buttonIndexContent.length);
if (!buttonVueContent.includes('buttonVariants')) {
  throw new Error('Expected Button.vue to contain buttonVariants');
}
if (!buttonIndexContent.includes('export { default as Button }')) {
  throw new Error('Expected button index.ts to export Button');
}
console.log('[verify] button component content verified');

console.log('\n[verify] tree:');
console.log(root + '/');
printTree(vol, root);
