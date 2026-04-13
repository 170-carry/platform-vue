<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addGift,
  updateGift,
} from '#/api/legacy/gift';
import {
  mapLuckyGiftStandard,
} from '#/api/legacy/game-lucky-gift';
import {
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  regionConfigTable,
} from '#/api/legacy/system';

import {
  Button,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  Image,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  TextArea,
  message,
} from 'antdv-next';

import {
  GIFT_CONFIG_TAB_OPTIONS,
  GIFT_SPECIAL_OPTIONS,
} from '../constants';

defineOptions({ name: 'OperateGiftFormModal' });

function createForm(sysOrigin = '') {
  return {
    account: '',
    explanationGift: false,
    expiredTime: '',
    giftCandy: '',
    giftCode: '',
    giftIntegral: '',
    giftName: '',
    giftPhoto: '',
    giftSourceUrl: '',
    giftTab: 'ORDINARY',
    id: '',
    regionList: [] as Array<number | string>,
    sort: '',
    specialList: [] as string[],
    standardId: '',
    sysOrigin,
    type: 'GOLD',
  };
}

const props = defineProps<{
  open: boolean;
  row?: null | Record<string, any>;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const form = reactive(createForm());
const loading = ref(false);
const saving = ref(false);
const coverInputRef = ref<HTMLInputElement | null>(null);
const sourceInputRef = ref<HTMLInputElement | null>(null);
const coverUploading = ref(false);
const sourceUploading = ref(false);
const regions = ref<Array<Record<string, any>>>([]);
const standardOptions = ref<Array<Record<string, any>>>([]);
const previousStandardId = ref<number | string>('');

const previewCover = computed(() => getAccessImgUrl(form.giftPhoto));
const previewSource = computed(() => getAccessImgUrl(form.giftSourceUrl));
const title = computed(() => (form.id ? '编辑礼物' : '新增礼物'));
const regionOptions = computed(() =>
  regions.value.map((item) => ({
    label: String(item.regionName || item.name || item.id || '-'),
    value: item.id as any,
  })),
);
const giftTabOptions = GIFT_CONFIG_TAB_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const chargeTypeOptions = [
  { label: '金币', value: 'GOLD' },
  { label: '钻石', value: 'DIAMOND' },
  { disabled: true, label: '免费', value: 'FREE' },
];
const specialOptions = GIFT_SPECIAL_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const standardSelectOptions = computed(() =>
  standardOptions.value.map((item) => ({
    label: String(item.name || item.label || item.value || item.id || '-'),
    value: (item.value || item.id) as any,
  })),
);
const isLuckyOrMagic = computed(
  () => form.giftTab === 'LUCKY_GIFT' || form.giftTab === 'MAGIC',
);

function normalizeMultiValue(value: any) {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== '' && item !== null && item !== undefined);
  }
  if (value === '' || value === null || value === undefined) {
    return [];
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resetForm() {
  Object.assign(form, createForm(props.sysOrigin));
  previousStandardId.value = '';
}

async function loadAuxiliary() {
  if (!form.sysOrigin) {
    return;
  }
  loading.value = true;
  try {
    regions.value = (await regionConfigTable({ sysOrigin: form.sysOrigin })) || [];
    standardOptions.value = (await mapLuckyGiftStandard(form.sysOrigin)) || [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    resetForm();
    if (props.row) {
      Object.assign(form, {
        ...props.row,
        explanationGift: Boolean(props.row.explanationGift),
        regionList: normalizeMultiValue(props.row.regions || props.row.regionList),
        specialList: normalizeMultiValue(props.row.special || props.row.specialList),
        sysOrigin: props.row.sysOrigin || props.sysOrigin,
      });
      previousStandardId.value = props.row.standardId || '';
    } else {
      form.sysOrigin = props.sysOrigin;
    }
    await loadAuxiliary();
  },
  { immediate: true },
);

watch(
  () => form.sysOrigin,
  () => {
    if (props.open) {
      void loadAuxiliary();
    }
  },
);

function toggleAllRegions() {
  if (form.regionList.length === regions.value.length) {
    form.regionList = [];
    return;
  }
  form.regionList = regions.value.map((item) => item.id);
}

function openCoverUpload() {
  coverInputRef.value?.click();
}

function openSourceUpload() {
  sourceInputRef.value?.click();
}

async function handleCoverUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  coverUploading.value = true;
  try {
    const result = await simpleUploadFile(file, 'gifts');
    form.giftPhoto = result.name;
    message.success('上传成功');
  } finally {
    coverUploading.value = false;
  }
}

async function handleSourceUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  sourceUploading.value = true;
  try {
    const result = await simpleUploadFile(file, 'gifts');
    form.giftSourceUrl = result.name;
    message.success('上传成功');
  } finally {
    sourceUploading.value = false;
  }
}

