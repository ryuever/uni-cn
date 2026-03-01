<script setup lang="ts">
import { ref, defineAsyncComponent, h } from 'vue';

const tab = ref<'init' | 'create'>('init');

const ErrorFallback = {
  props: ['error'],
  setup(props: { error?: Error }) {
    return () =>
      h('div', { class: 'error-box' }, [
        h('h3', 'Failed to load'),
        h('pre', props.error?.stack || props.error?.message || String(props.error)),
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
</script>

<template>
  <div class="app">
    <header>
      <h1>uni-cn Browser Demo</h1>
      <p class="subtitle">
        Run <strong>init</strong> and <strong>create</strong> commands in the
        browser using memfs
      </p>
    </header>

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
    </nav>

    <main>
      <Suspense>
        <InitExample v-if="tab === 'init'" />
        <CreateExample v-else />
        <template #fallback>
          <p class="loading">Loading...</p>
        </template>
      </Suspense>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  border-bottom: 1px solid #334155;
  padding-bottom: 1rem;
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.subtitle {
  margin: 0.5rem 0 0;
  color: #94a3b8;
  font-size: 0.95rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tabs button {
  padding: 0.5rem 1rem;
  border: 1px solid #334155;
  background: #1e293b;
  color: #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.tabs button:hover {
  background: #334155;
}

.tabs button.active {
  background: #3b82f6;
  border-color: #3b82f6;
}

main {
  flex: 1;
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

.error-box pre {
  overflow: auto;
  white-space: pre-wrap;
}
</style>
