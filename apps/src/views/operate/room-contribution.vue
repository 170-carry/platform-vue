<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { pageRoomContribution } from '#/api/legacy/activity';
import UserProfileLink from '#/views/operate/components/user-profile-link.vue';

import {
  Button,
  Card,
  Image,
  Pagination,
  Table,
} from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';
import RoomSearchInput from './components/room-search-input.vue';

defineOptions({ name: 'OperateRoomContribution' });

const loading = ref(false);
const searchLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const roomDetailsOpen = ref(false);
const activeRoomId = ref<number | string>('');

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  roomId: '',
});

const columns: any[] = [
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 260 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'contributionValue', key: 'contributionValue', title: '积分', width: 120 },
  { dataIndex: 'ratio', key: 'ratio', title: '比例', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '领取金币', width: 120 },
  { dataIndex: 'dateNumber', key: 'dateNumber', title: '时间(周一至周日)', width: 180 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageRoomContribution({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
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

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  roomDetailsOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="房间支持活动">
    <Card>
      <div class="toolbar">
        <div class="account-filter">
          <RoomSearchInput
            placeholder="房间ID"
            @fail="searchRoomFail"
            @load="loadSearchRoom"
            @success="searchRoomSuccess"
          />
        </div>
        <Button :loading="searchLoading || loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roomProfile'">
            <div class="room-cell">
              <Image
                :preview="false"
                :src="record.roomProfile?.roomCover"
                class="room-cover"
              />
              <div class="room-copy">
                <Button
                  type="link"
                  @click="openRoomDetails(record.roomProfile?.id)"
                >
                  {{ record.roomProfile?.roomName || '-' }}
                </Button>
                <div class="room-sub">
                  {{ record.roomProfile?.roomAccount || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
        </template>
      </Table>

      <div v-if="total > 0" class="pager">
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
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.account-filter {
  min-width: 280px;
  width: 320px;
}

.room-cell {
  align-items: center;
  display: flex;
  gap: 12px;
}

.room-cover {
  border-radius: 10px;
  height: 50px;
  width: 50px;
}

.room-copy {
  min-width: 0;
}

.room-sub {
  color: rgb(100 116 139);
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
