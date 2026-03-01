# fs-memfs-vue

Preparation for MemFileSystem service verification. Contains:

- **content.ts** – String structure (path → content) mirroring fs-node-vue file tree
- **populate-memfs.ts** – Reads content.ts and fills a memfs Volume
- **verify.ts** – Runs populate and verifies files exist in memfs

## Usage

```bash
cd examples/fs-memfs-vue
npm install
npm run verify
```

## Flow

1. `content.ts` exports `projectContent` (Record of paths to file contents) and `nodeModulesStructure` (dirs to create)
2. `populateMemfs(root)` creates a Volume, writes all files, creates node_modules placeholder
3. Use the returned Volume with `MemFileSystem` for service verification

## Next steps

Wire the populated Volume into MemFileSystem and run uni-cn add/init against it.
