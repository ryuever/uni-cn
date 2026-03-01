<script setup lang="ts">
import type { TreeNode } from '../composables/useMemfs';

const props = defineProps<{
  nodes: TreeNode[];
  selectedPath: string | null;
  root: string;
  expandedPaths: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'select', path: string): void;
  (e: 'toggle', path: string): void;
}>();

function displayName(node: TreeNode) {
  return node.isDir ? `${node.name}/` : node.name;
}
</script>

<template>
  <div class="file-tree">
    <div v-if="!nodes.length" class="empty">No files yet</div>
    <template v-for="node in nodes" :key="node.path">
      <div
        v-if="node.isDir"
        class="tree-node dir"
      >
        <button
          type="button"
          class="tree-row"
          :class="{ expanded: expandedPaths.has(node.path) }"
          @click="emit('toggle', node.path)"
        >
          <span class="icon">{{ expandedPaths.has(node.path) ? '▼' : '▶' }}</span>
          <span class="name">{{ displayName(node) }}</span>
        </button>
        <div
          v-if="expandedPaths.has(node.path)"
          class="tree-children"
        >
          <FileTree
            :nodes="node.children ?? []"
            :selected-path="selectedPath"
            :root="root"
            :expanded-paths="expandedPaths"
            @select="emit('select', $event)"
            @toggle="emit('toggle', $event)"
          />
        </div>
      </div>
      <button
        v-else
        type="button"
        class="tree-row file"
        :class="{ selected: selectedPath === node.path }"
        @click="emit('select', node.path)"
      >
        <span class="icon" />
        <span class="name">{{ node.name }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.file-tree {
  font-size: 0.85rem;
  user-select: none;
}

.empty {
  color: #64748b;
  padding: 0.5rem;
  font-size: 0.8rem;
}

.tree-node.dir {
  margin: 0;
}

.tree-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
  padding: 0.25rem 0.5rem;
  border: none;
  background: transparent;
  color: #e2e8f0;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  font-size: inherit;
  border-radius: 4px;
}

.tree-row:hover {
  background: #334155;
}

.tree-row.file.selected {
  background: #334155;
  color: #3b82f6;
}

.tree-row .icon {
  width: 1rem;
  flex-shrink: 0;
  font-size: 0.6rem;
  color: #64748b;
}

.tree-children {
  padding-left: 1rem;
  border-left: 1px solid #334155;
  margin-left: 0.5rem;
}
</style>
