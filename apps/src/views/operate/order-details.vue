<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getOrderAmount,
  listInAppPurchase,
  } from '#/api/legacy/operate';
import { regionConfigTable } from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag
} from 'antdv-next';

import {
  ORDER_RECEIPT_TYPE_OPTIONS,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_TAG_MAP,
  ORIGIN_PLATFORM_OPTIONS,
} from './constants';
import OrderDetailsDrawer from './components/order-details-drawer.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateOrderDetails' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);
const totalInfo = ref<Record<string, any>>({});
const notMore = ref(false);
const rangeDate = ref<[string, string] | null>(null);
const sysOrigins = ref<string[]>([]);
const detailsOpen = ref(false);
const activeOrderId = ref<number | string>('');

const query = reactive<Record<string, any>>({
  acceptUserId: '',
  countryCode: undefined,
  endTime: '',
  factoryPlatform: undefined,
  id: '',
  lastId: '',
  limit: 20,
  orderId: '',
  receiptType: undefined,
  startTime: '',
  status: undefined,
  sysOrigins: '',
  trackId: '',
});

const columns = [
  { dataIndex: 'env', key: 'env', title: '环境', width: 90 },
  { dataIndex: 'platform', key: 'platform', title: '平台渠道', width: 180 },
  { dataIndex: 'channel', key: 'channel', title: '渠道', width: 120 },
  { dataIndex: 'buyer', key: 'buyer', title: '购买人', width: 240 },
  { dataIndex: 'amountUsd', key: 'amountUsd', title: '金额(USD)', width: 120 },
  { dataIndex: 'productDescriptor', key: 'productDescriptor', title: '描述', width: 220 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
  { dataIndex: 'orderId', key: 'orderId', title: '第三方订单ID', width: 220 },
  { dataIndex: 'trackId', key: 'trackId', title: '跟踪ID', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
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

async function loadRegions() {
  regions.value = await regionConfigTable({ sysOrigin: 'LIKEI' });
}

async function loadData(reset = false) {
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
  }
  query.sysOrigins = getEffectiveSysOrigin();
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const [result, amountResult] = await Promise.all([
      listInAppPurchase({ ...query }),
      getOrderAmount({ ...query }),
    ]);
    const current = result || [];
    list.value = reset ? current : [...list.value, ...current];
    totalInfo.value = amountResult || {};
    notMore.value = current.length < Number(query.limit || 20);
    query.lastId = String(list.value.at(-1)?.details?.id || '');
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openDetails(record: Record<string, any>) {
  activeOrderId.value = record.details?.id || '';
  detailsOpen.value = true;
}

function openUserDetails(record: Record<string, any>) {
  const details = record.acceptUserProfile || record.createUserProfile;
  const userId = details?.id || details?.userId;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

void loadRegions();
void loadData(true);
</script>

<template>
  <Page title="订单详情">
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
          v-model:value="query.factoryPlatform"
          allow-clear
          placeholder="支付平台"
          style="width: 140px"
        
          :options="ORIGIN_PLATFORM_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.status"
          allow-clear
          placeholder="订单状态"
          style="width: 140px"
        
          :options="ORDER_STATUS_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.receiptType"
          allow-clear
          placeholder="订单类型"
          style="width: 140px"
        
          :options="ORDER_RECEIPT_TYPE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <AccountInput
          v-model:value="query.acceptUserId"
          :sys-origin="sysOrigins.length === 1 ? sysOrigins[0] : ''"
          placeholder="用户ID"
          style="width: 240px"
        />
        <Input v-model:value="query.id" placeholder="App订单ID" style="width: 180px" />
        <Input v-model:value="query.orderId" placeholder="第三方订单ID" style="width: 220px" />
        <Input v-model:value="query.trackId" placeholder="跟踪ID" style="width: 180px" />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Select option-label-prop="label"
          v-model:value="query.countryCode"
          allow-clear
          placeholder="地区"
          style="width: 160px"
        
          :options="regions.map((item) => ({ label: `${item.regionName}`, value: item.regionCode as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <div class="summary">
        当前查询到订单总数为:{{ totalInfo.totalOrderCount || '-' }}、订单总金额为:{{
          totalInfo.totalAmountUsd || '-'
        }}
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="details.id"
        :scroll="{ x: 1880 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'env'">
            <Tag :color="record.details?.env === 'PROD' ? 'success' : 'warning'">
              {{ record.details?.env || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'platform'">
            <Space size="small">
              <Tag>{{ record.details?.sysOrigin || '-' }}</Tag>
              <Tag>{{ record.details?.factory?.platform || '-' }}</Tag>
              <Tag>{{ record.details?.factory?.factoryCode || '-' }}</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'channel'">
            {{ record.details?.factory?.factoryChannelCode || '-' }}
          </template>
          <template v-else-if="column.key === 'buyer'">
            <div v-if="record.createNickname">
              <div>{{ record.createNickname }}</div>
              <div v-if="record.acceptUserProfile" class="attached">
                <UserProfileLink :profile="record.acceptUserProfile" />
              </div>
            </div>
            <div v-else-if="record.createUserProfile">
              <UserProfileLink :profile="record.createUserProfile" />
              <div v-if="record.acceptUserProfile" class="attached">
                <UserProfileLink :profile="record.acceptUserProfile" tag-name="朋友" />
              </div>
            </div>
            <UserProfileLink v-else :profile="record.acceptUserProfile" />
          </template>
          <template v-else-if="column.key === 'amountUsd'">
            {{ record.details?.amountUsd || '-' }}
          </template>
          <template v-else-if="column.key === 'productDescriptor'">
            {{ record.details?.productDescriptor || '-' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="ORDER_STATUS_TAG_MAP[record.details?.status || '']?.tagType || 'default'">
              {{ ORDER_STATUS_TAG_MAP[record.details?.status || '']?.label || record.details?.status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'orderId'">
            {{ record.details?.orderId || '-' }}
          </template>
          <template v-else-if="column.key === 'trackId'">
            {{ record.details?.trackId || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.details?.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openDetails(record)">
                详情
              </Button>
              <Button size="small" type="link" @click="openUserDetails(record)">
                用户
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <Button
          v-if="!notMore"
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false)"
        >
          加载更多
        </Button>
        <span v-else>已加载全部</span>
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

.summary {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  color: #ad6800;
  margin-bottom: 16px;
  padding: 10px 12px;
}

.attached {
  margin-top: 6px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
