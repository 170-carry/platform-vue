<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import dayjs from 'dayjs';

import { useAccessStore } from '@vben/stores';

import { pageMonthlyQualityUsers } from '#/api/legacy/statistics';
import AccountInput from '#/components/account-input.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  DatePicker,
  Pagination,
  Table,
  Tag,
} from 'antdv-next';

import UserProfileLink from '../components/user-profile-link.vue';
import { getRechargeTypeDes } from '../shared';

defineOptions({ name: 'OperateQualityUsersMonthTab' });

const accessStore = useAccessStore();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  rechargeDate: dayjs().format('YYYYMM'),
  sysOrigin: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 260 },
  { dataIndex: 'totalAmount', key: 'totalAmount', title: '总额', width: 120 },
  { dataIndex: 'recharges', key: 'recharges', title: '充值明细', width: 520 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
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
    const result = await pageMonthlyQualityUsers({ ...query });
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
</script>

<template>
  <div>
    <div class="toolbar">
      <SysOriginSelect
        v-model:value="query.sysOrigin"
        style="width: 140px"
        @change="handleSearch"

        :options="sysOriginOptions"
      ></SysOriginSelect>
      <AccountInput
        v-model:value="query.userId"
        :sys-origin="query.sysOrigin"
        placeholder="用户ID"
        style="width: 300px"
      />
      <DatePicker
        v-model:value="query.rechargeDate"
        picker="month"
        style="width: 160px"
        value-format="YYYYMM"
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
      :scroll="{ x: 980 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userProfile'">
          <UserProfileLink :profile="record.userProfile" />
        </template>
        <template v-else-if="column.key === 'recharges'">
          <div class="tag-row">
            <Tag
              v-for="(item, index) in record.recharges || []"
              :key="index"
              color="blue"
            >
              {{ getRechargeTypeDes(item.type) }}:{{ item.amount }}
            </Tag>
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
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
