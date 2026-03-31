<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addOrUpdateGlobalization,
  addOrUpdateHallFame,
  globalizationDelete,
  globalizationTable,
  hallFameTable,
} from '#/api/legacy/activity';
import { getAllowedSysOrigins, LANGUAGE_OPTIONS } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateHallFame' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const editOpen = ref(false);
const editSaving = ref(false);
const languageOpen = ref(false);
const languageLoading = ref(false);
const languageList = ref<Array<Record<string, any>>>([]);
const languageFormOpen = ref(false);
const languageSaving = ref(false);
const selectedHallFameId = ref('');
const selectedHallFameRow = ref<Record<string, any> | null>(null);

const query = reactive({
  cursor: 1,
  del: 'false',
  limit: 20,
  sysOrigin: '',
});

const editForm = reactive({
  accounts: '',
  del: false as any,
  id: '',
  notes: '',
  sort: '',
  sysOrigin: '',
});

const languageForm = reactive({
  description: '',
  id: '',
  language: '',
  relationId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 120 },
  { dataIndex: 'notes', key: 'notes', title: '备注', width: 180 },
  { dataIndex: 'accounts', key: 'accounts', title: '用户账号', width: 220 },
  { dataIndex: 'sort', key: 'sort', title: '顺序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 180 },
];

const languageColumns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 80 },
  { dataIndex: 'language', key: 'language', title: '语言', width: 120 },
  { dataIndex: 'description', key: 'description', title: '描述', width: 320 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 150 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await hallFameTable({ ...query });
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

function openCreate() {
  Object.assign(editForm, {
    accounts: '',
    del: false,
    id: '',
    notes: '',
    sort: '',
    sysOrigin: query.sysOrigin,
  });
  editOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  Object.assign(editForm, {
    accounts: record.accounts || '',
    del: record.del,
    id: String(record.id || ''),
    notes: record.notes || '',
    sort: String(record.sort || ''),
    sysOrigin: record.sysOrigin || query.sysOrigin,
  });
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.notes.trim() || !editForm.accounts.trim()) {
    message.warning('请补全备注和用户账号');
    return;
  }
  editSaving.value = true;
  try {
    await addOrUpdateHallFame({
      ...editForm,
      sysOrigin: query.sysOrigin,
    });
    message.success('保存成功');
    editOpen.value = false;
    await loadData(!editForm.id);
  } finally {
    editSaving.value = false;
  }
}

async function openLanguages(record: Record<string, any>) {
  selectedHallFameId.value = String(record.id || '');
  selectedHallFameRow.value = record;
  languageOpen.value = true;
  await loadLanguages();
}

async function loadLanguages() {
  if (!selectedHallFameId.value) {
    return;
  }
  languageLoading.value = true;
  try {
    languageList.value = await globalizationTable(selectedHallFameId.value);
  } finally {
    languageLoading.value = false;
  }
}

function openCreateLanguage() {
  Object.assign(languageForm, {
    description: '',
    id: '',
    language: '',
    relationId: selectedHallFameId.value,
  });
  languageFormOpen.value = true;
}

function openEditLanguage(record: Record<string, any>) {
  Object.assign(languageForm, {
    description: record.description || '',
    id: String(record.id || ''),
    language: record.language || '',
    relationId: selectedHallFameId.value,
  });
  languageFormOpen.value = true;
}

async function submitLanguage() {
  if (!languageForm.language || !languageForm.description.trim()) {
    message.warning('请补全语言和描述');
    return;
  }
  languageSaving.value = true;
  try {
    await addOrUpdateGlobalization({
      ...languageForm,
      relationId: selectedHallFameId.value,
    });
    message.success('保存成功');
    languageFormOpen.value = false;
    await loadLanguages();
  } finally {
    languageSaving.value = false;
  }
}

function removeLanguage(record: Record<string, any>) {
  Modal.confirm({
    title: '确定删除描述吗？',
    async onOk() {
      await globalizationDelete(record.id);
      message.success('删除成功');
      await loadLanguages();
    },
  });
}

loadData(true);
</script>

<template>
  <Page title="自定义名人堂">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px" @change="loadData(true)"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label" v-model:value="query.del" style="width: 120px" @change="loadData(true)"
            :options="[{ label: '上架', value: 'false' as any }, { label: '下架', value: 'true' as any }]"
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
          <template v-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openEdit(record)">编辑</Button>
              <Button size="small" type="link" @click="openLanguages(record)">
                更新描述
              </Button>
            </Space>
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
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <Modal
      :confirm-loading="editSaving"
      :open="editOpen"
      destroy-on-close
      title="名人堂编辑"
      @cancel="editOpen = false"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <FormItem label="中文备注">
          <Input v-model:value="editForm.notes" placeholder="如：斋月活动,方便自己人看" />
        </FormItem>
        <FormItem label="用户长ID">
          <Input
            v-model:value="editForm.accounts"
            placeholder="最多填写两个userId(用户长id),用英语逗号分割"
          />
        </FormItem>
        <FormItem label="顺序">
          <Input v-model:value="editForm.sort" placeholder="顺序(越大越靠前)" />
        </FormItem>
        <FormItem label="上架">
          <Select option-label-prop="label" v-model:value="editForm.del">
            <SelectOption :value="true" label="否">否</SelectOption>
            <SelectOption :value="false" label="是">是</SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>

    <Modal
      :footer="null"
      :open="languageOpen"
      destroy-on-close
      title="描述列表"
      width="960px"
      @cancel="languageOpen = false"
    >
      <div class="toolbar toolbar--inner">
        <Space>
          <Button type="primary" @click="openCreateLanguage">新增描述</Button>
        </Space>
      </div>

      <Table
        :columns="languageColumns"
        :data-source="languageList"
        :loading="languageLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'language'">
            {{
              LANGUAGE_OPTIONS.find((item) => item.value === record.language)?.name ||
                record.language ||
                '-'
            }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openEditLanguage(record)">
                修改
              </Button>
              <Button danger size="small" type="link" @click="removeLanguage(record)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      :confirm-loading="languageSaving"
      :open="languageFormOpen"
      destroy-on-close
      title="活动描述"
      @cancel="languageFormOpen = false"
      @ok="submitLanguage"
    >
      <Form layout="vertical">
        <FormItem label="语言">
          <Select option-label-prop="label" v-model:value="languageForm.language" :disabled="!!languageForm.id">
            <SelectOption
              v-for="item in LANGUAGE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="活动名称">
          <Input
            v-model:value="languageForm.description"
            :maxlength="200"
            placeholder="请输入活动名称"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.toolbar--inner {
  margin-top: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
