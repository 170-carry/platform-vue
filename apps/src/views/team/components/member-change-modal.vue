<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { updateMemberTeam } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';

import {
  Alert,
  Form,
  FormItem,
  Input,
  Modal,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [Record<string, any> | null];
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
    form.memberUserId = String(props.row?.userProfile?.id || '');
    form.ownUserId = '';
    form.remarks = '';
    form.sysOrigin = String(
      props.row?.sysOrigin || props.row?.userProfile?.originSys || '',
    );
    form.teamAccount = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.ownUserId) {
    message.warning('请输入代理ID');
    return;
  }
  const payload = { ...form };
  saving.value = true;
  try {
    const result = await updateMemberTeam(payload);
    message.success('保存成功');
    emit('success', result || null);
    emit('close');
  } catch {
    // keep modal open on failure
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
    title="更换团队"
    width="640px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <div class="member-change-modal__content">
      <Alert
        message="注意!! 切换到【不同区域】代理团队名下: 该主播相关目标工作都将删除,请谨慎操作!"
        show-icon
        type="warning"
      />
      <Alert
        message="注意!! 切换到【相同区域】代理团队名下: 该主播没有结算前更换代理团队, 相关目标工作都会同步到新团队!"
        show-icon
        type="warning"
      />
      <Form layout="vertical">
        <FormItem label="代理ID">
          <AccountInput
            v-model:value="form.ownUserId"
            :sys-origin="form.sysOrigin"
            placeholder="代理ID"
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
    </div>
  </Modal>
</template>

<style scoped>
.member-change-modal__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
