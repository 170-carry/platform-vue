<script lang="ts" setup>
import { reactive, watch } from 'vue';

import { Button, Input, Modal, message } from 'antdv-next';

import { createBankBalance } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';

const props = defineProps<{
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const form = reactive({
  quantity: '',
  remark: '',
  userId: '',
});

const state = reactive({
  submitting: false,
});

watch(
  () => props.open,
  (value) => {
    if (value) {
      form.userId = '';
      form.quantity = '';
      form.remark = '';
    }
  },
);

async function submitForm() {
  if (!form.userId || !String(form.quantity).trim()) {
    message.warning('请填写完整信息');
    return;
  }
  state.submitting = true;
  try {
    await createBankBalance({
      quantity: String(form.quantity).trim(),
      remark: String(form.remark || '').trim(),
      sysOrigin: props.sysOrigin,
      userId: form.userId,
    });
    message.success('保存成功');
    emit('success');
  } finally {
    state.submitting = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="state.submitting"
    :open="open"
    title="创建账户"
    @cancel="emit('close')"
  >
    <div class="form-grid">
      <div class="field">
        <div class="label">系统</div>
        <div class="value">{{ sysOrigin || '-' }}</div>
      </div>
      <div class="field">
        <div class="label">用户ID</div>
        <AccountInput
          v-model:value="form.userId"
          :sys-origin="sysOrigin"
          placeholder="用户ID"
        />
      </div>
      <div class="field">
        <div class="label">金额</div>
        <Input
          v-model:value="form.quantity"
          :maxlength="10"
          placeholder="请输入发送金额"
        />
      </div>
      <div class="field">
        <div class="label">对内备注</div>
        <Input
          v-model:value="form.remark"
          :maxlength="10"
          placeholder="对内备注"
        />
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <Button @click="emit('close')">取消</Button>
        <Button
          :loading="state.submitting"
          type="primary"
          @click="submitForm"
        >
          保存
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.value {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  min-height: 40px;
  padding: 9px 12px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
