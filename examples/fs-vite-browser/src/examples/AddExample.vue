<script setup lang="ts">
import { ref } from 'vue';
import type { Volume } from 'memfs';

const props = defineProps<{
  runAdd: (components: string[], options?: { style?: string }) => Promise<boolean>;
  runInit: (options?: { style?: string; baseColor?: string }) => Promise<boolean>;
  vol: Volume;
  root: string;
}>();

const componentInput = ref('button');
const style = ref('new-york');
const loading = ref(false);
const error = ref<string | null>(null);

async function doAdd() {
  loading.value = true;
  error.value = null;

  const components = componentInput.value
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!components.length) {
    error.value = 'Enter at least one component (e.g. button, card)';
    loading.value = false;
    return;
  }

  try {
    const hasComponentsJson = props.vol.existsSync(
      `${props.root}/components.json`
    );

    if (!hasComponentsJson) {
      await props.runInit({ style: style.value });
    }

    await props.runAdd(components, { style: style.value });
  } catch {
    error.value = 'Add failed. See terminal for details.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="example">
    <section class="form">
      <h2>Add</h2>
      <p class="desc">
        Add components to your project. Run Init first if needed.
      </p>
      <div class="fields">
        <label>
          <span>Components (comma or space separated)</span>
          <input
            v-model="componentInput"
            type="text"
            placeholder="button, card, input"
          />
        </label>
        <label>
          <span>Style</span>
          <select v-model="style">
            <option value="new-york">New York</option>
            <option value="default">Default</option>
          </select>
        </label>
      </div>
      <button :disabled="loading" @click="doAdd">
        {{ loading ? 'Running...' : 'Run Add' }}
      </button>
    </section>

    <section v-if="error" class="error">{{ error }}</section>
  </div>
</template>

<style scoped>
.example {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form {
  padding: 1rem;
}

.form h2 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.desc {
  margin: 0 0 0.75rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.fields label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.fields span {
  font-size: 0.75rem;
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
  padding: 0.75rem;
  margin: 0 1rem 1rem;
  background: #7f1d1d;
  border: 1px solid #991b1b;
  border-radius: 6px;
  color: #fecaca;
  font-size: 0.85rem;
}
</style>
