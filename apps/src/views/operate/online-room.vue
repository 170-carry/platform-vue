<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { onlineRoom } from '#/api/legacy/room';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Empty,
  Space,
  Tag,
} from 'antdv-next';

import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';
import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import OnlineRoomMembersDrawer from './components/online-room-members-drawer.vue';
import RoomSearchInput from './components/room-search-input.vue';
import SystemRegionSelect from './components/system-region-select.vue';

defineOptions({ name: 'OperateOnlineRoom' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const regionSelectRef = ref<InstanceType<typeof SystemRegionSelect> | null>(null);

const loading = ref(false);
const searchLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const membersOpen = ref(false);
const accountHandleOpen = ref(false);
const roomDetailsOpen = ref(false);
const activeSessionId = ref<number | string>('');
const activeUserId = ref<number | string>('');
const activeRoomId = ref<number | string>('');

const query = reactive<Record<string, any>>({
  limit: 200,
  region: '',
  roomAccount: '',
  roomId: '',
  sysOrigin: sysOriginOptions.value[0]?.value || '',
});

async function loadData() {
  loading.value = true;
  try {
    list.value = (await onlineRoom({ ...query })) || [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData();
}

function changeSysOrigin() {
  regionSelectRef.value?.clearValue();
  query.region = '';
  query.roomId = '';
  query.roomAccount = '';
  void loadData();
}

function loadSearchRoom() {
  searchLoading.value = true;
}

function searchRoomSuccess(result: Record<string, any>) {
  searchLoading.value = false;
  query.roomId = String(result?.id || '');
  query.roomAccount = '';
}

function searchRoomFail() {
  query.roomId = '';
  query.roomAccount = '';
  searchLoading.value = false;
}

function openMembers(record: Record<string, any>) {
  activeSessionId.value = record.profile?.id || '';
  membersOpen.value = true;
}

function openAccountHandle(record: Record<string, any>) {
  activeUserId.value = record.profile?.userId || '';
  accountHandleOpen.value = true;
}

function openRoomDetails(record: Record<string, any>) {
  activeRoomId.value = record.profile?.id || '';
  roomDetailsOpen.value = true;
}

loadData();
</script>

<template>
  <Page title="在线房间">
    <Card>
      <div class="toolbar">
        <select
          v-model="query.sysOrigin"
          class="plain-select"
          @change="changeSysOrigin"
        >
          <option
            v-for="item in sysOriginOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </option>
        </select>

        <div v-if="query.sysOrigin === 'ASWAT'" class="region-select">
          <SystemRegionSelect
            ref="regionSelectRef"
            v-model:value="query.region"
            placeholder="请选择区域"
            :sys-origin="query.sysOrigin"
          />
        </div>

        <div class="room-search">
          <RoomSearchInput
            :key="query.sysOrigin"
            :sys-origin="query.sysOrigin"
            placeholder="房间ID"
            @fail="searchRoomFail"
            @load="loadSearchRoom"
            @success="searchRoomSuccess"
          />
        </div>
        <Button :loading="searchLoading || loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <div class="room-grid">
        <Card
          v-for="item in list"
          :key="item.profile?.id || item.id"
          :loading="loading"
          class="room-card"
        >
          <div class="room-head">
            <div class="cover-row">
              <img
                :src="item.profile?.roomCover || 'https://dummyimage.com/80x80/e2e8f0/64748b&text=Room'"
                alt=""
                class="room-cover"
              >
              <Space wrap>
                <Tag>{{ item.activeRoom?.region || '-' }}</Tag>
                <Tag v-if="item.activeRoom?.hot" color="red">热门</Tag>
              </Space>
            </div>
            <div class="card-actions">
              <Button size="small" type="link" @click="openMembers(item)">在线成员</Button>
              <Button size="small" type="link" @click="openAccountHandle(item)">账号处理</Button>
              <Button size="small" type="link" @click="openRoomDetails(item)">房间详情</Button>
            </div>
          </div>

          <div class="room-body">
            <div class="ellipsis">名称：{{ item.profile?.roomName || '-' }}</div>
            <div class="ellipsis">ID：{{ item.profile?.id || '-' }}</div>
            <div class="ellipsis">账号：{{ item.profile?.roomAccount || '-' }}</div>
            <div class="ellipsis">
              密码：{{ item.profile?.setting?.password || '无' }}
            </div>
            <div class="ellipsis">公告：{{ item.profile?.roomDesc || '-' }}</div>
            <div class="ellipsis">
              国家：{{ item.activeRoom?.countryName || item.activeRoom?.countryCode || '-' }}
            </div>
            <div class="ellipsis">
              家族：
              {{ item.activeRoom?.familyProfile
                ? `[${item.activeRoom.familyProfile.familyAccount}] ${item.activeRoom.familyProfile.familyName || '-'}`
                : '无' }}
            </div>
          </div>
        </Card>
      </div>

      <Empty v-if="!loading && list.length === 0" description="暂无在线房间" />
    </Card>

    <OnlineRoomMembersDrawer
      :open="membersOpen"
      :session-id="activeSessionId"
      @close="membersOpen = false"
    />

    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeUserId"
      @close="accountHandleOpen = false"
      @success="accountHandleOpen = false"
    />

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="activeRoomId"
      @close="roomDetailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.plain-input,
.plain-select {
  border: 1px solid var(--ant-color-border);
  border-radius: 6px;
  min-width: 180px;
  padding: 4px 11px;
}

.room-search {
  width: 360px;
}

.region-select {
  min-width: 180px;
  width: 180px;
}

.room-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.room-card :deep(.ant-card-body) {
  display: grid;
  gap: 12px;
}

.room-head {
  display: grid;
  gap: 10px;
}

.cover-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.room-cover {
  border-radius: 12px;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.room-body {
  color: rgb(71 85 105);
  display: grid;
  gap: 8px;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
