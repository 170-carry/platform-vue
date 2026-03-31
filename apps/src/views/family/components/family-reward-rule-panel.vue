<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  addOrUpdateFamilyRewardRule,
  pageFamilyRewardRule,
  } from '#/api/legacy/family';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Form,
  FormItem,
  InputNumber,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'FamilyRewardRulePanel' });

function createForm(defaultSysOrigin = '') {
  return {
    goalExp: undefined as number | undefined,
    id: undefined as number | string | undefined,
    rewardQuantity: undefined as number | undefined,
    sort: undefined as number | undefined,
    sysOrigin: defaultSysOrigin,
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);

const query = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});

const form = reactive(createForm());

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'goalExp', key: 'goalExp', title: '任务所需贡献值', width: 180 },
  { dataIndex: 'rewardQuantity', key: 'rewardQuantity', title: '奖励糖果数', width: 160 },
  { dataIndex: 'sort', key: 'sort', title: '顺序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageFamilyRewardRule({ ...query });
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

function resetForm() {
  Object.assign(form, createForm(sysOriginOptions.value[0]?.value || ''));
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  Object.assign(form, createForm(), {
    goalExp: record.goalExp ?? undefined,
    id: record.id,
    rewardQuantity: record.rewardQuantity ?? undefined,
    sort: record.sort ?? undefined,
    sysOrigin: record.sysOrigin || '',
  });
  modalOpen.value = true;
}

function validateForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (form.goalExp === undefined || form.goalExp === null) {
    message.warning('请输入任务贡献值');
    return false;
  }
  if (form.rewardQuantity === undefined || form.rewardQuantity === null) {
    message.warning('请输入奖励糖果数');
    return false;
  }
  if (form.sort === undefined || form.sort === null) {
    message.warning('请输入奖励顺序');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    await addOrUpdateFamilyRewardRule({ ...form });
    message.success('保存成功');
    modalOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

void loadData(true);
</script>

<template>
  <div class="panel-grid">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <Button @click="openCreate">添加</Button>
        </Space>
      </div>

      <Alert class="warning-alert" message="一个系统只能有三条家族每周奖励规则!" type="warning" show-icon />

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 860 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" @click="openEdit(record)">修改</Button>
          </template>
        </template>
      </Table>

      <div class="pagination">
        <Pagination
          :current="query.cursor"
          :page-size="query.limit"
          :total="total"
          show-size-changer
          @change="handlePageChange"
        />
      </div>
    </Card>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      destroy-on-close
      :title="form.id ? '修改家族奖励规则' : '新增家族奖励规则'"
      width="520px"
      @cancel="
        modalOpen = false;
        resetForm();
      "
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem v-if="!form.id" label="系统">
          <SysOriginSelect v-model:value="form.sysOrigin"
            :options="sysOriginOptions"
          ></SysOriginSelect>
        </FormItem>
        <FormItem label="任务贡献值">
          <InputNumber
            v-model:value="form.goalExp"
            :min="0"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="奖励糖果数">
          <InputNumber
            v-model:value="form.rewardQuantity"
            :min="0"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="顺序">
          <InputNumber
            v-model:value="form.sort"
            :min="0"
            style="width: 100%"
          />
        </FormItem>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.panel-grid {
  display: grid;
  gap: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.warning-alert {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
