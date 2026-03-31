<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import type { LegacyUser } from '#/api/legacy/system';
import { addUser, getRoles, updateUser } from '#/api/legacy/system';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Space,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  updateData: LegacyUser | null;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const roleLoading = ref(false);
const roles = ref<Array<Record<string, any>>>([]);

const form = reactive<Record<string, any>>({
  email: '',
  loginName: '',
  nickname: '',
  phone: '',
  roleIds: [],
});

const isAdd = ref(true);

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    if (roles.value.length === 0) {
      roleLoading.value = true;
      try {
        roles.value = await getRoles();
      } finally {
        roleLoading.value = false;
      }
    }
  },
  { immediate: true },
);

watch(
  () => props.updateData,
  (data) => {
    if (!props.open) {
      return;
    }
    isAdd.value = !data;
    form.id = data?.id ?? '';
    form.loginName = data?.loginName ?? '';
    form.nickname = data?.nickname ?? '';
    form.phone = data?.phone ?? '';
    form.email = data?.email ?? '';
    form.roleIds =
      data?.userRoles
        ?.map((item: { roleId?: number | string }) => item.roleId)
        .filter(Boolean) ?? [];
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
    form.loginName = data?.loginName ?? '';
    form.nickname = data?.nickname ?? '';
    form.phone = data?.phone ?? '';
    form.email = data?.email ?? '';
    form.roleIds =
      data?.userRoles
        ?.map((item: { roleId?: number | string }) => item.roleId)
        .filter(Boolean) ?? [];
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.loginName?.trim()) {
    message.warning('请输入登录账号');
    return;
  }
  if (!form.nickname?.trim()) {
    message.warning('请输入用户昵称');
    return;
  }
  if (!Array.isArray(form.roleIds) || form.roleIds.length === 0) {
    message.warning('请选择角色');
    return;
  }

  loading.value = true;
  try {
    const payload = {
      email: form.email?.trim(),
      id: form.id,
      loginName: form.loginName?.trim(),
      nickname: form.nickname?.trim(),
      phone: form.phone,
      roleIds: [...form.roleIds],
    };
    if (isAdd.value) {
      await addUser(payload);
    } else {
      await updateUser(payload);
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
    :title="isAdd ? '创建用户' : '修改用户'"
    destroy-on-close
    width="440"
    @close="emit('close')"
  >
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
      <FormItem label="账号">
        <Input
          v-model:value="form.loginName"
          :disabled="loading || !isAdd"
          placeholder="请输入登录账号"
        />
      </FormItem>
      <FormItem label="昵称">
        <Input
          v-model:value="form.nickname"
          :disabled="loading"
          placeholder="请输入用户昵称"
        />
      </FormItem>
      <FormItem label="电话">
        <Input
          v-model:value="form.phone"
          :disabled="loading"
          placeholder="请输入手机号码"
        />
      </FormItem>
      <FormItem label="邮箱">
        <Input
          v-model:value="form.email"
          :disabled="loading"
          placeholder="请输入电子邮箱"
        />
      </FormItem>
      <FormItem label="角色">
        <Select option-label-prop="children"
          v-model:value="form.roleIds"
          :disabled="loading"
          :loading="roleLoading"
          mode="multiple"
          placeholder="请选择角色"
        >
          <SelectOption
            v-for="item in roles"
            :key="item.id"
            :value="item.id"
          >
            {{ item.roleName }}
          </SelectOption>
        </Select>
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
