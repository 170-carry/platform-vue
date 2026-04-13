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

const regionSelectOptions = computed(() =>
  props.regions.map((item) => ({
    label: String(item.regionName || item.id || '-'),
    value: item.id as any,
  })),
);

const countrySelectOptions = computed(() =>
  props.countryList.map((item) => ({
    label: String(item.country?.countryName || item.country?.aliasName || item.id || '-'),
    value: item.id as any,
  })),
);

const showcaseOptions = PRODUCT_SHOWCASE_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

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
        <Select
          v-model:value="form.regionId"
          :options="regionSelectOptions"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="开通国家">
        <Select
          v-if="form.id"
          v-model:value="singleRelationId"
          :options="countrySelectOptions"
          option-label-prop="label"
        />
        <Select
          v-else
          v-model:value="form.relationIds"
          :options="countrySelectOptions"
          mode="multiple"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="状态">
        <Select
          v-model:value="form.showcase"
          :options="showcaseOptions"
          option-label-prop="label"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
