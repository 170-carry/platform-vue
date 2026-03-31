<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { updateMemberRemark } from '#/api/legacy/team';

import { Form, FormItem, Input, Modal, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [Record<string, any>];
}>();

const saving = ref(false);
const form = reactive({
  id: '',
  remarks: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.id = String(props.row?.id || '');
    form.remarks = String(props.row?.remarks || '');
  },
  { immediate: true },
);

async function handleSubmit() {
  saving.value = true;
  try {
    await updateMemberRemark({ ...form });
    message.success('保存成功');
    emit('success', { ...form });
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
    title="编辑备注"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
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
