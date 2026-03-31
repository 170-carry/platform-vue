<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { listRoomPk } from '#/api/legacy/game';
import { getAllowedSysOrigins } from '#/views/system/shared';

import { Alert, Button, Select, SelectOption, Table } from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import RoomSearchInput from './room-search-input.vue';
import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateGamePkRoomPanel' });

const PK_TYPE_OPTIONS = [
  { value: 'ONE_VS_ONE', label: '1 VS 1' },
  { value: 'ROOM_VS_ROOM', label: '房间 PK' },
  { value: 'ROOM_ONE_VS_ONE', label: '房间1 VS 1' },
];

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
  pkType: 'ONE_VS_ONE',
  recipientRoomId: '',
  recipientUserId: '',
  sponsorRoomId: '',
  sponsorUserId: '',
  sysOrigin: '',
});

const columns: any[] = [
  {
    dataIndex: 'sponsorRoomProfile',
    key: 'sponsorRoomProfile',
    title: '发起房间',
    width: 180,
  },
  {
    dataIndex: 'sponsorUserProfile',
    key: 'sponsorUserProfile',
    title: '发起人',
    width: 260,
  },
  {
    dataIndex: 'sponsorIntegral',
    key: 'sponsorIntegral',
    title: '发起方积分',
    width: 120,
  },
  {
    dataIndex: 'recipientRoomProfile',
    key: 'recipientRoomProfile',
    title: '接受房间',
    width: 180,
  },
  {
    dataIndex: 'recipientUserProfile',
    key: 'recipientUserProfile',
    title: '接受人',
    width: 260,
  },
  {
    dataIndex: 'recipientIntegral',
    key: 'recipientIntegral',
    title: '接受方积分',
    width: 120,
  },
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
    const result = await listRoomPk({ ...query });
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

function handleSponsorRoomSuccess(record?: Record<string, any>) {
  searchDisabled.value = false;
  query.sponsorRoomId = String(record?.id || '');
}

function handleSponsorRoomFail() {
  query.sponsorRoomId = '';
  searchDisabled.value = false;
}

function handleRecipientRoomSuccess(record?: Record<string, any>) {
  searchDisabled.value = false;
  query.recipientRoomId = String(record?.id || '');
}

function handleRecipientRoomFail() {
  query.recipientRoomId = '';
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
      <Select option-label-prop="label"
        v-model:value="query.pkType"
        style="width: 140px"
        @change="handleSearch"
      >
        <SelectOption
          v-for="item in PK_TYPE_OPTIONS"
          :key="item.value"
          :value="item.value"
         :label="`${item.label}`">
          {{ item.label }}
        </SelectOption>
      </Select>
      <AccountInput
        v-model:value="query.sponsorUserId"
        :sys-origin="query.sysOrigin"
        placeholder="发起人ID"
        style="width: 280px"
      />
      <RoomSearchInput
        :sys-origin="query.sysOrigin"
        placeholder="发起方房间ID"
        style="width: 320px"
        @fail="handleSponsorRoomFail"
        @load="searchDisabled = true"
        @success="handleSponsorRoomSuccess"
      />
      <AccountInput
        v-model:value="query.recipientUserId"
        :sys-origin="query.sysOrigin"
        placeholder="接受人ID"
        style="width: 280px"
      />
      <RoomSearchInput
        :sys-origin="query.sysOrigin"
        placeholder="接受方房间ID"
        style="width: 320px"
        @fail="handleRecipientRoomFail"
        @load="searchDisabled = true"
        @success="handleRecipientRoomSuccess"
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
      :scroll="{ x: 1340 }"
    >
      <template #bodyCell="{ column, record }">
        <template
          v-if="
            column.key === 'sponsorRoomProfile' ||
              column.key === 'recipientRoomProfile'
          "
        >
          <Button
            type="link"
            @click="openRoomDetails(record[column.key]?.id)"
          >
            {{ record[column.key]?.roomName || '-' }}
          </Button>
        </template>
        <template
          v-else-if="
            column.key === 'sponsorUserProfile' ||
              column.key === 'recipientUserProfile'
          "
        >
          <UserProfileLink :profile="record[column.key]" />
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
