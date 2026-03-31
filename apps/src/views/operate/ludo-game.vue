<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  dismissLudoGame,
  flowLudoGame,
  } from '#/api/legacy/game';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Modal,
  Select,
  Space,
  Table,
  message
} from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import RoomSearchInput from './components/room-search-input.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateLudoGame' });

const GAME_DATA_TYPES = [
  { label: '运行', value: 'RUN' },
  { label: '历史', value: 'HISTORY' },
];

const GAME_STATUS_NAME: Record<string, string> = {
  END: '已结束',
  PROGRESS: '进行中',
  WAIT: '等待开始',
};

const GAME_EVENT_NAME: Record<string, string> = {
  BACK_DISBAND: '后台解散',
  DISCONNECTED_DISBAND: '游戏已开始,全部掉线后,解散',
  NONE: '无',
  NORMAL_SETTLEMENT: '正常结算',
  OTHER__DISBAND: '其他,不在预计状态内',
  TIMEOUT_DISBAND: '游戏未开始超时,解散',
};

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const searchLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const roomDetailsOpen = ref(false);
const roomId = ref<number | string>('');
const playersOpen = ref(false);
const selectedRow = ref<Record<string, any>>({});

const query = reactive<Record<string, any>>({
  lastId: '',
  limit: 20,
  roomId: '',
  sysOrigin: '',
  type: 'RUN',
});

