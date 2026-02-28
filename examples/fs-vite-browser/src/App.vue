<script setup lang="ts">
import { ref } from 'vue';
import InitExample from './examples/InitExample.vue';
import CreateExample from './examples/CreateExample.vue';

const tab = ref<'init' | 'create'>('init');
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
      <InitExample v-show="tab === 'init'" />
      <CreateExample v-show="tab === 'create'" />
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
</style>
