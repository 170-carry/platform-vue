<script lang="ts" setup>
import { reactive, watch } from 'vue';

import { handleBeautifulNumberApplyState } from '#/api/legacy/user';

import { Modal, TextArea, message } from 'antdv-next';

const props = defineProps<{
  id: number | string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const form = reactive({
  remark: '',
});

const loading = defineModel<boolean>('loading', { default: false });

watch(
  () => props.open,
  (open) => {
    if (!open) {
      form.remark = '';
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.id) {
    return;
  }
  loading.value = true;
  try {
    await handleBeautifulNumberApplyState(props.id, 2, form.remark);
    message.success('操作成功');
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
    title="申请处理"
    width="420px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <div class="field-label">备注</div>
    <TextArea
      v-model:value="form.remark"
      :maxlength="300"
      :rows="8"
      placeholder="请输入驳回理由"
      show-count
    />
  </Modal>
</template>

<style scoped>
.field-label {
  color: #0f172a;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
