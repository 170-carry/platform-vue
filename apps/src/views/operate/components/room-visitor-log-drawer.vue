<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { listRecentVisitors } from '#/api/legacy/room';
import { formatDate } from '#/views/system/shared';

import { Button, Drawer, Space, Table } from 'antdv-next';

import AccountInput from '#/components/account-input.vue';

import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateRoomVisitorLogDrawer' });

const props = defineProps<{
  open: boolean;
  roomId: number | string;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  limit: 20,
  roomId: '',
  userId: '',
});

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 260 },
  { dataIndex: 'createTime', key: 'createTime', title: '浏览时间', width: 180 },
];

watch(
  () => [props.open, props.roomId],
  ([open, roomId]) => {
    if (!open || !roomId) {
      return;
    }
    query.roomId = String(roomId);
    query.userId = '';
    void loadData();
  },
  { immediate: true },
);

async function loadData() {
  if (!query.roomId) {
    return;
  }
  loading.value = true;
  try {
    list.value = (await listRecentVisitors({ ...query })) || [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="房间访客记录"
    width="900"
    @close="emit('close')"
  >
    <Space class="toolbar" wrap>
      <AccountInput
        v-model:value="query.userId"
        :sys-origin="sysOrigin"
        placeholder="用户ID"
        style="width: 300px"
      />
      <Button :loading="loading" type="primary" @click="loadData">
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
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
      </template>
    </Table>
  </Drawer>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
