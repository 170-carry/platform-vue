<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccessStore } from '@vben/stores';

import { pageUserBeanRunningWater } from '#/api/legacy/pet';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';
import {
  BEAN_ORIGIN_OPTIONS,
  INCOME_EXPENSE_OPTIONS,
} from '#/views/pet/shared';

import {
  Button,
  DateRangePicker,
  Pagination,
  Select,
  SelectOption,
  Table,
  Tag,
} from 'antdv-next';

const props = withDefaults(
  defineProps<{
    userId?: number | string;
  }>(),
  {
    userId: '',
  },
);

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive({
  cursor: 1,
  endTime: '',
  limit: 20,
  origin: '',
  startTime: '',
  sysOrigin: '',
  type: undefined as number | undefined,
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'user', key: 'user', title: '用户名称', width: 260 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 100 },
  { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 180 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 100 },
  { dataIndex: 'originName', key: 'originName', title: '来源', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

watch(
  () => props.userId,
  (value) => {
    query.userId = String(value || '');
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function getTypeName(value: number) {
  return INCOME_EXPENSE_OPTIONS.find((item) => item.value === value)?.name || '-';
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserBeanRunningWater({ ...query });
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
  const userId = record.userBaseInfo?.id || record.userId;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

if (!props.userId && sysOriginOptions.length > 0) {
  query.sysOrigin = String(sysOriginOptions[0]?.value || '');
  void loadData(true);
}
</script>

<template>
  <div class="bean-panel">
    <div class="toolbar">
      <SysOriginSelect
        v-model:value="query.sysOrigin"
        allow-clear
        placeholder="系统"
        style="width: 140px"
        @change="handleSearch"

        :options="sysOriginOptions"
      ></SysOriginSelect>
      <Select option-label-prop="label"
        v-model:value="query.type"
        allow-clear
        placeholder="类型"
        style="width: 120px"
        @change="handleSearch"
      >
        <SelectOption
          v-for="item in INCOME_EXPENSE_OPTIONS"
          :key="item.value"
          :label="item.name"
          :value="item.value"
        >
          {{ item.name }}
        </SelectOption>
      </Select>
      <Select option-label-prop="label"
        v-model:value="query.origin"
        allow-clear
        placeholder="来源"
        show-search
        style="width: 160px"
        @change="handleSearch"
      >
        <SelectOption
          v-for="item in BEAN_ORIGIN_OPTIONS"
          :key="item.value"
          :label="`${item.name} / ${item.value}`"
          :value="item.value"
        >
          {{ item.name }} / {{ item.value }}
        </SelectOption>
      </Select>
      <AccountInput
        v-if="!userId"
        v-model:value="query.userId"
        placeholder="用户ID"
        style="width: 220px"
        :sys-origin="query.sysOrigin"
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
      :scroll="{ x: 1180 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'user'">
          <button class="user-cell" type="button" @click="openUserDetails(record)">
            <img
              :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
              alt=""
              class="user-avatar"
            >
            <div class="user-copy">
              <div>{{ record.userBaseInfo?.userNickname || '-' }}</div>
              <div class="user-sub">
                {{ record.userBaseInfo?.actualAccount || record.userBaseInfo?.account || '-' }}
              </div>
            </div>
          </button>
        </template>
        <template v-else-if="column.key === 'type'">
          <Tag :color="Number(record.type) === 0 ? 'success' : 'default'">
            {{ getTypeName(Number(record.type)) }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'quantity'">
          <span :class="Number(record.type) === 0 ? 'income' : 'expense'">
            {{ Number(record.type) === 0 ? '+' : '-' }}{{ record.quantity || 0 }}
          </span>
        </template>
        <template v-else-if="column.key === 'remarks'">
          {{ record.remarks || '-' }}
        </template>
        <template v-else-if="column.key === 'originName'">
          {{ record.originName || record.origin || '-' }}
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
      </template>
    </Table>

    <div class="pagination">
      <Pagination
        :current="query.cursor"
        :page-size="query.limit"
        :total="total"
        show-size-changer
        @change="handlePageChange"
        @showSizeChange="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.bean-panel {
  display: grid;
  gap: 16px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.user-cell {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 0;
  text-align: left;
}

.user-avatar {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.user-copy {
  min-width: 0;
}

.user-sub {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}

.income {
  color: #dc2626;
}

.expense {
  color: #0f172a;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
