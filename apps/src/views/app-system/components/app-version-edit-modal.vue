<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import type { LegacyVersionItem } from '#/api/legacy/app-system';
import { addAppVersion, updateAppVersion } from '#/api/legacy/app-system';
import { PLATFORM_ORIGINS } from '#/views/system/shared';

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
  sysOrigin: string;
  updateData: LegacyVersionItem | null;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);

const form = reactive<Record<string, any>>({
  apkSize: '',
  appType: 'CHAT',
  buildVersion: '',
  channel: '',
  downloadUrl: '',
  forceUpdate: true,
  id: '',
  patch: false,
  platform: '',
  review: false,
  sysOrigin: '',
  updateDescribe: '',
  version: '',
});

const isAdd = computed(() => !props.updateData);
const title = computed(() =>
  isAdd.value ? `添加(${props.sysOrigin || '-'})` : `修改(${props.updateData?.sysOrigin || '-'})`,
);

const selectedPlatform = computed(
  () => PLATFORM_ORIGINS.find((item) => item.value === form.platform) || null,
);

function resetForm() {
  form.apkSize = '';
  form.appType = 'CHAT';
  form.buildVersion = '';
  form.channel = '';
  form.downloadUrl = '';
  form.forceUpdate = true;
  form.id = '';
  form.patch = false;
  form.platform = '';
  form.review = false;
  form.sysOrigin = '';
  form.updateDescribe = '';
  form.version = '';
}

function syncForm(data: LegacyVersionItem | null) {
  if (!data) {
    resetForm();
    return;
  }
  form.apkSize = data.apkSize ?? '';
  form.appType = data.appType ?? 'CHAT';
  form.buildVersion = data.buildVersion ?? '';
  form.channel = data.channel ?? '';
  form.downloadUrl = data.downloadUrl ?? '';
  form.forceUpdate = data.forceUpdate ?? true;
  form.id = data.id ?? '';
  form.patch = data.patch ?? false;
  form.platform = data.platform ?? '';
  form.review = data.review ?? false;
  form.sysOrigin = data.sysOrigin ?? '';
  form.updateDescribe = data.updateDescribe ?? '';
  form.version = data.version ?? '';
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    syncForm(props.updateData);
  },
  { immediate: true },
);

watch(
  () => props.updateData,
  (data) => {
    if (!props.open) {
      return;
    }
    syncForm(data);
  },
  { immediate: true },
);

function handlePlatformChange(value: string) {
  form.platform = value;
  form.channel = '';
}

function validateForm() {
  if (!form.platform) {
    message.warning('请选择平台');
    return false;
  }
  if (!form.channel) {
    message.warning('请选择渠道');
    return false;
  }
  if (!String(form.version || '').trim()) {
    message.warning('请输入版本号');
    return false;
  }
  if (form.buildVersion === '' || form.buildVersion === null || form.buildVersion === undefined) {
    message.warning('请输入编译版本号');
    return false;
  }
  if (!String(form.apkSize || '').trim()) {
    message.warning('请输入安装包大小');
    return false;
  }
  if (!String(form.downloadUrl || '').trim()) {
    message.warning('请输入下载链接');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  const payload = {
    apkSize: String(form.apkSize || '').trim(),
    appType: form.appType,
    buildVersion: Number(form.buildVersion),
    channel: form.channel,
    downloadUrl: String(form.downloadUrl || '').trim(),
    forceUpdate: Boolean(form.forceUpdate),
    id: form.id,
    patch: Boolean(form.patch),
    platform: form.platform,
    review: Boolean(form.review),
    sysOrigin: isAdd.value ? props.sysOrigin : form.sysOrigin,
    updateDescribe: 'App version update',
    version: String(form.version || '').trim(),
  };

  loading.value = true;
  try {
    if (isAdd.value) {
      await addAppVersion(payload);
    } else {
      await updateAppVersion(payload);
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
  <Modal
    :confirm-loading="loading"
    :open="open"
    destroy-on-close
    ok-text="提交"
    :title="title"
    width="560"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
      <FormItem label="平台">
        <Select option-label-prop="label"
          v-model:value="form.platform"
          :disabled="loading || !isAdd"
          placeholder="请选择平台"
          @change="handlePlatformChange"
        >
          <SelectOption
            v-for="item in PLATFORM_ORIGINS"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem label="渠道">
        <Select option-label-prop="label"
          v-model:value="form.channel"
          :disabled="loading || !isAdd"
          placeholder="请选择渠道"
        >
          <SelectOption
            v-for="item in selectedPlatform?.channels || []"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>

      <FormItem label="版本号">
        <Input
          v-model:value="form.version"
          :disabled="loading"
          placeholder="请输入版本号"
        />
      </FormItem>

      <FormItem label="编译版本号">
        <Input
          v-model:value="form.buildVersion"
          :disabled="loading"
          placeholder="请输入编译版本号"
          type="number"
        />
      </FormItem>

      <FormItem label="强更">
        <Select option-label-prop="label" v-model:value="form.forceUpdate" :disabled="loading">
          <SelectOption :value="false" label="否">否</SelectOption>
          <SelectOption :value="true" label="是">是</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="app类型">
        <Select option-label-prop="label" v-model:value="form.appType" :disabled="loading">
          <SelectOption value="CHAT" label="语聊">语聊</SelectOption>
          <SelectOption value="WORSHIP" label="朝拜">朝拜</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="审核中">
        <Select option-label-prop="label" v-model:value="form.review" :disabled="loading">
          <SelectOption :value="false" label="否">否</SelectOption>
          <SelectOption :value="true" label="是">是</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="补丁">
        <Select option-label-prop="label" v-model:value="form.patch" :disabled="loading">
          <SelectOption :value="false" label="否">否</SelectOption>
          <SelectOption :value="true" label="是">是</SelectOption>
        </Select>
      </FormItem>

      <FormItem label="安装包大小">
        <Input
          v-model:value="form.apkSize"
          :disabled="loading"
          placeholder="请输入安装包大小"
        />
      </FormItem>

      <FormItem label="下载链接">
        <Input
          v-model:value="form.downloadUrl"
          :disabled="loading"
          placeholder="请输入下载链接"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
