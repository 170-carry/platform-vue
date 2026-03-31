<script lang="ts" setup>
import { reactive, watch } from 'vue';

import { resetUserAccountPassword } from '#/api/legacy/user';

import { Form, FormItem, Input, Modal, message } from 'antdv-next';

defineOptions({ name: 'OperateUserResetPasswordModal' });

const props = defineProps<{
  open: boolean;
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const form = reactive({
  password: '',
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.password = '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.userId) {
    return;
  }
  if (!String(form.password || '').trim()) {
    message.warning('请输入新密码');
    return;
  }
  await resetUserAccountPassword({
    password: form.password.trim(),
    userId: props.userId,
  });
  message.success('重置成功');
  emit('success');
  emit('close');
}
</script>

<template>
  <Modal
    :open="open"
    destroy-on-close
    title="重置密码"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="用户ID">
        <Input :value="String(userId || '')" disabled />
      </FormItem>
      <FormItem label="新密码">
        <Input v-model:value="form.password" placeholder="请输入新密码" />
      </FormItem>
    </Form>
  </Modal>
</template>
