<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getGameFruitDaysRecord,
  pageDaysUserData,
} from '#/api/legacy/game';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Pagination,
  TabPane,
  Table,
  Tabs,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateGameFruitDaysLog' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const activeTab = ref('days');
const loading = ref(false);
const total = ref(0);
const dayList = ref<Array<Record<string, any>>>([]);
const userList = ref<Array<Record<string, any>>>([]);
const summary = ref<Record<string, any>>({});

const query = reactive({
  cursor: 1,
  date: '',
  earningsRate: '',
  limit: 10,
  newNum: '',
  platformExpend: '',
  playerNum: '',
  profit: '',
  sysOrigin: '',
  userExpend: '',
  userId: '',
});

type DaySortKey =
  | 'date'
  | 'earningsRate'
  | 'newNum'
  | 'platformExpend'
  | 'playerNum'
  | 'profit'
  | 'userExpend';

const dayColumns = [
  { dataIndex: 'date', key: 'date', sorter: true, title: '日期', width: 140 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 100 },
  {
    dataIndex: 'vegetableNum',
    key: 'vegetableNum',
    title: '开蔬菜',
    width: 110,
  },
  { dataIndex: 'pizzaNum', key: 'pizzaNum', title: '开披萨', width: 110 },
  { dataIndex: 'newNum', key: 'newNum', sorter: true, title: '日新增', width: 110 },
  {
    dataIndex: 'playerNum',
    key: 'playerNum',
    sorter: true,
    title: '日活跃',
    width: 110,
  },
  {
    dataIndex: 'userExpend',
    key: 'userExpend',
    sorter: true,
    title: '日下注',
    width: 120,
  },
  {
    dataIndex: 'platformExpend',
    key: 'platformExpend',
    sorter: true,
    title: '日中奖',
    width: 120,
  },
  { dataIndex: 'profit', key: 'profit', sorter: true, title: '日盈利', width: 120 },
  {
    dataIndex: 'earningsRate',
    key: 'earningsRate',
    sorter: true,
    title: '盈利率',
    width: 120,
  },
];

const userColumns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '下注用户', width: 220 },
  { dataIndex: 'date', key: 'date', title: '日期', width: 140 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 100 },
  { dataIndex: 'betSize', key: 'betSize', title: '日下注次数', width: 120 },
  { dataIndex: 'betAmount', key: 'betAmount', title: '日下注', width: 120 },
  { dataIndex: 'winnersAmount', key: 'winnersAmount', title: '日得奖', width: 120 },
  { dataIndex: 'earnings', key: 'earnings', title: '日盈利', width: 120 },
  { dataIndex: 'earningsRate', key: 'earningsRate', title: '盈利率', width: 120 },
  { dataIndex: 'earningsSum', key: 'earningsSum', title: '历史盈利', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '注册时间', width: 180 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
      void loadDays(true);
    }
  },
  { immediate: true },
);

function clearSort() {
  query.date = '';
  query.newNum = '';
  query.playerNum = '';
  query.userExpend = '';
  query.platformExpend = '';
  query.profit = '';
  query.earningsRate = '';
}

async function loadDays(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getGameFruitDaysRecord({ ...query });
    dayList.value = result.pageResult?.records || [];
    total.value = result.pageResult?.total || 0;
    summary.value = result || {};
  } finally {
    loading.value = false;
  }
}

async function loadUsers(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageDaysUserData({ ...query });
    userList.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleTabChange(key: string) {
  activeTab.value = key;
  query.cursor = 1;
  query.limit = 10;
  clearSort();
  if (key === 'days') {
    void loadDays(true);
    return;
  }
  void loadUsers(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  if (activeTab.value === 'days') {
    void loadDays();
    return;
  }
  void loadUsers();
}

function handleTableChange(_: any, __: any, sorter: any) {
  clearSort();
  if (!Array.isArray(sorter) && sorter?.order && sorter?.columnKey) {
    const columnKey = sorter.columnKey as DaySortKey;
    query[columnKey] = sorter.order === 'ascend' ? 'true' : 'false';
  }
  if (activeTab.value === 'days') {
    void loadDays(true);
  }
}
</script>

<template>
  <Page title="摩天轮游戏每日数据">
    <Card>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <TabPane key="days" tab="每日数据" />
        <TabPane key="users" tab="用户数据" />
      </Tabs>

      <div v-if="activeTab === 'users'" class="toolbar">
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="用户ID"
          style="width: 240px"
        />
        <Button :loading="loading" type="primary" @click="loadUsers(true)">
          搜索
        </Button>
      </div>

      <Table
        v-if="activeTab === 'days'"
        :columns="dayColumns"
        :data-source="dayList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1200 }"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'earningsRate'">
            {{ Number(record.earningsRate || 0).toFixed(2) }} %
          </template>
        </template>
      </Table>

      <Table
        v-else
        :columns="userColumns"
        :data-source="userList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :user-profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'sysOrigin'">
            {{ record.userProfile?.originSys || record.sysOrigin || '-' }}
          </template>
          <template v-else-if="column.key === 'earningsRate'">
            {{ record.earningsRate || 0 }} %
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div class="pager">
        <Pagination
          :current="query.cursor"
          :page-size="query.limit"
          :total="total"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>

      <div v-if="activeTab === 'days'" class="summary">
        <div class="summary-card">
          <div class="summary-title">筛选结果汇总</div>
          <div>下注金币: {{ summary.filterBetAmount ?? '-' }}</div>
          <div>获得奖励: {{ summary.filterAward ?? '-' }}</div>
          <div>参与人数: {{ summary.filterActiveCount ?? '-' }}</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">总计</div>
          <div>下注金币: {{ summary.sumBetAmount ?? '-' }}</div>
          <div>获得奖励: {{ summary.sumAward ?? '-' }}</div>
          <div>参与人数: {{ summary.sumActiveCount ?? '-' }}</div>
        </div>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.summary {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  margin-top: 16px;
}

.summary-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.summary-title {
  color: #0f172a;
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
