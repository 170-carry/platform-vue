<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { getUserStatusLogTable } from '#/api/legacy/approval';
import { formatDate } from '#/views/system/shared';

import { Modal, Pagination, Table } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  beApprovalUser: '',
  cursor: 1,
  limit: 20,
});

const columns = [
  { dataIndex: 'statusName', key: 'statusName', title: '审批类型', width: 160 },
  {
    dataIndex: 'approvalUserName',
    key: 'approvalUserName',
    title: '审批人',
    width: 220,
  },
  { dataIndex: 'createTime', key: 'createTime', title: '审批时间', width: 180 },
  { dataIndex: 'description', key: 'description', title: '备注' },
];

watch(
  () => [props.open, props.userId],
  ([open, userId]) => {
    if (!open || !userId) {
      return;
    }
    query.beApprovalUser = String(userId);
    loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.beApprovalUser) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getUserStatusLogTable({ ...query });
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

function resolveApprovalUser(record: Record<string, any>) {
  if (!record.approvalUserName) {
    return '待处理';
  }
  return record.originType
    ? `${record.approvalUserName} (App)`
    : `${record.approvalUserName} (后台)`;
}
</script>

<template>
  <Modal
    :open="open"
    destroy-on-close
    title="账号处理记录"
    width="960"
    @cancel="emit('close')"
    @ok="emit('close')"
  >
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 760 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'approvalUserName'">
          {{ resolveApprovalUser(record) }}
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'description'">
          <div class="desc-cell">{{ record.description || '-' }}</div>
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
  </Modal>
</template>

<style scoped>
.desc-cell {
  white-space: normal;
  word-break: break-word;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
