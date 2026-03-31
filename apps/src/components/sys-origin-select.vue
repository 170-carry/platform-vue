<script lang="ts" setup>
import { computed, h, useAttrs } from 'vue';

import { useAccessStore } from '@vben/stores';

import { Select } from 'antdv-next';

import {
  SYS_ORIGIN_OPTIONS,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import SysOriginIcon from './sys-origin-icon.vue';

defineOptions({
  inheritAttrs: false,
  name: 'SysOriginSelect',
});

type SelectValue = null | number | string | Array<number | string> | undefined;
type SelectOptionValue = number | string;
type AppOriginOption = Record<string, any> & {
  icon?: string;
  label?: string;
  name?: string;
  value?: SelectOptionValue;
};

const props = defineProps<{
  options?: AppOriginOption[];
  value?: SelectValue;
}>();

const emit = defineEmits<{
  (event: 'change', value: SelectValue, option: any): void;
  (event: 'update:value', value: SelectValue): void;
}>();

const attrs = useAttrs();
const accessStore = useAccessStore();

const fallbackOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return (options.length > 0 ? options : SYS_ORIGIN_OPTIONS) as AppOriginOption[];
});

const normalizedOptions = computed(() =>
  (props.options?.length ? props.options : fallbackOptions.value).map((item) => {
    const value = String(item.value ?? '');
    const label = String(item.label ?? ('name' in item ? item.name : '') ?? value);
    return {
      ...item,
      icon: String(item.icon || value).toLowerCase(),
      label: label || value,
      value,
    };
  }),
);

const optionMap = computed(
  () => new Map(normalizedOptions.value.map((item) => [String(item.value), item])),
);

const selectAttrs = computed(() => {
  const nextAttrs = { ...attrs } as Record<string, any>;
  delete nextAttrs.options;
  delete nextAttrs.value;
  delete nextAttrs.onChange;
  delete nextAttrs['onUpdate:value'];
  delete nextAttrs.labelRender;
  delete nextAttrs.optionRender;
  delete nextAttrs.optionLabelProp;
  delete nextAttrs.optionFilterProp;
  return nextAttrs;
});

function renderContent(option?: Record<string, any> | null) {
  if (!option) {
    return null;
  }
  const label = String(option.label || option.name || option.value || '-');
  const code = String(option.icon || option.value || label);
  return h('span', { class: 'sys-origin-select__content' }, [
    h(SysOriginIcon, {
      code,
      label,
      size: 18,
    }),
    h('span', { class: 'sys-origin-select__text' }, label),
  ]);
}

function resolveOption(option?: Record<string, any> | null): null | Record<string, any> {
  if (!option) {
    return null;
  }
  const nextOption = option.option || option.data || option.originOption || option.item;
  if (nextOption && nextOption !== option) {
    return resolveOption(nextOption);
  }
  if (option.value !== undefined) {
    return optionMap.value.get(String(option.value)) || option;
  }
  return option;
}

function renderOption(option: Record<string, any>) {
  return renderContent(resolveOption(option));
}

function renderLabel(item: Record<string, any>) {
  return renderContent(
    resolveOption(item) || {
      icon: item?.value,
      label: item?.label || item?.value || '',
      value: item?.value || '',
    },
  );
}

function handleChange(value: SelectValue, option: any) {
  emit('update:value', value);
  emit('change', value, option);
}
</script>

<template>
  <Select
    v-bind="selectAttrs"
    :value="value"
    :options="normalizedOptions"
    option-filter-prop="label"
    option-label-prop="label"
    :label-render="renderLabel"
    :option-render="renderOption"
    @change="handleChange"
  />
</template>

<style scoped>
.sys-origin-select__content {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  min-width: 0;
}

.sys-origin-select__text {
  line-height: 1;
  white-space: nowrap;
}
</style>
