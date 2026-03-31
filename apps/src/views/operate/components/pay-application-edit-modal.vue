<script lang="ts" setup>
import {
  computed,
  reactive,
  watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { addPayApplication,
  updatePayApplication } from '#/api/legacy/pay';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Form,
  FormItem,
  Input,
  Modal,
  message,
} from 'antdv-next';

const props = withDefaults(
  defineProps<{
    open: boolean;
    row?: Record<string, any>;
  }>(),
  {
    row: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = defineModel<boolean>('loading', { default: false });

const form = reactive<Record<string, any>>({
  androidLink: '',
  appCode: '',
  appName: '',
  id: '',
  iosLink: '',
});

const isEdit = computed(() => Boolean(form.id));
const title = computed(() => (isEdit.value ? '修改应用' : '创建应用'));

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    form.androidLink = row.androidLink || '';
    form.appCode = row.appCode || '';
    form.appName = row.appName || '';
    form.id = row.id || '';
    form.iosLink = row.iosLink || '';
  },
  { immediate: true },
);

function handleSysOriginChange(value: string) {
  const target = sysOriginOptions.value.find((item) => item.value === value);
  form.appName = target?.label || '';
}

function validateForm() {
  if (!isEdit.value && !String(form.appCode || '').trim()) {
    message.warning('请选择系统类型');
    return false;
  }
  if (!String(form.androidLink || '').trim()) {
    message.warning('请输入Android链接');
    return false;
  }
  if (!String(form.iosLink || '').trim()) {
    message.warning('请输入iOS链接');
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
    const payload = {
      ...form,
      androidLink: String(form.androidLink || '').trim(),
      iosLink: String(form.iosLink || '').trim(),
    };
    if (isEdit.value) {
      await updatePayApplication(payload);
    } else {
      await addPayApplication(payload);
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
    :title="title"
    width="560px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem v-if="!isEdit" label="类型">
        <SysOriginSelect
          v-model:value="form.appCode"
          placeholder="请选择系统"
          @change="handleSysOriginChange"

          :options="sysOriginOptions"
        ></SysOriginSelect>
      </FormItem>
      <FormItem label="Android链接">
        <Input v-model:value="form.androidLink" />
      </FormItem>
      <FormItem label="iOS链接">
        <Input v-model:value="form.iosLink" />
      </FormItem>
    </Form>
  </Modal>
</template>
