<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { listTeamPk } from '#/api/legacy/game';
import { getAllowedSysOrigins } from '#/views/system/shared';

import { Alert,
  Button,
  Table,
} from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import RoomSearchInput from './room-search-input.vue';
import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateGamePkTeamPanel' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const searchDisabled = ref(false);
const notMore = ref(false);
const roomDetailsOpen = ref(false);
const activeRoomId = ref<number | string>('');
const list = ref<Array<Record<string, any>>>([]);

const query = reactive<Record<string, any>>({
  lastId: '',
  limit: 20,
  roomId: '',
  sysOrigin: '',
});

const columns: any[] = [
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 220 },
  { dataIndex: 'msvUserProfile', key: 'msvUserProfile', title: 'MVP用户', width: 280 },
  { dataIndex: 'blueTeamScore', key: 'blueTeamScore', title: '蓝队积分', width: 120 },
  { dataIndex: 'redTeamScore', key: 'redTeamScore', title: '红队积分', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

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

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  roomDetailsOpen.value = true;
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
  }
  if (query.lastId) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listTeamPk({ ...query });
    const current = result || [];
    notMore.value = current.length <= 0;
    list.value = [...list.value, ...current];
    if (list.value.length > 0) {
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handleRoomSuccess(record?: Record<string, any>) {
  query.roomId = String(record?.id || '');
  searchDisabled.value = false;
}

function handleRoomFail() {
  query.roomId = '';
  searchDisabled.value = false;
}
</script>

<template>
  <div class="pk-panel">
    <div class="toolbar">
      <SysOriginSelect
        v-model:value="query.sysOrigin"
        style="width: 140px"
        @change="handleSearch"

        :options="sysOriginOptions"
      ></SysOriginSelect>
      <RoomSearchInput
        :sys-origin="query.sysOrigin"
        placeholder="房间ID"
        style="width: 320px"
        @fail="handleRoomFail"
        @load="searchDisabled = true"
        @success="handleRoomSuccess"
      />
      <Button
        :disabled="searchDisabled"
        :loading="loading"
        type="primary"
        @click="handleSearch"
      >
        搜索
      </Button>
    </div>

    <Alert
      :closable="false"
      class="notice"
      message="注意: 每条数据的生命周期30天, 30天后记录将会永久清理"
      type="success"
    />

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 980 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'roomProfile'">
          <Button type="link" @click="openRoomDetails(record.roomProfile?.id)">
            {{ record.roomProfile?.roomName || '-' }}
          </Button>
        </template>
        <template v-else-if="column.key === 'msvUserProfile'">
          <UserProfileLink :profile="record.msvUserProfile" />
        </template>
      </template>
    </Table>

    <div v-if="list.length > 0" class="more">
      <Button
        v-if="!notMore"
        :disabled="loading"
        :loading="loadMoreLoading"
        size="small"
        @click="loadData()"
      >
        加载更多
      </Button>
      <span v-else>已加载全部</span>
    </div>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="activeRoomId"
      @close="roomDetailsOpen = false"
    />
  </div>
</template>

<style scoped>
.pk-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.notice {
  margin-bottom: 4px;
}

.more {
  margin-top: 16px;
  text-align: center;
}
</style>
