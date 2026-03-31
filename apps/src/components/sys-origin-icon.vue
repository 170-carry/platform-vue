<script lang="ts" setup>
import { computed } from 'vue';

import { SvgLikeiIcon } from '@vben/icons';

const props = withDefaults(
  defineProps<{
    code?: string;
    label?: string;
    size?: number | string;
  }>(),
  {
    code: '',
    label: '',
    size: 18,
  },
);

const iconMap = {
  likei: SvgLikeiIcon,
} as const;

const normalizedCode = computed(() =>
  String(props.code || props.label || '')
    .trim()
    .toLowerCase(),
);

const iconComponent = computed(
  () => iconMap[normalizedCode.value as keyof typeof iconMap] || null,
);

const iconSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
);

const fallbackText = computed(() => {
  const value = String(props.label || props.code || '?').trim();
  return value ? value.slice(0, 1).toUpperCase() : '?';
});
</script>

<template>
  <span
    class="sys-origin-icon"
    :style="{ height: iconSize, width: iconSize }"
  >
    <component :is="iconComponent" v-if="iconComponent" class="sys-origin-icon__graphic" />
    <span v-else class="sys-origin-icon__fallback">
      {{ fallbackText }}
    </span>
  </span>
</template>

<style scoped>
.sys-origin-icon {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto;
  justify-content: center;
  overflow: hidden;
}

.sys-origin-icon__graphic {
  display: block;
  height: 100%;
  width: 100%;
}

.sys-origin-icon__fallback {
  align-items: center;
  background: linear-gradient(135deg, #c670ff 0%, #7726ff 100%);
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-size: 10px;
  font-weight: 700;
  height: 100%;
  justify-content: center;
  line-height: 1;
  text-transform: uppercase;
  width: 100%;
}

.sys-origin-icon__graphic :deep(svg) {
  display: block;
  height: 100%;
  width: 100%;
}
</style>
