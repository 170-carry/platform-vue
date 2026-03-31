<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { listPayOpenCountry } from '#/api/legacy/pay';
import {
  regionConfigTable,
  regionRelationTable,
  } from '#/api/legacy/system';
import { PRODUCT_SHOWCASE_OPTIONS,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Pagination,
  Select,
  Table
} from 'antdv-next';

import RegionRelationFormModal from './components/region-relation-form-modal.vue';

defineOptions({ name: 'OperateRegionRelation' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);
const countryList = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<Record<string, any>>({});

const query = reactive<Record<string, any>>({
  cursor: 1,
  groupType: 'OPEN_PAY_COUNTRY',
  limit: 20,
  region: '',
  relationId: '',
  showcase: true,
  sysOrigin: '',
});

const columns: any[] = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 120 },
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 240 },
  { dataIndex: 'relationDesc', key: 'relationDesc', title: '关联数据', width: 260 },
  { dataIndex: 'showcase', key: 'showcase', title: '状态', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
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
  async (value) => {
    if (!value) {
      return;
    }
    await loadRegions();
    await loadCountryList();
    await loadData(true);
  },
  { immediate: true },
);

async function loadRegions() {
  regions.value = (await regionConfigTable({ sysOrigin: query.sysOrigin })) || [];
}

async function loadCountryList() {
  countryList.value = (await listPayOpenCountry()) || [];
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await regionRelationTable({ ...query });
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

function handleCreate() {
  activeRow.value = {};
  formOpen.value = true;
}

function handleUpdate(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}
</script>

<template>
  <Page title="支付区域关系">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.region"
          allow-clear
          placeholder="区域"
          style="width: 160px"
          @change="handleSearch"
        
          :options="regions.map((item) => ({ label: `${item.regionName}`, value: item.id as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.showcase"
          style="width: 140px"
          @change="handleSearch"
        
          :options="PRODUCT_SHOWCASE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="handleCreate">添加</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'showcase'">
            {{ record.showcase ? '已上架' : '已下架' }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" @click="handleUpdate(record)">修改</Button>
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

    <RegionRelationFormModal
      :country-list="countryList"
      :open="formOpen"
      :regions="regions"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      @close="formOpen = false"
      @success="loadData(true)"
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
