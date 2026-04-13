<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { addPayChannel, updatePayChannel } from '#/api/legacy/pay';

import {
  Button,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Select,
  message,
} from 'antdv-next';

import { PAY_CHANNEL_GROUP_OPTIONS } from '../pay-shared';

const props = withDefaults(
  defineProps<{
    open: boolean;
    row?: Record<string, any>;
  }>(),
  {
    row: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const payChannelGroupOptions = PAY_CHANNEL_GROUP_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const uploadLoading = ref(false);
const form = reactive<Record<string, any>>({
  channelCode: '',
  channelIcon: '',
  channelName: '',
  channelType: '',
  id: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    Object.assign(form, {
      channelCode: row.channelCode || '',
      channelIcon: row.channelIcon || '',
      channelName: row.channelName || '',
      channelType: row.channelType || '',
      id: row.id || '',
    });
  },
  { immediate: true },
);

function openFilePicker() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.back);
    form.channelIcon = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

function validateForm() {
  if (!String(form.channelType || '').trim()) {
    message.warning('请选择渠道类型');
    return false;
  }
  if (!String(form.channelCode || '').trim()) {
    message.warning('请输入渠道Code');
    return false;
  }
  if (!String(form.channelName || '').trim()) {
    message.warning('请输入渠道名称');
    return false;
  }
  if (!String(form.channelIcon || '').trim()) {
    message.warning('请上传图标');
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
    if (form.id) {
      await updatePayChannel({ ...form });
    } else {
      await addPayChannel({ ...form });
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
    :title="form.id ? '修改渠道' : '添加渠道'"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="类型">
        <Select
          v-model:value="form.channelType"
          :options="payChannelGroupOptions"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="Code">
        <Input v-model:value="form.channelCode" :disabled="Boolean(form.id)" />
      </FormItem>
      <FormItem label="名称">
        <Input v-model:value="form.channelName" />
      </FormItem>
      <FormItem label="图标">
        <div class="upload-row">
          <Image v-if="form.channelIcon" :preview="false" :src="form.channelIcon" class="preview" />
          <Button :loading="uploadLoading" @click="openFilePicker">
            {{ form.channelIcon ? '重新上传' : '上传图标' }}
          </Button>
          <input
            ref="fileInputRef"
            accept="image/*"
            class="hidden"
            type="file"
            @change="handleFileChange"
          >
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.hidden {
  display: none;
}

.preview {
  border-radius: 12px;
  height: 72px;
  width: 72px;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}
</style>
