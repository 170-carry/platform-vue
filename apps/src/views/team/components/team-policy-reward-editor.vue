<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

import { useSortable } from '@vben/hooks';

import { listBadgePictureBySysOrigin } from '#/api/legacy/badge';
import {
  listEmojiGroupsBySysOrigin,
} from '#/api/legacy/app-system';
import { listGiftBySysOrigin } from '#/api/legacy/gift';
import {
  listNotFamilyBySysOriginType,
  listSysOriginTypeList,
} from '#/api/legacy/props';

import {
  Button,
  Drawer,
  Empty,
  Input,
  Select,
  SelectOption,
  Space,
  Tag,
  message,
} from 'antdv-next';

import {
  TEAM_POLICY_BADGE_DAY_OPTIONS,
  TEAM_POLICY_REWARD_META,
  TEAM_POLICY_REWARD_ORDER,
  cloneRewards,
  getTeamPolicyRewardSummary,
  type TeamPolicyRewardDetailType,
} from '../policy-shared';

defineOptions({ name: 'TeamPolicyRewardEditor' });

const props = defineProps<{
  allowEdit: boolean;
  open: boolean;
  row?: null | Record<string, any>;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [Array<Record<string, any>>];
}>();

const list = ref<Array<Record<string, any>>>([]);
const draft = ref<null | Record<string, any>>(null);
const rewardContainerRef = ref<HTMLElement>();
const loadingMap = ref<Record<string, boolean>>({});
const optionMap = ref<Record<string, Array<Record<string, any>>>>({});

let sortableInstance: any = null;

function isCurrency(type?: string) {
  return type === 'DIAMOND' || type === 'GOLD';
}

function isSpecialId(type?: string) {
  return type === 'SPECIAL_ID';
}

function isBadge(type?: string) {
  return type === 'BADGE' || type === 'ROOM_BADGE';
}

function isCustomize(type?: string) {
  return type === 'CUSTOMIZE';
}

function isGameCoupon(type?: string) {
  return type === 'GAME_COUPON';
}

function isOptionType(type?: string) {
  return !isCurrency(type) && !isSpecialId(type) && !isGameCoupon(type);
}

function getBadgeType(type?: string) {
  if (type === 'BADGE') {
    return 'ACTIVITY';
  }
  if (type === 'ROOM_BADGE') {
    return 'ROOM_ACHIEVEMENT';
  }
  return '';
}

function resetState() {
  list.value = cloneRewards(props.row?.propsRewards);
  draft.value = null;
}

function createDraft(type: TeamPolicyRewardDetailType) {
  return {
    amount: '',
    clickType: type,
    content: '',
    cover: TEAM_POLICY_REWARD_META[type].staticCover || '',
    quantity: '',
    remark: '',
    sourceUrl: '',
  };
}

function removeReward(index: number) {
  list.value.splice(index, 1);
}

function clearDraft() {
  draft.value = null;
}

function getOptions(type?: string) {
  return optionMap.value[type || ''] || [];
}

function applySelectedOption(value?: string | number) {
  if (!draft.value) {
    return;
  }
  const options = getOptions(draft.value.clickType);
  const target = options.find((item) => String(item.id) === String(value));
  if (!target) {
    return;
  }
  draft.value.cover =
    target.cover ||
    TEAM_POLICY_REWARD_META[draft.value.clickType as TeamPolicyRewardDetailType]
      ?.staticCover ||
    '';
  draft.value.sourceUrl = target.sourceUrl || '';
  draft.value.amount = target.amount || '';
}

