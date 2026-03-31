<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { listFirstChargeRewards } from '#/api/legacy/product';
import { savePropsActivityRuleConfig } from '#/api/legacy/props';
import { flowGameMatchConfig } from '#/api/legacy/system';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Image,
  Input,
  Select,
  SelectOption,
  Space,
  Switch,
  message,
} from 'antdv-next';

import {
  PROP_ACTIVITY_TYPE_HELP,
  PROP_ACTIVITY_TYPES,
  createActivityRuleDraft,
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
const productsLoading = ref(false);
const gamesLoading = ref(false);
const smallIconUploading = ref(false);
const mediumIconUploading = ref(false);
const sourceUploading = ref(false);

const products = ref<Array<Record<string, any>>>([]);
const games = ref<Array<Record<string, any>>>([]);

const smallIconInputRef = ref<HTMLInputElement>();
const mediumIconInputRef = ref<HTMLInputElement>();
const sourceInputRef = ref<HTMLInputElement>();

const form = reactive<Record<string, any>>({
  activityType: '',
  id: '',
  jsonData: '',
  ruleDescription: '',
  sort: '',
  sysOrigin: '',
});

const ruleState = ref<any>(createActivityRuleDraft());

const isUpdate = computed(() => Boolean(form.id));
const isCrystal = computed(() => form.activityType === 'CRYSTAL');
const isFirstChargeReward = computed(() => form.activityType === 'FIRST_CHARGE_REWARD');
const isLuckyBox = computed(() => form.activityType === 'LUCKY_BOX');
const isQuantityMark = computed(() => form.activityType === 'SVIP_REWARD');
const isWeeklyGameTask = computed(() => form.activityType === 'WEEKLY_GAME_TASKS');
const isGameFruit = computed(() =>
  ['GAME_FRUIT_BOX_REWARD_WIN', 'GAME_FRUIT_BOX_REWARD_TIMES'].includes(
    form.activityType,
  ),
);
const luckyBoxRules = computed<Array<Record<string, any>>>(() =>
  Array.isArray(ruleState.value) ? ruleState.value : [],
);
const tips = computed(() => PROP_ACTIVITY_TYPE_HELP[form.activityType] || {});
const title = computed(() => (isUpdate.value ? '修改规则' : '新增规则'));

function resetForm() {
  form.activityType = '';
  form.id = '';
  form.jsonData = '';
  form.ruleDescription = '';
  form.sort = '';
  form.sysOrigin = props.sysOriginOptions[0]?.value ?? 'LIKEI';
  ruleState.value = createActivityRuleDraft();
}

function syncRuleDraft(value: string) {
  ruleState.value = createActivityRuleDraft(value);
}

async function ensureProducts() {
  if (!isFirstChargeReward.value || !form.sysOrigin || products.value.length > 0) {
    return;
  }
  productsLoading.value = true;
  try {
    products.value = await listFirstChargeRewards(form.sysOrigin);
  } finally {
    productsLoading.value = false;
  }
}

async function ensureGames() {
  if (!isWeeklyGameTask.value || !form.sysOrigin || games.value.length > 0) {
    return;
  }
  gamesLoading.value = true;
  try {
    games.value = await flowGameMatchConfig({ limit: 50, sysOrigin: form.sysOrigin });
  } finally {
    gamesLoading.value = false;
  }
}

async function handleActivityTypeChange(value: string) {
  syncRuleDraft(value);
  if (value === 'FIRST_CHARGE_REWARD') {
    await ensureProducts();
  }
  if (value === 'WEEKLY_GAME_TASKS') {
    await ensureGames();
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const record = props.record;
    products.value = [];
    games.value = [];
    if (!record) {
      resetForm();
      return;
    }
    form.activityType = record.activityType ?? '';
    form.id = record.id ?? '';
    form.jsonData = record.jsonData ?? '';
    form.ruleDescription = record.ruleDescription ?? '';
    form.sort = record.sort ?? '';
    form.sysOrigin = record.sysOrigin || props.sysOriginOptions[0]?.value || 'LIKEI';
    try {
      ruleState.value = form.jsonData
        ? JSON.parse(form.jsonData)
        : createActivityRuleDraft(form.activityType);
    } catch {
      ruleState.value = createActivityRuleDraft(form.activityType);
    }
    if (form.activityType === 'FIRST_CHARGE_REWARD') {
      void ensureProducts();
    }
    if (form.activityType === 'WEEKLY_GAME_TASKS') {
      void ensureGames();
    }
  },
  { immediate: true },
);

function validateRule() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.activityType) {
    message.warning('请选择类型');
    return false;
  }
  if (!String(form.ruleDescription || '').trim()) {
    message.warning('请输入规则描述');
    return false;
  }
  if (!isCrystal.value && (form.sort === '' || Number.isNaN(Number(form.sort)))) {
    message.warning('请输入排序');
    return false;
  }
  if (isQuantityMark.value) {
    if (!String(ruleState.value.mark || '').trim()) {
      message.warning('请输入标识');
      return false;
    }
    if (ruleState.value.quantity === '' || Number.isNaN(Number(ruleState.value.quantity))) {
      message.warning('请输入数量');
      return false;
    }
    return true;
  }
  if (isFirstChargeReward.value) {
    if (!ruleState.value.productId) {
      message.warning('请选择内购产品');
      return false;
    }
    return true;
  }
  if (isLuckyBox.value) {
    const valid = Array.isArray(ruleState.value)
      && ruleState.value.every(
        (item) =>
          item.quantity !== '' &&
          !Number.isNaN(Number(item.quantity)) &&
          item.opportunityNumber !== '' &&
          !Number.isNaN(Number(item.opportunityNumber)),
      );
    if (!valid) {
      message.warning('请完整填写 LuckyBox 规则');
      return false;
    }
    return true;
  }
  if (isCrystal.value) {
    const { level, mediumIcon, milestone, smallIcon, sourceUrl } = ruleState.value || {};
    if (!level || milestone === '' || !smallIcon || !mediumIcon || !sourceUrl) {
      message.warning('请完整填写爆水晶规则');
      return false;
    }
    return true;
  }
  if (isWeeklyGameTask.value) {
    if (!ruleState.value.gameConfId || ruleState.value.target === '') {
      message.warning('请完整填写游戏任务规则');
      return false;
    }
    return true;
  }
  if (isGameFruit.value) {
    if (ruleState.value.quantity === '' || Number.isNaN(Number(ruleState.value.quantity))) {
      message.warning('请输入数量');
      return false;
    }
    return true;
  }
  if (ruleState.value.quantity === '' || ruleState.value.quantity === undefined) {
    message.warning('请输入数量');
    return false;
  }
  return true;
}

