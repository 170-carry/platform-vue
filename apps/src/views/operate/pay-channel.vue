<script lang="ts" setup>
import {
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';

import { pagePayChannel } from '#/api/legacy/pay';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Input,
  Pagination,
  Select,
  Table
} from 'antdv-next';

import { PAY_CHANNEL_GROUP_NAME_MAP, PAY_CHANNEL_GROUP_OPTIONS } from './pay-shared';

import PayChannelEditModal from './components/pay-channel-edit-modal.vue';

defineOptions({ name: 'OperatePayChannel' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<Record<string, any>>({});

const query = reactive<Record<string, any>>({
  channelCode: '',
  channelName: '',
  channelType: '',
  cursor: 1,
  limit: 30,
});

const columns: any[] = [
  { dataIndex: 'channelCode', key: 'channelCode', title: 'Code', width: 180 },
  { dataIndex: 'channelName', key: 'channelName', title: '名称', width: 200 },
  { dataIndex: 'channelIcon', key: 'channelIcon', title: 'Icon', width: 120 },
  { dataIndex: 'channelType', key: 'channelType', title: '类型', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePayChannel({ ...query });
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

function handleEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

void loadData(true);
</script>

<template>
  <Page title="支付渠道">
    <Card>
      <div class="toolbar">
        <Select option-label-prop="label"
          v-model:value="query.channelType"
          allow-clear
          placeholder="渠道类型"
          style="width: 200px"
          @change="handleSearch"
        
          :options="PAY_CHANNEL_GROUP_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Input
          v-model:value="query.channelCode"
          placeholder="渠道Code"
          style="width: 220px"
        />
        <Input
          v-model:value="query.channelName"
          placeholder="渠道名称"
          style="width: 220px"
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
          <template v-if="column.key === 'channelIcon'">
            <Image
              :preview="false"
              :src="record.channelIcon"
              class="icon"
            />
          </template>
          <template v-else-if="column.key === 'channelType'">
            {{ PAY_CHANNEL_GROUP_NAME_MAP[record.channelType] || record.channelType || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" @click="handleEdit(record)">编辑</Button>
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

    <PayChannelEditModal
      :open="formOpen"
      :row="activeRow"
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

.icon {
  border-radius: 10px;
  height: 48px;
  width: 48px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
