<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { pagePayFactory } from '#/api/legacy/pay';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Input,
  Pagination,
  Table,
} from 'antdv-next';

import PayFactoryAssociatedModal from './components/pay-factory-associated-modal.vue';
import PayFactoryEditModal from './components/pay-factory-edit-modal.vue';

defineOptions({ name: 'OperatePayFactory' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const associatedOpen = ref(false);
const activeRow = ref<Record<string, any>>({});

const query = reactive<Record<string, any>>({
  cursor: 1,
  factoryCode: '',
  factoryName: '',
  limit: 30,
});

const columns: any[] = [
  { dataIndex: 'factoryCode', key: 'factoryCode', title: 'Code', width: 180 },
  { dataIndex: 'factoryName', key: 'factoryName', title: '名称', width: 220 },
  { dataIndex: 'factoryIcon', key: 'factoryIcon', title: 'Icon', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePayFactory({ ...query });
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

function handleAssociated(record: Record<string, any>) {
  activeRow.value = { ...record };
  associatedOpen.value = true;
}

void loadData(true);
</script>

<template>
  <Page title="支付厂商">
    <Card>
      <div class="toolbar">
        <Input
          v-model:value="query.factoryCode"
          placeholder="厂商code"
          style="width: 220px"
        />
        <Input
          v-model:value="query.factoryName"
          placeholder="厂商名称"
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
          <template v-if="column.key === 'factoryIcon'">
            <Image
              :preview="false"
              :src="record.factoryIcon"
              class="icon"
            />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" @click="handleAssociated(record)">
              关联渠道
            </Button>
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

    <PayFactoryEditModal
      :open="formOpen"
      :row="activeRow"
      @close="formOpen = false"
      @success="loadData(true)"
    />

    <PayFactoryAssociatedModal
      :factory-code="String(activeRow.factoryCode || '')"
      :open="associatedOpen"
      @close="associatedOpen = false"
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
