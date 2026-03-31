<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import type { Dayjs } from 'dayjs';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pageSalary } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Pagination,
  Space,
  Table,
} from 'antdv-next';

import AutoSalaryDetailsDrawer from './components/auto-salary-details-drawer.vue';
import AutoSalaryRemarkDrawer from './components/auto-salary-remark-drawer.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateAutoSalaryPayRecord' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const detailsOpen = ref(false);
const remarkOpen = ref(false);
const monthValue = ref<Dayjs | null>(null);
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive({
  cursor: 1,
  dateNumber: '',
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 90 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 300 },
  { dataIndex: 'dateNumber', key: 'dateNumber', title: '年月', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 160, fixed: 'right' as const },
];

watch(monthValue, (value) => {
  query.dateNumber = value ? value.format('YYYYMM') : '';
});

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageSalary({ ...query });
    list.value = result.records || [];
    total.value = Number(result.total || 0);
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailsOpen.value = true;
}

function openRemarks(record: Record<string, any>) {
  activeRow.value = record;
  remarkOpen.value = true;
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="自动发放工资凭据">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 260px"
          />
          <DatePicker
            v-model:value="monthValue"
            picker="month"
            placeholder="选择日期"
          />
          <Button :loading="loading" type="primary" @click="loadData(true)">
            搜索
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1260 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Button size="small" type="link" @click="openDetails(record)">
                查看明细
              </Button>
              <Button size="small" type="link" @click="openRemarks(record)">
                查看备注
              </Button>
            </Space>
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
    </Card>

    <AutoSalaryDetailsDrawer
      :open="detailsOpen"
      :row="activeRow || {}"
      @close="detailsOpen = false"
    />
    <AutoSalaryRemarkDrawer
      :open="remarkOpen"
      :row="activeRow || {}"
      @close="remarkOpen = false"
    />
  </Page>
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
