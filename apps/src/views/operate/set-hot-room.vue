<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  pageSetHotRoom,
  removeSetHotRoom,
} from '#/api/legacy/system';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import RoomSearchInput from './components/room-search-input.vue';
import SetRoomFormModal from './components/set-room-form-modal.vue';

defineOptions({ name: 'OperateSetHotRoom' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const searchLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const roomDetailsOpen = ref(false);
const roomId = ref<number | string>('');
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  roomId: '',
  showcase: 1,
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'roomName', key: 'roomName', title: '房间名称', width: 220 },
  { dataIndex: 'roomCover', key: 'roomCover', title: '房间封面', width: 120 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'statusDesc', key: 'statusDesc', title: '状态', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140, fixed: 'right' as const },
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

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    list.value = [];
    total.value = 0;
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageSetHotRoom({ ...query });
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
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
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

function openCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function openUpdate(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function openRoomDetails(record: Record<string, any>) {
  roomId.value = record.roomProfile?.id || '';
  roomDetailsOpen.value = true;
}

async function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await removeSetHotRoom(record.roomId);
      message.success('删除成功');
      await loadData();
    },
    title: '确认删除吗？',
  });
}
</script>

<template>
  <Page title="热门房间">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <div class="room-field">
            <RoomSearchInput
              :sys-origin="query.sysOrigin"
              @fail="searchRoomFail"
              @load="loadSearchRoom"
              @success="searchRoomSuccess"
            />
          </div>
          <Button :loading="searchLoading || loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="openCreate">新增</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="roomId"
        :scroll="{ x: 980 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roomName'">
            <Button
              v-if="record.roomProfile?.roomName"
              size="small"
              type="link"
              @click="openRoomDetails(record)"
            >
              {{ record.roomProfile.roomName }}
            </Button>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'roomCover'">
            <Image
              :preview="false"
              :src="record.roomProfile?.roomCover || 'https://dummyimage.com/50x50/e2e8f0/64748b&text=R'"
              class="room-cover"
            />
          </template>
          <template v-else-if="column.key === 'time'">
            <div>{{ formatDate(record.startTime) }}</div>
            <div>{{ formatDate(record.expiredTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Button size="small" type="link" @click="openUpdate(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
            </Space>
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
        />
      </div>
    </Card>

    <SetRoomFormModal
      mode="hot"
      :open="formOpen"
      :row="activeRow"
      @close="formOpen = false"
      @success="
        () => {
          formOpen = false;
          void loadData();
        }
      "
    />
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

.room-cover {
  border-radius: 999px;
  height: 50px;
  overflow: hidden;
  width: 50px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
