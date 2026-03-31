<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  exportFreightWaters,
  pageFreightRunningWater,
  } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Pagination,
  Select,
  Table,
  message
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';
import { FREIGHT_BALANCE_ORIGIN_OPTIONS } from './constants';

defineOptions({ name: 'OperateUserFreightInfoList' });

const props = withDefaults(
  defineProps<{
    queryBackOperation?: boolean;
  }>(),
  {
    queryBackOperation: false,
  },
);

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const exporting = ref(false);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive<Record<string, any>>({
  acceptUserId: '',
  cursor: 1,
  endTime: '',
  limit: 20,
  origin: undefined,
  queryBackOperationUser: false,
  startTime: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 240 },
  { dataIndex: 'acceptUser', key: 'acceptUser', title: '接收人', width: 240 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
  { dataIndex: 'originName', key: 'originName', title: '来源', width: 120 },
  { dataIndex: 'remark', key: 'remark', title: '备注', width: 200 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

watch(
  () => props.queryBackOperation,
  (value) => {
    query.queryBackOperationUser = value === true;
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
    const result = await pageFreightRunningWater({ ...query });
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

async function handleExport() {
  if (!query.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  exporting.value = true;
  try {
    await exportFreightWaters({ ...query });
    message.success('导出成功');
  } finally {
    exporting.value = false;
  }
}

void loadData(true);
</script>

<template>
  <Page v-if="!queryBackOperation" title="货运代理流水">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"
          :options="sysOriginOptions"
        />
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="发送用户"
          style="width: 240px"
        />
        <AccountInput
          v-model:value="query.acceptUserId"
          :sys-origin="query.sysOrigin"
          placeholder="接收用户"
          style="width: 240px"
        />
        <Select
          option-label-prop="label"
          v-model:value="query.origin"
          allow-clear
          placeholder="来源"
          style="width: 140px"
        
          :options="FREIGHT_BALANCE_ORIGIN_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button :loading="exporting" @click="handleExport">
          导出
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userBaseInfo'">
            <UserProfileLink
              :profile="record.userBaseInfo"
              :tag-name="record.operationUserNickname"
            />
          </template>
          <template v-else-if="column.key === 'acceptUser'">
            <UserProfileLink :profile="record.acceptUser" />
          </template>
          <template v-else-if="column.key === 'type'">
            {{ Number(record.type) === 0 ? '收入' : '支出' }}
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span :class="Number(record.type) === 0 ? 'income' : 'expense'">
              {{ Number(record.type) === 0 ? '+' : '-' }}{{ record.quantity || 0 }}
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

.income {
  color: #cf1322;
}

.expense {
  color: #262626;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
