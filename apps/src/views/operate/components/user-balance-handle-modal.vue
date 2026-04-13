<script lang="ts" setup>
import { computed, reactive, watch } from 'vue';

import {
  deductDiamond,
  deductGameCoupon,
  deductGold,
  rewardGameCoupon,
  sendDiamond,
  sendGold,
} from '#/api/legacy/user';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Select,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateUserBalanceHandleModal' });

const props = defineProps<{
  action: 'deduct' | 'reward';
  open: boolean;
  type: 'diamond' | 'gameCoupon' | 'gold';
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const form = reactive({
  amount: undefined as number | undefined,
  reasonType: 5,
  remarks: '',
});
const rewardReasonOptions = [
  { label: '奖励', value: 1 as any },
  { label: '内部', value: 2 as any },
  { label: '工资', value: 3 as any },
  { label: '充值', value: 4 as any },
  { label: '其他', value: 5 as any },
];
const deductReasonOptions = [
  { label: '违规', value: 1 as any },
  { label: '多发', value: 2 as any },
  { label: '操作错误', value: 3 as any },
  { label: '其他', value: 4 as any },
];
const reasonTypeOptions = computed(() =>
  props.action === 'reward' ? rewardReasonOptions : deductReasonOptions,
);

const title = computed(() => {
  const typeName =
    props.type === 'gold' ? '金币' : props.type === 'diamond' ? '钻石' : '游戏券';
  const actionName = props.action === 'reward' ? '奖励' : '扣除';
  return `${typeName}${actionName}`;
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    form.amount = undefined;
    form.reasonType = props.action === 'reward' ? 5 : 4;
    form.remarks = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.userId) {
    return;
  }
  if (!form.amount || form.amount <= 0) {
    message.warning('请输入大于 0 的数量');
    return;
  }
  if (!String(form.remarks || '').trim()) {
    message.warning('请输入备注');
    return;
  }

  if (props.type === 'gold') {
    const payload = {
      reason: form.reasonType,
      remarks: form.remarks.trim(),
      userId: props.userId,
      value: form.amount,
    };
    if (props.action === 'reward') {
      await sendGold(payload);
    } else {
      await deductGold(payload);
    }
  } else if (props.type === 'diamond') {
    const payload = {
      reason: form.reasonType,
      remarks: form.remarks.trim(),
      userId: props.userId,
      value: form.amount,
    };
    if (props.action === 'reward') {
      await sendDiamond(payload);
    } else {
      await deductDiamond(payload);
    }
  } else if (props.action === 'reward') {
    await rewardGameCoupon({
      coupon: form.amount,
      remarks: form.remarks.trim(),
      rewardType: form.reasonType,
      userId: props.userId,
    });
  } else {
    await deductGameCoupon({
      coupon: form.amount,
      remarks: form.remarks.trim(),
      userId: props.userId,
    });
  }

  message.success('操作成功');
  emit('success');
  emit('close');
}
</script>

<template>
  <Modal
    :open="open"
    destroy-on-close
    :title="title"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="用户ID">
        <Input :value="String(userId || '')" disabled />
      </FormItem>
      <FormItem label="数量">
        <InputNumber
          v-model:value="form.amount"
          :min="1"
          :precision="0"
          style="width: 100%"
        />
      </FormItem>
      <FormItem label="原因">
        <Select
          option-label-prop="label"
          v-model:value="form.reasonType"
          :options="reasonTypeOptions"
        />
      </FormItem>
      <FormItem label="备注">
        <TextArea v-model:value="form.remarks" :rows="4" />
      </FormItem>
    </Form>
  </Modal>
</template>
