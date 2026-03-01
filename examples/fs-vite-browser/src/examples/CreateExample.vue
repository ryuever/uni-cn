<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  runCreate: (options?: {
    template?: string;
    style?: string;
    name?: string;
  }) => Promise<boolean>;
}>();

const template = ref('default');
const style = ref('default');
const name = ref('my-project');
const loading = ref(false);
const error = ref<string | null>(null);

async function doCreate() {
  loading.value = true;
  error.value = null;

  try {
    await props.runCreate({
      template: template.value,
      style: style.value,
      name: name.value,
    });
  } catch {
    error.value = 'Create failed. See terminal for details.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="example">
    <section class="form">
      <h2>Create</h2>
      <p class="desc">
        Create a new project from a template. Uses memfs.
      </p>
      <div class="fields">
        <label>
          <span>Template</span>
          <input v-model="template" type="text" />
        </label>
        <label>
          <span>Style</span>
          <input v-model="style" type="text" />
        </label>
        <label>
          <span>Project name</span>
          <input v-model="name" type="text" />
        </label>
      </div>
      <button :disabled="loading" @click="doCreate">
        {{ loading ? 'Running...' : 'Run Create' }}
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