function validateDraft(showError = true) {
  const current = draft.value;
  if (!current) {
    return false;
  }
  if (isSpecialId(current.clickType)) {
    if (!String(current.content || '').trim()) {
      if (showError) {
        message.warning('请输入靓号类型');
      }
      return false;
    }
    if (!String(current.quantity || '').trim()) {
      if (showError) {
        message.warning('请输入数量');
      }
      return false;
    }
    return true;
  }

  if (isCurrency(current.clickType) || isGameCoupon(current.clickType)) {
    if (!String(current.content || '').trim()) {
      if (showError) {
        message.warning('请输入数量');
      }
      return false;
    }
    return true;
  }

  if (!String(current.content || '').trim()) {
    if (showError) {
      message.warning('请选择资源');
    }
    return false;
  }

  if (isCustomize(current.clickType)) {
    if (!String(current.remark || '').trim()) {
      if (showError) {
        message.warning('请输入描述');
      }
      return false;
    }
    return true;
  }

  if (!String(current.quantity || '').trim()) {
    if (showError) {
      message.warning(isBadge(current.clickType) ? '请输入天数' : '请输入数量/天数');
    }
    return false;
  }
  return true;
}

function appendDraft() {
  if (!validateDraft(true) || !draft.value) {
    return false;
  }
  const current = draft.value;
  list.value.push({
    amount: current.amount,
    content: current.content,
    cover:
      current.cover ||
      TEAM_POLICY_REWARD_META[
        current.clickType as TeamPolicyRewardDetailType
      ]?.staticCover ||
      '',
    detailType: current.clickType,
    quantity: current.quantity,
    remark: current.remark,
    sourceUrl: current.sourceUrl,
    type: TEAM_POLICY_REWARD_META[
      current.clickType as TeamPolicyRewardDetailType
    ]?.category,
  });
  draft.value = null;
  nextTick(initSortable);
  return true;
}

async function ensureOptions(type: TeamPolicyRewardDetailType) {
  if (!props.sysOrigin || !isOptionType(type) || getOptions(type).length > 0) {
    return;
  }
  loadingMap.value[type] = true;
  try {
    if (type === 'GIFT') {
      const result = await listGiftBySysOrigin(props.sysOrigin);
      optionMap.value[type] = (result || []).map((item) => ({
        amount: item.giftCandy,
        cover: item.giftPhoto,
        id: item.id,
        name: item.giftName,
        sourceUrl: item.giftSourceUrl,
      }));
      return;
    }

    if (isBadge(type)) {
      const result = await listBadgePictureBySysOrigin(
        props.sysOrigin,
        getBadgeType(type),
      );
      optionMap.value[type] = (result || []).map((item) => ({
        cover: item.selectUrl,
        id: item.badgeConfigId,
        name: item.badgeName,
        sourceUrl: item.animationUrl,
      }));
      return;
    }

    if (type === 'NOBLE_VIP') {
      const result = await listNotFamilyBySysOriginType(props.sysOrigin, type);
      optionMap.value[type] = (result || []).map((item) => ({
        amount: item.amount,
        cover: item.cover,
        id: item.id,
        name: item.name,
        remark: item.remark,
        sourceUrl: item.sourceUrl,
      }));
      return;
    }

    if (type === 'EMOJI') {
      const result = await listEmojiGroupsBySysOrigin(props.sysOrigin);
      optionMap.value[type] = (result || []).map((item) => ({
        cover: item.cover,
        id: item.id,
        name: item.groupName,
      }));
      return;
    }

    const result = await listSysOriginTypeList(props.sysOrigin, type);
    optionMap.value[type] = (result || []).map((item) => ({
      amount: item.amount,
      cover: item.cover,
      id: item.id,
      name: item.name,
      remark: item.remark,
      sourceUrl: item.sourceUrl,
    }));
  } finally {
    loadingMap.value[type] = false;
  }
}

async function handleAdd(type: TeamPolicyRewardDetailType) {
  if (draft.value && !appendDraft()) {
    return;
  }
  await ensureOptions(type);
  draft.value = createDraft(type);
}

async function handleSubmit() {
  if (draft.value && !appendDraft()) {
    return;
  }
  if (list.value.length === 0) {
    message.warning('请配置道具内容');
    return;
  }
  emit(
    'success',
    list.value.map((item, index) => ({
      ...item,
      sort: index + 1,
    })),
  );
}

