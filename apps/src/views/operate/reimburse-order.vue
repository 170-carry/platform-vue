<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getPurchaseTable } from '#/api/legacy/operate';
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
  Tag
} from 'antdv-next';

import { ORIGIN_PLATFORM_OPTIONS } from './constants';
import OrderDetailsDrawer from './components/order-details-drawer.vue';

defineOptions({ name: 'OperateReimburseOrder' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const sysOrigins = ref<string[]>([]);
const detailsOpen = ref(false);
const activeOrderId = ref<number | string>('');

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  platform: undefined,
  startTime: '',
  status: 'REIMBURSE',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'env', key: 'env', title: '环境', width: 90 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'expandTypeName', key: 'expandTypeName', title: '事件', width: 120 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '昵称', width: 180 },
  { dataIndex: 'productDescription', key: 'productDescription', title: '描述', width: 140 },
  { dataIndex: 'platform', key: 'platform', title: '平台', width: 90 },
  { dataIndex: 'payPlatform', key: 'payPlatform', title: '支付方式', width: 120 },
  { dataIndex: 'unitPrice', key: 'unitPrice', title: '单价', width: 120 },
  { dataIndex: 'statusName', key: 'statusName', title: '状态', width: 120 },
  { dataIndex: 'trialPeriod', key: 'trialPeriod', title: '免费试用', width: 120 },
  { dataIndex: 'expiresDateMs', key: 'expiresDateMs', title: '过期时间', width: 180 },
  { dataIndex: 'purchaseDateMs', key: 'purchaseDateMs', title: '购买时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (sysOrigins.value.length === 0 && options.length > 0) {
      sysOrigins.value = [String(options[0]?.value || '')];
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

function getEffectiveSysOrigin() {
  if (sysOrigins.value.length > 0) {
    return sysOrigins.value.join(',');
  }
  return sysOriginOptions.value.map((item) => String(item.value)).join(',');
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    query.sysOrigin = getEffectiveSysOrigin();
    const result = await getPurchaseTable({ ...query });
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

function openUserDetails(record: Record<string, any>) {
  const userId = record.userBaseInfo?.id;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openDetails(record: Record<string, any>) {
  activeOrderId.value = record.orderPurchase?.id || record.id || '';
  detailsOpen.value = true;
}

void loadData(true);
</script>

<template>
  <Page title="退款记录">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="sysOrigins"
          mode="multiple"
          style="width: 260px"
          placeholder="系统"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.platform"
          allow-clear
          placeholder="来源平台"
          style="width: 140px"
        
          :options="ORIGIN_PLATFORM_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="sysOrigins.length === 1 ? sysOrigins[0] : ''"
          placeholder="用户ID"
          style="width: 240px"
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
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1860 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'env'">
            <Tag :color="record.orderPurchase?.evn === 'PROD' ? 'success' : 'warning'">
              {{ record.orderPurchase?.evn || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'sysOrigin'">
            {{ record.orderPurchase?.sysOrigin || '-' }}
          </template>
          <template v-else-if="column.key === 'userBaseInfo'">
            <Button type="link" @click="openUserDetails(record)">
              {{ record.userBaseInfo?.userNickname || '-' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'productDescription'">
            {{ record.orderPurchase?.productDescription || '-' }}
          </template>
          <template v-else-if="column.key === 'platform'">
            {{ record.orderPurchase?.platform || '-' }}
          </template>
          <template v-else-if="column.key === 'payPlatform'">
            {{ record.orderPurchase?.payPlatform || '-' }}
          </template>
          <template v-else-if="column.key === 'unitPrice'">
            {{ record.orderPurchase?.unitPrice || '-' }}
            <span v-if="record.orderPurchase?.unit">（{{ record.orderPurchase?.unit }}）</span>
          </template>
          <template v-else-if="column.key === 'statusName'">
            <Tag color="error">{{ record.statusName || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'trialPeriod'">
            {{ record.orderPurchase?.trialPeriod === true ? '是' : '否' }}
          </template>
          <template v-else-if="column.key === 'expiresDateMs'">
            {{ formatDate(record.orderPurchase?.expiresDateMs) }}
          </template>
          <template v-else-if="column.key === 'purchaseDateMs'">
            {{ formatDate(record.orderPurchase?.purchaseDateMs) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.orderPurchase?.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetails(record)">
              查看详情
            </Button>
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

    <OrderDetailsDrawer
      :open="detailsOpen"
      :order-id="activeOrderId"
      @close="detailsOpen = false"
    />
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
