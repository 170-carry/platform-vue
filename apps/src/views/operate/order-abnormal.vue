<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getOrderAbnormalCertificate,
  getOrderAbnormalPage,
  updateOrderAbnormalStatus,
  } from '#/api/legacy/operate';
import { copyText } from '#/views/operate/shared';
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

defineOptions({ name: 'OperateOrderAbnormal' });

const STATUS_OPTIONS = [
  { label: '待处理', value: 'PENDING' },
  { label: '已处理', value: 'PROCESSED' },
  { label: '忽略', value: 'IGNORE' },
];

const PLATFORM_OPTIONS = [
  { label: 'iOS', value: 'iOS' },
  { label: 'Android', value: 'Android' },
  { label: 'H5', value: 'H5' },
];

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  platform: '',
  startTime: '',
  status: 'PENDING',
  sysOrigin: '',
});

const showOperation = computed(() => query.status === 'PENDING');

const columns: any[] = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 120 },
  { dataIndex: 'platform', key: 'platform', title: '平台', width: 100 },
  { dataIndex: 'orderId', key: 'orderId', title: '订单编号', width: 240 },
  { dataIndex: 'productCode', key: 'productCode', title: '产品编号', width: 180 },
  { dataIndex: 'certificate', key: 'certificate', title: '单据', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
      if (query.sysOrigin) {
        void loadData(true);
      }
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
    const result = await getOrderAbnormalPage({ ...query });
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

async function handleCopyCertificate(record: Record<string, any>) {
  try {
    const certificate = await getOrderAbnormalCertificate(record.id);
    await copyText(certificate || '');
    message.success('单据已复制');
  } catch {
    message.error('复制失败');
  }
}

async function handleChangeStatus(record: Record<string, any>, status: string) {
  await updateOrderAbnormalStatus({
    id: record.id,
    status,
  });
  await loadData();
}
</script>

<template>
  <Page title="异常订单">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.status"
          style="width: 140px"
          @change="handleSearch"
        
          :options="STATUS_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.platform"
          allow-clear
          placeholder="平台"
          style="width: 140px"
          @change="handleSearch"
        
          :options="PLATFORM_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'orderId'">
            {{ record.originalOrderId || '-' }} / {{ record.orderId || '-' }}
          </template>
          <template v-else-if="column.key === 'certificate'">
            <Button type="link" @click="handleCopyCertificate(record)">点击复制</Button>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <div v-if="showOperation" class="action-group">
              <Button
                v-for="item in STATUS_OPTIONS.filter((status) => status.value !== record.status)"
                :key="item.value"
                size="small"
                type="link"
                @click="handleChangeStatus(record, item.value)"
              >
                {{ item.label }}
              </Button>
            </div>
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

.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
