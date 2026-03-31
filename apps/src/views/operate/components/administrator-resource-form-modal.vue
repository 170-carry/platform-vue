<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  addAdministratorAuth,
  updateAdministratorAuth,
} from '#/api/legacy/administrator';

import {
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  message,
} from 'antdv-next';

const GROUP_OPTIONS = [
  { label: '用户', value: 'USER' },
  { label: '房间', value: 'ROOM' },
  { label: '其它', value: 'OTHER' },
];

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

const loading = ref(false);
const form = reactive<Record<string, any>>({
  auth: '',
  groupName: '',
  id: '',
  resourceName: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    form.auth = row.auth || '';
    form.groupName = row.groupName || '';
    form.id = row.id || '';
    form.resourceName = row.resourceName || '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!String(form.resourceName || '').trim()) {
    message.warning('请填写名称');
    return;
  }
  if (!String(form.auth || '').trim()) {
    message.warning('请填写Key');
    return;
  }
  if (!String(form.groupName || '').trim()) {
    message.warning('请选择分组');
    return;
  }
  loading.value = true;
  try {
    const payload = {
      auth: String(form.auth || '').trim(),
      groupName: form.groupName,
      id: form.id,
      resourceName: String(form.resourceName || '').trim(),
    };
    if (form.id) {
      await updateAdministratorAuth(payload);
    } else {
      await addAdministratorAuth(payload);
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
    :title="form.id ? '修改权限' : '新增权限'"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="名称">
        <Input v-model:value="form.resourceName" />
      </FormItem>
      <FormItem label="Key">
        <Input v-model:value="form.auth" />
      </FormItem>
      <FormItem label="分组">
        <Select option-label-prop="label" v-model:value="form.groupName">
          <SelectOption
            v-for="item in GROUP_OPTIONS"
            :key="item.value"
            :value="item.value"
           :label="`${item.label}`">
            {{ item.label }}
          </SelectOption>
        </Select>
      </FormItem>
    </Form>
  </Modal>
</template>
