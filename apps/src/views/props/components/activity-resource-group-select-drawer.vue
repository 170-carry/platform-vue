<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { pagePropsActivityRewardGroup } from '#/api/legacy/props';

import {
  Button,
  Drawer,
  Input,
  Pagination,
  Select,
  Space,
  Table,
} from 'antdv-next';

import RewardRow from './reward-row.vue';
import { PROPS_SHELF_STATUS_OPTIONS } from '../shared';

const props = defineProps<{
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  select: [row: Record<string, any>];
}>();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  id: '',
  limit: 20,
  name: '',
  shelfStatus: true as boolean | undefined,
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 140 },
  { dataIndex: 'name', key: 'name', title: '类型名称', width: 180 },
  { dataIndex: 'rewardConfigList', key: 'rewardConfigList', title: '道具', width: 360 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '状态', width: 100 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

const shelfStatusOptions = PROPS_SHELF_STATUS_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

async function loadData(reset = false) {
  if (!props.open || !query.sysOrigin) {
    return;
  }
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

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    query.cursor = 1;
    query.id = '';
    query.name = '';
    query.shelfStatus = true;
    query.sysOrigin = props.sysOrigin;
    void loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    :open="open"
    title="关联资源组"
    width="960"
    @close="emit('close')"
  >
    <Space class="toolbar" wrap>
      <Select
        v-model:value="query.shelfStatus"
        allow-clear
        :options="shelfStatusOptions"
        option-label-prop="label"
        placeholder="请选择状态"
        style="width: 120px"
        @change="loadData(true)"
      />
      <Input
        v-model:value="query.id"
        allow-clear
        placeholder="ID"
        style="width: 180px"
      />
      <Input
        v-model:value="query.name"
        allow-clear
        placeholder="类型名称"
        style="width: 180px"
      />
      <Button :loading="loading" type="primary" @click="loadData(true)">
        搜索
      </Button>
    </Space>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 860 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'rewardConfigList'">
          <RewardRow :list="record.rewardConfigList" />
        </template>
        <template v-else-if="column.key === 'shelfStatus'">
          {{ record.shelfStatus ? '上架' : '下架' }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button size="small" type="primary" @click="emit('select', record)">
            选择
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
  </Drawer>
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
