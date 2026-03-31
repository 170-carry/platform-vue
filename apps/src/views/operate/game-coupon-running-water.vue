<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRoute,
  useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getGameCouponRunningWaterDetailsTable,
  originList,
  } from '#/api/legacy/game-coupon';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Pagination,
  Select,
  Table
} from 'antdv-next';

import {
  CANDY_PURCHASING_TYPE_OPTIONS,
  ORIGIN_PLATFORM_OPTIONS,
} from './constants';

defineOptions({ name: 'OperateGameCouponRunningWater' });

const router = useRouter();
const route = useRoute();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const originKeyword = ref('');
const originOptionsRaw = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const sysOrigins = ref<string[]>([]);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  origin: '',
  platform: undefined,
  startTime: '',
  sysOrigin: '',
  type: undefined,
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'couponNumber', key: 'couponNumber', title: '游戏券数量', width: 120 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '昵称', width: 220 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 220 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 100 },
  { dataIndex: 'originName', key: 'originName', title: '来源', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const originOptions = computed(() => {
  const keyword = originKeyword.value.trim().toLowerCase();
  const result = keyword
    ? originOptionsRaw.value.filter(
        (item) =>
          String(item.value || '')
            .toLowerCase()
            .includes(keyword) ||
          String(item.name || '')
            .toLowerCase()
            .includes(keyword),
      )
    : originOptionsRaw.value;

  return result.map((item) => ({
    label: `${item.name || '-'} / ${item.value || '-'}`,
    value: item.value,
  }));
});

watch(
  sysOriginOptions,
  (options) => {
    if (sysOrigins.value.length === 0 && options.length > 0) {
      const querySysOrigin = String(route.query.sysOrigin || '').trim();
      if (querySysOrigin) {
        sysOrigins.value = querySysOrigin.split(',').filter(Boolean);
        return;
      }
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

function normalizeOriginValue() {
  if (!query.origin) {
    return;
  }
  const hit = originOptionsRaw.value.find(
    (item) =>
      String(item.value || '')
        .toLowerCase()
        .includes(String(query.origin).toLowerCase()) ||
      String(item.name || '')
        .toLowerCase()
        .includes(String(query.origin).toLowerCase()),
  );
  if (hit) {
    query.origin = hit.value;
  }
}

async function loadOriginOptions() {
  originOptionsRaw.value = await originList();
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    normalizeOriginValue();
    query.sysOrigin = getEffectiveSysOrigin();
    const result = await getGameCouponRunningWaterDetailsTable({ ...query });
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

if (route.query.userId) {
  query.userId = String(route.query.userId);
}

if (route.query.origin) {
  query.origin = String(route.query.origin);
  originKeyword.value = String(route.query.origin);
}

void loadOriginOptions();
void loadData(true);
</script>

<template>
  <Page title="游戏券收支记录">
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
          placeholder="平台"
          style="width: 120px"
        
          :options="ORIGIN_PLATFORM_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.type"
          allow-clear
          placeholder="类型"
          style="width: 120px"
        
          :options="CANDY_PURCHASING_TYPE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <AutoComplete
          v-model:value="query.origin"
          :options="originOptions"
          allow-clear
          placeholder="请输入或选择内容"
          style="width: 260px"
          @search="originKeyword = $event"
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
        :scroll="{ x: 1180 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ Number(record.type) === 0 ? '收入' : '支出' }}
          </template>
          <template v-else-if="column.key === 'couponNumber'">
            <span :class="Number(record.type) === 0 ? 'income' : 'expense'">
              {{ Number(record.type) === 0 ? '+' : '-' }}{{ record.couponNumber || 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'userBaseInfo'">
            <Button type="link" @click="openUserDetails(record)">
              {{ record.userBaseInfo?.userNickname || '-' }}
            </Button>
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
