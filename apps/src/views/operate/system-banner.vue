<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  bannerTable,
  getCountryAlls,
  deleteBanner,
  regionConfigTable,
  } from '#/api/legacy/system';
import {
  formatDate,
  getAllowedSysOrigins,
  } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Modal,
  Pagination,
  Popover,
  Select,
  Table,
  Tag,
  message
} from 'antdv-next';

import BannerFormModal from './components/banner-form-modal.vue';

defineOptions({ name: 'OperateSystemBanner' });

const APP_PLATFORMS = [
  { name: 'iOS', value: 'iOS' },
  { name: 'Android', value: 'Android' },
];

const accessStore = useAccessStore();
const loading = ref(false);
const regionsLoading = ref(false);
const countriesLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);
const countries = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  countryCode: '',
  cursor: 1,
  limit: 20,
  platform: '',
  region: '',
  showcase: undefined,
  sysOrigin: '',
});

const columns: any[] = [
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 220 },
  { dataIndex: 'smallCover', key: 'smallCover', title: '小图', width: 140 },
  { dataIndex: 'alertCover', key: 'alertCover', title: 'alert图', width: 140 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 100 },
  { dataIndex: 'displayPositionNames', key: 'displayPositionNames', title: '展示位', width: 180 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'regionNameStr', key: 'regionNameStr', title: '区域', width: 180 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'content', key: 'content', title: '内容', width: 120 },
  { dataIndex: 'showcase', key: 'showcase', title: '状态', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
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
    query.region = '';
    void Promise.all([loadRegions(value), loadCountries(), loadData(true)]);
  },
  { immediate: true },
);

async function loadRegions(sysOrigin: string) {
  regionsLoading.value = true;
  try {
    regions.value = await regionConfigTable({ sysOrigin });
  } finally {
    regionsLoading.value = false;
  }
}

async function loadCountries() {
  countriesLoading.value = true;
  try {
    countries.value = await getCountryAlls();
  } finally {
    countriesLoading.value = false;
  }
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
    const result = await bannerTable({ ...query });
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
  activeRow.value = null;
  formOpen.value = true;
}

function handleUpdate(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteBanner(record.id, record.sysOrigin);
      message.success('删除成功');
      await loadData();
    },
  });
}

function getStatusText(record: Record<string, any>) {
  if (record.expired === true && record.showcase === false) {
    return '下架+过期';
  }
  if (record.expired === true && record.showcase === true) {
    return '上架+过期';
  }
  if (record.expired === true) {
    return '过期';
  }
  return record.showcase ? '上架' : '下架';
}

function getStatusColor(record: Record<string, any>) {
  if (record.expired === true) {
    return 'warning';
  }
  return record.showcase ? 'success' : 'error';
}
</script>

<template>
  <Page title="系统banner管理">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.platform"
          allow-clear
          placeholder="平台"
          style="width: 120px"
        
          :options="APP_PLATFORMS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.showcase"
          allow-clear
          placeholder="状态"
          style="width: 120px"
          @change="handleSearch"
        
          :options="[{ label: '上架', value: true as any }, { label: '下架', value: false as any }]"
        />
        <Select option-label-prop="label"
          v-model:value="query.region"
          allow-clear
          :loading="regionsLoading"
          placeholder="区域"
          style="width: 140px"
          @change="handleSearch"
        
          :options="regions.map((item) => ({ label: `${item.regionName}`, value: item.id as any }))"
        />
        <Select option-label-prop="label"
          v-model:value="query.countryCode"
          allow-clear
          :loading="countriesLoading"
          placeholder="国家"
          style="width: 200px"
          @change="handleSearch"
        
          :options="countries.map((item) => ({ label: `${item.aliasName || item.countryName || item.alphaTwo}`, value: item.alphaTwo as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="handleCreate">新增</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1760 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <Image :preview="false" :src="record.cover" class="cover" />
          </template>
          <template v-else-if="column.key === 'smallCover'">
            <Image :preview="false" :src="record.smallCover" class="small-cover" />
          </template>
          <template v-else-if="column.key === 'alertCover'">
            <Image :preview="false" :src="record.alertCover" class="small-cover" />
          </template>
          <template v-else-if="column.key === 'sysOrigin'">
            <Tag>{{ record.sysOrigin || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'content'">
            <Popover placement="topLeft" trigger="hover">
              <template #content>
                <div class="popover-content">
                  <div><strong>内容：</strong>{{ record.content || '-' }}</div>
                  <div><strong>参数：</strong>{{ record.params || '-' }}</div>
                  <div><strong>描述：</strong>{{ record.depict || '-' }}</div>
                  <div><strong>开始时间：</strong>{{ formatDate(record.startTime) }}</div>
                  <div><strong>过期时间：</strong>{{ formatDate(record.expiredTime) }}</div>
                </div>
              </template>
              <Button size="small" type="link">查看</Button>
            </Popover>
          </template>
          <template v-else-if="column.key === 'showcase'">
            <Tag :color="getStatusColor(record)">
              {{ getStatusText(record) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-row">
              <Button size="small" type="link" @click="handleUpdate(record)">
                修改
              </Button>
              <Button size="small" type="link" danger @click="handleDelete(record)">
                删除
              </Button>
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
    </Card>

    <BannerFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.toolbar,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar {
  margin-bottom: 16px;
}

.cover {
  border-radius: 12px;
  height: 111px;
  object-fit: cover;
  width: 180px;
}

.small-cover {
  border-radius: 10px;
  height: 100px;
  object-fit: cover;
  width: 120px;
}

.popover-content {
  display: grid;
  gap: 6px;
  max-width: 280px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
