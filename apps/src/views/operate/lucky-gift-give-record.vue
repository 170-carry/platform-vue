<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import type { Dayjs } from 'dayjs';

import {
  countLuckyGiftGame,
  pageLuckyGiftGameRecord,
  } from '#/api/legacy/game-lucky-gift';
import { listByTab } from '#/api/legacy/gift';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Image,
  Pagination,
  Select,
  Space,
  Table,
  Tag
} from 'antdv-next';

import RoomDetailsDrawer from '../app-system/components/room-details-drawer.vue';
import AccountInput from '#/components/account-input.vue';
import UserProfileLink from './components/user-profile-link.vue';
import RoomSearchInput from './components/room-search-input.vue';

defineOptions({ name: 'OperateLuckyGiftGiveRecord' });

const { RangePicker } = DatePicker;

const QUANTITY_OPTIONS = ['1', '7', '77', '177', '777'];

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const countLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const countInfo = ref<Record<string, any>>({});
const giftOptions = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[Dayjs, Dayjs] | null>(null);
const roomDetailsOpen = ref(false);
const activeRoomId = ref('');

const query = reactive({
  cursor: 1,
  giftId: undefined as any,
  limit: 20,
  quantity: undefined as any,
  roomId: '',
  startTime: '',
  endTime: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 100 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 240 },
  { dataIndex: 'giftId', key: 'giftId', title: '礼物ID', width: 100 },
  { dataIndex: 'giftCover', key: 'giftCover', title: '封面', width: 80 },
  { dataIndex: 'payAmount', key: 'payAmount', title: '支出金币', width: 120 },
  { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 100 },
  { dataIndex: 'giftCombos', key: 'giftCombos', title: '连击礼物次数', width: 120 },
  { dataIndex: 'giftInc', key: 'giftInc', title: '累计送礼次数', width: 120 },
  { dataIndex: 'multiple', key: 'multiple', title: '出奖倍数', width: 100 },
  { dataIndex: 'awardAmount', key: 'awardAmount', title: '出奖金币数', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
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

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadGiftOptions();
  },
  { immediate: true },
);

async function loadGiftOptions() {
  giftOptions.value = await listByTab(query.sysOrigin, 'LUCKY_GIFT');
}

async function loadCount() {
  countLoading.value = true;
  try {
    countInfo.value = await countLuckyGiftGame({ ...query });
  } finally {
    countLoading.value = false;
  }
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageLuckyGiftGameRecord({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void Promise.all([loadData(true), loadCount()]);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function handleRoomSuccess(item: Record<string, any>) {
  query.roomId = String(item?.id || '');
}

function handleRoomFail() {
  query.roomId = '';
}

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = String(roomId);
  roomDetailsOpen.value = true;
}

loadData(true);
loadCount();
</script>

<template>
  <Page title="幸运礼物送礼记录">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px" @change="handleSearch"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label"
            v-model:value="query.quantity"
            allow-clear
            placeholder="数量"
            style="width: 120px"
            @change="handleSearch"
          
            :options="QUANTITY_OPTIONS.map((item) => ({ label: `${item}`, value: item as any }))"
          />
          <Select option-label-prop="label"
            v-model:value="query.giftId"
            allow-clear
            placeholder="礼物"
            style="width: 220px"
          
            :options="giftOptions.map((item) => ({ label: `${item.giftName || item.content || item.id}`, value: item.id as any }))"
          />
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 260px"
          />
          <RoomSearchInput
            :sys-origin="query.sysOrigin"
            @fail="handleRoomFail"
            @success="handleRoomSuccess"
          />
          <RangePicker v-model:value="rangeDate" />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
        </Space>
      </div>

      <div class="summary-row">
        <Card size="small" title="筛选结果汇总">
          <Space wrap>
            <Tag>参加人数: {{ countInfo.userCount || 0 }}</Tag>
            <Tag>用户支出糖果数: {{ countInfo.userExpendCount || 0 }}</Tag>
            <Tag>出奖糖果数: {{ countInfo.awardCount || 0 }}</Tag>
          </Space>
        </Card>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading || countLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'roomProfile'">
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
          <template v-else-if="column.key === 'giftCover'">
            <Image :preview="false" :src="record.giftCover" width="44px" />
          </template>
          <template v-else-if="column.key === 'giftInc'">
            {{
              record.userGiftIncCount
                ? `${record.userGiftIncCount}/${record.sysGiftIncCount || 0}`
                : (record.sysGiftIncCount || 0)
            }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div class="pagination">
        <Pagination
          :current="query.cursor"
          :page-size="query.limit"
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
.toolbar,
.summary-row {
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
