<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  checkTarget,
  resetUnpaidBillMemberTarget,
} from '#/api/legacy/team';

import {
  Alert,
  Checkbox,
  DateRangePicker,
  Form,
  FormItem,
  Modal,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const checking = ref(false);
const rangeDate = ref<[string, string] | null>(null);
const form = ref({
  acceptUserId: '',
  checkAnchor: true,
  endTime: '',
  startTime: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    rangeDate.value = null;
    form.value = {
      acceptUserId: String(props.row?.userProfile?.id || ''),
      checkAnchor: true,
      endTime: '',
      startTime: '',
    };
  },
  { immediate: true },
);

watch(rangeDate, (value) => {
  form.value.startTime = value?.[0] || '';
  form.value.endTime = value?.[1] || '';
});

async function submitResetTarget(target: number) {
  await resetUnpaidBillMemberTarget({
    resetUserId: props.row?.userProfile?.id,
    target,
  });
  message.success('操作成功');
  emit('success');
  emit('close');
}

async function handleCheck() {
  if (!form.value.startTime || !form.value.endTime) {
    message.warning('请选择时间范围');
    return;
  }
  checking.value = true;
  try {
    const target = Number((await checkTarget({ ...form.value })) || 0);
    Modal.confirm({
      title: `是否确认恢复用户目标: ${target}?`,
      async onOk() {
        await submitResetTarget(target);
      },
    });
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="checking"
    :open="open"
    destroy-on-close
    ok-text="检测"
    title="重置目标"
    @cancel="emit('close')"
    @ok="handleCheck"
  >
    <div class="member-target-reset__content">
      <Alert
        description="注意: 当前重置目标将计算到最新未结算账单(更细的操作将在后期完善)"
        show-icon
        type="info"
      />
      <Form layout="vertical">
        <FormItem label="时间范围">
          <DateRangePicker
            v-model:value="rangeDate"
            show-time
            style="width: 100%"
            value-format="x"
          />
        </FormItem>
        <FormItem>
          <Checkbox v-model:checked="form.checkAnchor">
            验证用户收礼物时段必须是主播身份
          </Checkbox>
        </FormItem>
      </Form>
    </div>
  </Modal>
</template>

<style scoped>
.member-target-reset__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
