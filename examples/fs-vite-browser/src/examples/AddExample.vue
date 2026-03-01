<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Volume } from 'memfs';

const props = defineProps<{
  runAdd: (components: string[], options?: { style?: string }) => Promise<boolean>;
  runCreate: (options?: { template?: string; style?: string; name?: string }) => Promise<boolean>;
  runInit: (options?: { style?: string; baseColor?: string }) => Promise<boolean>;
  vol: Volume;
  root: string;
}>();

const addType = ref<'component' | 'template'>('component');
const componentInput = ref('button');
const style = ref('new-york');
const templateName = ref('default');
const templateStyle = ref('default');
const projectName = ref('my-project');
const loading = ref(false);
const error = ref<string | null>(null);

const title = computed(() => addType.value === 'component' ? 'Add Component' : 'Add Template');
const desc = computed(() =>
  addType.value === 'component'
    ? 'Add components to your project. Run Init first if needed.'
    : 'Download a template and scaffold files as-is into the virtual project.'
);
const buttonLabel = computed(() =>
  loading.value
    ? 'Running...'
    : addType.value === 'component' ? 'Run Add' : 'Run Add Template'
);

async function doAdd() {
  loading.value = true;
  error.value = null;

  try {
    if (addType.value === 'template') {
      await props.runCreate({
        template: templateName.value,
        style: templateStyle.value,
        name: projectName.value,
      });
    } else {
      const components = componentInput.value
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (!components.length) {
        error.value = 'Enter at least one component (e.g. button, card)';
        loading.value = false;
        return;
      }

      const hasComponentsJson = props.vol.existsSync(
        `${props.root}/components.json`
      );
      if (!hasComponentsJson) {
        await props.runInit({ style: style.value });
      }

      await props.runAdd(components, { style: style.value });
    }
  } catch {
    error.value = `${title.value} failed. See terminal for details.`;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="example">
    <section class="form">
      <h2>Add</h2>
      <p class="desc">{{ desc }}</p>

      <div class="fields">
        <label>
          <span>Type</span>
          <select v-model="addType">
            <option value="component">Component</option>
            <option value="template">Template</option>
          </select>
        </label>

        <template v-if="addType === 'component'">
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
        </template>

        <template v-else>
          <label>
            <span>Template</span>
            <input v-model="templateName" type="text" placeholder="default" />
          </label>
          <label>
            <span>Style</span>
            <input v-model="templateStyle" type="text" placeholder="default" />
          </label>
          <label>
            <span>Project name</span>
            <input v-model="projectName" type="text" placeholder="my-project" />
          </label>
        </template>
      </div>

      <button :disabled="loading" @click="doAdd">
        {{ buttonLabel }}
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
