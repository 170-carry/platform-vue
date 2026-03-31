<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  offShelfPropsSource,
  pagePropsSource,
  } from '#/api/legacy/props';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Empty,
  Input,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  message
} from 'antdv-next';

import RewardIcon from './components/reward-icon.vue';
import ResourceConfigModal from './components/resource-config-modal.vue';
import ResourceOverviewModal from './components/resource-overview-modal.vue';
import ResourceSalesModal from './components/resource-sales-modal.vue';
import { PROPS_DEL_OPTIONS, PROPS_TYPES } from './shared';

defineOptions({ name: 'PropsResourceConfig' });

const accessStore = useAccessStore();

const accessCodes = computed(() => accessStore.accessCodes || []);
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessCodes.value);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

function hasPermission(code: string) {
  const codes = accessCodes.value;
  return codes.length === 0 || codes.includes(code);
}

const canQuery = computed(() => hasPermission('props:config:query'));
const canCreate = computed(() => hasPermission('props:config:add'));
const canEdit = computed(() => hasPermission('props:config:edit'));
const canQuerySingleSales = computed(() => hasPermission('props:config:sales:single'));
const canQueryOverviewSales = computed(() => hasPermission('props:config:sales:total'));

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const salesOpen = ref(false);
const overviewOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive({
  cursor: 1,
  del: false as boolean | undefined,
  id: '',
  limit: 20,
  name: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? 'LIKEI',
  type: PROPS_TYPES[0]?.value ?? 'AVATAR_FRAME',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 160 },
  { dataIndex: 'code', key: 'code', title: '编号', width: 140 },
  { dataIndex: 'typeName', key: 'typeName', title: '类型', width: 120 },
  { dataIndex: 'name', key: 'name', title: '名称', width: 180 },
  { dataIndex: 'cover', key: 'cover', title: '资源', width: 120 },
  { dataIndex: 'del', key: 'del', title: '上/下架', width: 120 },
  { dataIndex: 'amount', key: 'amount', title: '底价', width: 100 },
  { dataIndex: 'adminFree', key: 'adminFree', title: 'Admin Free', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 180 },
];

async function loadData(reset = false) {
  if (!canQuery.value || !query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePropsSource({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

async function handleStatusChange(record: Record<string, any>, checked: boolean) {
  const previous = record.del;
  record.del = !checked;
  try {
    await offShelfPropsSource(record.id, record.del);
    message.success('状态已更新');
  } catch (error) {
    record.del = previous;
    throw error;
  }
}

function openCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function openSales(record: Record<string, any>) {
  activeRow.value = { ...record };
  salesOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="资源配置">
    <Card v-if="canQuery">
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="loadData(true)"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="类型">
          <Select option-label-prop="label"
            v-model:value="query.type"
            style="width: 140px"
            @change="loadData(true)"
          
            :options="PROPS_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="状态">
          <Select option-label-prop="label"
            v-model:value="query.del"
            allow-clear
            style="width: 120px"
            @change="loadData(true)"
          
            :options="PROPS_DEL_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="ID">
          <Input
            v-model:value="query.id"
            allow-clear
            placeholder="ID"
            style="width: 180px"
          />
        </InlineFilterField>
        <InlineFilterField label="名称">
          <Input
            v-model:value="query.name"
            allow-clear
            placeholder="名称"
            style="width: 180px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button v-if="canCreate" @click="openCreate">添加</Button>
        <Button v-if="canQueryOverviewSales" @click="overviewOpen = true">
          销售情况
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1160 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <RewardIcon :item="record" />
          </template>
          <template v-else-if="column.key === 'del'">
            <Switch
              :checked="!record.del"
              checked-children="上架"
              un-checked-children="下架"
              @change="(checked: boolean) => handleStatusChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'adminFree'">
            <Tag :color="record.adminFree ? 'green' : 'default'">
              {{ record.adminFree ? '是' : '否' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button v-if="canEdit" size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button
                v-if="canQuerySingleSales"
                size="small"
                type="link"
                @click="openSales(record)"
              >
                销售情况
              </Button>
            </Space>
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
    <Card v-else>
      <Empty description="暂无查看权限" />
    </Card>

    <ResourceConfigModal
      :open="formOpen"
      :record="activeRow"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData()"
    />

    <ResourceSalesModal
      :open="salesOpen"
      :record="activeRow"
      @close="salesOpen = false"
    />

    <ResourceOverviewModal
      :open="overviewOpen"
      @close="overviewOpen = false"
    />
  </Page>
</template>

<style scoped>
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
