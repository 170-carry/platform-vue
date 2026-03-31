<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { listEmojiGroupsBySysOrigin } from '#/api/legacy/app-system';
import { listBadgePictureBySysOrigin } from '#/api/legacy/badge';
import { listGiftBySysOrigin } from '#/api/legacy/gift';
import {
  listNotFamilyBySysOriginType,
  listSysOriginTypeList,
  saveOrUpdatePropsActivityRewardGroup,
} from '#/api/legacy/props';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Space,
  Switch,
  message,
} from 'antdv-next';

import RewardIcon from './reward-icon.vue';
import {
  PROPS_SOURCE_GROUP_ADD_TYPES,
  PROPS_SOURCE_GROUP_TYPE_MAP,
  formatRewardText,
  getPropsTypeName,
  getRewardBadgeType,
  isBadgeRewardType,
  isCurrencyRewardType,
  isGameCouponType,
  isPropsCouponType,
} from '../shared';

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const draftLoading = ref(false);

type DraftSourceOption = {
  badgeName?: string;
  cover?: string;
  id: number | string;
  name: string;
  remark?: string;
  sourceUrl?: string;
};

type RewardGroupItem = {
  badgeName?: string;
  content: number | string;
  cover?: string;
  detailType: string;
  quantity: number | string;
  remark: string;
  sourceUrl?: string;
  type: string;
};

const form = reactive<{
  id: number | string;
  name: string;
  rewardConfigList: RewardGroupItem[];
  shelfStatus: boolean;
  sysOrigin: string;
}>({
  id: '',
  name: '',
  rewardConfigList: [],
  shelfStatus: true,
  sysOrigin: '',
});

const draft = reactive<{
  content: number | string;
  quantity: number | string;
  remark: string;
  type: string;
}>({
  content: '',
  quantity: '',
  remark: '',
  type: '',
});

const sourceOptionsMap = reactive<
  Record<string, { list: DraftSourceOption[]; loaded: boolean; loading: boolean }>
>({});

const selectedDraftResource = ref<DraftSourceOption | null>(null);

const title = computed(() =>
  `${form.id ? '修改' : '添加'}（${props.sysOrigin || form.sysOrigin || '-'}）`,
);

const rewardItems = computed(() => form.rewardConfigList);
const sourceSelectOptions = computed<DraftSourceOption[]>(
  () => sourceOptionsMap[draft.type]?.list || [],
);

function createTypeStore(type: string) {
  if (!sourceOptionsMap[type]) {
    sourceOptionsMap[type] = { list: [], loaded: false, loading: false };
  }
  return sourceOptionsMap[type];
}

function resetForm() {
  form.id = '';
  form.name = '';
  form.rewardConfigList = [];
  form.shelfStatus = true;
  form.sysOrigin = props.sysOrigin || '';
}

function resetDraft() {
  draft.content = '';
  draft.quantity = '';
  draft.remark = '';
  draft.type = '';
  selectedDraftResource.value = null;
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
      resetDraft();
      return;
    }
    form.id = record.id ?? '';
    form.name = record.name ?? '';
    form.rewardConfigList = (record.rewardConfigList || []).map((item: RewardGroupItem) => ({
      ...item,
    }));
    form.shelfStatus = Boolean(record.shelfStatus ?? true);
    form.sysOrigin = props.sysOrigin || record.sysOrigin || '';
    resetDraft();
  },
  { immediate: true },
);

watch(
  () => props.sysOrigin,
  (value) => {
    if (value) {
      form.sysOrigin = value;
    }
  },
  { immediate: true },
);

function needsRemoteOptions(type: string) {
  return !(
    ['SPECIAL_ID', 'GOLD', 'DIAMOND', 'GAME_COUPON', 'PROP_COUPON'].includes(type)
  );
}

async function loadOptions(type: string) {
  if (!type || !form.sysOrigin || !needsRemoteOptions(type)) {
    return;
  }
  const store = createTypeStore(type);
  if (store.loaded || store.loading) {
    return;
  }
  store.loading = true;
  draftLoading.value = true;
  try {
    if (type === 'GIFT') {
      const list = await listGiftBySysOrigin(form.sysOrigin);
      store.list = list.map((item) => ({
        cover: item.giftPhoto || '',
        id: item.id ?? '',
        name: item.giftName || '',
        sourceUrl: item.giftSourceUrl || '',
      }));
    } else if (type === 'EMOJI') {
      const list = await listEmojiGroupsBySysOrigin(form.sysOrigin);
      store.list = list.map((item) => ({
        cover: item.cover || '',
        id: item.id ?? '',
        name: item.groupName || '',
        sourceUrl: '',
      }));
    } else if (isBadgeRewardType(type)) {
      const badgeType = getRewardBadgeType(type);
      const list = await listBadgePictureBySysOrigin(form.sysOrigin, badgeType);
      store.list = list.map((item) => ({
        badgeName: item.badgeName || '',
        cover: item.selectUrl || '',
        id: item.badgeConfigId ?? '',
        name: item.badgeName || '',
        sourceUrl: item.animationUrl || '',
      }));
    } else if (type === 'NOBLE_VIP') {
      const list = await listNotFamilyBySysOriginType(form.sysOrigin, type);
      store.list = list.map((item) => ({
        cover: item.cover || '',
        id: item.id ?? '',
        name: item.name || '',
        sourceUrl: item.sourceUrl || '',
      }));
    } else {
      const list = await listSysOriginTypeList(form.sysOrigin, type);
      store.list = list.map((item) => ({
        cover: item.cover || '',
        id: item.id ?? '',
        name: item.name || '',
        remark: item.remark || '',
        sourceUrl: item.sourceUrl || '',
      }));
    }
    store.loaded = true;
  } finally {
    store.loading = false;
    draftLoading.value = false;
  }
}

