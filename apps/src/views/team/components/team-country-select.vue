<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { getCountryAlls } from '#/api/legacy/system';

import { Select, SelectOption } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    value?: number | string;
  }>(),
  {
    clearable: false,
    disabled: false,
    value: '',
  },
);

const emit = defineEmits<{
  change: [number | string, Record<string, any> | null];
  'update:value': [number | string];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const selectValue = ref<number | string>('');

watch(
  () => props.value,
  (value) => {
    selectValue.value = value ?? '';
  },
  { immediate: true },
);

async function loadCountries() {
  loading.value = true;
  try {
    list.value = await getCountryAlls();
  } finally {
    loading.value = false;
  }
}

function handleChange(value: number | string) {
  selectValue.value = value;
  emit('update:value', value);
  const country =
    list.value.find((item) => String(item.id) === String(value)) || null;
  emit('change', value, country);
}

onMounted(() => {
  void loadCountries();
});
</script>

<template>
  <Select option-label-prop="label"
    :value="selectValue"
    allow-clear
    :disabled="disabled"
    :loading="loading"
    show-search
    @change="handleChange"
  >
    <SelectOption
      v-for="item in list"
      :key="item.id"
      :label="item.aliasName || item.countryName"
      :value="item.id"
    >
      {{ item.aliasName || item.countryName }}
    </SelectOption>
  </Select>
</template>
