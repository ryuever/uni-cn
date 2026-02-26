# uni-cn - Project Brief

## Overview

uni-cn is a headless CLI for adding Vue/UI components to projects. It is derived from [shadcn-vue CLI](https://github.com/unovue/shadcn-vue/tree/dev/packages/cli) but refactored to support Dependency Injection (DI), enabling the filesystem (fs) to be swapped (e.g. memfs for testing or non-Node environments).

## Goals

1. **DI-based architecture**: Abstract filesystem operations behind `IFileSystemService`; provide `NodeFileSystem` (real disk) and `MemFileSystem` (memfs in-memory).
2. **Compatibility**: Maintain compatibility with shadcn-vue's test expectations and CLI behavior (init, add commands).
3. **Extensibility**: Support additional features such as add template, and run in non-Node contexts when using MemFileSystem.

## Scope

- init command: Initialize project with components.json
- add command: Add components from registry
- DI container with @inject / @injectable
- File system abstraction: IFileSystemService, NodeFileSystem, MemFileSystem
- Test suite with Vitest, fixtures, runInit export for programmatic use

## Out of Scope (current)

- MCP integration
- migrate, diff, info, build commands
- Full parity with all shadcn-vue tests

## Key Decisions

- Path alias: `@/` (replaced `@/delightless-vue`)
- Package name: `uni-cn`
- CLI entry: `src/cli.ts` (separate from library exports in `src/index.ts`)
- Build: tsdown (ESM, Node 18+)
