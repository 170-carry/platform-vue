<script lang="ts" setup>
import {
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';

import { pageUserIntegralOriginStream } from '#/api/legacy/approval';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Pagination,
  Select,
  Table
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';
import { VIDEO_ORIGIN_OPTIONS } from './shared';

defineOptions({ name: 'OperateIntegralStream' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<null | [string, string]>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  origin: '',
  startTime: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '昵称', width: 220 },
  { dataIndex: 'title', key: 'title', title: '来源对象', width: 200 },
  { dataIndex: 'originName', key: 'originName', title: '积分来源', width: 180 },
  { dataIndex: 'quantity', key: 'quantity', title: '获得积分', width: 120 },
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
    const result = await pageUserIntegralOriginStream({ ...query });
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
  <Page title="积分收支记录">
    <Card>
      <div class="toolbar">
        <AccountInput
          v-model:value="query.userId"
          placeholder="用户ID"
          style="width: 300px"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Select option-label-prop="label"
          v-model:value="query.origin"
          allow-clear
          placeholder="积分来源"
          style="width: 180px"
        
          :options="VIDEO_ORIGIN_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <Alert
        message="注意"
        description="数据只会保留30天；"
        show-icon
        type="warning"
      />

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 980 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userBaseInfo'">
            <UserProfileLink :profile="record.userBaseInfo" />
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span :class="{ income: record.type === 0 }">
              {{ record.type === 0 ? '+' : '-' }}{{ record.quantity || 0 }}
            </span>
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

:deep(.ant-alert) {
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
