<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { pageCpApply } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Pagination,
  Select,
  Table,
  Tag,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateCpApply' });

const STATUS_OPTIONS = [
  { value: 'WAIT', label: '等待', color: 'default' },
  { value: 'AGREE', label: '同意', color: 'success' },
  { value: 'DISMISS', label: '解散', color: 'warning' },
  { value: 'REFUSE', label: '拒绝', color: 'error' },
  { value: 'REIMBURSE', label: '退款', color: 'processing' },
];

const statusFilterOptions = STATUS_OPTIONS.map(({ label, value }) => ({
  label,
  value,
}));

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive<Record<string, any>>({
  acceptApplyUserId: '',
  cursor: 1,
  limit: 20,
  sendApplyUserId: '',
  status: '',
});

const columns: any[] = [
  {
    dataIndex: 'sendApplyUser',
    key: 'sendApplyUser',
    title: '发送用户',
    width: 280,
  },
  {
    dataIndex: 'acceptApplyUser',
    key: 'acceptApplyUser',
    title: '接收用户',
    width: 280,
  },
  {
    dataIndex: 'applyConsumeGold',
    key: 'applyConsumeGold',
    title: '金额',
    width: 120,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
];

function getStatusMeta(status?: string) {
  return (
    STATUS_OPTIONS.find((item) => item.value === status) || {
      color: 'default',
      label: status || '-',
    }
  );
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageCpApply({ ...query });
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
  <Page title="CP申请">
    <Card>
      <div class="toolbar">
        <Select option-label-prop="label"
          v-model:value="query.status"
          :options="statusFilterOptions"
          allow-clear
          placeholder="状态"
          style="width: 140px"
          @change="handleSearch"
        />
        <AccountInput
          v-model:value="query.sendApplyUserId"
          placeholder="发送用户ID"
          style="width: 300px"
        />
        <AccountInput
          v-model:value="query.acceptApplyUserId"
          placeholder="接收用户ID"
          style="width: 300px"
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
        :scroll="{ x: 1060 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sendApplyUser'">
            <UserProfileLink :profile="record.sendApplyUser" />
          </template>
          <template v-else-if="column.key === 'acceptApplyUser'">
            <UserProfileLink :profile="record.acceptApplyUser" />
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="getStatusMeta(record.status).color">
              {{ getStatusMeta(record.status).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建: {{ formatDate(record.createTime) }}</div>
            <div>修改: {{ formatDate(record.updateTime) }}</div>
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

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
