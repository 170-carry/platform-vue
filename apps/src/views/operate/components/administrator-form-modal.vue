<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { addAdministrator } from '#/api/legacy/administrator';
import { getUserBaseInfo } from '#/api/legacy/approval';

import {
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  message,
} from 'antdv-next';

const ROLE_OPTIONS = [
  { label: '管理员', value: 'ADMIN' },
  { label: '超级管理员', value: 'SUPER_ADMIN' },
  { label: '经理', value: 'MANAGER' },
];

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const form = reactive({
  roles: 'ADMIN',
  userId: '',
  wage: '0',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.roles = 'ADMIN';
    form.userId = '';
    form.wage = '0';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!String(form.userId || '').trim()) {
    message.warning('请填写UID');
    return;
  }
  if (!String(form.roles || '').trim()) {
    message.warning('请选择角色');
    return;
  }
  loading.value = true;
  try {
    const userInfo = await getUserBaseInfo(form.userId);
    if (!userInfo || (!userInfo.id && !userInfo.userId)) {
      message.warning('UID不存在');
      return;
    }
    await addAdministrator({
      roles: form.roles,
      userId: form.userId,
      wage: form.wage,
    });
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
    title="新建APP管理员"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="UID">
        <Input v-model:value="form.userId" />
      </FormItem>
      <FormItem label="角色">
        <Select option-label-prop="label" v-model:value="form.roles">
          <SelectOption
            v-for="item in ROLE_OPTIONS"
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
