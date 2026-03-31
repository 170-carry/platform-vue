<script lang="ts" setup>
import { computed, reactive, ref, watchEffect } from 'vue';

import { leadBindBd } from '#/api/legacy/team';
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
  bdLeadUserId: '',
  userId: '',
});

const title = computed(() => '绑定子级BD');

function syncForm() {
  form.userId = '';
  form.bdLeadUserId = String(
    props.row?.userProfile?.id || props.row?.userId || '',
  );
  sysOrigin.value = String(
    props.row?.userProfile?.originSys || props.row?.sysOrigin || '',
  );
}

async function handleSubmit() {
  if (!form.userId.trim()) {
    message.warning('请输入BD账号');
    return;
  }
  saving.value = true;
  try {
    await leadBindBd({
      bdLeadUserId: form.bdLeadUserId,
      userId: form.userId,
    });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    saving.value = false;
  }
}

watchEffect(() => {
  if (props.open) {
    syncForm();
  }
});
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    destroy-on-close
    :title="title"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="BD">
        <AccountInput
          v-model:value="form.userId"
          :sys-origin="sysOrigin"
          placeholder="请输入BD账号"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
