<script lang="ts" setup>
import {
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { archiveDevicePage,
  delDevice } from '#/api/legacy/tools';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'AppSystemArchiveDevice' });

const accessStore = useAccessStore();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const query = reactive({
  cursor: 1,
  deviceNo: '',
  limit: 20,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'deviceNo', key: 'deviceNo', title: '设备号' },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await archiveDevicePage({ ...query });
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

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await delDevice(record.id);
      message.success('删除成功');
      await loadData(true);
    },
    title: '确认删除该设备吗？',
  });
}

loadData(true);
</script>

<template>
  <Page title="封禁设备">
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
        <InlineFilterField label="设备号">
          <Input
            v-model:value="query.deviceNo"
            allow-clear
            placeholder="设备号"
            style="width: 220px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="handleDelete(record)">
              删除
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