async function initSortable() {
  if (!props.allowEdit || !props.open || !rewardContainerRef.value || sortableInstance) {
    return;
  }
  const { initializeSortable } = useSortable(rewardContainerRef.value, {
    animation: 150,
    ghostClass: 'reward-item--dragging',
    handle: '.drag-handle',
    onEnd(event) {
      const oldIndex = event.oldIndex ?? -1;
      const newIndex = event.newIndex ?? -1;
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }
      const next = [...list.value];
      next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]!);
      list.value = next;
    },
  });
  sortableInstance = await initializeSortable();
}

function destroySortable() {
  sortableInstance?.destroy?.();
  sortableInstance = null;
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetState();
      nextTick(initSortable);
      return;
    }
    destroySortable();
  },
  { immediate: true },
);

watch(
  () => props.row,
  () => {
    if (props.open) {
      resetState();
      nextTick(initSortable);
    }
  },
  { deep: true },
);

onBeforeUnmount(() => {
  destroySortable();
});
</script>

<template>
  <Drawer
    :open="open"
    :title="`${allowEdit ? '编辑' : '查看'}(${sysOrigin || '-'})`"
    destroy-on-close
    width="960"
    @close="emit('close')"
  >
    <div class="reward-editor">
      <div class="reward-section">
        <div class="reward-section__header">
          <span>当前配置</span>
          <Tag>{{ list.length }}项</Tag>
        </div>
        <div
          v-if="list.length > 0"
          ref="rewardContainerRef"
          class="reward-list"
        >
          <div
            v-for="(item, index) in list"
            :key="`${item.detailType}-${item.content}-${index}`"
            class="reward-item"
          >
            <div class="reward-item__sort">
              <span
                v-if="allowEdit"
                class="drag-handle"
              >::</span>
              <span>{{ index + 1 }}</span>
            </div>
            <div class="reward-item__cover">
              <img
                v-if="item.cover"
                :src="item.cover"
                alt=""
              >
              <div
                v-else
                class="reward-item__fallback"
              >
                {{ item.detailType || item.type || '-' }}
              </div>
            </div>
            <div class="reward-item__body">
              <div class="reward-item__name">
                {{
                  TEAM_POLICY_REWARD_META[
                    (item.detailType || item.type) as TeamPolicyRewardDetailType
                  ]?.name || item.detailType || item.type || '-'
                }}
              </div>
              <div class="reward-item__desc">
                {{ getTeamPolicyRewardSummary(item) }}
              </div>
            </div>
            <Button
              v-if="allowEdit"
              danger
              size="small"
              type="link"
              @click="removeReward(index)"
            >
              删除
            </Button>
          </div>
        </div>
        <Empty
          v-else
          description="暂无道具配置"
        />
      </div>

      <template v-if="allowEdit">
        <div class="reward-section">
          <div class="reward-section__header">
            <span>添加配置</span>
          </div>
          <Space wrap>
            <Button
              v-for="type in TEAM_POLICY_REWARD_ORDER"
              :key="type"
              :loading="Boolean(loadingMap[type])"
              size="small"
              @click="handleAdd(type)"
            >
              {{ TEAM_POLICY_REWARD_META[type].name }}
            </Button>
          </Space>
        </div>

        <div
          v-if="draft"
          class="reward-section reward-section--draft"
        >
          <div class="reward-section__header">
            <span>
              {{
                TEAM_POLICY_REWARD_META[
                  draft.clickType as TeamPolicyRewardDetailType
                ].name
              }}
            </span>
          </div>
          <div class="draft-grid">
            <div
              v-if="draft.cover"
              class="draft-cover"
            >
              <img
                :src="draft.cover"
                alt=""
              >
            </div>
            <div class="draft-form">
              <template v-if="isSpecialId(draft.clickType)">
                <div class="draft-field">
                  <label>类型</label>
                  <Input
                    v-model:value="draft.content"
                    placeholder="请输入靓号类型"
                  />
                </div>
                <div class="draft-field">
                  <label>数量</label>
                  <Input
                    v-model:value="draft.quantity"
                    placeholder="请输入数量"
                  />
                </div>
              </template>

              <template v-else-if="isCurrency(draft.clickType) || isGameCoupon(draft.clickType)">
                <div class="draft-field draft-field--full">
                  <label>数量</label>
                  <Input
                    v-model:value="draft.content"
                    placeholder="请输入数量"
                  />
                </div>
              </template>

              <template v-else>
                <div class="draft-field">
                  <label>资源</label>
                  <Select option-label-prop="label"
                    v-model:value="draft.content"
                    show-search
                    @change="applySelectedOption"
                  >
                    <SelectOption
                      v-for="item in getOptions(draft.clickType)"
                      :key="item.id"
                      :label="item.name"
                      :value="item.id"
                    >
                      {{ item.name }}
                    </SelectOption>
                  </Select>
                </div>
                <div
                  v-if="isCustomize(draft.clickType)"
                  class="draft-field"
                >
                  <label>描述</label>
                  <Input
                    v-model:value="draft.remark"
                    placeholder="请输入描述"
                  />
                </div>
                <div
                  v-else
                  class="draft-field"
                >
                  <label>{{ isBadge(draft.clickType) ? '天数' : '数量/天数' }}</label>
                  <template v-if="isBadge(draft.clickType)">
                    <Select option-label-prop="label"
                      v-model:value="draft.quantity"
                      allow-clear
                      placeholder="0表示永久"
                    >
                      <SelectOption
                        v-for="item in TEAM_POLICY_BADGE_DAY_OPTIONS"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      >
                        {{ item.label }}
                    </SelectOption>
                    </Select>
                  </template>
                  <template v-else>
                    <Input
                      v-model:value="draft.quantity"
                      placeholder="请输入数量或天数"
                    />
                  </template>
                </div>
              </template>
            </div>
          </div>
          <Space>
            <Button @click="clearDraft">取消</Button>
            <Button
              type="primary"
              @click="appendDraft"
            >
              加入列表
            </Button>
          </Space>
        </div>
      </template>
    </div>

    <template
      v-if="allowEdit"
      #footer
    >
      <div class="reward-footer">
        <Button @click="emit('close')">取消</Button>
        <Button
          type="primary"
          @click="handleSubmit"
        >
          保存
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.reward-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reward-section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.reward-section__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reward-item {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 56px 56px minmax(0, 1fr) auto;
  padding: 12px;
}

