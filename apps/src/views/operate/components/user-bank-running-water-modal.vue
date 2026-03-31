<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, Drawer, Table } from 'antdv-next';

import { pageRunningWater } from '#/api/legacy/operate';
import { formatDate } from '#/views/system/shared';

import {
  getBankWaterEventName,
  getTransferDescriptionName,
} from '../shared';
import UserProfileLink from './user-profile-link.vue';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const loadMoreLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const query = ref({
  lastId: '',
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 280 },
  { dataIndex: 'typeName', key: 'typeName', title: '类型', width: 90 },
  { dataIndex: 'amount', key: 'amount', title: '数量', width: 100 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 110 },
  { dataIndex: 'event', key: 'event', title: '事件', width: 180 },
  { dataIndex: 'remark', key: 'remark', title: '备注', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(
  () => props.open,
  (value) => {
    if (!value) {
      return;
    }
    query.value.userId = String(props.row?.id || '');
    query.value.sysOrigin = String(props.row?.sysOrigin || '');
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.value.sysOrigin) {
    return;
  }
  if (reset) {
    query.value.lastId = '';
    list.value = [];
    notData.value = false;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await pageRunningWater({ ...query.value });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.value.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="用户银行账户流水"
    width="1120px"
    @close="emit('close')"
  >
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1360 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user'">
          <div class="user-group">
            <UserProfileLink :profile="record.userProfile" />
            <UserProfileLink
              v-if="record.tmpUserProfile"
              :profile="record.tmpUserProfile"
              :tag-name="getTransferDescriptionName(record.event)"
            />
          </div>
        </template>
        <template v-else-if="column.key === 'amount'">
          <span :class="record.type === 0 ? 'amount-plus' : ''">
            {{ record.type === 0 ? '+' : '-' }}{{ record.amount || 0 }}
          </span>
        </template>
        <template v-else-if="column.key === 'event'">
          {{ getBankWaterEventName(record.event) }}
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
      </template>
    </Table>

    <div v-if="list.length > 0" class="load-more">
      <span v-if="notData">已加载全部</span>
      <Button
        v-else
        :loading="loadMoreLoading"
        size="small"
        @click="loadData()"
      >
        加载更多
      </Button>
    </div>
  </Drawer>
</template>

<style scoped>
.user-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-plus {
  color: #dc2626;
}

.load-more {
  padding: 20px 0 0;
  text-align: center;
}
</style>
