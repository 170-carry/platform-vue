<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  addNoticeMessage,
  changeAnnouncementStatus,
  changeShelfStatus,
  deleteNoticeMessage,
  noticeMessageTable,
  updateNoticeMessage,
} from '#/api/legacy/system';
import {
  PRODUCT_SHOWCASE_OPTIONS,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Switch,
  Table,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateNoticeMessage' });

const NOTICE_TYPE_LABELS: Record<string, string> = {
  activity: '活动',
  notification: '通知',
};

const ANNOUNCEMENT_STATUS_OPTIONS = [
  { name: '已发布', value: true },
  { name: '未发布', value: false },
];

const NOTICE_TYPE_OPTIONS = [
  { label: '通知', value: 'notification' as any },
  { label: '活动', value: 'activity' as any },
];

function createForm() {
  return {
    cover: '',
    description: '',
    id: '',
    link: '',
    sysOrigin: '',
    title: '',
    type: '',
  };
}

const accessStore = useAccessStore();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<null | [string, string]>(null);
const formOpen = ref(false);
const submitLoading = ref(false);
const uploadLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  announcement: undefined,
  cursor: 1,
  endTime: '',
  limit: 20,
  shelfStatus: undefined,
  startTime: '',
  sysOrigin: '',
});

const form = reactive<Record<string, any>>(createForm());

const columns: any[] = [
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 100 },
  { dataIndex: 'title', key: 'title', title: '标题', width: 180 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '来源系统', width: 120 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 120 },
  { dataIndex: 'link', key: 'link', title: '链接', width: 200 },
  { dataIndex: 'description', key: 'description', title: '描述', width: 260 },
  { dataIndex: 'announcement', key: 'announcement', title: '发布状态', width: 120 },
  { dataIndex: 'announcementTime', key: 'announcementTime', title: '发布时间', width: 180 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '上架状态', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
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
    const result = await noticeMessageTable({ ...query });
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

function handleCreate() {
  Object.assign(form, createForm(), { sysOrigin: query.sysOrigin });
  formOpen.value = true;
}

function handleUpdate(record: Record<string, any>) {
  Object.assign(form, createForm(), record);
  formOpen.value = true;
}

function pickCover() {
  fileInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.cover = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function submitForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!String(form.title || '').trim()) {
    message.warning('请填写标题');
    return;
  }
  if (!String(form.description || '').trim()) {
    message.warning('请填写描述');
    return;
  }
  submitLoading.value = true;
  try {
    if (form.id) {
      await updateNoticeMessage({ ...form });
    } else {
      await addNoticeMessage({ ...form });
    }
    message.success('保存成功');
    formOpen.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteNoticeMessage(id);
      message.success('删除成功');
      await loadData();
    },
  });
}

function handleAnnouncementChange(record: Record<string, any>, checked: boolean) {
  if (!checked) {
    message.error('不可以取消发布');
    return;
  }
  Modal.confirm({
    title: '确认发布公告吗？发布后不可以取消！',
    async onOk() {
      await changeAnnouncementStatus(record.id);
      message.success('发布成功');
      await loadData();
    },
  });
}

async function handleShelfChange(record: Record<string, any>, checked: boolean) {
  await changeShelfStatus(record.id, checked);
  message.success(`${checked ? '上架' : '下架'}成功`);
  await loadData();
}
</script>

<template>
  <Page title="系统公告管理">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"
          :options="sysOriginOptions"
        />
        <Select
          option-label-prop="label"
          v-model:value="query.shelfStatus"
          allow-clear
          placeholder="状态"
          style="width: 120px"
          @change="handleSearch"
        
          :options="PRODUCT_SHOWCASE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Select
          option-label-prop="label"
          v-model:value="query.announcement"
          allow-clear
          placeholder="发布状态"
          style="width: 120px"
          @change="handleSearch"
        
          :options="ANNOUNCEMENT_STATUS_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="handleCreate">
          新增
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1680 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <Image :src="record.cover" class="cover" />
          </template>
          <template v-else-if="column.key === 'sysOrigin'">
            {{ record.sysOrigin || '-' }}
          </template>
          <template v-else-if="column.key === 'type'">
            {{ NOTICE_TYPE_LABELS[record.type] || record.type || '-' }}
          </template>
          <template v-else-if="column.key === 'announcement'">
            <Switch
              :checked="Boolean(record.announcement)"
              @change="handleAnnouncementChange(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'announcementTime'">
            {{ formatDate(record.announcementTime) }}
          </template>
          <template v-else-if="column.key === 'shelfStatus'">
            <Switch
              :checked="Boolean(record.shelfStatus)"
              @change="handleShelfChange(record, $event)"
            />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-row">
              <Button size="small" type="link" @click="handleUpdate(record)">
                修改
              </Button>
              <Button danger size="small" type="link" @click="handleDelete(record.id)">
                删除
              </Button>
            </div>
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
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      :title="form.id ? '修改公告' : '新增公告'"
      width="520px"
      @cancel="formOpen = false"
      @ok="submitForm"
    >
      <div class="form-grid">
        <div class="field">
          <div class="label">封面</div>
          <div class="upload-row">
            <Button :loading="uploadLoading" @click="pickCover">
              上传封面
            </Button>
            <Image v-if="form.cover" :src="form.cover" class="cover" />
          </div>
          <input
            ref="fileInputRef"
            accept="image/png,image/jpg,image/jpeg"
            class="hidden-input"
            type="file"
            @change="handleUpload"
          >
        </div>

        <div class="field">
          <div class="label">系统</div>
          <SysOriginSelect
            v-model:value="form.sysOrigin"
            :options="sysOriginOptions"
          />
        </div>

        <div class="field">
          <div class="label">标题</div>
          <Input v-model:value="form.title" />
        </div>

        <div class="field">
          <div class="label">类型</div>
          <Select
            v-model:value="form.type"
            :options="NOTICE_TYPE_OPTIONS"
            option-label-prop="label"
          />
        </div>

        <div class="field">
          <div class="label">链接</div>
          <Input v-model:value="form.link" />
        </div>

        <div class="field">
          <div class="label">描述</div>
          <TextArea v-model:value="form.description" :rows="6" />
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar {
  margin-bottom: 16px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.field {
  display: grid;
  gap: 8px;
}

.label {
  color: #0f172a;
  font-weight: 600;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.cover {
  border-radius: 12px;
  height: 50px;
  object-fit: cover;
  width: 50px;
}

.hidden-input {
  display: none;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
