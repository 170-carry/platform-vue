<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pageAgentActivity } from '#/api/legacy/activity';
import { regionConfigTable } from '#/api/legacy/system';
import { getAllowedSysOrigins } from '#/views/system/shared';

import { Button, Card, Pagination, Select, Table } from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateAgentActivity' });

const accessStore = useAccessStore();
const loading = ref(false);
const regionLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);
const typeOptions = [
  { label: '周', value: 'WEEK' },
  { label: '月', value: 'MONTH' },
];

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  regionId: '',
  sysOrigin: '',
  type: 'WEEK',
});

const columns: any[] = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 260 },
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 180 },
  { dataIndex: 'target', key: 'target', title: '目标值', width: 120 },
  { dataIndex: 'groupName', key: 'groupName', title: '类型', width: 160 },
  { dataIndex: 'dateNumber', key: 'dateNumber', title: '时间', width: 180 },
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
      regions.value = [];
      return;
    }
    query.regionId = '';
    void loadRegions();
    void loadData(true);
  },
  { immediate: true },
);

async function loadRegions() {
  if (!query.sysOrigin) {
    return;
  }
  regionLoading.value = true;
  try {
    regions.value = await regionConfigTable({ sysOrigin: query.sysOrigin });
  } finally {
    regionLoading.value = false;
  }
}

const regionOptions = computed(() =>
  regions.value.map((item) => ({
    label: item.regionName,
    value: item.id,
  })),
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
    const result = await pageAgentActivity({ ...query });
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
  <Page title="代理活动">
    <Card>
      <div class="toolbar">
        <Select
          v-model:value="query.type"
          :options="typeOptions"
          allow-clear
          option-label-prop="label"
          placeholder="类型"
          style="width: 120px"
          @change="handleSearch"
        />
        <Select
          v-model:value="query.regionId"
          :options="regionOptions"
          allow-clear
          :loading="regionLoading"
          option-label-prop="label"
          placeholder="区域"
          style="width: 140px"
          @change="handleSearch"
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
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
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
</style>
