<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  addPropsSource,
  updatePropsSource,
} from '#/api/legacy/props';

import {
  Button,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Select,
  SelectOption,
  Switch,
  message,
} from 'antdv-next';

import {
  NOBLE_VIP_OPTIONS,
  PROPS_TYPES,
} from '../shared';

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const coverUploading = ref(false);
const sourceUploading = ref(false);
const expandUploading = ref(false);

const coverInputRef = ref<HTMLInputElement>();
const sourceInputRef = ref<HTMLInputElement>();
const expandInputRef = ref<HTMLInputElement>();

const form = reactive<Record<string, any>>({
  adminFree: false,
  amount: '',
  code: '',
  cover: '',
  expand: '',
  id: '',
  name: '',
  sourceUrl: '',
  sysOrigin: '',
  type: '',
});

const isUpdate = computed(() => Boolean(form.id));
const isImageSourceType = computed(() =>
  ['THEME', 'LAYOUT', 'CHAT_BUBBLE'].includes(form.type),
);
const isAmountRequired = computed(
  () => !['CUSTOMIZE', 'FRAGMENTS'].includes(form.type),
);
const isSourceRequired = computed(
  () => !['CUSTOMIZE', 'FRAGMENTS'].includes(form.type),
);
const showExpandUpload = computed(() => form.type === 'CHAT_BUBBLE');
const title = computed(() => (isUpdate.value ? '修改资源' : '新增资源'));

function resetForm() {
  form.adminFree = false;
  form.amount = '';
  form.code = '';
  form.cover = '';
  form.expand = '';
  form.id = '';
  form.name = '';
  form.sourceUrl = '';
  form.sysOrigin = props.sysOriginOptions[0]?.value ?? 'LIKEI';
  form.type = PROPS_TYPES[0]?.value ?? '';
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const record = props.record;
    if (!record) {
      resetForm();
      return;
    }
    form.adminFree = Boolean(record.adminFree);
    form.amount = record.amount ?? '';
    form.code = record.code ?? '';
    form.cover = record.cover ?? '';
    form.expand = record.expand ?? '';
    form.id = record.id ?? '';
    form.name = record.name ?? '';
    form.sourceUrl = record.sourceUrl ?? '';
    form.sysOrigin = record.sysOrigin || props.sysOriginOptions[0]?.value || 'LIKEI';
    form.type = record.type ?? '';
  },
  { immediate: true },
);

watch(
  () => form.type,
  (value) => {
    if (!value) {
      return;
    }
    if (value === 'NOBLE_VIP' && !NOBLE_VIP_OPTIONS.some((item) => item.value === form.name)) {
      form.name = '';
    }
    if (['CUSTOMIZE', 'FRAGMENTS'].includes(value)) {
      form.amount = 0;
      form.sourceUrl = '';
      form.expand = '';
    }
    if (value !== 'CHAT_BUBBLE') {
      form.expand = '';
    }
  },
);

function openCoverPicker() {
  coverInputRef.value?.click();
}

function openSourcePicker() {
  sourceInputRef.value?.click();
}

function openExpandPicker() {
  expandInputRef.value?.click();
}

function handleCoverInput(event: Event) {
  void uploadFile(event, 'cover', coverUploading, true);
}

function handleSourceInput(event: Event) {
  void uploadFile(event, 'sourceUrl', sourceUploading, isImageSourceType.value);
}

function handleExpandInput(event: Event) {
  void uploadFile(event, 'expand', expandUploading, true);
}

async function uploadFile(
  event: Event,
  targetKey: 'cover' | 'expand' | 'sourceUrl',
  loadingRef: typeof coverUploading,
  imageBucket = false,
) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  loadingRef.value = true;
  try {
    const result = await simpleUploadFile(
      file,
      imageBucket ? OSS_FILE_BUCKETS.svgaCover : OSS_FILE_BUCKETS.svgasource,
    );
    form[targetKey] = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    loadingRef.value = false;
  }
}

function validateForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.type) {
    message.warning('请选择类型');
    return false;
  }
  if (!String(form.cover || '').trim()) {
    message.warning('请上传封面');
    return false;
  }
  if (isSourceRequired.value && !String(form.sourceUrl || '').trim()) {
    message.warning('请上传资源');
    return false;
  }
  if (showExpandUpload.value && !String(form.expand || '').trim()) {
    message.warning('请上传 Android 资源');
    return false;
  }
  if (!String(form.name || '').trim()) {
    message.warning(form.type === 'NOBLE_VIP' ? '请选择贵族类型' : '请输入名称');
    return false;
  }
  if (!isUpdate.value && !String(form.code || '').trim()) {
    message.warning('请输入编码');
    return false;
  }
  if (isAmountRequired.value && (form.amount === '' || Number.isNaN(Number(form.amount)))) {
    message.warning('请输入底价');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      amount: isAmountRequired.value ? Number(form.amount) : 0,
    };
    if (isUpdate.value) {
      await updatePropsSource(payload);
    } else {
      await addPropsSource(payload);
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
    :title="title"
    width="720"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="系统">
        <SysOriginSelect v-model:value="form.sysOrigin"
          :options="sysOriginOptions"
        ></SysOriginSelect>
      </FormItem>
      <FormItem label="类型">
        <Select option-label-prop="label" v-model:value="form.type">
          <SelectOption
            v-for="item in PROPS_TYPES"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="封面">
        <input
          ref="coverInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="handleCoverInput"
        />
        <div class="upload-field">
          <div v-if="form.cover" class="upload-preview">
            <Image class="upload-preview__image" :src="form.cover" />
          </div>
          <div v-else class="upload-empty">请上传封面</div>
          <Button :loading="coverUploading" @click="openCoverPicker">
            {{ form.cover ? '重新上传' : '上传封面' }}
          </Button>
        </div>
      </FormItem>
      <FormItem v-if="isSourceRequired" :label="showExpandUpload ? 'iOS资源' : '资源'">
        <input
          ref="sourceInputRef"
          :accept="isImageSourceType ? 'image/*' : '.svga,.pag,.mp4'"
          class="hidden-input"
          type="file"
          @change="handleSourceInput"
        />
        <div class="upload-field">
          <div v-if="form.sourceUrl" class="upload-preview">
            <Image
              v-if="isImageSourceType"
              class="upload-preview__image"
              :src="form.sourceUrl"
            />
            <div v-else class="upload-file">
              {{ form.sourceUrl }}
            </div>
          </div>
          <div v-else class="upload-empty">请上传资源</div>
          <Button :loading="sourceUploading" @click="openSourcePicker">
            {{ form.sourceUrl ? '重新上传' : '上传资源' }}
          </Button>
        </div>
      </FormItem>
      <FormItem v-if="showExpandUpload" label="Android资源">
        <input
          ref="expandInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="handleExpandInput"
        />
        <div class="upload-field">
          <div v-if="form.expand" class="upload-preview">
            <Image class="upload-preview__image" :src="form.expand" />
          </div>
          <div v-else class="upload-empty">请上传 Android 资源</div>
          <Button :loading="expandUploading" @click="openExpandPicker">
            {{ form.expand ? '重新上传' : '上传资源' }}
          </Button>
        </div>
      </FormItem>
      <FormItem label="名称">
        <Select option-label-prop="label" v-if="form.type === 'NOBLE_VIP'" v-model:value="form.name">
          <SelectOption
            v-for="item in NOBLE_VIP_OPTIONS"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
        <Input v-else v-model:value="form.name" />
      </FormItem>
      <FormItem v-if="!isUpdate" label="编码">
        <Input v-model:value="form.code" placeholder="编码添加后不可修改" />
      </FormItem>
      <FormItem v-if="isAmountRequired" label="底价">
        <Input v-model:value="form.amount" />
      </FormItem>
      <FormItem label="Admin Free">
        <Switch
          v-model:checked="form.adminFree"
          checked-children="是"
          un-checked-children="否"
        />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.upload-field {
  display: grid;
  gap: 12px;
}

.upload-preview,
.upload-empty {
  align-items: center;
  background: rgb(248 250 252);
  border: 1px dashed rgb(148 163 184 / 35%);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  min-height: 180px;
  overflow: hidden;
  padding: 12px;
}

.upload-empty {
  color: rgb(148 163 184);
}

.upload-preview__image {
  height: 180px;
  object-fit: contain;
  width: 100%;
}

.upload-file {
  color: rgb(51 65 85);
  line-height: 1.5;
  word-break: break-all;
}
</style>
