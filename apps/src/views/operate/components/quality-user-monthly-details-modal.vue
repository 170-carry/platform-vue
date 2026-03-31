<script lang="ts" setup>
import { ref, watch } from 'vue';

import { pageQualityUsersDetails } from '#/api/legacy/statistics';

import { Modal, Pagination, Table, Tag } from 'antdv-next';

import { getRechargeTypeDes } from '../shared';

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
const query = ref<Record<string, any>>({
  cursor: 1,
  limit: 20,
  userId: '',
});

const columns = [
  { dataIndex: 'rechargeDate', key: 'rechargeDate', title: '日期', width: 120 },
  { dataIndex: 'total', key: 'total', title: '总额', width: 100 },
  { dataIndex: 'recharges', key: 'recharges', title: '充值明细', width: 520 },
];

watch(
  () => ({ open: props.open, userId: props.userId }),
  ({ open, userId }) => {
    if (!open || !userId) {
      return;
    }
    query.value.cursor = 1;
    query.value.userId = String(userId);
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (reset) {
    query.value.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageQualityUsersDetails({ ...query.value });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.value.cursor = page;
  query.value.limit = pageSize;
  void loadData();
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="每月明细"
    width="960px"
    @cancel="emit('close')"
  >
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="rechargeDate"
      :scroll="{ x: 800, y: 420 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'recharges'">
          <div class="tag-row">
            <Tag
              v-for="(item, index) in record.recharges || []"
              :key="index"
              color="blue"
            >
              {{ getRechargeTypeDes(item.type) }}:{{ item.amount }}
            </Tag>
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
  </Modal>
</template>

<style scoped>
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
