<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import type { Dayjs } from 'dayjs';

import {
  getLuckyDrawRatio,
  getLuckyPrizePoolAmount,
  getPoolPutRatio,
  getPrizePoolAmount,
  getProfitLossAmount,
  listGameLuckyBox,
  setLuckyDrawRatio,
  setPoolPutRatio,
} from '#/api/legacy/game';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Timeline,
  TimelineItem,
} from 'antdv-next';

import AccountInput from '#/components/account-input.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateLuckyBox' });

const { RangePicker } = DatePicker;

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadingMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notMore = ref(false);
const rangeDate = ref<[Dayjs, Dayjs] | null>(null);
const profitLossAmount = ref<Record<string, any>>({});
const prizePoolAmount = ref<number | string>('');
const luckyPrizePoolAmount = ref<number | string>('');
const luckyDrawRatio = ref<number | string>('');
const poolPutRatio = ref<number | string>('');
const detailOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);
const ratioModalOpen = ref(false);
const ratioSaving = ref(false);

const ratioForm = reactive({
  key: '' as 'lucky' | 'pool' | '',
  title: '',
  value: '',
});

const query = reactive({
  endTime: '',
  lastId: '',
  limit: 20,
  startTime: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'tickets', key: 'tickets', title: '门票', width: 100 },
  { dataIndex: 'lotterySize', key: 'lotterySize', title: '抽奖次数', width: 100 },
  { dataIndex: 'giftTotalAmount', key: 'giftTotalAmount', title: '礼物总价值', width: 120 },
  { dataIndex: 'earn', key: 'earn', title: '盈亏', width: 100 },
  { dataIndex: 'luckyDrawAmount', key: 'luckyDrawAmount', title: '抽成', width: 160 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(rangeDate, (value) => {
  if (!value?.length) {
    query.startTime = '';
    query.endTime = '';
    return;
  }
  query.startTime = String(value[0].valueOf());
  query.endTime = String(value[1].valueOf());
});

async function loadSummary() {
  if (!query.sysOrigin) {
    return;
  }
  const [profit, prizePool, luckyPool, luckyRatio, poolRatio] = await Promise.all([
    getProfitLossAmount({ ...query }),
    getPrizePoolAmount(query.sysOrigin),
    getLuckyPrizePoolAmount(query.sysOrigin),
    getLuckyDrawRatio(query.sysOrigin),
    getPoolPutRatio(query.sysOrigin),
  ]);
  profitLossAmount.value = profit || {};
  prizePoolAmount.value = prizePool || '';
  luckyPrizePoolAmount.value = luckyPool || '';
  luckyDrawRatio.value = luckyRatio || '';
  poolPutRatio.value = poolRatio || '';
}

async function loadData(reset = false) {
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  try {
    await loadSummary();
    const next = await listGameLuckyBox({ ...query });
    notMore.value = next.length <= 0;
    if (!notMore.value) {
      list.value = list.value.concat(next);
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailOpen.value = true;
}

function openRatioEditor(key: 'lucky' | 'pool') {
  ratioForm.key = key;
  ratioForm.title = key === 'lucky' ? 'Lucky抽取' : '投入奖金池抽取';
  ratioForm.value = String(key === 'lucky' ? luckyDrawRatio.value || '' : poolPutRatio.value || '');
  ratioModalOpen.value = true;
}

async function submitRatio() {
  if (!query.sysOrigin || !ratioForm.value.trim()) {
    return;
  }
  ratioSaving.value = true;
  try {
    if (ratioForm.key === 'lucky') {
      await setLuckyDrawRatio(query.sysOrigin, ratioForm.value);
    } else if (ratioForm.key === 'pool') {
      await setPoolPutRatio(query.sysOrigin, ratioForm.value);
    }
    ratioModalOpen.value = false;
    await loadSummary();
  } finally {
    ratioSaving.value = false;
  }
}

loadData(true);
</script>

<template>
  <Page title="LuckyBox抽奖记录">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 160px" @change="handleSearch"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 260px"
          />
          <RangePicker v-model:value="rangeDate" show-time />
          <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
        </Space>
      </div>

      <div class="summary">
        <Space wrap>
          <Tag>
            收入{{ profitLossAmount.income || 0 }} - 支出{{ profitLossAmount.expenditure || 0 }} = 余{{ profitLossAmount.remain || 0 }}
          </Tag>
          <Tag>奖金池: {{ prizePoolAmount || '-' }}</Tag>
          <Tag>幸运池: {{ luckyPrizePoolAmount || '-' }}</Tag>
          <Button size="small" type="link" @click="openRatioEditor('lucky')">
            Lucky抽%: {{ luckyDrawRatio || '-' }}
          </Button>
          <Button size="small" type="link" @click="openRatioEditor('pool')">
            投入奖金抽%: {{ poolPutRatio || '-' }}
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'luckyDrawAmount'">
            <span v-if="Number(record.earn || 0) > 0">
              {{ record.earn || 0 }} * {{ record.luckyDrawRatio || 0 }} = {{ record.luckyDrawAmount || 0 }}
            </span>
            <span v-else>0</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetails(record)">详情</Button>
          </template>
        </template>
      </Table>

      <div class="load-more">
        <span v-if="notMore">已加载全部</span>
        <Button v-else :loading="loadingMore" @click="loadData(false)">加载更多</Button>
      </div>
    </Card>

    <Drawer
      :open="detailOpen"
      destroy-on-close
      title="详情"
      width="720px"
      @close="detailOpen = false"
    >
      <div v-if="activeRow" class="detail-stack">
        <Card size="small" title="抽奖人">
          <UserProfileLink :profile="activeRow.userProfile" />
        </Card>
        <Card size="small" title="抽奖情况">
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="ID">{{ activeRow.id || '-' }}</DescriptionsItem>
            <DescriptionsItem label="系统">{{ activeRow.sysOrigin || '-' }}</DescriptionsItem>
            <DescriptionsItem label="门票">{{ activeRow.tickets || 0 }}</DescriptionsItem>
            <DescriptionsItem label="抽奖数">{{ activeRow.lotterySize || 0 }}</DescriptionsItem>
            <DescriptionsItem label="礼物价值">{{ activeRow.giftTotalAmount || 0 }}</DescriptionsItem>
            <DescriptionsItem label="盈亏">{{ activeRow.earn || 0 }}</DescriptionsItem>
            <DescriptionsItem label="幸运抽取%">
              {{ activeRow.luckyDrawRatio || 0 }}
            </DescriptionsItem>
            <DescriptionsItem label="幸运抽取金额">
              {{ activeRow.luckyDrawAmount || 0 }}
            </DescriptionsItem>
            <DescriptionsItem label="投入奖金抽取%">
              {{ activeRow.poolPutRatio || 0 }}
            </DescriptionsItem>
            <DescriptionsItem label="投入奖金抽取金额">
              {{ activeRow.poolPutAmount || 0 }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ formatDate(activeRow.createTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="过期时间">
              {{ activeRow.expiredTime || '-' }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
        <Card size="small" :title="`中奖礼物(${activeRow.giftTotalAmount || 0})`">
          <div class="gift-grid">
            <div
              v-for="(item, index) in activeRow.luckProps || []"
              :key="`${index}-${item.propsCover}`"
              class="gift-card"
            >
              <Image :preview="false" :src="item.propsCover" class="gift-cover" />
              <div>{{ item.amount || 0 }} * {{ item.quantity || 0 }}</div>
            </div>
          </div>
        </Card>
        <Card size="small" title="日志事件">
          <Timeline>
            <TimelineItem
              v-for="(item, index) in activeRow.logs || []"
              :key="`${index}-${item.createTime}`"
            >
              {{ item.content || '-' }}
              <div class="timeline-meta">{{ formatDate(item.createTime) }}</div>
            </TimelineItem>
          </Timeline>
        </Card>
      </div>
    </Drawer>

    <Modal
      :confirm-loading="ratioSaving"
      :open="ratioModalOpen"
      destroy-on-close
      :title="ratioForm.title"
      @cancel="ratioModalOpen = false"
      @ok="submitRatio"
    >
      <Input v-model:value="ratioForm.value" placeholder="范围0~99999, 最多5位小数" />
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar,
.summary {
  margin-bottom: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.detail-stack {
  display: grid;
  gap: 16px;
}

.gift-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.gift-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.gift-cover {
  height: 64px;
  margin: 0 auto 8px;
  width: 64px;
}

.timeline-meta {
  color: #64748b;
  margin-top: 8px;
}
</style>
