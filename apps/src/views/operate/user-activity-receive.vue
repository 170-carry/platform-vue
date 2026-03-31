<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { pageRewardReceiveRecord } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Pagination,
  Table,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateUserActivityReceive' });

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
  { dataIndex: 'userProfile', key: 'userProfile', title: '昵称', width: 260 },
  { dataIndex: 'rechargeDate', key: 'rechargeDate', title: '累计月度', width: 140 },
  { dataIndex: 'ruleDescription', key: 'ruleDescription', title: '规则描述', width: 240 },
  { dataIndex: 'activityType', key: 'activityType', title: '活动类型', width: 180 },
  { dataIndex: 'receiveCount', key: 'receiveCount', title: '领取次数', width: 120 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统平台', width: 120 },
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
    const result = await pageRewardReceiveRecord({ ...query });
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
  <Page title="用户活动领奖记录">
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
        :scroll="{ x: 1240 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'receiveCount'">
            <span class="income">+1</span>
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
