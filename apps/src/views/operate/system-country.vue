<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  pageSysCountryCode,
  updateSysCountryCode,
} from '#/api/legacy/system';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateSystemCountry' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const submitLoading = ref(false);
const uploadLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const query = reactive<Record<string, any>>({
  aliasName: '',
  countryName: '',
  cursor: 1,
  limit: 30,
});

const form = reactive<Record<string, any>>({
  aliasName: '',
  countryName: '',
  id: '',
  nationalFlag: '',
  open: false,
  phonePrefix: '',
  sort: '',
  top: 0,
});

const columns: any[] = [
  { dataIndex: 'countryName', key: 'countryName', title: '国家名称', width: 200 },
  { dataIndex: 'aliasName', key: 'aliasName', title: '别名', width: 160 },
  { dataIndex: 'nationalFlag', key: 'nationalFlag', title: '国旗', width: 120 },
  { dataIndex: 'open', key: 'open', title: '开放状态', width: 120 },
  { dataIndex: 'phonePrefix', key: 'phonePrefix', title: '手机号码前缀', width: 140 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageSysCountryCode({ ...query });
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

function openEdit(record: Record<string, any>) {
  form.aliasName = record.aliasName || '';
  form.countryName = record.countryName || '';
  form.id = record.id || '';
  form.nationalFlag = record.nationalFlag || '';
  form.open = record.open ?? false;
  form.phonePrefix = record.phonePrefix || '';
  form.sort = record.sort || '';
  form.top = record.top ?? 0;
  formOpen.value = true;
}

function pickFlag() {
  fileInputRef.value?.click();
}

async function uploadFlag(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.nationalFlag = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

async function saveForm() {
  if (!form.id) {
    return;
  }
  if (!form.nationalFlag) {
    message.warning('请上传国旗');
    return;
  }
  if (!String(form.countryName || '').trim()) {
    message.warning('请填写国家名称');
    return;
  }
  if (!String(form.phonePrefix || '').trim()) {
    message.warning('请填写手机号前缀');
    return;
  }
  if (!String(form.sort || '').trim()) {
    message.warning('请填写权重序号');
    return;
  }
  submitLoading.value = true;
  try {
    await updateSysCountryCode({ ...form });
    message.success('保存成功');
    formOpen.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

async function updateCountryState(data: Record<string, any>) {
  await updateSysCountryCode(data);
  message.success('操作成功');
  await loadData();
}

loadData(true);
</script>

<template>
  <Page title="国家管理">
    <Card>
      <div class="toolbar">
        <Input
          v-model:value="query.countryName"
          allow-clear
          placeholder="英文国家名称"
          style="width: 220px"
        />
        <Input
          v-model:value="query.aliasName"
          allow-clear
          placeholder="别名"
          style="width: 220px"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'countryName'">
            <div class="name-cell">
              <Tag v-if="record.top === 1" color="red">置顶</Tag>
              <span>{{ record.countryName }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'nationalFlag'">
            <Image :preview="false" :src="record.nationalFlag" class="flag" />
          </template>
          <template v-else-if="column.key === 'open'">
            {{ record.open ? '已开放' : '未开放' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">修改</Button>
            <Button
              v-if="record.top === 0"
              size="small"
              type="link"
              @click="updateCountryState({ id: record.id, top: 1 })"
            >
              置顶
            </Button>
            <Button
              v-else
              size="small"
              type="link"
              @click="updateCountryState({ id: record.id, top: 0 })"
            >
              取消置顶
            </Button>
            <Button
              v-if="record.open === false"
              size="small"
              type="link"
              @click="updateCountryState({ id: record.id, open: true })"
            >
              开放国家
            </Button>
            <Button
              v-else
              size="small"
              type="link"
              @click="updateCountryState({ id: record.id, open: false })"
            >
              取消开放
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
    </Card>

    <Modal
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      title="修改"
      @cancel="formOpen = false"
      @ok="saveForm"
    >
      <Form layout="vertical">
        <FormItem label="国旗">
          <div class="upload-row">
            <Image v-if="form.nationalFlag" :preview="false" :src="form.nationalFlag" class="flag" />
            <Button :loading="uploadLoading" @click="pickFlag">点击上传</Button>
            <input
              ref="fileInputRef"
              accept="image/png,image/jpg,image/jpeg"
              class="hidden"
              type="file"
              @change="uploadFlag"
            >
          </div>
        </FormItem>
        <FormItem label="国家名称">
          <Input v-model:value="form.countryName" />
        </FormItem>
        <FormItem label="别名">
          <Input v-model:value="form.aliasName" />
        </FormItem>
        <FormItem label="手机号前缀">
          <Input v-model:value="form.phonePrefix" />
        </FormItem>
        <FormItem label="权重序号">
          <Input v-model:value="form.sort" />
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

.name-cell {
  align-items: center;
  display: flex;
  gap: 8px;
}

.flag {
  border-radius: 8px;
  height: 30px;
  width: 45px;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.hidden {
  display: none;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
