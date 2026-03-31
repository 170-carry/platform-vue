<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { deleteMikeType,
  mikeTypeTable } from '#/api/legacy/mike';
import { getAllowedSysOrigins } from '#/views/system/shared';

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

import MikeTypeFormModal from './components/mike-type-form-modal.vue';

defineOptions({ name: 'OperateMikeTypeConfig' });

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

const query = reactive<Record<string, any>>({
  chargeType: '',
  cursor: 1,
  limit: 20,
  showcase: 1,
  sysOrigin: sysOriginOptions.value[0]?.value || '',
});

const columns: any[] = [
  { dataIndex: 'mikeCover', key: 'mikeCover', title: '麦位图', width: 220 },
  { dataIndex: 'mikeIcon', key: 'mikeIcon', title: '麦位图标', width: 140 },
  { dataIndex: 'mikeName', key: 'mikeName', title: '麦位名称', width: 140 },
  { dataIndex: 'mikeType', key: 'mikeType', title: '麦位类型', width: 160 },
  { dataIndex: 'fifteenMikeCandy', key: 'fifteenMikeCandy', title: '15天麦位价格', width: 130 },
  { dataIndex: 'longMikeCandy', key: 'longMikeCandy', title: '永久麦位价格', width: 130 },
  { dataIndex: 'chargeType', key: 'chargeType', title: '收费类型', width: 120 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'showcase', key: 'showcase', title: '状态', width: 100 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await mikeTypeTable({ ...query });
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

function openCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteMikeType(record.id);
      message.success('删除成功');
      await loadData();
    },
  });
}

loadData(true);
</script>

<template>
  <Page title="麦位类型管理">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.chargeType"
          allow-clear
          placeholder="收费类型"
          style="width: 140px"
          @change="handleSearch"
        
          :options="[{ label: '金币', value: 'GOLD' as any }, { label: '免费', value: 'FREE' as any }]"
        />
        <Select option-label-prop="label"
          v-model:value="query.showcase"
          style="width: 140px"
          @change="handleSearch"
        
          :options="[{ label: '上架', value: 1 as any }, { label: '下架', value: 2 as any }]"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
        <Button @click="openCreate">新增</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1640 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'mikeCover'">
            <Image :preview="false" :src="record.mikeCover" class="cover" />
          </template>
          <template v-else-if="column.key === 'mikeIcon'">
            <Image :preview="false" :src="record.mikeIcon" class="icon" />
          </template>
          <template v-else-if="column.key === 'chargeType'">
            <Tag :color="record.chargeType === 'GOLD' ? 'red' : 'blue'">
              {{ record.chargeType === 'GOLD' ? '金币' : '免费' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'showcase'">
            <Tag :color="record.showcase ? 'green' : 'red'">
              {{ record.showcase ? '上架' : '下架' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">修改</Button>
            <Button danger size="small" type="link" @click="handleDelete(record)">
              删除
            </Button>
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

    <MikeTypeFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      @close="formOpen = false"
      @success="loadData()"
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

.cover {
  border-radius: 12px;
  height: 84px;
  object-fit: cover;
  width: 180px;
}

.icon {
  border-radius: 12px;
  height: 84px;
  object-fit: cover;
  width: 84px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
