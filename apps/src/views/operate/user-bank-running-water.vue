<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  calculateTotalAmount,
  pageRunningWater,
} from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Select,
  Space,
  Table,
} from 'antdv-next';

import {
  USER_BANK_WATER_EVENTS,
  buildDateRangePresets,
  type DayjsRange,
  getBankWaterEventName,
  getTransferDescriptionName,
} from './shared';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateUserBankRunningWater' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const totalLoading = ref(false);
const notData = ref(false);
const showTotal = ref(false);
const totalValue = ref('0');
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<DayjsRange | null>(null);

const query = reactive<Record<string, any>>({
  endTime: '',
  event: '',
  lastId: '',
  limit: 20,
  startTime: '',
  sysOrigin: '',
  type: '',
  userId: '',
});

const runningWaterTypeOptions = [
  { label: '收入', value: 0 },
  { label: '支出', value: 1 },
];

const runningWaterEventOptions = USER_BANK_WATER_EVENTS.map((item) => ({
  label: item.name,
  value: item.value,
}));

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 90 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 300 },
  { dataIndex: 'typeName', key: 'typeName', title: '类型', width: 90 },
  { dataIndex: 'amount', key: 'amount', title: '数量', width: 110 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 110 },
  { dataIndex: 'event', key: 'event', title: '事件', width: 180 },
  { dataIndex: 'remark', key: 'remark', title: '备注', width: 220 },
  { dataIndex: 'createUserOriginName', key: 'createUserOriginName', title: '创建源', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

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

async function updateTotalAmount() {
  showTotal.value = Boolean(
    query.sysOrigin &&
      query.userId &&
      query.event &&
      query.startTime &&
      query.endTime &&
      query.type !== '',
  );
  if (!showTotal.value) {
    totalValue.value = '0';
    return;
  }
  totalLoading.value = true;
  try {
    const result = await calculateTotalAmount({ ...query });
    totalValue.value = String(result || 0);
  } finally {
    totalLoading.value = false;
  }
}

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
    const result = await pageRunningWater({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
    await updateTotalAmount();
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
  <Page title="用户银行流水">
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
          <Select option-label-prop="label"
            v-model:value="query.type"
            :options="runningWaterTypeOptions"
            allow-clear
            placeholder="类型"
            style="width: 120px"
            @change="handleSearch"
          />
          <Select option-label-prop="label"
            v-model:value="query.event"
            :options="runningWaterEventOptions"
            allow-clear
            placeholder="事件"
            style="width: 180px"
            @change="handleSearch"
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

      <Alert
        v-if="showTotal"
        :message="`金额($): ${totalValue}`"
        :show-icon="true"
        banner
        type="success"
      />

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1540 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <div class="user-group">
              <UserProfileLink :profile="record.userProfile" />
              <UserProfileLink
                v-if="record.tmpUserProfile"
                :profile="record.tmpUserProfile"
                :tag-name="getTransferDescriptionName(record.event)"
              />
            </div>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span :class="record.type === 0 ? 'amount-plus' : ''">
              {{ record.type === 0 ? '+' : '-' }}{{ record.amount || 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'event'">
            {{ getBankWaterEventName(record.event) }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
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

.user-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.amount-plus {
  color: #dc2626;
}

.load-more {
  padding: 20px 0 0;
  text-align: center;
}
</style>
