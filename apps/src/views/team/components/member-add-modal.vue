<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { addTeamMember } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';

import { Form, FormItem, Input, Modal, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const form = reactive({
  memberUserId: '',
  ownUserId: '',
  remarks: '',
  sysOrigin: '',
  teamAccount: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.memberUserId = '';
    form.ownUserId = '';
    form.remarks = '';
    form.sysOrigin = props.sysOrigin || '';
    form.teamAccount = '';
  },
  { immediate: true },
);

watch(
  () => props.sysOrigin,
  (value) => {
    form.sysOrigin = value || '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.ownUserId) {
    message.warning('请输入代理ID');
    return;
  }
  if (!form.memberUserId) {
    message.warning('请输入成员ID');
    return;
  }
  saving.value = true;
  try {
    await addTeamMember({ ...form });
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
    title="添加成员"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="代理ID">
        <AccountInput
          v-model:value="form.ownUserId"
          :sys-origin="form.sysOrigin"
          placeholder="代理ID"
        />
      </FormItem>
      <FormItem label="成员ID">
        <AccountInput
          v-model:value="form.memberUserId"
          :sys-origin="form.sysOrigin"
          placeholder="成员ID"
        />
      </FormItem>
      <FormItem label="备注">
        <Input
          v-model:value="form.remarks"
          :maxlength="100"
          placeholder="请输入备注"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
