<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  offPropsActivityRewardGroup,
  pagePropsActivityRewardGroup,
  } from '#/api/legacy/props';
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
  Switch,
  Table,
  message
} from 'antdv-next';

import RewardRow from './components/reward-row.vue';
import SourceGroupDrawer from './components/source-group-drawer.vue';
import { PROPS_SHELF_STATUS_OPTIONS } from './shared';

defineOptions({ name: 'PropsSourceGroup' });

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
  id: '',
  limit: 20,
  name: '',
  shelfStatus: true as boolean | undefined,
  sysOrigin: sysOriginOptions.value[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 160 },
  { dataIndex: 'name', key: 'name', title: '类型名称', width: 180 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '上/下架', width: 120 },
  { dataIndex: 'rewardConfigList', key: 'rewardConfigList', title: '道具', width: 420 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 240 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePropsActivityRewardGroup({ ...query });
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
  const previous = record.shelfStatus;
  record.shelfStatus = checked;
  try {
    await offPropsActivityRewardGroup(record.id, checked);
    message.success('状态已更新');
  } catch (error) {
    record.shelfStatus = previous;
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

loadData(true);
</script>

<template>
  <Page title="道具资源组配置">
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
        <InlineFilterField label="状态">
          <Select option-label-prop="label"
            v-model:value="query.shelfStatus"
            allow-clear
            style="width: 120px"
            @change="loadData(true)"
          
            :options="PROPS_SHELF_STATUS_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
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
        <InlineFilterField label="类型名称">
          <Input
            v-model:value="query.name"
            allow-clear
            placeholder="类型名称"
            style="width: 180px"
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
        row-key="id"
        :scroll="{ x: 1180 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'shelfStatus'">
            <Switch
              :checked="Boolean(record.shelfStatus)"
              checked-children="上架"
              un-checked-children="下架"
              @change="
                (checked: boolean) => handleShelfStatusChange(record, checked)
              "
            />
          </template>
          <template v-else-if="column.key === 'rewardConfigList'">
            <RewardRow :list="record.rewardConfigList" />
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建：{{ formatDate(record.createTime) }}</div>
            <div>修改：{{ formatDate(record.updateTime) }}</div>
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

    <SourceGroupDrawer
      :open="formOpen"
      :record="activeRow"
      :sys-origin="query.sysOrigin"
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