async function handleSubmit() {
  if (!form.sysOrigin) {
    message.warning('请选择平台');
    return;
  }
  if (!form.giftName.trim()) {
    message.warning('请输入礼物名称');
    return;
  }
  if (!form.giftCode.trim()) {
    message.warning('请输入礼物编码');
    return;
  }
  if (!form.giftPhoto) {
    message.warning('请上传封面');
    return;
  }
  if (!form.giftCandy && form.type !== 'FREE') {
    message.warning('请输入金币');
    return;
  }
  if (!form.giftIntegral && form.type !== 'FREE') {
    message.warning('请输入积分');
    return;
  }
  if (!form.sort) {
    message.warning('请输入排序');
    return;
  }
  if ((form.regionList || []).length <= 0) {
    message.warning('请至少选择一个区域');
    return;
  }
  if (form.giftTab === 'EXCLUSIVE' && !String(form.account || '').trim()) {
    message.warning('请输入归属人账号');
    return;
  }
  if (isLuckyOrMagic.value && !form.standardId) {
    message.warning('幸运/魔法礼物必须选择规格');
    return;
  }
  if (
    form.giftTab === 'LUCKY_GIFT' &&
    previousStandardId.value &&
    previousStandardId.value !== form.standardId
  ) {
    const confirmed = window.confirm(
      '修改规格会立刻切换新规格和新抽奖数据，是否确定切换？',
    );
    if (!confirmed) {
      return;
    }
  }

  saving.value = true;
  try {
    const payload = {
      ...form,
      giftCandy: form.type === 'FREE' ? '' : form.giftCandy,
      giftIntegral: form.type === 'FREE' ? '' : form.giftIntegral,
    };
    if (payload.id) {
      await updateGift(payload);
    } else {
      await addGift(payload);
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
  <Drawer
    :open="open"
    :title="title"
    destroy-on-close
    width="980"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <Form layout="vertical">
        <div class="grid">
          <FormItem label="平台">
            <Input :value="form.sysOrigin" disabled />
          </FormItem>
          <FormItem label="区域">
            <Space direction="vertical" style="width: 100%">
              <Button size="small" @click="toggleAllRegions">
                {{ form.regionList.length === regions.length ? '取消全选' : '全选' }}
              </Button>
              <Select option-label-prop="label"
                v-model:value="form.regionList"
                :options="regionOptions"
                mode="multiple"
                placeholder="请选择区域"
                show-search
                style="width: 100%"
              />
            </Space>
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="名称">
            <Input v-model:value="form.giftName" />
          </FormItem>
          <FormItem label="Code">
            <Input v-model:value="form.giftCode" />
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="金币">
            <Input v-model:value="form.giftCandy" :disabled="form.type === 'FREE'" />
          </FormItem>
          <FormItem label="积分">
            <Input v-model:value="form.giftIntegral" :disabled="form.type === 'FREE'" />
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="礼物类型">
            <Select
              v-model:value="form.giftTab"
              :options="giftTabOptions"
              option-label-prop="label"
              placeholder="请选择礼物类型"
            />
          </FormItem>
          <FormItem label="收费类型">
            <Select
              v-model:value="form.type"
              :options="chargeTypeOptions"
              option-label-prop="label"
              placeholder="请选择收费类型"
            />
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="特效">
            <Select
              v-model:value="form.specialList"
              :options="specialOptions"
              mode="multiple"
              option-label-prop="label"
              placeholder="请选择特效"
            />
          </FormItem>
          <FormItem label="排序">
            <Input v-model:value="form.sort" />
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="封面">
            <div class="upload-field">
              <Image
                v-if="previewCover"
                :src="previewCover"
                class="preview-image"
              />
              <div v-else class="preview-image preview-image--empty">未上传</div>
              <Space>
                <Button :loading="coverUploading" @click="openCoverUpload">上传封面</Button>
                <Button v-if="form.giftPhoto" danger @click="form.giftPhoto = ''">清空</Button>
              </Space>
            </div>
          </FormItem>
          <FormItem label="资源">
            <div class="upload-field">
              <div class="source-value">{{ previewSource || '未上传' }}</div>
              <Space>
                <Button :loading="sourceUploading" @click="openSourceUpload">上传资源</Button>
                <Button
                  v-if="form.giftSourceUrl"
                  danger
                  @click="form.giftSourceUrl = ''"
                >
                  清空
                </Button>
              </Space>
            </div>
          </FormItem>
        </div>

        <div class="grid">
          <FormItem label="有效期">
            <DatePicker
              v-model:value="form.expiredTime"
              style="width: 100%"
              value-format="x"
            />
          </FormItem>
          <FormItem v-if="form.giftTab === 'EXCLUSIVE'" label="归属人账号">
            <Input v-model:value="form.account" />
          </FormItem>
        </div>

        <div class="grid" v-if="isLuckyOrMagic">
          <FormItem label="幸运规格">
            <Select
              v-model:value="form.standardId"
              :options="standardSelectOptions"
              option-label-prop="label"
              placeholder="请选择幸运规格"
            />
          </FormItem>
        </div>

        <div class="grid" v-if="form.giftTab === 'CP'">
          <FormItem label="是否告白礼物">
            <Switch v-model:checked="form.explanationGift" />
          </FormItem>
        </div>

        <FormItem label="备注">
          <TextArea :value="previewSource" :rows="2" disabled />
        </FormItem>
      </Form>
    </Spin>

    <input
      ref="coverInputRef"
      accept="image/*"
      hidden
      type="file"
      @change="handleCoverUpload"
    >
    <input
      ref="sourceInputRef"
      accept=".svga,.pag,.mp4"
      hidden
      type="file"
      @change="handleSourceUpload"
    >

    <template #footer>
      <Space>
        <Button @click="emit('close')">取消</Button>
        <Button :loading="saving" type="primary" @click="handleSubmit">
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.upload-field {
  display: grid;
  gap: 10px;
}

.preview-image {
  border-radius: 16px;
  height: 120px;
  object-fit: cover;
  width: 120px;
}

.preview-image--empty,
.source-value {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  display: flex;
  min-height: 72px;
  padding: 12px;
  word-break: break-all;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
