<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import type { LegacyEmojiGroupItem } from '#/api/legacy/app-system';
import {
  addOrUpdateEmojiGroup,
  pageEmojiGroupConfigs,
  switchEmojiGroupShelfStatus,
} from '#/api/legacy/app-system';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Switch,
  Table,
  Tag,
  message,
} from 'antdv-next';

const accessStore = useAccessStore();

const loading = ref(false);
const total = ref(0);
const list = ref<LegacyEmojiGroupItem[]>([]);
const formOpen = ref(false);
const submitLoading = ref(false);
const coverUploading = ref(false);
const coverInputRef = ref<HTMLInputElement>();

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const query = reactive<Record<string, any>>({
  cursor: 1,
  groupCode: '',
  ktvStatus: undefined,
  limit: 20,
  shelfStatus: undefined,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const form = reactive<Record<string, any>>({
  amount: '',
  cover: '',
  groupCode: '',
  groupName: '',
  id: '',
  ktvStatus: 0,
  shelfStatus: 0,
  sort: '',
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'groupCode', key: 'groupCode', title: '编码', width: 180 },
  { dataIndex: 'groupName', key: 'groupName', title: '名称', width: 180 },
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 120 },
  { dataIndex: 'amount', key: 'amount', title: '售卖价格', width: 120 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '上/下架', width: 120 },
  { dataIndex: 'ktvStatus', key: 'ktvStatus', title: 'ktv表情', width: 100 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

function createFormState() {
  return {
    amount: '',
    cover: '',
    groupCode: '',
    groupName: '',
    id: '',
    ktvStatus: 0,
    shelfStatus: 0,
    sort: '',
    sysOrigin: '',
  };
}

function resetForm() {
  Object.assign(form, createFormState());
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageEmojiGroupConfigs({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openCreate() {
  resetForm();
  form.sysOrigin = query.sysOrigin;
  formOpen.value = true;
}

function openEdit(record: LegacyEmojiGroupItem) {
  resetForm();
  form.amount = record.amount ?? '';
  form.cover = record.cover ?? '';
  form.groupCode = record.groupCode ?? '';
  form.groupName = record.groupName ?? '';
  form.id = record.id ?? '';
  form.ktvStatus = Number(record.ktvStatus ?? 0);
  form.shelfStatus = Number(record.shelfStatus ?? 0);
  form.sort = record.sort ?? '';
  form.sysOrigin = record.sysOrigin ?? '';
  formOpen.value = true;
}

function openCoverPicker() {
  coverInputRef.value?.click();
}

async function handleCoverFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  coverUploading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.svgaCover);
    form.cover = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    coverUploading.value = false;
  }
}

function validateForm() {
  if (!form.id && !form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.id && !String(form.groupCode || '').trim()) {
    message.warning('请输入分组Code');
    return false;
  }
  if (!String(form.groupName || '').trim()) {
    message.warning('请输入分组名称');
    return false;
  }
  if (!String(form.cover || '').trim()) {
    message.warning('请上传封面');
    return false;
  }
  if (!String(form.sort || '').trim()) {
    message.warning('请输入权重');
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
    await addOrUpdateEmojiGroup({
      ...form,
      groupCode: String(form.groupCode || '').trim(),
      groupName: String(form.groupName || '').trim(),
      sysOrigin: form.id ? form.sysOrigin : query.sysOrigin,
    });
    message.success('保存成功');
    formOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    submitLoading.value = false;
  }
}

async function handleShelfStatusChange(record: LegacyEmojiGroupItem, checked: boolean) {
  const previous = record.shelfStatus;
  record.shelfStatus = checked ? 1 : 0;
  try {
    await switchEmojiGroupShelfStatus(record.id as number | string, record.shelfStatus);
    await loadData();
  } catch (error) {
    record.shelfStatus = previous;
    throw error;
  }
}

loadData(true);
</script>

<template>
  <div>
    <InlineFilterToolbar class="toolbar">
      <InlineFilterField label="系统">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="loadData(true)"
          :options="sysOriginOptions"
        />
      </InlineFilterField>
      <InlineFilterField label="状态">
        <Select
          option-label-prop="label"
          v-model:value="query.shelfStatus"
          allow-clear
          placeholder="状态"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption :value="1" label="上架">上架</SelectOption>
          <SelectOption :value="0" label="下架">下架</SelectOption>
        </Select>
      </InlineFilterField>
      <InlineFilterField label="KTV">
        <Select
          option-label-prop="label"
          v-model:value="query.ktvStatus"
          allow-clear
          placeholder="KTV表情"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption :value="1" label="是">是</SelectOption>
          <SelectOption :value="0" label="否">否</SelectOption>
        </Select>
      </InlineFilterField>
      <InlineFilterField label="分组Code" :label-width="88">
        <Input
          v-model:value="query.groupCode"
          allow-clear
          placeholder="分组Code"
          style="width: 180px"
        />
      </InlineFilterField>
      <Button :loading="loading" type="primary" @click="loadData(true)">
        搜索
      </Button>
      <Button @click="openCreate">
        新增
      </Button>
    </InlineFilterToolbar>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1280 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'sysOrigin'">
          {{ record.sysOrigin || '-' }}
        </template>
        <template v-else-if="column.key === 'cover'">
          <img
            :src="record.cover || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=G'"
            alt=""
            class="cover-image"
          >
        </template>
        <template v-else-if="column.key === 'shelfStatus'">
          <Switch
            :checked="Number(record.shelfStatus) === 1"
            @change="handleShelfStatusChange(record, $event)"
          />
        </template>
        <template v-else-if="column.key === 'ktvStatus'">
          <Tag :color="Number(record.ktvStatus) === 1 ? 'success' : 'default'">
            {{ Number(record.ktvStatus) === 1 ? '是' : '否' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button size="small" type="link" @click="openEdit(record)">
            编辑
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

    <Modal
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      :title="form.id ? '编辑表情分组' : '新增表情分组'"
      width="560px"
      @cancel="formOpen = false"
      @ok="handleSubmit"
    >
      <div class="form-grid">
        <div v-if="!form.id" class="form-item">
          <label class="form-label">系统</label>
          <SysOriginSelect
            v-model:value="form.sysOrigin"
            :options="sysOriginOptions"
          />
        </div>
        <div v-if="!form.id" class="form-item">
          <label class="form-label">分组Code</label>
          <Input v-model:value="form.groupCode" placeholder="分组Code" />
        </div>
        <div class="form-item">
          <label class="form-label">分组名称</label>
          <Input v-model:value="form.groupName" placeholder="分组名称" />
        </div>
        <div class="form-item">
          <label class="form-label">封面</label>
          <div class="upload-row">
            <Button :loading="coverUploading" @click="openCoverPicker">
              上传封面
            </Button>
            <Button v-if="form.cover" type="link" @click="form.cover = ''">
              清空
            </Button>
          </div>
          <img
            v-if="form.cover"
            :src="form.cover"
            alt=""
            class="cover-preview"
          >
          <input
            ref="coverInputRef"
            accept="image/*"
            class="hidden-input"
            type="file"
            @change="handleCoverFileChange"
          >
        </div>
        <div class="form-item">
          <label class="form-label">售卖价格</label>
          <Input v-model:value="form.amount" placeholder="不填或填0都为免费" />
        </div>
        <div class="form-item">
          <label class="form-label">上/下架</label>
          <Select option-label-prop="label" v-model:value="form.shelfStatus">
            <SelectOption :value="1" label="上架">上架</SelectOption>
            <SelectOption :value="0" label="下架">下架</SelectOption>
          </Select>
        </div>
        <div class="form-item">
          <label class="form-label">ktv表情</label>
          <Select option-label-prop="label" v-model:value="form.ktvStatus">
            <SelectOption :value="1" label="是">是</SelectOption>
            <SelectOption :value="0" label="否">否</SelectOption>
          </Select>
        </div>
        <div class="form-item">
          <label class="form-label">权重</label>
          <Input v-model:value="form.sort" placeholder="数字越大越靠前" />
        </div>
      </div>
    </Modal>
  </div>
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

.cover-image,
.cover-preview {
  border-radius: 12px;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-item {
  display: grid;
  gap: 8px;
}

.form-label {
  color: #334155;
  font-size: 14px;
}

.hidden-input {
  display: none;
}

.upload-row {
  display: flex;
  gap: 8px;
}
</style>
