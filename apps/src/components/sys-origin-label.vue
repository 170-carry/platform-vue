<script lang="ts" setup>
import { computed } from 'vue';

import { SYS_ORIGIN_OPTIONS } from '#/views/system/shared';

import SysOriginIcon from './sys-origin-icon.vue';

const props = withDefaults(
  defineProps<{
    size?: number | string;
    value?: null | string;
  }>(),
  {
    size: 18,
    value: '',
  },
);

const optionMap = new Map(SYS_ORIGIN_OPTIONS.map((item) => [item.value, item]));

const option = computed(() => optionMap.get(String(props.value || '')));
const label = computed(() => option.value?.label || String(props.value || '-'));
const iconCode = computed(() => option.value?.icon || String(props.value || ''));
</script>

<template>
  <span class="sys-origin-label">
    <SysOriginIcon :code="iconCode" :label="label" :size="size" />
    <span class="sys-origin-label__text">{{ label }}</span>
  </span>
</template>

<style scoped>
.sys-origin-label {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  min-width: 0;
}

.sys-origin-label__text {
  line-height: 1;
  white-space: nowrap;
}
</style>
