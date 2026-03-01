<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const props = defineProps<{
  logLines: string[];
}>();

const terminalRef = ref<HTMLDivElement | null>(null);
let terminal: Terminal | null = null;
let fitAddon: FitAddon | null = null;

onMounted(() => {
  if (!terminalRef.value) return;
  terminal = new Terminal({
    theme: {
      background: '#0f172a',
      foreground: '#e2e8f0',
      cursor: '#3b82f6',
      cursorAccent: '#0f172a',
      selectionBackground: '#334155',
      black: '#0f172a',
      red: '#f87171',
      green: '#4ade80',
      yellow: '#facc15',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#22d3ee',
      white: '#e2e8f0',
    },
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    allowProposedApi: false,
  });
  fitAddon = new FitAddon();
  terminal.loadAddon(fitAddon);
  terminal.open(terminalRef.value);
  fitAddon.fit();

  const ro = new ResizeObserver(() => fitAddon?.fit());
  ro.observe(terminalRef.value);
});

let lastWrittenCount = 0;
watch(
  () => props.logLines,
  (lines) => {
    if (!terminal) return;
    if (lines.length < lastWrittenCount) {
      terminal.clear();
      lastWrittenCount = 0;
    }
    for (let i = lastWrittenCount; i < lines.length; i++) {
      terminal.writeln(lines[i]);
    }
    lastWrittenCount = lines.length;
  },
  { immediate: true }
);

defineExpose({
  clear: () => {
    terminal?.clear();
  },
});
</script>

<template>
  <div class="terminal-wrap">
    <div class="terminal-header">Terminal</div>
    <div ref="terminalRef" class="terminal-container" />
  </div>
</template>

<style scoped>
.terminal-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f172a;
  border-top: 1px solid #334155;
}

.terminal-header {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
  border-bottom: 1px solid #334155;
}

.terminal-container {
  flex: 1;
  min-height: 0;
  padding: 0.5rem;
}
</style>
