<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addOrUpdateStandardConfig,
  deleteStandardConfig,
  standardConfigTable,
  } from '#/api/legacy/game-lucky-gift';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

import LuckyGiftProbabilityDrawer from './components/lucky-gift-probability-drawer.vue';

defineOptions({ name: 'OperateLuckyGiftStandardConfig' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const editOpen = ref(false);
const saving = ref(false);
const probabilityOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const query = reactive({
  cursor: 1,
  limit: 20,
  remarks: '',
  sysOrigin: '',
});

const form = reactive({
  id: '',
  remarks: '',
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 120 },
  { dataIndex: 'remarks', key: 'remarks', title: '名称', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
      form.sysOrigin = query.sysOrigin;
      void loadData(true);
    }
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await standardConfigTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  form.id = '';
  form.sysOrigin = query.sysOrigin;
  form.remarks = '';
  editOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  form.id = record.id ?? '';
  form.sysOrigin = record.sysOrigin ?? query.sysOrigin;
  form.remarks = record.remarks ?? '';
  editOpen.value = true;
}

async function handleSave() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  saving.value = true;
  try {
    await addOrUpdateStandardConfig({
      id: form.id || undefined,
      remarks: form.remarks,
      sysOrigin: query.sysOrigin,
    });
    message.success('保存成功');
    editOpen.value = false;
    await loadData(!form.id);
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteStandardConfig(record.id);
      message.success('删除成功');
      await loadData();
    },
  });
}

function openProbability(record: Record<string, any>) {
  activeRow.value = { ...record };
  probabilityOpen.value = true;
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}
</script>

<template>
  <Page title="幸运礼物规格配置">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="loadData(true)"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Input
            v-model:value="query.remarks"
            allow-clear
            placeholder="名称"
            style="width: 220px"
          />
          <Button :loading="loading" type="primary" @click="loadData(true)">
            搜索
          </Button>
          <Button @click="openCreate">添加</Button>
        </Space>
      </div>

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
            <Space wrap>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="openProbability(record)">
                概率配置
              </Button>
              <Button danger size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
            </Space>
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

    <Modal
      :confirm-loading="saving"
      :open="editOpen"
      :title="form.id ? `修改(${form.sysOrigin || '-'})` : `添加(${query.sysOrigin || '-'})`"
      @cancel="editOpen = false"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <FormItem label="系统">
          <SysOriginSelect v-model:value="form.sysOrigin" disabled
            :options="sysOriginOptions"
          ></SysOriginSelect>
        </FormItem>
        <FormItem label="名称">
          <Input v-model:value="form.remarks" placeholder="名称" />
        </FormItem>
      </Form>
    </Modal>

    <LuckyGiftProbabilityDrawer
      :open="probabilityOpen"
      :standard-info="activeRow"
      @close="probabilityOpen = false"
    />
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
