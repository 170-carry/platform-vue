<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { saveOrUpdateSpecialId } from '#/api/legacy/app-system';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Space,
  message,
} from 'antdv-next';

import SpecialIdCustomizeModal from './special-id-customize-modal.vue';

const props = defineProps<{
  initialRecord?: Record<string, any> | null;
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const customizeOpen = ref(false);

const form = reactive<Record<string, any>>({
  account: '',
  customizeField: {},
  expiredDays: '',
  id: '',
  remark: '',
  sysOrigin: '',
  userId: '',
});

const title = computed(() => (props.initialRecord?.id ? '修改' : '添加'));

function syncForm() {
  const record = props.initialRecord || {};
  form.account = record.account ?? '';
  form.customizeField = record.customizeField || {};
  form.expiredDays = record.expiredDays ?? '';
  form.id = record.id ?? '';
  form.remark = record.remark ?? '';
  form.sysOrigin = record.sysOrigin ?? props.sysOrigin;
  form.userId = record.userId ?? '';
}

watch(
  () => [props.open, props.initialRecord],
  ([open]) => {
    if (!open) {
      return;
    }
    syncForm();
  },
  { immediate: true },
);

function validateForm() {
  if (!String(form.userId || '').trim()) {
    message.warning('请输入用户ID');
    return false;
  }
  if (!String(form.account || '').trim()) {
    message.warning('请输入新账号');
    return false;
  }
  if (form.expiredDays === '' || form.expiredDays === null || form.expiredDays === undefined) {
    message.warning('请输入有效天数');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  loading.value = true;
  try {
    await saveOrUpdateSpecialId({
      ...form,
      account: String(form.account || '').trim(),
      remark: String(form.remark || '').trim(),
      sysOrigin: form.sysOrigin || props.sysOrigin,
      userId: String(form.userId || '').trim(),
    });
    message.success('操作成功');
    emit('success');
    emit('close');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    :title="title"
    width="520"
    @close="emit('close')"
  >
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
      <FormItem label="系统">
        <div class="readonly-value">{{ sysOrigin }}</div>
      </FormItem>
      <FormItem label="用户">
        <Input
          v-model:value="form.userId"
          :disabled="loading"
          placeholder="请输入用户ID"
        />
      </FormItem>
      <FormItem label="新账号">
        <Input
          v-model:value="form.account"
          :disabled="loading"
          :maxlength="10"
          placeholder="请输入新账号"
        />
      </FormItem>
      <FormItem label="有效天数">
        <Input
          v-model:value="form.expiredDays"
          :disabled="loading"
          :maxlength="4"
          placeholder="0代表永久，其他范围1~3650"
        />
      </FormItem>
      <FormItem label="备注">
        <Input
          v-model:value="form.remark"
          :disabled="loading"
          :maxlength="100"
          placeholder="请输入备注"
        />
      </FormItem>
      <FormItem label="自定义属性">
        <Button type="link" @click="customizeOpen = true">点击查看/设置</Button>
      </FormItem>
    </Form>

    <template #footer>
      <Space>
        <Button @click="emit('close')">取消</Button>
        <Button :loading="loading" type="primary" @click="handleSubmit">
          保存
        </Button>
      </Space>
    </template>

    <SpecialIdCustomizeModal
      :customize-field="form.customizeField"
      :open="customizeOpen"
      @close="customizeOpen = false"
      @submit="(value) => { form.customizeField = value; customizeOpen = false; }"
    />
  </Drawer>
</template>

<style scoped>
.readonly-value {
  color: #0f172a;
  font-weight: 500;
}
</style>
