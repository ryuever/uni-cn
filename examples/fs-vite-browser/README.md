# uni-cn Browser Demo (Vite + Vue)

Run **init** and **create** commands in the browser using memfs.

## Setup

From the repo root:

```bash
pnpm install
pnpm run build   # build uni-cn
cd examples/fs-vite-browser
pnpm install
pnpm run dev
```

Open http://localhost:5173 and use the Init and Create tabs to run the commands against a virtual filesystem.

## Notes

- **Init**: Writes `components.json` to memfs. Uses pre-built config; skips npm install and add components.
- **Create**: Creates a project from a template (e.g. `default`) into memfs.
- Production build may require additional Node polyfill configuration; dev mode is fully supported.
