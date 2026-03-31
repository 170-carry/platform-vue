<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { useAccessStore } from '@vben/stores';

import type {
  LegacyEmojiGroupItem,
  LegacyEmojiItem,
} from '#/api/legacy/app-system';
import {
  addOrUpdateEmojiConfig,
  listEmojiGroupsBySysOrigin,
  offShelfEmojiById,
  pageEmojiConfigs,
} from '#/api/legacy/app-system';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  EMOJI_SOURCE_TYPE_OPTIONS,
  EMOJI_TYPE_OPTIONS,
  PRODUCT_SHOWCASE_OPTIONS,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

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
const groupLoading = ref(false);
const submitLoading = ref(false);
const coverUploading = ref(false);
const sourceUploading = ref(false);
const total = ref(0);
const list = ref<LegacyEmojiItem[]>([]);
const groupList = ref<LegacyEmojiGroupItem[]>([]);
const formOpen = ref(false);
const coverInputRef = ref<HTMLInputElement>();
const sourceInputRef = ref<HTMLInputElement>();

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const query = reactive<Record<string, any>>({
  cursor: 1,
  groupId: '',
  limit: 20,
  shelfStatus: undefined,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  type: undefined,
});

const form = reactive<Record<string, any>>({
  coverUrl: '',
  groupId: '',
  id: '',
  shelfStatus: '',
  sort: '',
  sourceType: '',
  sourceUrl: '',
  sysOrigin: '',
  type: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'sourceType', key: 'sourceType', title: '资源类型', width: 120 },
  { dataIndex: 'coverUrl', key: 'coverUrl', title: '封面', width: 120 },
  { dataIndex: 'groupName', key: 'groupName', title: '分组', width: 160 },
  { dataIndex: 'type', key: 'type', title: '表情类型', width: 120 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '上/下架', width: 120 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

function createFormState() {
  return {
    coverUrl: '',
    groupId: '',
    id: '',
    shelfStatus: '',
    sort: '',
    sourceType: '',
    sourceUrl: '',
    sysOrigin: '',
    type: '',
  };
}

function resetForm() {
  Object.assign(form, createFormState());
}

async function loadGroupList(reset = false) {
  if (reset) {
    query.groupId = '';
  }
  groupLoading.value = true;
  try {
    groupList.value = await listEmojiGroupsBySysOrigin(query.sysOrigin);
  } finally {
    groupLoading.value = false;
  }
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageEmojiConfigs({ ...query });
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

function handleSysOriginChange() {
  loadGroupList(true);
  loadData(true);
}

function openCreate() {
  resetForm();
  formOpen.value = true;
}

function openEdit(record: LegacyEmojiItem) {
  resetForm();
  form.coverUrl = record.coverUrl ?? '';
  form.groupId = record.groupId ?? '';
  form.id = record.id ?? '';
  form.shelfStatus = record.shelfStatus ?? '';
  form.sort = record.sort ?? '';
  form.sourceType = record.sourceType ?? '';
  form.sourceUrl = record.sourceUrl ?? '';
  form.sysOrigin = record.sysOrigin ?? '';
  form.type = record.type ?? '';
  formOpen.value = true;
}

function openCoverPicker() {
  coverInputRef.value?.click();
}

function openSourcePicker() {
  sourceInputRef.value?.click();
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
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.svgasource);
    form.coverUrl = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    coverUploading.value = false;
  }
}

async function handleSourceFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  sourceUploading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.svgasource);
    form.sourceUrl = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    sourceUploading.value = false;
  }
}

function validateForm() {
  if (!form.groupId) {
    message.warning('请选择分组');
    return false;
  }
  if (!String(form.coverUrl || '').trim()) {
    message.warning('请上传封面');
    return false;
  }
  if (!form.type) {
    message.warning('请选择类型');
    return false;
  }
  if (form.shelfStatus === '' || form.shelfStatus === null || form.shelfStatus === undefined) {
    message.warning('请选择上架状态');
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
    await addOrUpdateEmojiConfig({
      ...form,
      sysOrigin: query.sysOrigin,
    });
    message.success('保存成功');
    formOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    submitLoading.value = false;
  }
}

async function handleShelfStatusChange(record: LegacyEmojiItem, checked: boolean) {
  const previous = record.shelfStatus;
  record.shelfStatus = checked;
  try {
    await offShelfEmojiById(record.id as number | string);
    await loadData(true);
  } catch (error) {
    record.shelfStatus = previous;
    throw error;
  }
}

function getSourceTypeName(value: number | string) {
  return (
    EMOJI_SOURCE_TYPE_OPTIONS.find((item) => item.value === Number(value))?.name ||
    value ||
    '-'
  );
}

function getTypeName(value?: string) {
  return EMOJI_TYPE_OPTIONS.find((item) => item.value === value)?.name || value || '-';
}

