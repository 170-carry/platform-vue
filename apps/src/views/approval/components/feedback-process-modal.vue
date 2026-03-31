<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { processFeedback } from '#/api/legacy/approval';

import { Form, FormItem, Modal, TextArea, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const form = reactive({
  remarks: '',
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.remarks = '';
    }
  },
);

async function handleSubmit() {
  if (!props.record?.id || !props.record?.userId) {
    return;
  }
  loading.value = true;
  try {
    await processFeedback({
      id: props.record.id,
      remarks: form.remarks,
      userId: props.record.userId,
    });
    message.success('处理成功');
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
    ok-text="提交"
    title="反馈处理"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="处理结果">
        <TextArea v-model:value="form.remarks" :rows="4" />
      </FormItem>
    </Form>
  </Modal>
</template>
