<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { regionConfigTable } from '#/api/legacy/system';
import {
  listPayOpenCountry,
  pagePayCommodity,
  switchShelfCommodity,
} from '#/api/legacy/pay';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Switch,
  Table,
} from 'antdv-next';

import { WEB_PRODUCT_TYPE_OPTIONS } from '../pay-shared';

import PayCommodityEditModal from './pay-commodity-edit-modal.vue';

const props = withDefaults(
  defineProps<{
    appInfo?: Record<string, any>;
    mode: 'country' | 'region';
  }>(),
  {
    appInfo: () => ({
      appList: [],
      appSelect: {},
    }),
  },
);

const loading = ref(false);
const supportLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const supportList = ref<Array<Record<string, any>>>([]);
const selectedApp = ref<Record<string, any>>({});
const selectedDimension = ref<Record<string, any>>({});
const formOpen = ref(false);
const activeRow = ref<Record<string, any>>({});

const query = reactive<Record<string, any>>({
  applicationId: '',
  cursor: 1,
  id: '',
  limit: 30,
  payCountryId: '',
  regionId: '',
  shelf: true,
  type: 'GOLD',
});

const title = computed(() => (props.mode === 'country' ? '商品管理' : '商品管理V2'));
const dimensionPlaceholder = computed(() =>
  props.mode === 'country' ? '国家' : '区域',
);
const productTypeOptions = WEB_PRODUCT_TYPE_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const applicationOptions = computed(() =>
  (props.appInfo?.appList || []).map((item: Record<string, any>) => ({
    label: item.appName || '-',
    value: item.id as any,
  })),
);
const supportOptions = computed(() =>
  supportList.value.map((item) => ({
    label:
      props.mode === 'country'
        ? item.country?.aliasName || item.country?.enName || '-'
        : item.regionName || '-',
    value: item.id as any,
  })),
);
const shelfOptions = [
  { label: '上架', value: true as any },
  { label: '下架', value: false as any },
];
const selectedDimensionId = computed({
  get: () => (props.mode === 'country' ? query.payCountryId : query.regionId),
  set: (value) => {
    if (props.mode === 'country') {
      query.payCountryId = value;
      return;
    }
    query.regionId = value;
  },
});

