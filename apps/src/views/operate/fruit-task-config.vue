<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addOrUpdateGameFruitBountyConfig,
  deleteGameFruitBountyConfig,
  getGameFruitBountyConfigTable,
} from '#/api/legacy/game-fruit-task';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import FruitTaskDetailsDrawer from './components/fruit-task-details-drawer.vue';

defineOptions({ name: 'OperateFruitTaskConfig' });

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
const detailsOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const query = reactive({
  bountyType: '',
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});

const form = reactive({
  bountyType: '',
  id: '',
  name: '',
  sort: '',
  sysOrigin: '',
});

const BOUNTY_TYPE_OPTIONS = [
  { label: '每日', value: 'DAILY' },
  { label: '每周', value: 'WEEKLY' },
  { label: '每周(争霸赛)', value: 'WEEKLY_COMPETITION' },
];

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 120 },
  { dataIndex: 'bountyType', key: 'bountyType', title: '类型', width: 140 },
  { dataIndex: 'name', key: 'name', title: '名称', width: 220 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

function getBountyTypeLabel(value?: string) {
  return BOUNTY_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

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
    const result = await getGameFruitBountyConfigTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.bountyType = '';
  form.id = '';
  form.name = '';
  form.sort = '';
  form.sysOrigin = query.sysOrigin;
}

function openCreate() {
  resetForm();
  editOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  form.bountyType = record.bountyType ?? '';
  form.id = String(record.id || '');
  form.name = record.name ?? '';
  form.sort = String(record.sort ?? '');
  form.sysOrigin = record.sysOrigin ?? query.sysOrigin;
  editOpen.value = true;
}

async function handleSave() {
  if (!form.bountyType) {
    message.warning('请选择关联类型');
    return;
  }
  if (!form.name.trim()) {
    message.warning('请输入名称');
    return;
  }
  if (!form.sort) {
    message.warning('请输入排序');
    return;
  }
  saving.value = true;
  try {
    await addOrUpdateGameFruitBountyConfig({
      bountyType: form.bountyType,
      id: form.id || undefined,
      name: form.name.trim(),
      sort: Number(form.sort || 0),
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
      await deleteGameFruitBountyConfig(record.id);
      message.success('删除成功');
      await loadData();
    },
  });
}

function openDetails(record: Record<string, any>) {
  activeRow.value = { ...record };
  detailsOpen.value = true;
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}
</script>

<template>
  <Page title="摩天轮任务配置">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="loadData(true)"
            :options="sysOriginOptions"
          />
          <Select
            option-label-prop="label"
            v-model:value="query.bountyType"
            allow-clear
            placeholder="关联类型"
            style="width: 180px"
            @change="loadData(true)"
          
            :options="BOUNTY_TYPE_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <Button :loading="loading" type="primary" @click="loadData(true)">
            搜索
          </Button>
          <Button type="primary" @click="openCreate">
            添加
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 980 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'bountyType'">
            <Tag>{{ getBountyTypeLabel(record.bountyType) }}</Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="openDetails(record)">
                奖励配置
              </Button>
              <Button danger size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
            </Space>
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

    <Modal
      :confirm-loading="saving"
      :open="editOpen"
      destroy-on-close
      :title="form.id ? '编辑任务配置' : '新增任务配置'"
      width="520px"
      @cancel="editOpen = false"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <FormItem label="关联类型">
          <Select
            v-model:value="form.bountyType"
            allow-clear
            :options="BOUNTY_TYPE_OPTIONS"
            option-label-prop="label"
            placeholder="类型"
          />
        </FormItem>
        <FormItem label="名称">
          <Input v-model:value="form.name" placeholder="名称" />
        </FormItem>
        <FormItem label="排序">
          <Input v-model:value="form.sort" placeholder="排序" />
        </FormItem>
      </Form>
    </Modal>

    <FruitTaskDetailsDrawer
      :bounty-info="activeRow"
      :open="detailsOpen"
      @close="detailsOpen = false"
      @success="loadData()"
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
