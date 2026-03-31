<script lang="ts" setup>
import {
  reactive,
  ref } from 'vue';
import { Page } from '@vben/common-ui';
import type { Dayjs } from 'dayjs';

import {
  contributionBalanceTable,
  roomTimeContributionBalanceTable,
  } from '#/api/legacy/room';

import {
  Button,
  Card,
  DatePicker,
  Pagination,
  Select,
  Space,
  Table,
  TabPane,
  Tabs
} from 'antdv-next';

import RoomDetailsDrawer from '../app-system/components/room-details-drawer.vue';
import RoomSearchInput from './components/room-search-input.vue';

defineOptions({ name: 'OperateContributionBalance' });

const activeTab = ref('total');
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const roomDetailsOpen = ref(false);
const activeRoomId = ref('');
const timeDate = ref<Dayjs | null>(null);

const totalQuery = reactive({
  cursor: 1,
  limit: 20,
  roomId: '',
});

const timeQuery = reactive({
  cursor: 1,
  limit: 20,
  roomId: '',
  type: 'DAILY',
  dateNumber: '',
});

const totalColumns = [
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 260 },
  { dataIndex: 'totalQuantity', key: 'totalQuantity', title: '总额数量', width: 140 },
  {
    dataIndex: 'withdrawQuantity',
    key: 'withdrawQuantity',
    title: '提取数量',
    width: 140,
  },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const timeColumns = [
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 260 },
  { dataIndex: 'totalQuantity', key: 'totalQuantity', title: '数量', width: 140 },
  { dataIndex: 'dateNumber', key: 'dateNumber', title: '时间', width: 180 },
];

function currentQuery() {
  return activeTab.value === 'total' ? totalQuery : timeQuery;
}

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = String(roomId);
  roomDetailsOpen.value = true;
}

async function loadData(reset = false) {
  const query = currentQuery();
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result =
      activeTab.value === 'total'
        ? await contributionBalanceTable({ ...totalQuery })
        : await roomTimeContributionBalanceTable({ ...timeQuery });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  const query = currentQuery();
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function handleRoomSuccess(item: Record<string, any>) {
  currentQuery().roomId = String(item?.id || '');
}

function handleRoomFail() {
  currentQuery().roomId = '';
}

function handleTabChange() {
  total.value = 0;
  list.value = [];
  void loadData(true);
}

function handleTypeChange() {
  timeDate.value = null;
  timeQuery.dateNumber = '';
  handleSearch();
}

function handleTimeDateChange(value: Dayjs | Dayjs[] | null) {
  if (!value || Array.isArray(value)) {
    timeQuery.dateNumber = '';
    return;
  }
  timeQuery.dateNumber = value.format('YYYYMMDD');
}

loadData(true);
</script>

<template>
  <Page title="房间贡献余额">
    <Card>
      <Tabs v-model:activeKey="activeTab" @change="handleTabChange">
        <TabPane key="total" tab="总预览" />
        <TabPane key="time" tab="时间段预览" />
      </Tabs>

      <div class="toolbar">
        <Space wrap>
          <RoomSearchInput
            placeholder="请输入房间ID"
            @fail="handleRoomFail"
            @success="handleRoomSuccess"
          />
          <template v-if="activeTab === 'time'">
            <Select option-label-prop="label"
              v-model:value="timeQuery.type"
              style="width: 120px"
              @change="handleTypeChange"
            
              :options="[{ label: '天', value: 'DAILY' as any }, { label: '周', value: 'WEEKLY' as any }]"
            />
            <DatePicker
              v-model:value="timeDate"
              :picker="timeQuery.type === 'WEEKLY' ? 'week' : 'date'"
              placeholder="选择时间"
              @change="handleTimeDateChange"
            />
          </template>
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
        </Space>
      </div>

      <Table
        :columns="activeTab === 'total' ? totalColumns : timeColumns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roomProfile'">
            <div v-if="record.roomProfile" class="room-cell">
              <img
                :src="record.roomProfile.roomCover || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=R'"
                alt=""
                class="room-cover"
              >
              <div class="room-copy">
                <Button
                  size="small"
                  type="link"
                  @click="openRoomDetails(record.roomProfile?.id)"
                >
                  {{ record.roomProfile?.roomName || '-' }}
                </Button>
                <div class="room-meta">
                  {{ record.roomProfile?.roomAccount || record.roomProfile?.id || '-' }}
                </div>
              </div>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ record.createTime || '-' }}
          </template>
        </template>
      </Table>

      <div class="pagination">
        <Pagination
          :current="currentQuery().cursor"
          :page-size="currentQuery().limit"
          :total="total"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="activeRoomId"
      @close="roomDetailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.room-cell {
  align-items: center;
  display: flex;
  gap: 12px;
}

.room-cover {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.room-copy {
  min-width: 0;
}

.room-meta {
  color: #64748b;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
