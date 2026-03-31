<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addOrUpdatePropsStore,
  pagePropsStore,
  } from '#/api/legacy/props';
import SysOriginLabel from '#/components/sys-origin-label.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
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
import StoreEditModal from './components/store-edit-modal.vue';
import {
  PROPS_CURRENCY_TYPES,
  PROPS_SHELF_STATUS_OPTIONS,
  PROPS_STORE_TYPES,
} from './shared';

defineOptions({ name: 'PropsStore' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive({
  cursor: 1,
  currencyTypes: '',
  id: '',
  limit: 20,
  propsType: PROPS_STORE_TYPES[0]?.value ?? 'AVATAR_FRAME',
  shelfStatus: true as boolean | undefined,
  sourceId: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 160 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 100 },
  { dataIndex: 'currencyTypesName', key: 'currencyTypesName', title: '付费类型', width: 120 },
  { dataIndex: 'validDays', key: 'validDays', title: '有效天数', width: 120 },
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 100 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '上/下架', width: 120 },
  { dataIndex: 'label', key: 'label', title: '标签', width: 140 },
  { dataIndex: 'sort', key: 'sort', title: '序号', width: 100 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePropsStore({ ...query });
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

async function handleShelfStatusChange(record: Record<string, any>, checked: boolean) {
  const previous = record.commodity.shelfStatus;
  record.commodity.shelfStatus = checked;
  try {
    await addOrUpdatePropsStore({ ...record.commodity });
    message.success('状态已更新');
  } catch (error) {
    record.commodity.shelfStatus = previous;
    throw error;
  }
}

function openCreate() {
  activeRow.value = {
    commodity: {
      currencyTypes: '',
      discount: 0,
      label: '',
      propsType: query.propsType,
      shelfStatus: false,
      sort: 0,
      sysOrigin: query.sysOrigin,
      validDays: '',
    },
    propsAbility: {},
    propsSource: null,
  };
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="道具商店">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="loadData(true)"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="道具类型">
          <Select option-label-prop="label"
            v-model:value="query.propsType"
            style="width: 140px"
            @change="loadData(true)"
          
            :options="PROPS_STORE_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="状态">
          <Select option-label-prop="label"
            v-model:value="query.shelfStatus"
            allow-clear
            style="width: 120px"
            @change="loadData(true)"
          
            :options="PROPS_SHELF_STATUS_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="付费类型" :label-width="72">
          <Select option-label-prop="label"
            v-model:value="query.currencyTypes"
            allow-clear
            style="width: 120px"
            @change="loadData(true)"
          
            :options="PROPS_CURRENCY_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="商品ID">
          <Input
            v-model:value="query.id"
            allow-clear
            placeholder="商品ID"
            style="width: 160px"
          />
        </InlineFilterField>
        <InlineFilterField label="资源ID">
          <Input
            v-model:value="query.sourceId"
            allow-clear
            placeholder="资源ID"
            style="width: 160px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button @click="openCreate">添加</Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-key="(record) => record.commodity?.id"
        :scroll="{ x: 1220 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'id'">
            {{ record.commodity?.id || '-' }}
          </template>
          <template v-else-if="column.key === 'sysOrigin'">
            <SysOriginLabel :value="record.commodity?.sysOrigin" />
          </template>
          <template v-else-if="column.key === 'currencyTypesName'">
            {{ record.currencyTypesName || '-' }}
          </template>
          <template v-else-if="column.key === 'validDays'">
            {{ record.commodity?.validDays || '-' }}
          </template>
          <template v-else-if="column.key === 'cover'">
            <RewardIcon :item="record.propsSource || {}" />
          </template>
          <template v-else-if="column.key === 'shelfStatus'">
            <Switch
              :checked="Boolean(record.commodity?.shelfStatus)"
              checked-children="上架"
              un-checked-children="下架"
              @change="
                (checked: boolean) => handleShelfStatusChange(record, checked)
              "
            />
          </template>
          <template v-else-if="column.key === 'label'">
            <Space wrap>
              <Tag v-if="record.commodity?.label">{{ record.commodity.label }}</Tag>
              <Tag v-if="record.commodity?.propsType === 'NOBLE_VIP'" color="gold">
                贵族
              </Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'sort'">
            {{ record.commodity?.sort ?? '-' }}
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建：{{ formatDate(record.commodity?.createTime) }}</div>
            <div>修改：{{ formatDate(record.commodity?.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
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

    <StoreEditModal
      :open="formOpen"
      :record="activeRow"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData()"
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
