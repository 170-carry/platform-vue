<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { addPayFactory, updatePayFactory } from '#/api/legacy/pay';

import {
  Button,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  message,
} from 'antdv-next';

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

const fileInputRef = ref<HTMLInputElement | null>(null);
const loading = ref(false);
const uploadLoading = ref(false);
const form = reactive<Record<string, any>>({
  factoryCode: '',
  factoryIcon: '',
  factoryName: '',
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
      factoryCode: row.factoryCode || '',
      factoryIcon: row.factoryIcon || '',
      factoryName: row.factoryName || '',
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
    form.factoryIcon = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

function validateForm() {
  if (!String(form.factoryCode || '').trim()) {
    message.warning('请输入厂商Code');
    return false;
  }
  if (!String(form.factoryName || '').trim()) {
    message.warning('请输入厂商名称');
    return false;
  }
  if (!String(form.factoryIcon || '').trim()) {
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
      await updatePayFactory({ ...form });
    } else {
      await addPayFactory({ ...form });
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
    :title="form.id ? '修改厂商' : '添加厂商'"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="Code">
        <Input v-model:value="form.factoryCode" :disabled="Boolean(form.id)" />
      </FormItem>
      <FormItem label="名称">
        <Input v-model:value="form.factoryName" />
      </FormItem>
      <FormItem label="图标">
        <div class="upload-row">
          <Image v-if="form.factoryIcon" :preview="false" :src="form.factoryIcon" class="preview" />
          <Button :loading="uploadLoading" @click="openFilePicker">
            {{ form.factoryIcon ? '重新上传' : '上传图标' }}
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