async function handleDraftTypeChange(value: string) {
  resetDraft();
  draft.type = value;
  await loadOptions(value);
}

function handleDraftContentChange(value: string | number) {
  if (!draft.type || !needsRemoteOptions(draft.type)) {
    return;
  }
  const option = sourceSelectOptions.value.find(
    (item) => String(item.id) === String(value),
  );
  selectedDraftResource.value = option || null;
}

function buildRewardItem(): null | RewardGroupItem {
  if (!draft.type) {
    return null;
  }
  const mapping = PROPS_SOURCE_GROUP_TYPE_MAP[draft.type];
  if (!mapping) {
    return null;
  }
  const base: RewardGroupItem = {
    content: draft.content,
    cover: selectedDraftResource.value?.cover || '',
    detailType: draft.type,
    quantity: draft.quantity,
    remark: draft.remark,
    sourceUrl: selectedDraftResource.value?.sourceUrl || '',
    type: mapping.value,
  };
  if (isBadgeRewardType(draft.type)) {
    base.badgeName = selectedDraftResource.value?.name || '';
  }
  return base;
}

function getAddTypeName(type: string) {
  return PROPS_SOURCE_GROUP_TYPE_MAP[type]?.name || getPropsTypeName(type);
}

function validateDraft() {
  if (!draft.type) {
    message.warning('请选择奖励类型');
    return false;
  }
  if (draft.type === 'SPECIAL_ID') {
    if (!String(draft.content || '').trim()) {
      message.warning('请输入靓号类型');
      return false;
    }
    if (draft.quantity === '' || Number.isNaN(Number(draft.quantity))) {
      message.warning('请输入数量');
      return false;
    }
    return true;
  }
  if (isCurrencyRewardType(draft.type) || isGameCouponType(draft.type)) {
    if (draft.content === '' || Number.isNaN(Number(draft.content))) {
      message.warning('请输入数量');
      return false;
    }
    return true;
  }
  if (isPropsCouponType(draft.type)) {
    if (draft.content === '' || Number.isNaN(Number(draft.content))) {
      message.warning('请输入券数');
      return false;
    }
    if (draft.quantity === '' || Number.isNaN(Number(draft.quantity))) {
      message.warning('请输入数量');
      return false;
    }
    return true;
  }
  if (!draft.content) {
    message.warning('请选择资源');
    return false;
  }
  if (draft.type === 'CUSTOMIZE') {
    if (!String(draft.remark || '').trim()) {
      message.warning('请输入描述');
      return false;
    }
    return true;
  }
  if (draft.quantity === '' || Number.isNaN(Number(draft.quantity))) {
    message.warning('请输入数量/天数');
    return false;
  }
  return true;
}

function addDraftItem() {
  if (!validateDraft()) {
    return;
  }
  const item = buildRewardItem();
  if (!item) {
    return;
  }
  form.rewardConfigList.push(item);
  resetDraft();
}

function moveItem(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= form.rewardConfigList.length) {
    return;
  }
  const list = [...form.rewardConfigList];
  const current = list[index];
  const next = list[target];
  if (!current || !next) {
    return;
  }
  list[index] = next;
  list[target] = current;
  form.rewardConfigList = list;
}

function removeItem(index: number) {
  form.rewardConfigList.splice(index, 1);
}

