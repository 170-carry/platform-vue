<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addActivityConf,
  listTemplateValues,
  updateActivityConf,
} from '#/api/legacy/system';
import RewardRow from '#/views/props/components/reward-row.vue';
import ActivityResourceGroupSelectDrawer from '#/views/props/components/activity-resource-group-select-drawer.vue';

import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  Space,
  Tabs,
  TabPane,
  Tag,
  TextArea,
  message,
} from 'antdv-next';

import PropsSourceSelectDrawer from './props-source-select-drawer.vue';

defineOptions({ name: 'OperateActivityFormModal' });

function createForm() {
  return {
    butOneRewards: [] as Array<Record<string, any>>,
    butTwoRewards: [] as Array<Record<string, any>>,
    endTime: '',
    gifts: [{}, {}, {}] as Array<Record<string, any>>,
    id: '',
    remark: '',
    showcase: false,
    startTime: '',
    templateId: '',
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
const rangeDate = ref<[string, string] | null>(null);
const saving = ref(false);
const templateLoading = ref(false);
const templateOptions = ref<Array<Record<string, any>>>([]);
const rewardTab = ref('but1');

const giftDrawerOpen = ref(false);
const giftIndex = ref(-1);
const rewardDrawerOpen = ref(false);
const rewardTarget = ref<'butOneRewards' | 'butTwoRewards'>('butOneRewards');
const rewardIndex = ref(-1);

const isClose = ref(false);

const showcaseOptions = [
  { label: '下架', value: false as any },
  { label: '上架', value: true as any },
];

const templateSelectOptions = computed(() =>
  templateOptions.value.map((item) => ({
    label: String(item.name || item.templateName || item.id || '-'),
    value: item.id as any,
  })),
);

function resetForm() {
  Object.assign(form, createForm());
  rangeDate.value = null;
  rewardTab.value = 'but1';
  isClose.value = false;
}

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function fillEmptyGifts(list?: Array<Record<string, any>>) {
  const gifts = Array.isArray(list) ? cloneData(list) : [];
  while (gifts.length < 3) {
    gifts.push({});
  }
  return gifts.slice(0, 3);
}

function normalizeRewards(list?: Array<Record<string, any>>) {
  return (list || []).map((item) => ({
    rankRange: item.rankRange || '',
    resourceGroupId: item.resourceGroupId || '',
    rewards:
      item.rewards ||
      item.rewardConfigList ||
      item.reward?.rewards ||
      [],
    status: item.status,
  }));
}

async function loadTemplateOptions() {
  templateLoading.value = true;
  try {
    templateOptions.value = (await listTemplateValues()) || [];
  } finally {
    templateLoading.value = false;
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    resetForm();
    await loadTemplateOptions();

    const row = props.row;
    if (!row) {
      return;
    }

    const rowData = cloneData(row);
    const config = rowData.config || rowData;
    form.id = config.id || '';
    form.templateId = config.templateId || '';
    form.startTime = config.startTime || '';
    form.endTime = config.endTime || '';
    form.showcase = Boolean(config.showcase);
    form.remark = config.remark || '';
    form.butOneRewards = normalizeRewards(
      rowData.butOneRewards || config.butOneRewards,
    );
    form.butTwoRewards = normalizeRewards(
      rowData.butTwoRewards || config.butTwoRewards,
    );
    form.gifts = fillEmptyGifts(rowData.gifts || config.gifts);
    rangeDate.value =
      form.startTime && form.endTime
        ? [String(form.startTime), String(form.endTime)]
        : null;
    isClose.value = Number(rowData.status) === 2;
  },
  { immediate: true },
);

watch(rangeDate, (value) => {
  form.startTime = value?.[0] || '';
  form.endTime = value?.[1] || '';
});

function openGiftDrawer(index: number) {
  if (isClose.value) {
    return;
  }
  giftIndex.value = index;
  giftDrawerOpen.value = true;
}

function removeGift(index: number) {
  if (isClose.value) {
    return;
  }
  form.gifts[index] = {};
}

function selectGift(item: Record<string, any>) {
  if (giftIndex.value < 0) {
    return;
  }
  form.gifts[giftIndex.value] = {
    giftCandy: item.amount,
    giftName: item.name,
    giftPhoto: item.cover,
    giftSourceUrl: item.sourceUrl,
    id: item.id,
    type: 'GIFT',
  };
  giftDrawerOpen.value = false;
}

function getRewardList(target: 'butOneRewards' | 'butTwoRewards') {
  return form[target];
}

function addRewardRow(target: 'butOneRewards' | 'butTwoRewards') {
  if (isClose.value) {
    return;
  }
  getRewardList(target).push({
    rankRange: '',
    resourceGroupId: '',
    rewards: [],
  });
}

function removeRewardRow(
  target: 'butOneRewards' | 'butTwoRewards',
  index: number,
) {
  if (isClose.value) {
    return;
  }
  getRewardList(target).splice(index, 1);
}

function openRewardDrawer(
  target: 'butOneRewards' | 'butTwoRewards',
  index: number,
) {
  if (isClose.value) {
    return;
  }
  rewardTarget.value = target;
  rewardIndex.value = index;
  rewardDrawerOpen.value = true;
}

function selectRewardGroup(row: Record<string, any>) {
  const list = getRewardList(rewardTarget.value);
  const current = list[rewardIndex.value];
  if (!current) {
    return;
  }
  current.resourceGroupId = row.id;
  current.rewards = row.rewardConfigList || [];
  rewardDrawerOpen.value = false;
}

function filterConvertRewards(list: Array<Record<string, any>>) {
  return list
    .map((item) => ({
      rankRange: String(item.rankRange || '').trim(),
      resourceGroupId: item.resourceGroupId,
    }))
    .filter((item) => {
      if (!item.rankRange || !item.resourceGroupId) {
        return false;
      }
      if (/^\d+$/.test(item.rankRange)) {
        return true;
      }
      const [start, end] = item.rankRange.split('~');
      if (!start || !end) {
        return false;
      }
      if (!/^\d+$/.test(start) || !/^\d+$/.test(end)) {
        return false;
      }
      return Number(start) <= Number(end);
    });
}

async function handleSubmit() {
  if (isClose.value) {
    message.warning('活动已结束，不可编辑');
    return;
  }
  if (!props.sysOrigin) {
    message.warning('系统不能为空');
    return;
  }
  if (!form.templateId) {
    message.warning('请选择模版');
    return;
  }
  if (!form.startTime || !form.endTime) {
    message.warning('请选择活动时间');
    return;
  }

  const submitForm = cloneData(form) as Record<string, any>;
  submitForm.giftIds = submitForm.gifts
    .filter((item: Record<string, any>) => item?.id)
    .map((item: Record<string, any>) => item.id);

  const tips: string[] = [];
  if (submitForm.giftIds.length < 3) {
    tips.push('礼物数量不足 3 个');
  }

  submitForm.butOneRewards = filterConvertRewards(form.butOneRewards);
  if (submitForm.butOneRewards.length <= 0) {
    tips.push('[奖品-按钮1] 没有关联活动排名奖品');
  } else if (submitForm.butOneRewards.length !== form.butOneRewards.length) {
    tips.push('[奖品-按钮1] 存在错误记录，系统会自动排除');
  }

  submitForm.butTwoRewards = filterConvertRewards(form.butTwoRewards);
  if (submitForm.butTwoRewards.length <= 0) {
    tips.push('[奖品-按钮2] 没有关联活动排名奖品');
  } else if (submitForm.butTwoRewards.length !== form.butTwoRewards.length) {
    tips.push('[奖品-按钮2] 存在错误记录，系统会自动排除');
  }

  if (tips.length > 0) {
    const confirmed = window.confirm(`${tips.join('\n')}\n是否继续提交？`);
    if (!confirmed) {
      return;
    }
  }

  const payload = {
    butOneRewards: submitForm.butOneRewards,
    butTwoRewards: submitForm.butTwoRewards,
    endTime: submitForm.endTime,
    giftIds: submitForm.giftIds,
    id: submitForm.id || undefined,
    remark: submitForm.remark,
    showcase: submitForm.showcase,
    startTime: submitForm.startTime,
    sysOrigin: props.sysOrigin,
    templateId: submitForm.templateId,
  };

  saving.value = true;
  try {
    if (submitForm.id) {
      await updateActivityConf(payload);
    } else {
      await addActivityConf(payload);
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
    :title="row?.config?.id || row?.id ? (isClose ? '查看活动' : '编辑活动') : '新增活动'"
    destroy-on-close
    width="1120"
    @close="emit('close')"
  >
    <div class="panel">
      <Alert
        v-if="isClose"
        :closable="false"
        message="活动结束后不可再次编辑"
        type="info"
      />

      <Form layout="vertical">
        <div class="grid">
          <FormItem label="系统">
            <Input :value="sysOrigin" disabled />
          </FormItem>
          <FormItem label="模版">
            <Select
              v-model:value="form.templateId"
              :options="templateSelectOptions"
              :disabled="isClose"
              :loading="templateLoading"
              option-label-prop="label"
              placeholder="请选择模版"
              show-search
            />
          </FormItem>
        </div>

        <FormItem label="活动时间">
          <DatePicker.RangePicker
            v-model:value="rangeDate"
            :disabled="isClose"
            show-time
            style="width: 100%"
            value-format="x"
          />
        </FormItem>

        <div class="grid">
          <FormItem label="状态">
            <Select
              v-model:value="form.showcase"
              :disabled="isClose"
              :options="showcaseOptions"
              option-label-prop="label"
              placeholder="请选择状态"
            />
          </FormItem>
          <FormItem label="备注">
            <TextArea
              v-model:value="form.remark"
              :maxlength="200"
              :rows="3"
              :disabled="isClose"
            />
          </FormItem>
        </div>
      </Form>

      <div class="section">
        <div class="section__title">活动礼物</div>
        <div class="gift-grid">
          <div
            v-for="(item, index) in form.gifts"
            :key="index"
            class="gift-card"
          >
            <button type="button" class="gift-card__cover" @click="openGiftDrawer(index)">
              <img
                :src="item.giftPhoto || 'https://dummyimage.com/120x120/e2e8f0/64748b&text=Gift'"
                alt=""
              >
            </button>
            <div class="gift-card__name">{{ item.giftName || '请选择礼物' }}</div>
            <div class="gift-card__meta">
              <Tag v-if="item.id">ID {{ item.id }}</Tag>
              <span v-if="item.giftCandy">金币 {{ item.giftCandy }}</span>
            </div>
            <Button
              v-if="item.id && !isClose"
              danger
              size="small"
              type="link"
              @click="removeGift(index)"
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section__title">活动排名奖品</div>
        <Alert :closable="false" class="reward-tips" type="info">
          <template #message>
            <div>排行榜只展示前 20 名，后台派奖也只处理 TOP20。</div>
            <div>排名可输入单个数字，如 `1`；也可输入区间，如 `1~10`、`11~20`。</div>
          </template>
        </Alert>

        <Tabs v-model:activeKey="rewardTab">
          <TabPane key="but1" tab="奖品-按钮1">
            <div class="reward-list">
              <div
                v-for="(item, index) in form.butOneRewards"
                :key="`one-${index}`"
                class="reward-item"
              >
                <Input
                  v-model:value="item.rankRange"
                  :disabled="isClose"
                  placeholder="排名范围"
                />
                <Button :disabled="isClose" @click="openRewardDrawer('butOneRewards', index)">
                  选择奖品组
                </Button>
                <Tag v-if="item.resourceGroupId">资源组 {{ item.resourceGroupId }}</Tag>
                <Button
                  v-if="!isClose"
                  danger
                  type="link"
                  @click="removeRewardRow('butOneRewards', index)"
                >
                  删除
                </Button>
                <RewardRow :list="item.rewards" />
              </div>
              <Button v-if="!isClose" type="dashed" @click="addRewardRow('butOneRewards')">
                添加
              </Button>
            </div>
          </TabPane>
          <TabPane key="but2" tab="奖品-按钮2">
            <div class="reward-list">
              <div
                v-for="(item, index) in form.butTwoRewards"
                :key="`two-${index}`"
                class="reward-item"
              >
                <Input
                  v-model:value="item.rankRange"
                  :disabled="isClose"
                  placeholder="排名范围"
                />
                <Button :disabled="isClose" @click="openRewardDrawer('butTwoRewards', index)">
                  选择奖品组
                </Button>
                <Tag v-if="item.resourceGroupId">资源组 {{ item.resourceGroupId }}</Tag>
                <Button
                  v-if="!isClose"
                  danger
                  type="link"
                  @click="removeRewardRow('butTwoRewards', index)"
                >
                  删除
                </Button>
                <RewardRow :list="item.rewards" />
              </div>
              <Button v-if="!isClose" type="dashed" @click="addRewardRow('butTwoRewards')">
                添加
              </Button>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>

    <PropsSourceSelectDrawer
      :open="giftDrawerOpen"
      default-type="GIFT"
      :sys-origin="sysOrigin"
      @close="giftDrawerOpen = false"
      @select="selectGift"
    />
    <ActivityResourceGroupSelectDrawer
      :open="rewardDrawerOpen"
      :sys-origin="sysOrigin"
      @close="rewardDrawerOpen = false"
      @select="selectRewardGroup"
    />

    <template v-if="!isClose" #footer>
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
.panel {
  display: grid;
  gap: 16px;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.section {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.section__title {
  color: #0f172a;
  font-weight: 600;
  margin-bottom: 12px;
}

.gift-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.gift-card {
  align-items: center;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.gift-card__cover {
  background: transparent;
  border: 0;
  cursor: pointer;
  padding: 0;
}

.gift-card__cover img {
  border-radius: 14px;
  height: 120px;
  object-fit: cover;
  width: 120px;
}

.gift-card__name {
  color: #0f172a;
  font-weight: 600;
}

.gift-card__meta {
  align-items: center;
  color: #475569;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.reward-tips {
  margin-bottom: 12px;
}

.reward-list {
  display: grid;
  gap: 12px;
}

.reward-item {
  align-items: flex-start;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 200px auto auto auto minmax(0, 1fr);
  padding: 12px;
}

@media (max-width: 960px) {
  .grid,
  .gift-grid,
  .reward-item {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
