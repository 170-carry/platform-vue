<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getCountryAlls,
  pageUserInviteRegister,
  } from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Pagination,
  Select,
  Space,
  Table
} from 'antdv-next';

import {
  buildDateRangePresets,
  type DayjsRange,
} from './shared';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateInviteUserLog' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const countries = ref<Array<Record<string, any>>>([]);
const countryKeyword = ref('');
const rangeDate = ref<DayjsRange | null>(null);

const query = reactive<Record<string, any>>({
  countryCode: '',
  cursor: 1,
  endTime: '',
  inviteUserId: '',
  limit: 20,
  startTime: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '邀请用户', width: 280 },
  { dataIndex: 'beUserProfile', key: 'beUserProfile', title: '被邀请用户', width: 280 },
  { dataIndex: 'commission', key: 'commission', title: '奖金', width: 100 },
  { dataIndex: 'deviceId', key: 'deviceId', title: '设备号', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return countries.value;
  }
  return countries.value.filter((item) =>
    buildCountrySearchText(item).includes(keyword),
  );
});

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

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function buildCountryLabel(item: Record<string, any>) {
  return `${item.phonePrefix || ''} ${item.countryName || ''}`.trim();
}

function buildCountrySearchText(item: Record<string, any>) {
  return [
    item.phonePrefix,
    item.countryName,
    item.aliasName,
    item.alphaTwo,
    item.alphaThree,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

async function loadCountries() {
  countries.value = await getCountryAlls();
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    list.value = [];
    total.value = 0;
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserInviteRegister({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handleCountrySearch(value: string) {
  countryKeyword.value = value;
}

function handleCountryChange(value: number | string) {
  query.countryCode = String(value || '');
  countryKeyword.value = '';
  handleSearch();
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

void loadCountries();
</script>

<template>
  <Page title="邀请用户日志">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label"
            v-model:value="query.countryCode"
            allow-clear
            show-search
            :filter-option="false"
            placeholder="国家"
            style="width: 240px"
            @change="handleCountryChange"
            @search="handleCountrySearch"
          
            :options="filteredCountries.map((item) => ({ label: `${buildCountryLabel(item)}`, value: item.alphaTwo as any }))"
          />
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="邀请用户"
            style="width: 260px"
          />
          <AccountInput
            v-model:value="query.inviteUserId"
            :sys-origin="query.sysOrigin"
            placeholder="被邀请用户"
            style="width: 260px"
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
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'beUserProfile'">
            <UserProfileLink :profile="record.beUserProfile" />
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
        />
      </div>
    </Card>
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
