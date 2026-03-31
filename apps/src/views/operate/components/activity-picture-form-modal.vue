<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  addActivityPicture,
  updateActivityPicture,
} from '#/api/legacy/activity';

import { Button, Image, Input, Modal, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

function createForm() {
  return {
    id: '',
    name: '',
    picture: '',
    sysOrigin: '',
  };
}

const saving = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const form = reactive<Record<string, any>>(createForm());

watch(
  () => ({ open: props.open, row: props.row, sysOrigin: props.sysOrigin }),
  ({ open, row, sysOrigin }) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm(), { sysOrigin });
    if (row) {
      Object.assign(form, row);
    }
  },
  { immediate: true },
);

function pickImage() {
  fileInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  uploading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.picture = getAccessImgUrl(result.name);
  } finally {
    uploading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function submitForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!form.picture) {
    message.warning('请上传活动图');
    return;
  }
  if (!String(form.name || '').trim()) {
    message.warning('请填写描述');
    return;
  }
  saving.value = true;
  try {
    if (form.id) {
      await updateActivityPicture({ ...form });
    } else {
      await addActivityPicture({ ...form });
    }
    message.success('保存成功');
    emit('success');
    emit('close');
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
    :title="form.id ? `修改(${sysOrigin})` : `新增(${sysOrigin})`"
    width="520px"
    @cancel="emit('close')"
    @ok="submitForm"
  >
    <div class="form-grid">
      <div class="field">
        <div class="label">活动图</div>
        <input
          ref="fileInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="handleUpload"
        >
        <div class="upload-row">
          <Image
            v-if="form.picture"
            :preview="false"
            :src="form.picture"
            class="preview"
          />
          <Button :loading="uploading" @click="pickImage">
            {{ form.picture ? '重新上传' : '上传图片' }}
          </Button>
        </div>
      </div>

      <div class="field">
        <div class="label">描述</div>
        <Input
          v-model:value="form.name"
          allow-clear
          placeholder="描述"
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: #0f172a;
  font-weight: 600;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.preview {
  border-radius: 12px;
  height: 120px;
  object-fit: cover;
  width: 160px;
}

.hidden-input {
  display: none;
}
</style>
