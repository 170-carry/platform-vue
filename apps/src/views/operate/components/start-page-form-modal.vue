<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  addStartPagePlan,
  updateStartPagePlan,
} from '#/api/legacy/system';

import {
  Button,
  DatePicker,
  Image,
  Modal,
  Select,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const APP_START_PAGE_PLAN_TYPES = [
  { name: '游戏王', value: 'KING_GAMES' },
  { name: 'CP', value: 'CP' },
];
const APP_START_PAGE_PLAN_TYPE_OPTIONS = APP_START_PAGE_PLAN_TYPES.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

function createForm() {
  return {
    cover: '',
    expireTime: '',
    id: '',
    sysOrigin: '',
    type: '',
  };
}

const saving = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const form = reactive<Record<string, any>>(createForm());

watch(
  () => ({ open: props.open, row: props.row }),
  ({ open, row }) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm());
    if (row) {
      Object.assign(form, row);
    } else {
      form.sysOrigin = String(props.sysOriginOptions[0]?.value || '');
      form.type = 'KING_GAMES';
    }
  },
  { immediate: true },
);

function pickCover() {
  fileInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  uploading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.startPage);
    form.cover = getAccessImgUrl(result.name);
  } finally {
    uploading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function submitForm() {
  if (!form.cover) {
    message.warning('请上传封面');
    return;
  }
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!form.type) {
    message.warning('请选择类型');
    return;
  }
  if (!form.expireTime) {
    message.warning('请选择过期时间');
    return;
  }
  saving.value = true;
  try {
    if (form.id) {
      await updateStartPagePlan({ ...form });
    } else {
      await addStartPagePlan({ ...form });
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
    :title="form.id ? '修改' : '新增'"
    width="540px"
    @cancel="emit('close')"
    @ok="submitForm"
  >
    <div class="form-grid">
      <div class="field">
        <div class="label">封面</div>
        <input
          ref="fileInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="handleUpload"
        >
        <div class="upload-row">
          <Image
            v-if="form.cover"
            :preview="false"
            :src="form.cover"
            class="preview"
          />
          <Button :loading="uploading" @click="pickCover">
            {{ form.cover ? '重新上传' : '上传图片' }}
          </Button>
        </div>
      </div>

      <div class="field">
        <div class="label">系统</div>
        <SysOriginSelect v-model:value="form.sysOrigin"
          :options="sysOriginOptions"
        ></SysOriginSelect>
      </div>

      <div class="field">
        <div class="label">类型</div>
        <Select
          v-model:value="form.type"
          :options="APP_START_PAGE_PLAN_TYPE_OPTIONS"
          option-label-prop="label"
          placeholder="请选择活动类型"
        />
      </div>

      <div class="field">
        <div class="label">过期时间</div>
        <DatePicker
          v-model:value="form.expireTime"
          show-time
          style="width: 100%"
          value-format="x"
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
  width: 220px;
}

.hidden-input {
  display: none;
}
</style>
