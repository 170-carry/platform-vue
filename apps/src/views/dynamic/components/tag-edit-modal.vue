<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { saveDynamicTag } from '#/api/legacy/dynamic';
import { LANGUAGE_OPTIONS } from '#/views/system/shared';

import {
  Button,
  Form,
  FormItem,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  SelectOption,
  Space,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const saving = ref(false);
const uploadLoading = ref(false);

const form = reactive({
  del: false as boolean,
  description: '',
  id: '',
  imageUrl: '',
  languageType: '',
  sort: undefined as number | string | undefined,
  sysOrigin: '',
  tag: '',
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const record = props.record;
    form.id = String(record?.id || '');
    form.imageUrl = record?.imageUrl || '';
    form.sysOrigin =
      record?.sysOrigin || props.sysOriginOptions[0]?.value || 'LIKEI';
    form.tag = record?.tag || '';
    form.description = record?.description || '';
    form.del = Boolean(record?.del);
    form.sort = record?.sort ?? undefined;
    form.languageType = record?.languageType || '';
  },
  { immediate: true },
);

const title = ref('新增标签');

watch(
  () => props.record,
  (value) => {
    title.value = value?.id ? '修改标签' : '新增标签';
  },
  { immediate: true },
);

function openFileDialog() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.imageUrl = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    uploadLoading.value = false;
  }
}

function resetImage() {
  form.imageUrl = '';
}

async function handleSubmit() {
  if (!form.imageUrl) {
    message.warning('请上传背景图');
    return;
  }
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!form.tag.trim()) {
    message.warning('请输入标签');
    return;
  }
  if (!form.description.trim()) {
    message.warning('请输入描述');
    return;
  }
  if (!form.languageType) {
    message.warning('请选择语言');
    return;
  }
  if (form.sort === undefined || form.sort === null || form.sort === '') {
    message.warning('请输入排序');
    return;
  }

  saving.value = true;
  try {
    await saveDynamicTag({
      del: form.del,
      description: form.description.trim(),
      id: form.id || undefined,
      imageUrl: form.imageUrl,
      languageType: form.languageType,
      sort: Number(form.sort),
      sysOrigin: form.sysOrigin,
      tag: form.tag.trim(),
    });
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
    :title="title"
    width="680"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="背景">
        <input
          ref="fileInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="handleFileChange"
        />
        <div class="cover-field">
          <div v-if="form.imageUrl" class="cover-preview">
            <Image :src="form.imageUrl" class="cover-image" />
          </div>
          <div v-else class="cover-empty">请选择背景图</div>
          <Space>
            <Button :loading="uploadLoading" @click="openFileDialog">
              {{ form.imageUrl ? '重新上传' : '上传图片' }}
            </Button>
            <Button v-if="form.imageUrl" danger @click="resetImage">移除</Button>
          </Space>
        </div>
      </FormItem>
      <FormItem label="系统">
        <SysOriginSelect v-model:value="form.sysOrigin"
          :options="sysOriginOptions"
        ></SysOriginSelect>
      </FormItem>
      <FormItem label="标签">
        <Input v-model:value="form.tag" />
      </FormItem>
      <FormItem label="描述">
        <Input v-model:value="form.description" />
      </FormItem>
      <FormItem label="语言">
        <Select option-label-prop="children" v-model:value="form.languageType">
          <SelectOption
            v-for="item in LANGUAGE_OPTIONS"
            :key="item.value"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="状态">
        <Select option-label-prop="children" v-model:value="form.del">
          <SelectOption :value="false">上架</SelectOption>
          <SelectOption :value="true">下架</SelectOption>
        </Select>
      </FormItem>
      <FormItem label="排序">
        <InputNumber
          v-model:value="form.sort"
          :min="0"
          placeholder="数字越大越靠前"
          style="width: 100%"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.cover-field {
  display: grid;
  gap: 12px;
}

.cover-preview,
.cover-empty {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed rgb(148 163 184 / 35%);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  min-height: 180px;
  overflow: hidden;
}

.cover-empty {
  color: #94a3b8;
}

.cover-image {
  height: 180px;
  object-fit: cover;
  width: 100%;
}
</style>
