<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pageBankWithdrawGoldApply } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
} from 'antdv-next';

import {
  BANK_EXCHANGE_ACCEPT_OPTIONS,
  buildDateRangePresets,
} from './shared';
import type { DayjsRange } from './shared';
import UserProfileLink from './components/user-profile-link.vue';

const props = withDefaults(
  defineProps<{
    amountType?: string;
    title: string;
  }>(),
  {
    amountType: '',
  },
);

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<DayjsRange | null>(null);

const query = reactive<Record<string, any>>({
  acceptAccount: '',
  acceptUserId: '',
  endTime: '',
  lastId: '',
  limit: 20,
  startTime: '',
  submitUserId: '',
  sysOrigin: '',
});

if (props.amountType) {
  query.amountType = props.amountType;
}

watch(rangeDate, (value) => {
  query.startTime = value?.[0]?.valueOf() || '';
  query.endTime = value?.[1]?.valueOf() || '';
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

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 90 },
  { dataIndex: 'submitUser', key: 'submitUser', title: '提交用户', width: 260 },
  { dataIndex: 'acceptUser', key: 'acceptUser', title: '接收用户', width: 260 },
  { dataIndex: 'acceptAccountName', key: 'acceptAccountName', title: '接收方式', width: 120 },
  { dataIndex: 'amount', key: 'amount', title: '提交金额', width: 120 },
  { dataIndex: 'exchangeRate', key: 'exchangeRate', title: '兑换比率', width: 120 },
  { dataIndex: 'goldQuantity', key: 'goldQuantity', title: '获得金币', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
    notData.value = false;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await pageBankWithdrawGoldApply({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
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
  <Page :title="title">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.submitUserId"
            :sys-origin="query.sysOrigin"
            placeholder="提交用户ID"
            style="width: 260px"
          />
          <AccountInput
            v-model:value="query.acceptUserId"
            :sys-origin="query.sysOrigin"
            placeholder="接收用户ID"
            style="width: 260px"
          />
          <Select option-label-prop="label"
            v-model:value="query.acceptAccount"
            allow-clear
            placeholder="类型"
            style="width: 160px"
            @change="handleSearch"
            :options="BANK_EXCHANGE_ACCEPT_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <DatePicker.RangePicker
            v-model:value="rangeDate"
            :presets="buildDateRangePresets()"
            show-time
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
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
        :scroll="{ x: 1360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'submitUser'">
            <UserProfileLink :profile="record.submitUser" />
          </template>
          <template v-else-if="column.key === 'acceptUser'">
            <UserProfileLink :profile="record.acceptUser" />
          </template>
          <template v-else-if="column.key === 'createTime'">
            创建日期：{{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData()"
        >
          加载更多
        </Button>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.load-more {
  padding: 20px 0 0;
  text-align: center;
}
</style>