const columns = computed(() => {
  const listColumns: any[] = [
    { dataIndex: 'id', key: 'id', title: 'ID', width: 90 },
  ];
  if (props.mode === 'region') {
    listColumns.push({
      dataIndex: 'regionName',
      key: 'regionName',
      title: '区域',
      width: 120,
    });
  }
  listColumns.push(
    { dataIndex: 'content', key: 'content', title: '金币数', width: 120 },
    { dataIndex: 'awardContent', key: 'awardContent', title: '奖励数', width: 120 },
    { dataIndex: 'amountUsd', key: 'amountUsd', title: '价格$', width: 120 },
    { dataIndex: 'shelf', key: 'shelf', title: '上/下架', width: 120 },
    { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
    { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
  );
  return listColumns;
});

async function loadSupportData() {
  const app = selectedApp.value || {};
  if (props.mode === 'country') {
    supportLoading.value = true;
    try {
      supportList.value = (await listPayOpenCountry()) || [];
      selectedDimension.value = supportList.value[0] || {};
      query.payCountryId = selectedDimension.value.id || '';
    } finally {
      supportLoading.value = false;
    }
    return;
  }

  supportLoading.value = true;
  try {
    supportList.value = (await regionConfigTable({ sysOrigin: app.appCode })) || [];
    selectedDimension.value = supportList.value[0] || {};
    query.regionId = selectedDimension.value.id || '';
  } finally {
    supportLoading.value = false;
  }
}

async function loadData(reset = false) {
  if (!query.applicationId) {
    list.value = [];
    total.value = 0;
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePayCommodity({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.appInfo,
  async (value) => {
    const current = value?.appSelect || {};
    selectedApp.value = current;
    query.applicationId = current.id || '';
    query.payCountryId = '';
    query.regionId = '';
    await loadSupportData();
    await loadData(true);
  },
  { deep: true, immediate: true },
);

function handleSearch() {
  void loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function handleApplicationChange(value: string | number) {
  selectedApp.value =
    props.appInfo?.appList?.find((item: Record<string, any>) => item.id === value) ||
    {};
  query.applicationId = selectedApp.value.id || '';
  void loadSupportData().then(() => loadData(true));
}

function handleDimensionChange(value: string | number) {
  selectedDimension.value =
    supportList.value.find((item) => item.id === value) || {};
  if (props.mode === 'country') {
    query.payCountryId = selectedDimension.value.id || '';
  } else {
    query.regionId = selectedDimension.value.id || '';
  }
  void loadData(true);
}

async function handleSwitchChange(record: Record<string, any>, checked: boolean) {
  const previous = !checked;
  try {
    await switchShelfCommodity(record.id, checked);
  } catch {
    record.shelf = previous;
  }
}

function openCreate() {
  activeRow.value = {
    amountUsd: '',
    applicationId: query.applicationId,
    payCountryId: query.payCountryId,
    regionId: query.regionId,
    regionName: selectedDimension.value.regionName || '',
    selectApp: selectedApp.value,
    shelf: true,
    type: query.type,
    ...(props.mode === 'country'
      ? {
          country: {
            countryName:
              selectedDimension.value.country?.aliasName ||
              selectedDimension.value.country?.enName ||
              '-',
            currency: selectedDimension.value.currency || '',
            exchangeRate: selectedDimension.value.usdExchangeRate || '',
            icon: selectedDimension.value.country?.nationalFlag || '',
          },
        }
      : {}),
  };
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = {
    ...record,
    regionName: record.regionName || selectedDimension.value.regionName || '',
    selectApp: selectedApp.value,
    ...(props.mode === 'country'
      ? {
          country: {
            countryName:
              selectedDimension.value.country?.aliasName ||
              selectedDimension.value.country?.enName ||
              '-',
            currency: selectedDimension.value.currency || '',
            exchangeRate: selectedDimension.value.usdExchangeRate || '',
            icon: selectedDimension.value.country?.nationalFlag || '',
          },
        }
      : {}),
  };
  formOpen.value = true;
}
</script>

<template>
  <Card :title="title">
    <div class="toolbar">
      <Select option-label-prop="label"
        v-model:value="query.type"
        :options="productTypeOptions"
        style="width: 180px"
        @change="handleSearch"
      />
      <Select option-label-prop="label"
        v-model:value="query.applicationId"
        :options="applicationOptions"
        placeholder="应用"
        style="width: 200px"
        @change="handleApplicationChange"
      />
      <Select option-label-prop="label"
        v-model:value="selectedDimensionId"
        :loading="supportLoading"
        :options="supportOptions"
        :placeholder="dimensionPlaceholder"
        style="width: 200px"
        @change="handleDimensionChange"
      />
      <Select option-label-prop="label"
        v-model:value="query.shelf"
        :options="shelfOptions"
        style="width: 140px"
        @change="handleSearch"
      />
      <Input
        v-model:value="query.id"
        placeholder="商品ID"
        style="width: 180px"
      />
      <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
      <Button
        type="primary"
        :disabled="props.mode === 'country' ? !query.payCountryId : !query.regionId"
        @click="openCreate"
      >
        添加
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
        <template v-if="column.key === 'regionName'">
          {{ record.regionName || '-' }}
        </template>
        <template v-else-if="column.key === 'shelf'">
          <Switch
            v-model:checked="record.shelf"
            @change="(checked) => handleSwitchChange(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button type="link" @click="openEdit(record)">编辑</Button>
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

    <PayCommodityEditModal
      :mode="mode"
      :open="formOpen"
      :row="activeRow"
      @close="formOpen = false"
      @success="loadData(true)"
    />
  </Card>
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