async function uploadAsset(
  event: Event,
  key: 'mediumIcon' | 'smallIcon' | 'sourceUrl',
  loadingRef: typeof smallIconUploading,
  imageBucket = true,
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
    ruleState.value[key] = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    loadingRef.value = false;
  }
}

function handleSmallIconChange(event: Event) {
  void uploadAsset(event, 'smallIcon', smallIconUploading);
}

function handleMediumIconChange(event: Event) {
  void uploadAsset(event, 'mediumIcon', mediumIconUploading);
}

function handleSourceAssetChange(event: Event) {
  void uploadAsset(event, 'sourceUrl', sourceUploading, false);
}

async function handleSubmit() {
  if (!validateRule()) {
    return;
  }
  saving.value = true;
  try {
    const payload = {
      activityType: form.activityType,
      id: form.id || undefined,
      jsonData: JSON.stringify(ruleState.value),
      ruleDescription: form.ruleDescription.trim(),
      sort: isCrystal.value ? Number(ruleState.value.level) : Number(form.sort),
      sysOrigin: form.sysOrigin,
    };
    await savePropsActivityRuleConfig(payload);
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
    width="760"
    @close="emit('close')"
  >
    <Form layout="vertical">
      <FormItem label="系统">
        <SysOriginSelect
          v-model:value="form.sysOrigin"
          :disabled="isUpdate"

          :options="sysOriginOptions"
        ></SysOriginSelect>
      </FormItem>
      <FormItem label="类型">
        <Select option-label-prop="label"
          v-model:value="form.activityType"
          :disabled="isUpdate"
          @change="handleActivityTypeChange"
        >
          <SelectOption
            v-for="item in PROP_ACTIVITY_TYPES"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </FormItem>

      <template v-if="form.activityType">
        <FormItem v-if="isQuantityMark" :label="tips.mark || '标识'">
          <Input v-model:value="ruleState.mark" />
        </FormItem>

        <template v-if="isFirstChargeReward">
          <FormItem label="内购产品">
            <Select option-label-prop="label"
              v-model:value="ruleState.productId"
              :loading="productsLoading"
              option-filter-prop="label"
              show-search
            >
              <SelectOption
                v-for="item in products"
                :key="item.productId"
                :label="`${item.unitPrice || '-'} ${item.productId}`"
                :value="item.productId"
              >
                {{ item.unitPrice || '-' }} / {{ item.productId }} /
                {{ item.description || '-' }}
              </SelectOption>
            </Select>
          </FormItem>
        </template>

        <template v-else-if="isLuckyBox">
          <div class="rule-array">
            <div
              v-for="(item, index) in luckyBoxRules"
              :key="item.id || index"
              class="rule-array__item"
            >
              <div class="rule-array__title">第 {{ index + 1 }} 档</div>
              <FormItem label="消耗糖果">
                <Input v-model:value="item.quantity" />
              </FormItem>
              <FormItem label="抽奖次数">
                <Input v-model:value="item.opportunityNumber" />
              </FormItem>
            </div>
          </div>
        </template>

        <template v-else-if="isCrystal">
          <FormItem :label="tips.level || '等级'">
            <Select option-label-prop="label" v-model:value="ruleState.level">
              <SelectOption v-for="level in [1, 2, 3, 4, 5]" :key="level" :value="level" :label="`${level}`">
                {{ level }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem :label="tips.milestone || '里程碑'">
            <Input v-model:value="ruleState.milestone" />
          </FormItem>
          <div class="upload-grid">
            <FormItem :label="tips.smallIcon || '小号图标'">
              <input
                ref="smallIconInputRef"
                accept="image/*"
                class="hidden-input"
                type="file"
                @change="handleSmallIconChange"
              />
              <div class="upload-box">
                <Image v-if="ruleState.smallIcon" class="upload-box__image" :src="ruleState.smallIcon" />
                <div v-else class="upload-box__empty">请上传小图标</div>
                <Button :loading="smallIconUploading" @click="smallIconInputRef?.click()">
                  {{ ruleState.smallIcon ? '重新上传' : '上传图片' }}
                </Button>
              </div>
            </FormItem>
            <FormItem :label="tips.mediumIcon || '中号图标'">
              <input
                ref="mediumIconInputRef"
                accept="image/*"
                class="hidden-input"
                type="file"
                @change="handleMediumIconChange"
              />
              <div class="upload-box">
                <Image v-if="ruleState.mediumIcon" class="upload-box__image" :src="ruleState.mediumIcon" />
                <div v-else class="upload-box__empty">请上传中图标</div>
                <Button :loading="mediumIconUploading" @click="mediumIconInputRef?.click()">
                  {{ ruleState.mediumIcon ? '重新上传' : '上传图片' }}
                </Button>
              </div>
            </FormItem>
          </div>
          <FormItem :label="tips.sourceUrl || '动画资源图'">
            <input
              ref="sourceInputRef"
              accept=".svga,.pag"
              class="hidden-input"
              type="file"
              @change="handleSourceAssetChange"
            />
            <div class="upload-box">
              <div v-if="ruleState.sourceUrl" class="upload-box__file">
                {{ ruleState.sourceUrl }}
              </div>
              <div v-else class="upload-box__empty">请上传 svga/pag 资源</div>
              <Button :loading="sourceUploading" @click="sourceInputRef?.click()">
                {{ ruleState.sourceUrl ? '重新上传' : '上传资源' }}
              </Button>
            </div>
          </FormItem>
        </template>

        <template v-else-if="isWeeklyGameTask">
          <FormItem label="游戏">
            <Select option-label-prop="label"
              v-model:value="ruleState.gameConfId"
              :loading="gamesLoading"
              option-filter-prop="label"
              show-search
            >
              <SelectOption
                v-for="item in games"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              >
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="目标">
            <Input v-model:value="ruleState.target" />
          </FormItem>
        </template>

        <template v-else-if="isGameFruit">
          <FormItem label="上架状态">
            <Switch
              v-model:checked="ruleState.status"
              checked-children="上架"
              un-checked-children="下架"
            />
          </FormItem>
          <FormItem label="数量">
            <Input v-model:value="ruleState.quantity" />
          </FormItem>
        </template>

        <template v-else>
          <FormItem :label="tips.quantity || '数量'">
            <Input v-model:value="ruleState.quantity" />
          </FormItem>
        </template>
      </template>

      <FormItem label="规则描述">
        <Input
          v-model:value="form.ruleDescription"
          :maxlength="200"
          show-count
        />
      </FormItem>
      <FormItem v-if="!isCrystal" label="排序">
        <Input v-model:value="form.sort" />
      </FormItem>
    </Form>

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
.hidden-input {
  display: none;
}

.rule-array {
  display: grid;
  gap: 12px;
}

.rule-array__item {
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  padding: 12px;
}

.rule-array__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.upload-box {
  display: grid;
  gap: 12px;
}

.upload-box__empty,
.upload-box__file {
  align-items: center;
  background: rgb(248 250 252);
  border: 1px dashed rgb(148 163 184 / 35%);
  border-radius: 16px;
  color: rgb(148 163 184);
  display: flex;
  justify-content: center;
  min-height: 120px;
  padding: 12px;
}

.upload-box__file {
  color: rgb(51 65 85);
  word-break: break-all;
}

.upload-box__image {
  height: 120px;
  object-fit: contain;
  width: 100%;
}

.upload-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
