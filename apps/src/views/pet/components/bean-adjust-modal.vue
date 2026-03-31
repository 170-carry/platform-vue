<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { addOrSubtractBeans } from '#/api/legacy/pet';
import {
  BEAN_OPERATION_TYPE_OPTIONS,
  CURRENCY_DEDUCT_REASON_OPTIONS,
  CURRENCY_REWARD_REASON_OPTIONS,
} from '#/views/pet/shared';

import {
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const submitLoading = ref(false);
const formData = reactive({
  quantity: '',
  reason: undefined as number | undefined,
  remark: '',
  type: undefined as number | undefined,
  userId: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    formData.type = undefined;
    formData.reason = undefined;
    formData.quantity = '';
    formData.remark = '';
    formData.userId = String(props.userId || '');
  },
  { immediate: true },
);

function getReasonOptions() {
  return formData.type === 0
    ? CURRENCY_REWARD_REASON_OPTIONS
    : CURRENCY_DEDUCT_REASON_OPTIONS;
}

async function handleSubmit() {
  formData.userId = String(props.userId || '');
  if (formData.type === undefined) {
    message.warning('请选择类型');
    return;
  }
  if (!formData.userId) {
    message.warning('缺少用户ID');
    return;
  }
  if (formData.reason === undefined) {
    message.warning('请选择原因');
    return;
  }
  submitLoading.value = true;
  try {
    await addOrSubtractBeans({
      ...formData,
      quantity: String(formData.quantity || '').trim(),
      remark: String(formData.remark || '').trim(),
    });
    message.success('提交成功');
    emit('success');
    emit('close');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="submitLoading"
    :open="open"
    destroy-on-close
    title="豆子余额操作"
    width="520"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="类型">
        <Select option-label-prop="label" v-model:value="formData.type" placeholder="请选择">
          <SelectOption
            v-for="item in BEAN_OPERATION_TYPE_OPTIONS"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="原因">
        <Select option-label-prop="label" v-model:value="formData.reason" placeholder="请选择">
          <SelectOption
            v-for="item in getReasonOptions()"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="豆子">
        <Input
          v-model:value="formData.quantity"
          allow-clear
          placeholder="请输入数量"
        />
      </FormItem>
      <FormItem label="备注">
        <Input
          v-model:value="formData.remark"
          allow-clear
          placeholder="奖励备注"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
