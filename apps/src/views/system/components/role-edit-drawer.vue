<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import type { LegacyRole } from '#/api/legacy/system';
import { addRole, updateRole } from '#/api/legacy/system';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Space,
  TextArea,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  updateData: LegacyRole | null;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const isAdd = ref(true);
const form = reactive<Record<string, any>>({
  id: '',
  remark: '',
  roleName: '',
});

watch(
  () => props.updateData,
  (data) => {
    if (!props.open) {
      return;
    }
    isAdd.value = !data;
    form.id = data?.id ?? '';
    form.roleName = data?.roleName ?? '';
    form.remark = data?.remark ?? '';
  },
  { immediate: true },
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const data = props.updateData;
    isAdd.value = !data;
    form.id = data?.id ?? '';
    form.roleName = data?.roleName ?? '';
    form.remark = data?.remark ?? '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.roleName?.trim()) {
    message.warning('请输入角色名');
    return;
  }
  if (String(form.remark || '').length > 100) {
    message.warning('备注必须在100字符以内');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      id: form.id,
      remark: form.remark?.trim(),
      roleName: form.roleName?.trim(),
    };
    if (isAdd.value) {
      await addRole(payload);
    } else {
      await updateRole(payload);
    }
    message.success('保存成功');
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
    :title="isAdd ? '创建角色' : '修改角色'"
    destroy-on-close
    width="420"
    @close="emit('close')"
  >
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
      <FormItem label="角色名">
        <Input
          v-model:value="form.roleName"
          :disabled="loading"
          placeholder="请输入角色名"
        />
      </FormItem>
      <FormItem label="备注">
        <TextArea
          v-model:value="form.remark"
          :disabled="loading"
          :maxlength="100"
          :rows="5"
          placeholder="请输入备注"
          show-count
        />
      </FormItem>
    </Form>

    <template #footer>
      <Space>
        <Button @click="emit('close')">取消</Button>
        <Button :loading="loading" type="primary" @click="handleSubmit">
          提交
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