async function handleSubmit() {
  if (!String(form.name || '').trim()) {
    message.warning('请输入类型名称');
    return;
  }
  if (form.rewardConfigList.length === 0) {
    message.warning('请先配置资源组内容');
    return;
  }
  saving.value = true;
  try {
    await saveOrUpdatePropsActivityRewardGroup({
      id: form.id || undefined,
      name: form.name.trim(),
      rewardConfigList: form.rewardConfigList.map((item: RewardGroupItem, index: number) => ({
        content: item.content,
        detailType: item.detailType,
        quantity: item.quantity,
        remark: item.remark,
        sort: index + 1,
        type: item.type,
      })),
      shelfStatus: form.shelfStatus,
      sysOrigin: form.sysOrigin,
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
  <Drawer
    :open="open"
    :title="title"
    width="980"
    @close="emit('close')"
  >
    <Form layout="vertical">
      <FormItem label="类型名称">
        <Input v-model:value="form.name" placeholder="类别名称" />
      </FormItem>
      <FormItem label="上架状态">
        <Switch
          v-model:checked="form.shelfStatus"
          checked-children="上架"
          un-checked-children="下架"
        />
      </FormItem>

      <div class="reward-list">
        <div
          v-for="(item, index) in rewardItems"
          :key="`${item.detailType}-${item.content}-${index}`"
          class="reward-list__item"
        >
          <div class="reward-list__order">{{ Number(index) + 1 }}</div>
          <RewardIcon :item="item" />
          <div class="reward-list__info">
            <div class="reward-list__title">
              {{ getPropsTypeName(item.detailType || item.type) }}
            </div>
            <div class="reward-list__desc">
              {{ formatRewardText(item) }}
            </div>
          </div>
          <Space>
            <Button size="small" @click="moveItem(Number(index), -1)">上移</Button>
            <Button size="small" @click="moveItem(Number(index), 1)">下移</Button>
            <Button danger size="small" @click="removeItem(Number(index))">删除</Button>
          </Space>
        </div>
      </div>

      <div class="draft-box">
        <div class="draft-box__title">添加配置</div>
        <FormItem label="奖励类型">
          <Select option-label-prop="label"
            v-model:value="draft.type"
            placeholder="请选择奖励类型"
            @change="handleDraftTypeChange"
          >
            <SelectOption
              v-for="type in PROPS_SOURCE_GROUP_ADD_TYPES"
              :key="type"
              :value="type"
             :label="`${getAddTypeName(type)}`">
              {{ getAddTypeName(type) }}
            </SelectOption>
          </Select>
        </FormItem>

        <template v-if="draft.type === 'SPECIAL_ID'">
          <FormItem label="靓号类型">
            <Input v-model:value="draft.content" placeholder="请输入靓号类型" />
          </FormItem>
          <FormItem label="数量">
            <Input v-model:value="draft.quantity" placeholder="请输入数量" />
          </FormItem>
        </template>

        <template v-else-if="isCurrencyRewardType(draft.type) || isGameCouponType(draft.type)">
          <FormItem label="数量">
            <Input v-model:value="draft.content" placeholder="请输入数量" />
          </FormItem>
        </template>

        <template v-else-if="isPropsCouponType(draft.type)">
          <FormItem label="券数">
            <Input v-model:value="draft.content" placeholder="请输入券数" />
          </FormItem>
          <FormItem label="数量">
            <Input v-model:value="draft.quantity" placeholder="请输入数量" />
          </FormItem>
        </template>

        <template v-else>
          <FormItem label="资源">
            <Select option-label-prop="label"
              v-model:value="draft.content"
              :loading="draftLoading"
              option-filter-prop="label"
              placeholder="请选择资源"
              show-search
              @change="handleDraftContentChange"
            >
              <SelectOption
                v-for="item in sourceSelectOptions"
                :key="item.id"
                :label="`${item.id} ${item.name}`"
                :value="item.id"
              >
                {{ item.id }} / {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>

          <div v-if="selectedDraftResource" class="draft-preview">
            <RewardIcon :item="selectedDraftResource" :size="56" />
            <div class="draft-preview__meta">
              <div>{{ selectedDraftResource.name }}</div>
              <div class="draft-preview__id">
                ID: {{ selectedDraftResource.id }}
              </div>
            </div>
          </div>

          <FormItem v-if="draft.type === 'CUSTOMIZE'" label="描述">
            <Input v-model:value="draft.remark" placeholder="请输入描述" />
          </FormItem>

          <FormItem v-else label="数量/天数">
            <Input
              v-model:value="draft.quantity"
              :placeholder="
                isBadgeRewardType(draft.type)
                  ? '请输入天数，0 表示永久'
                  : '请输入数量/天数'
              "
            />
          </FormItem>
        </template>

        <Button type="primary" @click="addDraftItem">加入配置</Button>
      </div>
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
.draft-box {
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  margin-top: 16px;
  padding: 16px;
}

.draft-box__title {
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.draft-preview {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.draft-preview__id {
  color: rgb(100 116 139);
  font-size: 12px;
}

.reward-list {
  display: grid;
  gap: 12px;
}

.reward-list__item {
  align-items: center;
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  display: grid;
  gap: 12px;
  grid-template-columns: 40px 56px 1fr auto;
  padding: 12px;
}

.reward-list__info {
  min-width: 0;
}

.reward-list__order {
  align-items: center;
  background: rgb(241 245 249);
  border-radius: 999px;
  color: rgb(15 23 42);
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.reward-list__title {
  color: rgb(15 23 42);
  font-weight: 600;
}

.reward-list__desc {
  color: rgb(100 116 139);
  font-size: 13px;
  margin-top: 4px;
}
</style>
