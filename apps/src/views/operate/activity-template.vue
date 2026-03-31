<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  addTemplate,
  getTemplateById,
  listTemplates,
  updateTemplateName,
} from '#/api/legacy/system';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  message,
} from 'antdv-next';

import ActivityTemplateEditorModal from './components/activity-template-editor-modal.vue';

defineOptions({ name: 'OperateActivityTemplate' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const loadMoreLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notMore = ref(false);

const editorOpen = ref(false);
const activeTemplateId = ref<number | string>('');
const activeRow = ref<Record<string, any> | null>(null);

const nameModalOpen = ref(false);
const nameModalMode = ref<'copy' | 'create' | 'edit'>('create');
const nameValue = ref('');
const nameSaving = ref(false);

const query = reactive({
  id: '',
  lastId: '',
  limit: 20,
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'name', key: 'name', title: '名称', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'creator', key: 'creator', title: '创建/修改人', width: 200 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

function resetList() {
  list.value = [];
  query.lastId = '';
  notMore.value = false;
}

async function loadData(reset = false) {
  if (reset) {
    resetList();
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = (await listTemplates({ ...query })) || [];
    list.value = reset ? result : [...list.value, ...result];
    notMore.value = result.length < query.limit;
    if (list.value.length > 0) {
      const last = list.value[list.value.length - 1];
      if (last) {
        query.lastId = String(last.template?.id || last.id || '');
      }
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openEditor(templateId: number | string) {
  activeTemplateId.value = templateId;
  editorOpen.value = true;
}

function closeEditor() {
  editorOpen.value = false;
  activeTemplateId.value = '';
  if (route.query.id) {
    router.replace({ path: '/operate/manager/activity/template', query: {} });
  }
}

function openNameModal(mode: 'copy' | 'create' | 'edit', row?: Record<string, any>) {
  activeRow.value = row || null;
  nameModalMode.value = mode;
  nameValue.value =
    mode === 'edit' ? String(row?.template?.name || row?.name || '') : '';
  nameModalOpen.value = true;
}

async function handleNameSubmit() {
  const value = nameValue.value.trim();
  if (!value) {
    message.warning('请输入名称');
    return;
  }
  nameSaving.value = true;
  try {
    if (nameModalMode.value === 'create') {
      await addTemplate({
        indexTree: [],
        name: value,
      });
    } else if (nameModalMode.value === 'edit') {
      await updateTemplateName(activeRow.value?.template?.id || activeRow.value?.id, value);
    } else if (activeRow.value) {
      let source = activeRow.value.template || activeRow.value;
      if (!Array.isArray(source.indexTree)) {
        source = await getTemplateById(source.id);
      }
      await addTemplate({
        indexTree: source.indexTree || [],
        name: value,
      });
    }
    message.success('保存成功');
    nameModalOpen.value = false;
    await loadData(true);
  } finally {
    nameSaving.value = false;
  }
}

watch(
  () => route.query.id,
  (value) => {
    if (!value) {
      return;
    }
    activeTemplateId.value = String(value);
    editorOpen.value = true;
  },
  { immediate: true },
);

void loadData(true);
</script>

<template>
  <Page title="活动模版">
    <Card>
      <Space class="toolbar" wrap>
        <Input
          v-model:value="query.id"
          allow-clear
          placeholder="模版ID"
          style="width: 220px"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="openNameModal('create')">
          新增
        </Button>
      </Space>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="template.id"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'id'">
            {{ record.template?.id || '-' }}
          </template>
          <template v-else-if="column.key === 'name'">
            {{ record.template?.name || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.template?.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.template?.updateTime) }}
          </template>
          <template v-else-if="column.key === 'creator'">
            <div>创建：{{ record.createUserName || '-' }}</div>
            <div>修改：{{ record.updateUserName || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button size="small" type="link" @click="openNameModal('edit', record)">
                编辑名称
              </Button>
              <Button
                size="small"
                type="link"
                @click="openEditor(record.template?.id || record.id)"
              >
                编辑模版
              </Button>
              <Button size="small" type="link" @click="openNameModal('copy', record)">
                复制模版
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="load-more">
        <span v-if="notMore">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false)"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <ActivityTemplateEditorModal
      :open="editorOpen"
      :template-id="activeTemplateId"
      @close="closeEditor"
      @success="loadData(true)"
    />

    <Modal
      :confirm-loading="nameSaving"
      :open="nameModalOpen"
      destroy-on-close
      :title="nameModalMode === 'create'
        ? '新增模版'
        : nameModalMode === 'edit'
          ? '编辑模版名称'
          : '复制模版'"
      @cancel="nameModalOpen = false"
      @ok="handleNameSubmit"
    >
      <Input
        v-model:value="nameValue"
        :maxlength="200"
        placeholder="请输入模版名称"
      />
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
