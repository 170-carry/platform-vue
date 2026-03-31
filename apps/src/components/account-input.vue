<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { Input, Select } from 'antdv-next';

import { getAllowedSysOrigins } from '#/views/system/shared';
import SysOriginSelect from '#/components/sys-origin-select.vue';

type AccountSelectType = 'LONG' | 'SHORT';

const ACCOUNT_TYPE_OPTIONS = [
  { label: '长ID', value: 'LONG' },
  { label: '短ID', value: 'SHORT' },
] satisfies Array<{ label: string; value: AccountSelectType }>;

const props = withDefaults(
  defineProps<{
    defaultSelectType?: AccountSelectType;
    placeholder?: string;
    sysOrigin?: string;
    type?: string;
    value?: number | string;
  }>(),
  {
    defaultSelectType: 'SHORT',
    placeholder: '',
    sysOrigin: '',
    type: 'USER',
    value: '',
  },
);

const emit = defineEmits<{
  'update:value': [string];
}>();

const accessStore = useAccessStore();
const inputValue = ref('');
const selectType = ref<AccountSelectType>('SHORT');
const sysOriginType = ref('');

const sysOriginOptions = computed(() =>
  getAllowedSysOrigins(accessStore.accessCodes || []),
);

const showSysOriginTypeSelect = computed(
  () => !props.sysOrigin && sysOriginOptions.value.length > 0,
);

const sysOriginVal = computed(() => props.sysOrigin || sysOriginType.value);

function filterString(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value).replace(/[^\d]/g, '');
}

function parseEncodedValue(value: unknown) {
  const raw = String(value ?? '');
  if (!raw) {
    return {
      accountType: '',
      content: '',
      sysOrigin: '',
    };
  }
  const match = raw.match(/^\*(.*)\*$/);
  if (!match) {
    return {
      accountType: '',
      content: raw,
      sysOrigin: '',
    };
  }
  const body = match[1] || '';
  return {
    accountType: body.match(/accountType:([^,]*)/)?.[1] || '',
    content: body.match(/content:(.*)$/)?.[1] || '',
    sysOrigin: body.match(/sysOrigin:([^,]*)/)?.[1] || '',
  };
}

function syncFromValue(value: unknown) {
  const parsed = parseEncodedValue(value);
  const nextType = (parsed.accountType ||
    props.defaultSelectType ||
    'SHORT') as AccountSelectType;
  selectType.value = nextType;
  inputValue.value =
    nextType === 'LONG' ? filterString(parsed.content) : parsed.content;
  if (!props.sysOrigin) {
    if (parsed.sysOrigin) {
      sysOriginType.value = parsed.sysOrigin;
      return;
    }
    if (!sysOriginType.value && sysOriginOptions.value.length > 0) {
      sysOriginType.value = String(sysOriginOptions.value[0]?.value || '');
    }
  }
}

function buildValue() {
  if (!inputValue.value) {
    return '';
  }
  return `*type:${props.type},accountType:${selectType.value},sysOrigin:${sysOriginVal.value},content:${inputValue.value}*`;
}

function emitValue() {
  emit('update:value', buildValue());
}

function handleInput(value: string) {
  inputValue.value =
    selectType.value === 'LONG' ? filterString(value) : String(value || '');
  emitValue();
}

function handleSelectTypeChange(value: AccountSelectType) {
  selectType.value = value;
  if (selectType.value === 'LONG') {
    inputValue.value = filterString(inputValue.value);
  }
  emitValue();
}

function handleSysOriginTypeChange(
  value: Array<number | string> | number | string | null | undefined,
) {
  const nextValue = Array.isArray(value) ? value[0] : value;
  sysOriginType.value = nextValue === null || nextValue === undefined ? '' : String(nextValue);
  emitValue();
}

watch(
  () => props.value,
  (value) => {
    syncFromValue(value);
  },
  { immediate: true },
);

watch(
  () => props.defaultSelectType,
  (value) => {
    if (!props.value) {
      selectType.value = (value || 'SHORT') as AccountSelectType;
    }
  },
  { immediate: true },
);

watch(
  sysOriginOptions,
  (options) => {
    if (!props.sysOrigin && !sysOriginType.value && options.length > 0) {
      sysOriginType.value = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => props.sysOrigin,
  () => {
    emitValue();
  },
);
</script>

<template>
  <div class="account-input">
    <Select
      v-model:value="selectType"
      :options="ACCOUNT_TYPE_OPTIONS"
      class="account-input__type"
      :disabled="!sysOriginVal"
      @change="handleSelectTypeChange"
    />
    <Input
      :value="inputValue"
      allow-clear
      class="account-input__field"
      :disabled="!sysOriginVal"
      :placeholder="placeholder"
      @update:value="handleInput"
    />
    <SysOriginSelect
      v-if="showSysOriginTypeSelect && selectType !== 'LONG'"
      v-model:value="sysOriginType"
      class="account-input__origin"
      :options="sysOriginOptions"
      @change="handleSysOriginTypeChange"
    />
  </div>
</template>

<style scoped>
.account-input {
  display: flex;
  gap: 8px;
  width: 100%;
}

.account-input__type {
  flex: 0 0 88px;
}

.account-input__field {
  flex: 1 1 auto;
  min-width: 0;
}

.account-input__origin {
  flex: 0 0 120px;
}
</style>
