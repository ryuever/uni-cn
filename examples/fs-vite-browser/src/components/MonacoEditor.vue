<script setup lang="ts">
import { computed, watch } from 'vue';
import { CodeEditor } from 'monaco-editor-vue3';

const props = defineProps<{
  value: string;
  path: string | null;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:value', value: string): void;
}>();

const language = computed(() => {
  if (!props.path) return 'plaintext';
  const ext = props.path.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    vue: 'html',
    css: 'css',
    html: 'html',
  };
  return map[ext] ?? 'plaintext';
});

const editorOptions = {
  fontSize: 13,
  minimap: { enabled: false },
  automaticLayout: true,
  readOnly: props.readOnly ?? false,
  wordWrap: 'on' as const,
  scrollBeyondLastLine: false,
};
</script>

<template>
  <div class="monaco-editor-wrap">
    <div v-if="!path" class="placeholder">
      Select a file from the sidebar to view its content
    </div>
    <CodeEditor
      v-else
      :key="path"
      :value="value"
      :language="language"
      theme="vs-dark"
      :options="editorOptions"
      @update:value="emit('update:value', $event)"
    />
  </div>
</template>

<style scoped>
.monaco-editor-wrap {
  height: 100%;
  min-height: 200px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #64748b;
  font-size: 0.9rem;
}
</style>