const columns = computed<any[]>(() => {
  const base: any[] = [
    { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
    { dataIndex: 'roomInfo', key: 'roomInfo', title: '房间信息', width: 220 },
    { dataIndex: 'status', key: 'status', title: '状态', width: 220 },
    { dataIndex: 'amount', key: 'amount', title: '金额(加入/奖金)', width: 150 },
    { dataIndex: 'detail', key: 'detail', title: '情况', width: 220 },
    { dataIndex: 'victoryColor', key: 'victoryColor', title: '胜利方', width: 120 },
    { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  ];
  if (query.type === 'HISTORY') {
    base.push({ dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 });
  }
  base.push({ dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const });
  return base;
});

const selectedPlayers = computed(() =>
  Array.isArray(selectedRow.value.players) ? selectedRow.value.players : [],
);

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function getRowKey(record: Record<string, any>) {
  return String(record.history?.id || record.id || '');
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    list.value = [];
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
    notData.value = false;
  }
  loading.value = true;
  try {
    const result = await flowLudoGame({ ...query });
    const current = result || [];
    if (current.length > 0) {
      list.value = [...list.value, ...current];
      query.lastId = String(
        list.value[list.value.length - 1]?.history?.id || '',
      );
      return;
    }
    notData.value = true;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handleSysOriginChange() {
  query.roomId = '';
  searchLoading.value = false;
  handleSearch();
}

function handleTypeChange() {
  handleSearch();
}

function loadSearchRoom() {
  searchLoading.value = true;
}

function searchRoomSuccess(result: Record<string, any>) {
  searchLoading.value = false;
  if (!result) {
    return;
  }
  query.roomId = result.id;
}

function searchRoomFail() {
  query.roomId = '';
  searchLoading.value = false;
}

function openRoomDetails(record: Record<string, any>) {
  roomId.value = record.roomProfile?.id || record.history?.roomId || '';
  roomDetailsOpen.value = true;
}

async function handleDismiss(record: Record<string, any>) {
  if (record.history?.gameStatus === 'END') {
    return;
  }
  Modal.confirm({
    async onOk() {
      await dismissLudoGame(record.history?.roomId);
      message.success('操作成功');
      record.history.gameStatus = 'END';
      record.history.gameStatusEvent = 'BACK_DISBAND';
      list.value = list.value.filter(
        (item) => item.history?.id !== record.history?.id,
      );
    },
    title: '后台解散游戏将没有胜利者, 是否确定解散?',
  });
}

function handleLoadMore() {
  if (notData.value || loading.value) {
    return;
  }
  void loadData();
}

function openPlayers(record: Record<string, any>) {
  selectedRow.value = record;
  playersOpen.value = true;
}
</script>

<template>
  <Page title="Ludo飞行棋">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSysOriginChange"
            :options="sysOriginOptions"
          />
          <Select
            option-label-prop="label"
            v-model:value="query.type"
            style="width: 120px"
            @change="handleTypeChange"
          
            :options="GAME_DATA_TYPES.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <div class="room-field">
            <RoomSearchInput
              :key="query.sysOrigin"
              :sys-origin="query.sysOrigin"
              @fail="searchRoomFail"
              @load="loadSearchRoom"
              @success="searchRoomSuccess"
            />
          </div>
          <Button :loading="searchLoading || loading" type="primary" @click="handleSearch">
            搜索
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-key="getRowKey"
        :scroll="{ x: 1540 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            {{ record.history?.sysOrigin || '-' }}
          </template>
          <template v-else-if="column.key === 'roomInfo'">
            <div v-if="record.roomProfile" class="room-info">
              <Image
                :preview="false"
                :src="record.roomProfile.roomCover || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=R'"
                class="room-cover"
              />
              <div class="room-copy">
                <Button size="small" type="link" @click="openRoomDetails(record)">
                  {{ record.roomProfile.roomName || '-' }}
                </Button>
                <div class="room-meta">房间ID {{ record.roomProfile.id || '-' }}</div>
              </div>
            </div>
            <div v-else>{{ record.history?.roomId || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            {{ GAME_STATUS_NAME[record.history?.gameStatus] || '-' }}、
            {{ GAME_EVENT_NAME[record.history?.gameStatusEvent] || '-' }}
          </template>
          <template v-else-if="column.key === 'amount'">
            {{ record.history?.joinAmount || '-' }}/{{ record.history?.bonus || '-' }}
          </template>
          <template v-else-if="column.key === 'detail'">
            <Button size="small" type="link" @click="openPlayers(record)">
              玩家:{{ record.history?.playerSize || '-' }}
            </Button>
            、锁定座位:{{ record.history?.lockSeat || '-' }}
          </template>
          <template v-else-if="column.key === 'victoryColor'">
            <div
              class="victory-box"
              :style="{ background: record.history?.victoryColor || 'black' }"
            />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.history?.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.history?.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              :disabled="record.history?.gameStatus === 'END'"
              size="small"
              type="link"
              @click="handleDismiss(record)"
            >
              解散
            </Button>
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <span v-if="notData">已经加载全部</span>
        <Button
          v-else
          :loading="loading"
          size="small"
          type="link"
          @click="handleLoadMore"
        >
          点击加载更多
        </Button>
      </div>
    </Card>

    <Modal
      :open="playersOpen"
      title="游戏玩家"
      width="1080px"
      @cancel="playersOpen = false"
    >
      <Table
        :columns="[
          { dataIndex: 'user', key: 'user', title: '玩家', width: 280 },
          { dataIndex: 'checkerboardColor', key: 'checkerboardColor', title: '棋盘', width: 120 },
          { dataIndex: 'rankingIndex', key: 'rankingIndex', title: '名次', width: 100 },
          { dataIndex: 'initiator', key: 'initiator', title: '房主', width: 100 },
          { dataIndex: 'consumeJoinAmount', key: 'consumeJoinAmount', title: '消费', width: 120 },
          { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
        ]"
        :data-source="selectedPlayers"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="player-user">
              <UserProfileLink :profile="record.userProfile" />
              <div class="player-meta">
                {{ record.userProfile?.accountStatusName || '-' }}
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'checkerboardColor'">
            <div
              class="victory-box"
              :style="{ background: record.players?.checkerboardColor || 'black' }"
            />
          </template>
          <template v-else-if="column.key === 'rankingIndex'">
            {{ record.players?.rankingIndex || '-' }}
          </template>
          <template v-else-if="column.key === 'initiator'">
            {{ record.players?.initiator ? '是' : '否' }}
          </template>
          <template v-else-if="column.key === 'consumeJoinAmount'">
            {{ record.players?.consumeJoinAmount || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.players?.createTime) }}
          </template>
        </template>
      </Table>

      <template #footer>
        <Button @click="playersOpen = false">关闭</Button>
      </template>
    </Modal>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="roomId"
      @close="roomDetailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.room-field {
  width: 360px;
}

.room-info {
  align-items: center;
  display: flex;
  gap: 10px;
}

.room-cover {
  border-radius: 999px;
  height: 44px;
  overflow: hidden;
  width: 44px;
}

.room-copy {
  min-width: 0;
}

.room-meta {
  color: #64748b;
  font-size: 12px;
}

.victory-box {
  border-radius: 6px;
  height: 28px;
  margin: 0 auto;
  width: 56px;
}

.load-more {
  padding-top: 16px;
  text-align: center;
}

.player-user {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.player-meta {
  color: #64748b;
  font-size: 12px;
}
</style>
