<script lang="ts" setup>
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    controlWidth?: number | string;
    label: string;
    labelWidth?: number | string;
    showLabel?: boolean;
  }>(),
  {
    controlWidth: undefined,
    labelWidth: 80,
    showLabel: false,
  },
);

function normalizeSize(value?: number | string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return typeof value === 'number' ? `${value}px` : value;
}

const labelStyle = computed(() => {
  const width = normalizeSize(props.labelWidth);
  return width ? { width } : undefined;
});

const controlStyle = computed(() => {
  const width = normalizeSize(props.controlWidth);
  return width ? { width } : undefined;
});
</script>

<template>
  <div
    class="inline-filter-field"
    :class="{ 'inline-filter-field--with-label': showLabel }"
  >
    <span
      v-if="showLabel"
      class="inline-filter-field__label"
      :style="labelStyle"
    >
      {{ label }}
    </span>
    <div class="inline-filter-field__control" :style="controlStyle">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.inline-filter-field {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0;
  min-width: 0;
  white-space: nowrap;
}

.inline-filter-field--with-label {
  gap: 8px;
}

.inline-filter-field__label {
  color: rgb(100 116 139);
  flex: 0 0 auto;
  font-size: 13px;
  line-height: 1.4;
  text-align: right;
}

.inline-filter-field__control {
  flex: 0 0 auto;
  min-width: 0;
}

.inline-filter-field__control :deep(.ant-cascader),
.inline-filter-field__control :deep(.ant-input),
.inline-filter-field__control :deep(.ant-input-affix-wrapper),
.inline-filter-field__control :deep(.ant-picker),
.inline-filter-field__control :deep(.ant-select) {
  width: 100%;
}
</style>
