<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { addMikeType, updateMikeType } from '#/api/legacy/mike';

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

const MIKE_NAME_OPTIONS = [
  { label: '常规麦位', value: '常规麦位' },
  { label: '特殊麦位', value: '特殊麦位' },
  { label: '聚会麦位', value: '聚会麦位' },
  { label: '尊贵麦位', value: '尊贵麦位' },
];

const MIKE_TYPE_OPTIONS = [
  { label: '常规麦位', value: 'NORMAL_MIKE' },
  { label: '特殊麦位', value: 'SPECIAL_MIKE' },
  { label: '聚会麦位', value: 'PARTY_MIKE' },
  { label: '尊贵麦位', value: 'HONORABLE_MIKE' },
];

const SHOWCASE_OPTIONS = [
  { label: '上架', value: true as any },
  { label: '下架', value: false as any },
];

const CHARGE_TYPE_OPTIONS = [
  { label: '免费', value: 'FREE' as any },
  { label: '金币', value: 'GOLD' as any },
];

const props = withDefaults(
  defineProps<{
    open: boolean;
    row?: null | Record<string, any>;
    sysOrigin?: string;
  }>(),
  {
    row: null,
    sysOrigin: '',
  },
);

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const mikeCoverLoading = ref(false);
const mikeIconLoading = ref(false);
const coverInputRef = ref<HTMLInputElement | null>(null);
const iconInputRef = ref<HTMLInputElement | null>(null);

const form = reactive<Record<string, any>>({
  chargeType: '',
  fifteenMikeCandy: '',
  id: '',
  longMikeCandy: '',
  mikeCover: '',
  mikeIcon: '',
  mikeName: '',
  mikeType: '',
  showcase: true,
  sort: '',
  sysOrigin: '',
});

const title = computed(() =>
  `${form.id ? '修改' : '新增'}(${props.sysOrigin || form.sysOrigin || '-'})`,
);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    form.chargeType = row.chargeType || '';
    form.fifteenMikeCandy = row.fifteenMikeCandy || '';
    form.id = row.id || '';
    form.longMikeCandy = row.longMikeCandy || '';
    form.mikeCover = row.mikeCover || '';
    form.mikeIcon = row.mikeIcon || '';
    form.mikeName = row.mikeName || '';
    form.mikeType = row.mikeType || '';
    form.showcase = row.showcase ?? true;
    form.sort = row.sort || '';
    form.sysOrigin = row.sysOrigin || props.sysOrigin || '';
  },
  { immediate: true },
);

function pickCover() {
  coverInputRef.value?.click();
}

function pickIcon() {
  iconInputRef.value?.click();
}

async function uploadCover(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  mikeCoverLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.mikeCover = getAccessImgUrl(result.name);
  } finally {
    mikeCoverLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function uploadIcon(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  mikeIconLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.mikeIcon = getAccessImgUrl(result.name);
  } finally {
    mikeIconLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function handleSubmit() {
  if (!form.mikeCover) {
    message.warning('请上传麦位图');
    return;
  }
  if (!form.mikeIcon) {
    message.warning('请上传麦位图标');
    return;
  }
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!form.mikeName || !form.mikeType) {
    message.warning('请完善麦位名称和麦位类型');
    return;
  }
  if (!form.fifteenMikeCandy || !form.longMikeCandy) {
    message.warning('请填写麦位价格');
    return;
  }
  if (!form.chargeType) {
    message.warning('请选择收费类型');
    return;
  }
  loading.value = true;
  try {
    const payload = { ...form };
    if (payload.id) {
      await updateMikeType(payload);
    } else {
      await addMikeType(payload);
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
    :title="title"
    width="720px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="麦位图">
        <div class="upload-row">
          <Image v-if="form.mikeCover" :preview="false" :src="form.mikeCover" class="preview" />
          <Button :loading="mikeCoverLoading" @click="pickCover">
            {{ form.mikeCover ? '重新上传' : '上传麦位图' }}
          </Button>
          <input
            ref="coverInputRef"
            accept="image/*"
            class="hidden"
            type="file"
            @change="uploadCover"
          >
        </div>
      </FormItem>
      <FormItem label="麦位图标">
        <div class="upload-row">
          <Image v-if="form.mikeIcon" :preview="false" :src="form.mikeIcon" class="preview" />
          <Button :loading="mikeIconLoading" @click="pickIcon">
            {{ form.mikeIcon ? '重新上传' : '上传麦位图标' }}
          </Button>
          <input
            ref="iconInputRef"
            accept="image/*"
            class="hidden"
            type="file"
            @change="uploadIcon"
          >
        </div>
      </FormItem>
      <FormItem label="状态">
        <Select
          v-model:value="form.showcase"
          :options="SHOWCASE_OPTIONS"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="麦位名称">
        <Select
          v-model:value="form.mikeName"
          :options="MIKE_NAME_OPTIONS"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="麦位类型">
        <Select
          v-model:value="form.mikeType"
          :options="MIKE_TYPE_OPTIONS"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="15天麦位价格">
        <Input v-model:value="form.fifteenMikeCandy" />
      </FormItem>
      <FormItem label="永久麦位价格">
        <Input v-model:value="form.longMikeCandy" />
      </FormItem>
      <FormItem label="收费类型">
        <Select
          v-model:value="form.chargeType"
          :options="CHARGE_TYPE_OPTIONS"
          option-label-prop="label"
        />
      </FormItem>
      <FormItem label="排序">
        <Input v-model:value="form.sort" />
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.hidden {
  display: none;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.preview {
  border-radius: 12px;
  height: 72px;
  width: 72px;
}
</style>
