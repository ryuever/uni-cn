<script setup lang="ts">
import { ref } from 'vue';
import { Volume } from 'memfs';
import {
  runInitWithVolume,
  buildMemfsConfig,
  defaultMemfsRawConfig,
} from 'uni-cn/browser';
import type { RawConfig } from 'uni-cn/browser';

const root = ref('/project');
const style = ref('new-york');
const baseColor = ref('zinc');
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<Record<string, string> | null>(null);

const baseColors = [
  'zinc',
  'slate',
  'stone',
  'gray',
  'neutral',
  'red',
  'rose',
  'orange',
  'green',
  'blue',
  'yellow',
  'violet',
];

async function runInit() {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    const vol = new Volume();
    vol.mkdirSync(root.value, { recursive: true });
    vol.writeFileSync(
      `${root.value}/package.json`,
      JSON.stringify({ name: 'demo', private: true }, null, 2),
      'utf-8'
    );

    const rawConfig: RawConfig = {
      ...defaultMemfsRawConfig,
      style: style.value,
      tailwind: {
        ...defaultMemfsRawConfig.tailwind,
        baseColor: baseColor.value,
      },
    };
    const config = buildMemfsConfig(root.value, rawConfig);

    await runInitWithVolume(vol, root.value, config);

    const json = vol.toJSON();
    result.value = json as Record<string, string>;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="example">
    <section class="form">
      <h2>Init</h2>
      <p class="desc">
        Initialize components.json in a virtual project. Uses memfs; no
        npm install.
      </p>
      <div class="fields">
        <label>
          <span>Root path</span>
          <input v-model="root" type="text" />
        </label>
        <label>
          <span>Style</span>
          <select v-model="style">
            <option value="new-york">New York</option>
            <option value="default">Default</option>
          </select>
        </label>
        <label>
          <span>Base color</span>
          <select v-model="baseColor">
            <option v-for="c in baseColors" :key="c" :value="c">
              {{ c }}
            </option>
          </select>
        </label>
      </div>
      <button :disabled="loading" @click="runInit">
        {{ loading ? 'Running...' : 'Run Init' }}
      </button>
    </section>

    <section v-if="error" class="error">
      {{ error }}
    </section>

    <section v-if="result" class="output">
      <h3>Generated files</h3>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </section>
  </div>
</template>

<style scoped>
.example {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1.25rem;
}

.form h2 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
}

.desc {
  margin: 0 0 1rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 140px;
}

.fields span {
  font-size: 0.8rem;
  color: #94a3b8;
}

.fields input,
.fields select {
  padding: 0.5rem;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 4px;
}

.form button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  border: none;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.form button:hover:not(:disabled) {
  background: #2563eb;
}

.form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  padding: 1rem;
  background: #7f1d1d;
  border: 1px solid #991b1b;
  border-radius: 8px;
  color: #fecaca;
}

.output {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 1.25rem;
}

.output h3 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}

.output pre {
  margin: 0;
  font-size: 0.8rem;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
