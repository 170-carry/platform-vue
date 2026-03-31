<script lang="ts" setup>
import { ref, watch } from 'vue';

import { regionConfigTable } from '#/api/legacy/system';

import { Select, SelectOption } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    multiple?: boolean;
    placeholder?: string;
    sysOrigin: string;
    value?: any;
  }>(),
  {
    clearable: false,
    disabled: false,
    filterable: true,
    multiple: false,
    placeholder: '请选择',
    value: '',
  },
);

const emit = defineEmits<{
  change: [any, Record<string, any> | null];
  'update:value': [any];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const selectValue = ref<any>(props.value);

watch(
  () => props.value,
  (value) => {
    selectValue.value = value;
  },
  { immediate: true },
);

watch(
  () => props.sysOrigin,
  async (value) => {
    if (!value) {
      list.value = [];
      return;
    }
    loading.value = true;
    try {
      list.value = await regionConfigTable({ sysOrigin: value });
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function emitChange(value: any) {
  emit('update:value', value);
  const item =
    list.value.find((current) => String(current.id) === String(value)) || null;
  emit('change', value, item);
}

function handleChange(value: any) {
  selectValue.value = value;
  emitChange(value);
}

function clearValue() {
  const value = props.multiple ? [] : '';
  selectValue.value = value;
  emitChange(value);
}

defineExpose({
  clearValue,
});
</script>

<template>
  <Select option-label-prop="label"
    :value="selectValue"
    :allow-clear="clearable"
    :disabled="disabled"
    :loading="loading"
    :mode="multiple ? 'multiple' : undefined"
    :placeholder="placeholder"
    :show-search="filterable"
    style="width: 100%"
    @change="handleChange"
  >
    <SelectOption
      v-for="item in list"
      :key="item.id"
      :value="item.id"
     :label="`${item.regionName}`">
      {{ item.regionName }}
    </SelectOption>
  </Select>
</template>
