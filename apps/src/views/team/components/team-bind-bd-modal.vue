<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { teamBindBd } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';

import { Form, FormItem, Modal, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const sysOrigin = ref('');
const form = reactive({
  bdUserId: '',
  ownUserId: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    sysOrigin.value = String(props.row?.sysOrigin || '');
    form.ownUserId = String(props.row?.ownUserId || '');
    form.bdUserId = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.bdUserId) {
    message.warning('请输入BD账号');
    return;
  }
  saving.value = true;
  try {
    await teamBindBd({ ...form });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    destroy-on-close
    title="绑定BD"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="BD">
        <AccountInput
          v-model:value="form.bdUserId"
          :sys-origin="sysOrigin"
          placeholder="请输入BD账号"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
