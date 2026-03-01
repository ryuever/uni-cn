<script setup lang="ts">
import { ref, computed, defineAsyncComponent, h } from 'vue';
import { useMemfs } from './composables/useMemfs';
import FileTree from './components/FileTree.vue';
import MonacoEditor from './components/MonacoEditor.vue';
import TerminalLog from './components/TerminalLog.vue';

const tab = ref<'init' | 'create' | 'add'>('init');
const expandedPaths = ref(new Set<string>(['/project']));

const {
  vol,
  root,
  selectedPath,
  logLines,
  refreshKey,
  ensureProject,
  getFileContent,
  setFileContent,
  buildFileTree,
  runInit,
  runCreate,
  runAdd,
} = useMemfs();

ensureProject();

const fileTreeNodes = computed(() => {
  refreshKey.value;
  return buildFileTree(root.value);
});
const selectedContent = computed(() =>
  selectedPath.value ? getFileContent(selectedPath.value) : ''
);

function toggleExpand(path: string) {
  const next = new Set(expandedPaths.value);
  if (next.has(path)) {
    next.delete(path);
  } else {
    next.add(path);
  }
  expandedPaths.value = next;
}

function onEditorUpdate(value: string) {
  if (selectedPath.value) {
    setFileContent(selectedPath.value, value);
  }
}

const ErrorFallback = {
  props: ['error'],
  setup(props: { error?: Error }) {
    return () =>
      h('div', { class: 'error-box' }, [
        h('h3', 'Failed to load'),
        h(
          'pre',
          props.error?.stack || props.error?.message || String(props.error)
        ),
      ]);
  },
};

const InitExample = defineAsyncComponent({
  loader: () => import('./examples/InitExample.vue'),
  errorComponent: ErrorFallback,
});
const CreateExample = defineAsyncComponent({
  loader: () => import('./examples/CreateExample.vue'),
  errorComponent: ErrorFallback,
});
const AddExample = defineAsyncComponent({
  loader: () => import('./examples/AddExample.vue'),
  errorComponent: ErrorFallback,
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>uni-cn Browser Demo</h1>
      <p class="subtitle">
        CodeSandbox-like demo: init, create, and add components in the browser
      </p>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <div class="sidebar-header">Files</div>
        <FileTree
          :nodes="fileTreeNodes"
          :selected-path="selectedPath"
          :root="root"
          :expanded-paths="expandedPaths"
          @select="selectedPath = $event"
          @toggle="toggleExpand"
        />
      </aside>

      <div class="main">
        <nav class="tabs">
          <button
            :class="{ active: tab === 'init' }"
            @click="tab = 'init'"
          >
            Init
          </button>
          <button
            :class="{ active: tab === 'create' }"
            @click="tab = 'create'"
          >
            Create
          </button>
          <button
            :class="{ active: tab === 'add' }"
            @click="tab = 'add'"
          >
            Add
          </button>
        </nav>

        <div class="content-area">
          <div class="form-area">
            <Suspense>
              <InitExample
                v-if="tab === 'init'"
                :run-init="runInit"
              />
              <CreateExample
                v-else-if="tab === 'create'"
                :run-create="runCreate"
              />
              <AddExample
                v-else
                :run-add="runAdd"
                :run-init="runInit"
                :vol="vol"
                :root="root"
              />
              <template #fallback>
                <p class="loading">Loading...</p>
              </template>
            </Suspense>
          </div>
          <div class="editor-area">
            <MonacoEditor
              :value="selectedContent"
              :path="selectedPath"
              @update:value="onEditorUpdate"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="terminal-area">
      <TerminalLog :log-lines="logLines" />
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  flex-shrink: 0;
  border-bottom: 1px solid #334155;
  padding: 0.75rem 1rem;
}

.app-header h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

.layout {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid #334155;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
  border-bottom: 1px solid #334155;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  border-bottom: 1px solid #334155;
}

.tabs button {
  padding: 0.4rem 0.75rem;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.tabs button:hover {
  background: #334155;
}

.tabs button.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

.content-area {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.form-area {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #334155;
  overflow-y: auto;
}

.editor-area {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.loading {
  color: #94a3b8;
  padding: 1rem;
}

.error-box {
  padding: 1rem;
  background: #7f1d1d;
  border: 1px solid #991b1b;
  border-radius: 8px;
  color: #fecaca;
}

.terminal-area {
  height: 180px;
  flex-shrink: 0;
  overflow: hidden;
}
</style>
