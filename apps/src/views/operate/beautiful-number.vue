<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  addNumber,
  deleteNumber,
  numberTable,
  updateNumber,
} from '#/api/legacy/user';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Cascader,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  message,
} from 'antdv-next';

import {
  BEAUTIFUL_NUMBER_GROUP_OPTIONS,
  BEAUTIFUL_NUMBER_STATUS_OPTIONS,
} from './constants';

defineOptions({ name: 'OperateBeautifulNumber' });

function createForm() {
  return {
    SysGroup: [] as string[],
    gold: '',
    id: '',
    status: undefined as any,
    tabs: [] as Array<Record<string, any>>,
    userAccount: '',
    worth: '',
  };
}

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);
const groups = ref<string[]>([]);

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  status: undefined,
  tabName: '',
  typeName: '',
  userAccount: '',
});

const form = reactive(createForm());

const beautifulNumberSaleOptions = [
  { label: '不可售卖', value: 0 as any },
  { label: '可售卖', value: 1 as any },
];

const columns = [
  { dataIndex: 'userAccount', key: 'userAccount', title: '靓号', width: 140 },
  { dataIndex: 'gold', key: 'gold', title: '金币', width: 120 },
  { dataIndex: 'worth', key: 'worth', title: '价值(美元)', width: 120 },
  { dataIndex: 'status', key: 'status', title: '是否可售卖', width: 120 },
  { dataIndex: 'tabName', key: 'tabName', title: 'Tab分组', width: 140 },
  { dataIndex: 'typeName', key: 'typeName', title: '二级类型', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120 },
];

function syncGroupQuery() {
  query.tabName = groups.value?.[0] || '';
  query.typeName = groups.value?.[1] || '';
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  syncGroupQuery();
  loading.value = true;
  try {
    const result = await numberTable({ ...query });
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

function resetForm() {
  Object.assign(form, createForm());
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  Object.assign(form, createForm(), {
    SysGroup: [record.tabName, record.typeName].filter(Boolean),
    gold: String(record.gold ?? ''),
    id: String(record.id || ''),
    status: record.status,
    userAccount: record.userAccount || '',
    worth: String(record.worth ?? ''),
  });
  modalOpen.value = true;
}

async function submitForm() {
  if (!String(form.userAccount || '').trim()) {
    message.warning('请填写靓号');
    return;
  }
  if (!form.SysGroup?.length) {
    message.warning('请选择分组');
    return;
  }
  if (form.status === undefined || form.status === null || form.status === '') {
    message.warning('请选择售卖类型');
    return;
  }
  if (!String(form.gold || '').trim()) {
    message.warning('请填写金币');
    return;
  }
  if (!String(form.worth || '').trim()) {
    message.warning('请填写价值');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      gold: form.gold,
      id: form.id,
      status: form.status,
      tabs: [
        {
          tabName: form.SysGroup[0],
          typeName: form.SysGroup[1],
        },
      ],
      userAccount: String(form.userAccount || '').trim(),
      worth: form.worth,
    };
    if (form.id) {
      await updateNumber(payload);
    } else {
      await addNumber(payload);
    }
    message.success('保存成功');
    modalOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteNumber(record.id);
      message.success('删除成功');
      await loadData(true);
    },
  });
}

void loadData(true);
</script>

<template>
  <Page title="靓号池管理">
    <Card>
      <div class="toolbar">
        <Select option-label-prop="label"
          v-model:value="query.status"
          allow-clear
          placeholder="类型"
          style="width: 120px"
        
          :options="BEAUTIFUL_NUMBER_STATUS_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
        />
        <Input
          v-model:value="query.userAccount"
          placeholder="靓号"
          style="width: 200px"
        />
        <Cascader
          v-model:value="groups"
          :options="BEAUTIFUL_NUMBER_GROUP_OPTIONS"
          allow-clear
          placeholder="分组"
          style="width: 240px"
        />
        <Space>
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="openCreate">新增</Button>
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
          <template v-if="column.key === 'status'">
            {{
              BEAUTIFUL_NUMBER_STATUS_OPTIONS.find(
                (item) => item.value === record.status,
              )?.label || '-'
            }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="Number(record.status) !== 2"
                size="small"
                type="link"
                @click="openEdit(record)"
              >
                修改
              </Button>
              <Button
                v-if="Number(record.status) !== 2"
                danger
                size="small"
                type="link"
                @click="handleDelete(record)"
              >
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
      :open="modalOpen"
      destroy-on-close
      :title="form.id ? '修改' : '新增'"
      @cancel="modalOpen = false"
      @ok="submitForm"
    >
      <Form :label-col="{ span: 6 }" :model="form" :wrapper-col="{ span: 16 }">
        <FormItem label="靓号">
          <Input
            v-model:value="form.userAccount"
            :disabled="Boolean(form.id)"
            placeholder="请输入靓号"
          />
        </FormItem>
        <FormItem label="分组">
          <Cascader
            v-model:value="form.SysGroup"
            :options="BEAUTIFUL_NUMBER_GROUP_OPTIONS"
            allow-clear
            placeholder="请选择分组"
          />
        </FormItem>
        <FormItem label="售卖类型">
          <Select
            v-model:value="form.status"
            :options="beautifulNumberSaleOptions"
            option-label-prop="label"
            placeholder="请选择售卖类型"
          />
        </FormItem>
        <FormItem label="金币">
          <Input v-model:value="form.gold" placeholder="请输入金币" />
        </FormItem>
        <FormItem label="价值(美元)">
          <Input v-model:value="form.worth" placeholder="请输入价值" />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
