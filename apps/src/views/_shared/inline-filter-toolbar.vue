<template>
  <div class="inline-filter-toolbar">
    <slot />
  </div>
</template>

<style scoped>
.inline-filter-toolbar {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  white-space: nowrap;
  width: 100%;
}

.inline-filter-toolbar > * {
  flex: 0 0 auto;
}
</style>
