<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  getUserBaseInfo,
  updateUserBaseInfo,
} from '#/api/legacy/approval';

import {
  Button,
  DatePicker,
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
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const birthday = ref('');
const form = reactive<Record<string, any>>({
  bornDay: '',
  bornMonth: '',
  bornYear: '',
  countryName: '',
  id: '',
  userNickname: '',
  userSex: undefined,
});

watch(
  () => [props.open, props.userId],
  async ([open, userId]) => {
    if (!open || !userId) {
      return;
    }
    loading.value = true;
    try {
      const data = await getUserBaseInfo(String(userId));
      Object.assign(form, data || {});
      birthday.value =
        data?.bornYear && data?.bornMonth && data?.bornDay
          ? `${String(data.bornYear)}-${String(data.bornMonth).padStart(2, '0')}-${String(data.bornDay).padStart(2, '0')}`
          : '';
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

watch(birthday, (value) => {
  if (!value) {
    form.bornYear = '';
    form.bornMonth = '';
    form.bornDay = '';
    return;
  }
  const [year = '', month = '', day = ''] = value.split('-');
  form.bornYear = year;
  form.bornMonth = month;
  form.bornDay = day;
});

async function handleSubmit() {
  if (!form.userNickname?.trim()) {
    message.warning('请输入用户昵称');
    return;
  }
  if (form.userSex === undefined || form.userSex === '') {
    message.warning('请选择性别');
    return;
  }

  loading.value = true;
  try {
    await updateUserBaseInfo({
      bornDay: form.bornDay,
      bornMonth: form.bornMonth,
      bornYear: form.bornYear,
      countryCode: form.countryCode,
      countryId: form.countryId,
      countryName: form.countryName,
      id: form.id || props.userId,
      userNickname: form.userNickname?.trim(),
      userSex: form.userSex,
    });
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
    destroy-on-close
    title="编辑用户"
    width="420"
    @close="emit('close')"
  >
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
      <FormItem label="昵称">
        <Input v-model:value="form.userNickname" :disabled="loading" />
      </FormItem>
      <FormItem label="性别">
        <Select option-label-prop="children" v-model:value="form.userSex" :disabled="loading">
          <SelectOption :value="0">女</SelectOption>
          <SelectOption :value="1">男</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="出生日期">
        <DatePicker
          v-model:value="birthday"
          :disabled="loading"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </FormItem>
      <FormItem label="国家">
        <Input v-model:value="form.countryName" disabled />
      </FormItem>
    </Form>

    <template #footer>
      <Space>
        <Button @click="emit('close')">关闭</Button>
        <Button :loading="loading" type="primary" @click="handleSubmit">
          提交
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
