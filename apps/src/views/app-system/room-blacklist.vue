<script lang="ts" setup>
import {
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getRoomBlacklist } from '#/api/legacy/app-system';
import AccountInput from '#/components/account-input.vue';
import RoomSearchInput from '#/views/operate/components/room-search-input.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Table,
} from 'antdv-next';

import RoomDetailsDrawer from './components/room-details-drawer.vue';

defineOptions({ name: 'AppSystemRoomBlacklist' });

const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const searchLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notData = ref(false);
const loadMoreLoading = ref(false);
const rangeDate = ref<[string, string] | null>(null);
const roomDrawerOpen = ref(false);
const activeRoomId = ref<number | string>('');

const query = reactive({
  createUserId: '',
  endTime: '',
  lastId: '',
  roomId: '',
  size: 20,
  startTime: '',
  sysOrigin: sysOriginOptions[0]?.value ?? '',
  userId: '',
});

const columns = [
  { dataIndex: 'createUser', key: 'createUser', title: '操作用户', width: 220 },
  { dataIndex: 'beUser', key: 'beUser', title: '被拉黑用户', width: 220 },
  { dataIndex: 'room', key: 'room', title: '房间', width: 260 },
  { dataIndex: 'expiredTime', key: 'expiredTime', title: '过期时间', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
  }
  loading.value = true;
  try {
    const result = await getRoomBlacklist({ ...query });
    const currentList = result || [];
    notData.value = currentList.length <= 0;
    if (currentList.length > 0) {
      list.value = [...list.value, ...currentList];
      query.lastId = String(currentList[currentList.length - 1]?.timingId || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSysOriginChange() {
  query.roomId = '';
  searchLoading.value = false;
  void loadData(true);
}

function loadSearchRoom() {
  searchLoading.value = true;
}

function searchRoomSuccess(result: Record<string, any>) {
  searchLoading.value = false;
  query.roomId = String(result?.id || '');
}

function searchRoomFail() {
  query.roomId = '';
  searchLoading.value = false;
}

function openRoomDetails(record: Record<string, any>) {
  activeRoomId.value = record.roomId || record.roomProfile?.id || '';
  roomDrawerOpen.value = true;
}

function getUserAvatar(record: Record<string, any>) {
  return record.userAvatar || record.avatar || '';
}

loadData(true);
</script>

<template>
  <Page title="房间黑名单">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSysOriginChange"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="被拉黑用户ID" :label-width="104">
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="被拉黑用户ID"
            style="width: 180px"
          />
        </InlineFilterField>
        <InlineFilterField label="操作用户ID" :label-width="96">
          <AccountInput
            v-model:value="query.createUserId"
            :sys-origin="query.sysOrigin"
            placeholder="操作用户ID"
            style="width: 180px"
          />
        </InlineFilterField>
        <InlineFilterField label="房间ID" :control-width="360">
          <RoomSearchInput
            :key="query.sysOrigin"
            :sys-origin="query.sysOrigin"
            placeholder="房间ID"
            @fail="searchRoomFail"
            @load="loadSearchRoom"
            @success="searchRoomSuccess"
          />
        </InlineFilterField>
        <InlineFilterField label="时间范围" :control-width="360">
          <DateRangePicker
            v-model:value="rangeDate"
            show-time
            value-format="x"
          />
        </InlineFilterField>
        <Button :loading="loading || searchLoading" type="primary" @click="loadData(true)">
          搜索
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="timingId"
        :scroll="{ x: 1040 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createUser'">
            <div class="user-card">
              <img
                :src="getUserAvatar(record.userProfile || {}) || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div>
                <div class="user-name">{{ record.userProfile?.userNickname || '-' }}</div>
                <div class="user-sub">
                  ID {{ record.userProfile?.id || record.createUserId || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'beUser'">
            <div class="user-card">
              <img
                :src="getUserAvatar(record.beUserProfile || {}) || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div>
                <div class="user-name">{{ record.beUserProfile?.userNickname || '-' }}</div>
                <div class="user-sub">
                  ID {{ record.beUserProfile?.id || record.userId || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'room'">
            <button class="room-card" type="button" @click="openRoomDetails(record)">
              <img
                :src="record.roomProfile?.roomCover || 'https://dummyimage.com/52x52/e2e8f0/64748b&text=R'"
                alt=""
                class="room-avatar"
              >
              <div>
                <div class="room-name">{{ record.roomProfile?.roomName || '-' }}</div>
                <div class="user-sub">房间ID {{ record.roomId || '-' }}</div>
              </div>
            </button>
          </template>
          <template v-else-if="column.key === 'expiredTime'">
            {{ formatDate(record.expiredTime) }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadMoreLoading = true; loadData()"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <RoomDetailsDrawer
      :open="roomDrawerOpen"
      :room-id="activeRoomId"
      @close="roomDrawerOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-card,
.room-card {
  align-items: center;
  display: flex;
  gap: 12px;
}

.room-card {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.user-avatar,
.room-avatar {
  border-radius: 14px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.room-avatar {
  border-radius: 16px;
  height: 52px;
  width: 52px;
}

.user-name,
.room-name {
  color: rgb(15 23 42);
  font-weight: 600;
}

.user-sub {
  color: rgb(100 116 139);
  font-size: 12px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
