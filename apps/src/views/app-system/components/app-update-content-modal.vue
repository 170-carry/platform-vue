<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import type { LegacyVersionDescriptionItem } from '#/api/legacy/app-system';
import {
  addAppVersionDescription,
  delAppVersionDescription,
  getAppVersionDescriptionTable,
  updateAppVersionDescription,
} from '#/api/legacy/app-system';
import { formatDate, LANGUAGE_OPTIONS } from '#/views/system/shared';

import {
  Button,
  Form,
  FormItem,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  TextArea,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  versionId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const submitLoading = ref(false);
const total = ref(0);
const formOpen = ref(false);
const list = ref<LegacyVersionDescriptionItem[]>([]);
const formTitle = ref('新增描述');

const query = reactive({
  cursor: 1,
  limit: 20,
  versionId: '',
});

const form = reactive<Record<string, any>>({
  id: '',
  language: '',
  updateDescribe: '',
  updateWorshipDescribe: '',
  versionId: '',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 100 },
  { dataIndex: 'language', key: 'language', title: '语言', width: 120 },
  { dataIndex: 'updateDescribe', key: 'updateDescribe', title: '描述' },
  {
    dataIndex: 'updateWorshipDescribe',
    key: 'updateWorshipDescribe',
    title: '朝拜描述',
  },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120 },
];

function resetForm() {
  form.id = '';
  form.language = '';
  form.updateDescribe = '';
  form.updateWorshipDescribe = '';
  form.versionId = '';
}

function getLanguageName(value?: string) {
  return LANGUAGE_OPTIONS.find((item) => item.value === value)?.name || value || '-';
}

async function loadData(reset = false) {
  if (!query.versionId) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getAppVersionDescriptionTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.versionId],
  ([open, versionId]) => {
    if (!open || !versionId) {
      return;
    }
    query.versionId = String(versionId);
    loadData(true);
  },
  { immediate: true },
);

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function handleCreate() {
  resetForm();
  formTitle.value = '新增描述';
  formOpen.value = true;
}

function handleUpdate(record: LegacyVersionDescriptionItem) {
  form.id = record.id ?? '';
  form.language = record.language ?? '';
  form.updateDescribe = record.updateDescribe ?? '';
  form.updateWorshipDescribe = record.updateWorshipDescribe ?? '';
  form.versionId = record.versionId ?? '';
  formTitle.value = '修改描述';
  formOpen.value = true;
}

function validateForm() {
  if (!form.language) {
    message.warning('请选择语言');
    return false;
  }
  if (!String(form.updateDescribe || '').trim()) {
    message.warning('请输入更新描述');
    return false;
  }
  if (String(form.updateDescribe).length > 500) {
    message.warning('更新描述最大 500 字符');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }

  submitLoading.value = true;
  try {
    const payload = {
      id: form.id,
      language: form.language,
      updateDescribe: String(form.updateDescribe || '').trim(),
      updateWorshipDescribe: String(form.updateWorshipDescribe || '').trim(),
      versionId: query.versionId,
    };
    if (!form.id) {
      await addAppVersionDescription(payload);
    } else {
      await updateAppVersionDescription(payload);
    }
    message.success('保存成功');
    formOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(record: LegacyVersionDescriptionItem) {
  Modal.confirm({
    title: '确定删除描述吗？',
    async onOk() {
      await delAppVersionDescription(record.id as number | string);
      message.success('删除成功');
      await loadData(true);
    },
  });
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="描述列表"
    width="1100"
    @cancel="emit('close')"
  >
    <div class="toolbar">
      <Button type="primary" @click="handleCreate">新增描述</Button>
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
        <template v-if="column.key === 'language'">
          {{ getLanguageName(record.language) }}
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space>
            <Button size="small" type="link" @click="handleUpdate(record)">
              修改
            </Button>
            <Button size="small" type="link" @click="handleDelete(record)">
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

    <Modal
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      ok-text="保存"
      :title="formTitle"
      width="520"
      @cancel="formOpen = false; resetForm()"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem label="语言">
          <Select option-label-prop="label"
            v-model:value="form.language"
            :disabled="submitLoading || Boolean(form.id)"
            placeholder="请选择语言"
          >
            <SelectOption
              v-for="item in LANGUAGE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="更新描述">
          <TextArea
            v-model:value="form.updateDescribe"
            :rows="5"
            placeholder="请输入更新描述"
          />
        </FormItem>
        <FormItem label="更新朝拜描述">
          <TextArea
            v-model:value="form.updateWorshipDescribe"
            :rows="5"
            placeholder="请输入更新朝拜描述"
          />
        </FormItem>
      </Form>
    </Modal>
  </Modal>
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
