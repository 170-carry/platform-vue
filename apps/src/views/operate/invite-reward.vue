<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { getUserInviteRewardRecord } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Pagination,
  Table,
  Tag,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateInviteRewardRecord' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<null | [string, string]>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  startTime: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 280 },
  { dataIndex: 'quantity', key: 'quantity', title: '糖果数', width: 120 },
  { dataIndex: 'origin', key: 'origin', title: '来源', width: 220 },
  { dataIndex: 'flagReceive', key: 'flagReceive', title: '状态', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getUserInviteRewardRecord({ ...query });
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

void loadData(true);
</script>

<template>
  <Page title="邀请用户奖励记录">
    <Card>
      <div class="toolbar">
        <AccountInput
          v-model:value="query.userId"
          placeholder="用户ID"
          style="width: 300px"
        />
        <DateRangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userBaseInfo'">
            <UserProfileLink :profile="record.userBaseInfo" />
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span class="income">+{{ record.quantity || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'flagReceive'">
            <Tag :color="record.flagReceive ? 'success' : 'error'">
              {{ record.flagReceive ? '已领取' : '未领取' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
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
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.income {
  color: #dc2626;
  font-weight: 600;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
