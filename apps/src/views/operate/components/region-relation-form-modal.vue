<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addRegionRelation,
  updateRegionRelation,
} from '#/api/legacy/system';

import {
  Form,
  FormItem,
  Modal,
  Select,
  SelectOption,
  message,
} from 'antdv-next';

import { PRODUCT_SHOWCASE_OPTIONS } from '#/views/system/shared';

const props = withDefaults(
  defineProps<{
    countryList?: Array<Record<string, any>>;
    open: boolean;
    regions?: Array<Record<string, any>>;
    row?: Record<string, any>;
    sysOrigin: string;
  }>(),
  {
    countryList: () => [],
    regions: () => [],
    row: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const form = reactive<Record<string, any>>({
  groupType: 'OPEN_PAY_COUNTRY',
  id: '',
  regionId: '',
  relationIds: [] as Array<number | string>,
  showcase: true,
  sysOrigin: '',
});

const singleRelationId = computed({
  get: () => form.relationIds[0],
  set: (value) => {
    form.relationIds = value ? [value] : [];
  },
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    form.groupType = 'OPEN_PAY_COUNTRY';
    form.id = row.id || '';
    form.regionId = row.regionId || '';
    form.showcase = row.showcase ?? true;
    form.sysOrigin = props.sysOrigin;
    form.relationIds = row.id
      ? [row.relationId].filter(Boolean)
      : [];
  },
  { immediate: true },
);

function validateForm() {
  if (!form.regionId) {
    message.warning('请选择区域');
    return false;
  }
  if (!Array.isArray(form.relationIds) || form.relationIds.length === 0) {
    message.warning('请选择开通国家');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  loading.value = true;
  try {
    if (!form.id) {
      await addRegionRelation({
        ...form,
        sysOrigin: props.sysOrigin,
      });
    } else {
      await updateRegionRelation({
        ...form,
        relationIds: [form.relationIds[0]],
        sysOrigin: props.sysOrigin,
      });
    }
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="open"
    destroy-on-close
    :title="form.id ? '修改内购产品' : '新增内购产品'"
    width="640px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="区域">
        <Select option-label-prop="label" v-model:value="form.regionId">
          <SelectOption
            v-for="item in regions"
            :key="item.id"
            :value="item.id"
           :label="`${item.regionName}`">
            {{ item.regionName }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="开通国家">
        <Select option-label-prop="label"
          v-if="form.id"
          v-model:value="singleRelationId"
        >
          <SelectOption
            v-for="item in countryList"
            :key="item.id"
            :value="item.id"
           :label="`${item.country?.countryName || item.country?.aliasName || '-'}`">
            {{ item.country?.countryName || item.country?.aliasName || '-' }}
          </SelectOption>
        </Select>
        <Select option-label-prop="label"
          v-else
          v-model:value="form.relationIds"
          mode="multiple"
        >
          <SelectOption
            v-for="item in countryList"
            :key="item.id"
            :value="item.id"
           :label="`${item.country?.countryName || item.country?.aliasName || '-'}`">
            {{ item.country?.countryName || item.country?.aliasName || '-' }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="状态">
        <Select option-label-prop="label" v-model:value="form.showcase">
          <SelectOption
            v-for="item in PRODUCT_SHOWCASE_OPTIONS"
            :key="String(item.value)"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>