loadGroupList(true);
loadData(true);
</script>

<template>
  <div>
    <InlineFilterToolbar class="toolbar">
      <InlineFilterField label="系统">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSysOriginChange"

          :options="sysOriginOptions"
        ></SysOriginSelect>
      </InlineFilterField>
      <InlineFilterField label="分组">
        <Select
          v-model:value="query.groupId"
          :loading="groupLoading"
          allow-clear
          option-label-prop="label"
          placeholder="分组"
          style="width: 160px"
          @change="loadData(true)"
        >
          <SelectOption
            v-for="item in groupList"
            :key="item.id"
            :value="item.id"
           :label="`${item.groupName}`">
            {{ item.groupName }}
          </SelectOption>
        </Select>
      </InlineFilterField>
      <InlineFilterField label="类型">
        <Select
          v-model:value="query.type"
          allow-clear
          option-label-prop="label"
          placeholder="类型"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption
            v-for="item in EMOJI_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </InlineFilterField>
      <InlineFilterField label="状态">
        <Select
          v-model:value="query.shelfStatus"
          allow-clear
          option-label-prop="label"
          placeholder="状态"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption
            v-for="item in PRODUCT_SHOWCASE_OPTIONS"
            :key="String(item.value)"
            :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
      </InlineFilterField>
      <Button :loading="loading" type="primary" @click="loadData(true)">
        搜索
      </Button>
      <Button @click="openCreate">新增</Button>
    </InlineFilterToolbar>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1380 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'sysOrigin'">
          <Tag>{{ record.sysOrigin || '-' }}</Tag>
        </template>
        <template v-else-if="column.key === 'sourceType'">
          {{ getSourceTypeName(record.sourceType as number | string) }}
        </template>
        <template v-else-if="column.key === 'coverUrl'">
          <img
            :src="record.coverUrl || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=IMG'"
            alt=""
            class="cover-image"
          >
        </template>
        <template v-else-if="column.key === 'groupName'">
          {{ record.group?.groupName || '-' }}
        </template>
        <template v-else-if="column.key === 'type'">
          {{ getTypeName(record.type) }}
        </template>
        <template v-else-if="column.key === 'shelfStatus'">
          <Switch
            :checked="Boolean(record.shelfStatus)"
            checked-children="上架"
            un-checked-children="下架"
            @change="(checked: boolean) => handleShelfStatusChange(record, checked)"
          />
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button size="small" type="link" @click="openEdit(record)">
            修改
          </Button>
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
      :title="form.id ? '修改' : '添加'"
      width="700"
      @cancel="formOpen = false"
      @ok="handleSubmit"
    >
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">分组</label>
          <Select option-label-prop="label"
            v-model:value="form.groupId"
            :loading="groupLoading"
            placeholder="请选择分组"
          >
            <SelectOption
              v-for="item in groupList"
              :key="item.id"
              :value="item.id"
             :label="`${item.groupName}`">
              {{ item.groupName }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">资源类型</label>
          <Select option-label-prop="label" v-model:value="form.sourceType" placeholder="资源类型">
            <SelectOption
              v-for="item in EMOJI_SOURCE_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">封面</label>
          <div class="upload-row">
            <Button :loading="coverUploading" @click="openCoverPicker">上传封面</Button>
            <Button v-if="form.coverUrl" type="link" @click="form.coverUrl = ''">清空</Button>
          </div>
          <img
            v-if="form.coverUrl"
            :src="form.coverUrl"
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
          <label class="form-label">svga/gif</label>
          <div class="upload-row">
            <Button :loading="sourceUploading" @click="openSourcePicker">点击上传</Button>
            <Button v-if="form.sourceUrl" type="link" @click="form.sourceUrl = ''">清空</Button>
          </div>
          <a
            v-if="form.sourceUrl"
            :href="form.sourceUrl"
            rel="noreferrer"
            target="_blank"
            class="source-link"
          >
            {{ form.sourceUrl }}
          </a>
          <input
            ref="sourceInputRef"
            accept=".svga,.gif,.pag"
            class="hidden-input"
            type="file"
            @change="handleSourceFileChange"
          >
        </div>

        <div class="form-item">
          <label class="form-label">类型</label>
          <Select option-label-prop="label" v-model:value="form.type" placeholder="类型">
            <SelectOption
              v-for="item in EMOJI_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">上架</label>
          <Select option-label-prop="label" v-model:value="form.shelfStatus" placeholder="上架">
            <SelectOption
              v-for="item in PRODUCT_SHOWCASE_OPTIONS"
              :key="String(item.value)"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">顺序</label>
          <Input v-model:value="form.sort" placeholder="数字越小越靠前" />
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

.upload-row {
  display: flex;
  gap: 8px;
}

.hidden-input {
  display: none;
}

.source-link {
  color: #2563eb;
  overflow-wrap: anywhere;
}
</style>
