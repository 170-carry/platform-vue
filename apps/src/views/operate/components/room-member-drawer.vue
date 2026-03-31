<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { getRoomUserInfo } from '#/api/legacy/room';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Drawer,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
} from 'antdv-next';

import AccountInput from '#/components/account-input.vue';

import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateRoomMemberDrawer' });

const ROOM_ROLE_OPTIONS = [
  { label: '房主', value: 'HOMEOWNER' },
  { label: '管理员', value: 'ADMIN' },
  { label: '成员', value: 'MEMBER' },
];

const props = defineProps<{
  open: boolean;
  roomId: number | string;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  limit: 20,
  roomId: '',
  roomRole: '',
  userId: '',
});

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 260 },
  { dataIndex: 'roomRole', key: 'roomRole', title: '房间角色', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '加入时间', width: 180 },
];

watch(
  () => [props.open, props.roomId],
  ([open, roomId]) => {
    if (!open || !roomId) {
      return;
    }
    query.cursor = 1;
    query.roomId = String(roomId);
    query.userId = '';
    query.roomRole = '';
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.roomId) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getRoomUserInfo({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="房间成员详情"
    width="960"
    @close="emit('close')"
  >
    <Space class="toolbar" wrap>
      <AccountInput
        v-model:value="query.userId"
        :sys-origin="sysOrigin"
        placeholder="用户ID"
        style="width: 300px"
      />
      <Select option-label-prop="label"
        v-model:value="query.roomRole"
        allow-clear
        placeholder="角色"
        style="width: 140px"
      >
        <SelectOption
          v-for="item in ROOM_ROLE_OPTIONS"
          :key="item.value"
          :value="item.value"
         :label="`${item.label}`">
          {{ item.label }}
        </SelectOption>
      </Select>
      <Button :loading="loading" type="primary" @click="loadData(true)">
        搜索
      </Button>
    </Space>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userProfile'">
          <UserProfileLink :profile="record.userProfile" />
        </template>
        <template v-else-if="column.key === 'roomRole'">
          {{
            ROOM_ROLE_OPTIONS.find((item) => item.value === record.roomRole)?.label ||
              record.roomRole ||
              '-'
          }}
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
  </Drawer>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
