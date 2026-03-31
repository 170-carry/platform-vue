<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';

import { pageResources,
  resetResources } from '#/api/legacy/system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  formatDate,
  REQUEST_METHOD_OPTIONS,
  RESOURCE_AUTH_TYPE_OPTIONS,
  } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Pagination,
  Select,
  Table,
  Tag,
  message
} from 'antdv-next';

defineOptions({ name: 'SystemResourceManager' });

const loading = ref(false);
const refreshLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const total = ref(0);

const query = reactive({
  authType: '',
  cursor: 1,
  limit: 20,
  method: '',
  resourceName: '',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 100 },
  { dataIndex: 'resourceName', key: 'resourceName', title: '资源名称', width: 220 },
  { dataIndex: 'method', key: 'method', title: '请求方式', width: 120 },
  { dataIndex: 'mapping', key: 'mapping', title: '映射路径' },
  { dataIndex: 'authType', key: 'authType', title: '授权类型', width: 140 },
  { dataIndex: 'perm', key: 'perm', title: '权限标识', width: 220 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
];

const authTypeMap = new Map(
  RESOURCE_AUTH_TYPE_OPTIONS.map((item) => [item.value, item.label]),
);

const tableScroll = computed(() => ({ x: 1220 }));

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageResources({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

async function handleRefreshResources() {
  refreshLoading.value = true;
  try {
    await resetResources();
    message.success('资源已刷新');
    await loadData();
  } finally {
    refreshLoading.value = false;
  }
}

loadData(true);
</script>

<template>
  <Page title="资源管理">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="资源名">
          <Input
            v-model:value="query.resourceName"
            allow-clear
            placeholder="资源名"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="请求方式" :label-width="84">
          <Select
            v-model:value="query.method"
            allow-clear
            option-label-prop="label"
            placeholder="请求方式"
            style="width: 140px"
          
            :options="REQUEST_METHOD_OPTIONS.map((item) => ({ label: item, value: item as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="权限类型" :label-width="84">
          <Select
            v-model:value="query.authType"
            allow-clear
            option-label-prop="label"
            placeholder="权限类型"
            style="width: 140px"
          
            :options="RESOURCE_AUTH_TYPE_OPTIONS.map((item) => ({ label: item.label, value: item.value as any }))"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button :loading="refreshLoading" @click="handleRefreshResources">
          刷新资源
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-key="(record: Record<string, any>) => record.id"
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'method'">
            <Tag>{{ record.method || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'authType'">
            {{ authTypeMap.get(String(record.authType ?? '')) || record.authType || '-' }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div class="pager">
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
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
