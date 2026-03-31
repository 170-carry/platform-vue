<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  deleteStartPagePlan,
  pageStartPagePlans,
  } from '#/api/legacy/system';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Modal,
  Pagination,
  Select,
  Table,
  Tag,
  message
} from 'antdv-next';

import StartPageFormModal from './components/start-page-form-modal.vue';

defineOptions({ name: 'OperateStartPageConfig' });

const APP_START_PAGE_PLAN_TYPES = [
  { name: '游戏王', value: 'KING_GAMES' },
  { name: 'CP', value: 'CP' },
];

const accessStore = useAccessStore();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  showcase: 1,
  sysOrigin: '',
  type: 'KING_GAMES',
});

const columns: any[] = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 100 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 140 },
  { dataIndex: 'type', key: 'type', title: '活动类型', width: 140 },
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 260 },
  { dataIndex: 'expireTime', key: 'expireTime', title: '过期时间', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140, fixed: 'right' as const },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);

function getTypeName(value?: string) {
  return APP_START_PAGE_PLAN_TYPES.find((item) => item.value === value)?.name || value || '-';
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageStartPagePlans({ ...query });
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
  activeRow.value = null;
  formOpen.value = true;
}

function handleUpdate(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？【不可恢复】',
    async onOk() {
      await deleteStartPagePlan(record.id);
      message.success('删除成功');
      await loadData();
    },
  });
}
</script>

<template>
  <Page title="App启动页">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.showcase"
          style="width: 120px"
          @change="handleSearch"
        
          :options="[{ label: '正常', value: 1 as any }, { label: '过期', value: 0 as any }]"
        />
        <Select option-label-prop="label"
          v-model:value="query.type"
          style="width: 160px"
          @change="handleSearch"
        
          :options="APP_START_PAGE_PLAN_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="handleCreate">新增</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <Tag>{{ record.sysOrigin || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'type'">
            {{ getTypeName(record.type) }}
          </template>
          <template v-else-if="column.key === 'cover'">
            <Image :src="record.cover" class="cover" />
          </template>
          <template v-else-if="column.key === 'expireTime'">
            {{ formatDate(record.expireTime) }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-row">
              <Button size="small" type="link" @click="handleUpdate(record)">
                修改
              </Button>
              <Button size="small" type="link" danger @click="handleDelete(record)">
                删除
              </Button>
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
    </Card>

    <StartPageFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.toolbar,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar {
  margin-bottom: 16px;
}

.cover {
  border-radius: 12px;
  height: 111px;
  object-fit: cover;
  width: 200px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