.reward-item__sort {
  align-items: center;
  color: #0f172a;
  display: flex;
  font-weight: 600;
  gap: 8px;
  justify-content: center;
}

.drag-handle {
  color: #94a3b8;
  cursor: move;
  letter-spacing: 1px;
}

.reward-item__cover img,
.draft-cover img {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.reward-item__fallback {
  align-items: center;
  background: #e2e8f0;
  border-radius: 12px;
  color: #475569;
  display: flex;
  font-size: 12px;
  height: 48px;
  justify-content: center;
  padding: 4px;
  text-align: center;
  width: 48px;
}

.reward-item__body {
  min-width: 0;
}

.reward-item__name {
  color: #0f172a;
  font-weight: 600;
}

.reward-item__desc {
  color: #475569;
  font-size: 13px;
  margin-top: 4px;
  word-break: break-all;
}

.reward-section--draft {
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
}

.draft-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 72px minmax(0, 1fr);
  margin-bottom: 16px;
}

.draft-cover {
  align-items: center;
  display: flex;
  justify-content: center;
}

.draft-form {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.draft-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draft-field--full {
  grid-column: 1 / -1;
}

.draft-field label {
  color: #475569;
  font-size: 13px;
}

.reward-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

:deep(.reward-item--dragging) {
  opacity: 0.6;
}

@media (max-width: 768px) {
  .reward-item {
    grid-template-columns: 48px minmax(0, 1fr);
  }

  .reward-item__cover {
    grid-column: 1 / 2;
    grid-row: 2 / 3;
  }

  .reward-item__body {
    grid-column: 2 / 3;
    grid-row: 1 / 3;
  }

  .draft-grid,
  .draft-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
