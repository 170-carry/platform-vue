<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { dynamicTagTable } from '#/api/legacy/dynamic';
import SysOriginLabel from '#/components/sys-origin-label.vue';
import {
  LANGUAGE_OPTIONS,
  formatDate,
  getAllowedSysOrigins,
  } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Pagination,
  Select,
  Space,
  Table,
  Tag
} from 'antdv-next';

import TagEditModal from './components/tag-edit-modal.vue';

defineOptions({ name: 'DynamicTagList' });

const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const activeRecord = ref<null | Record<string, any>>(null);

const query = reactive({
  cursor: 1,
  del: false as boolean,
  languageType: '',
  limit: 20,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 90 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'imageUrl', key: 'imageUrl', title: '背景', width: 240 },
  { dataIndex: 'tag', key: 'tag', title: '标签', width: 160 },
  { dataIndex: 'description', key: 'description', title: '描述', width: 220 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'languageType', key: 'languageType', title: '语言', width: 120 },
  { dataIndex: 'del', key: 'del', title: '状态', width: 120 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '更新时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

const scroll = computed(() => ({ x: 1500 }));

function getLanguage(value?: string) {
  return LANGUAGE_OPTIONS.find((item) => item.value === value)?.name || '-';
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await dynamicTagTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openCreate() {
  activeRecord.value = null;
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRecord.value = { ...record };
  modalOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="标签列表">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select
            v-model:value="query.del"
            option-label-prop="label"
            style="width: 140px"
            @change="handleSearch"
          
            :options="[{ label: '上架', value: false as any }, { label: '下架', value: true as any }]"
          />
          <Select
            v-model:value="query.languageType"
            allow-clear
            option-label-prop="label"
            placeholder="语言"
            style="width: 160px"
            @change="handleSearch"
          
            :options="LANGUAGE_OPTIONS.map((item) => ({ label: item.name, value: item.value as any }))"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="openCreate">新增</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :scroll="scroll"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <SysOriginLabel :value="record.sysOrigin" />
          </template>
          <template v-else-if="column.key === 'imageUrl'">
            <Image :src="record.imageUrl" class="cover-image" />
          </template>
          <template v-else-if="column.key === 'languageType'">
            {{ getLanguage(record.languageType) }}
          </template>
          <template v-else-if="column.key === 'del'">
            <Tag :color="record.del ? 'error' : 'success'">
              {{ record.del ? '已下架' : '已上架' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime || record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">
              修改
            </Button>
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
    </Card>

    <TagEditModal
      :open="modalOpen"
      :record="activeRecord"
      :sys-origin-options="sysOriginOptions"
      @close="modalOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.cover-image {
  border-radius: 12px;
  height: 84px;
  object-fit: cover;
  width: 168px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
