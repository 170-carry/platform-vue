<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { sendTeamNotice } from '#/api/legacy/team';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Modal,
  TextArea,
  message,
} from 'antdv-next';

function createForm() {
  return {
    content: '',
    cover: '',
    link: '',
    teamId: '',
    title: '',
  };
}

const props = defineProps<{
  open: boolean;
  teamId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const uploading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const form = reactive(createForm());

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm(), {
      teamId: String(props.teamId || ''),
    });
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
  uploading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.back);
    form.cover = getAccessImgUrl(result.name || '');
    message.success('上传成功');
  } finally {
    uploading.value = false;
  }
}

function handleSubmit() {
  if (!form.title.trim()) {
    message.warning('请输入标题');
    return;
  }
  if (!form.content.trim()) {
    message.warning('请输入内容');
    return;
  }
  Modal.confirm({
    title: '确认发送通知吗？',
    async onOk() {
      saving.value = true;
      try {
        await sendTeamNotice({ ...form });
        message.success('发送成功');
        emit('success');
        emit('close');
      } finally {
        saving.value = false;
      }
    },
  });
}
</script>

<template>
  <Drawer
    :open="open"
    title="发送团队通知"
    width="560px"
    @close="emit('close')"
  >
    <input
      ref="fileInputRef"
      accept="image/*"
      class="hidden-input"
      type="file"
      @change="handleFileChange"
    >
    <Form layout="vertical">
      <FormItem label="标题">
        <Input
          v-model:value="form.title"
          :maxlength="60"
          placeholder="标题"
          show-count
        />
      </FormItem>
      <FormItem label="内容">
        <TextArea
          v-model:value="form.content"
          :maxlength="200"
          :rows="5"
          placeholder="内容"
          show-count
        />
      </FormItem>
      <FormItem label="链接">
        <Input
          v-model:value="form.link"
          placeholder="链接"
        />
      </FormItem>
      <FormItem label="封面">
        <div class="cover-actions">
          <Button :loading="uploading" @click="openFileDialog">上传封面</Button>
          <span v-if="form.cover" class="cover-url">{{ form.cover }}</span>
        </div>
        <img v-if="form.cover" :src="form.cover" alt="" class="cover-preview">
      </FormItem>
    </Form>

    <template #footer>
      <div class="drawer-footer">
        <Button @click="emit('close')">取消</Button>
        <Button :loading="saving" type="primary" @click="handleSubmit">
          提交
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cover-url {
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.cover-preview {
  border-radius: 12px;
  margin-top: 12px;
  max-height: 180px;
  max-width: 240px;
  object-fit: cover;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
