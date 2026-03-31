<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addUserFriendshipCardConfig,
  updateUserFriendshipCardConfig,
  userFriendshipCardConfigTable,
} from '#/api/legacy/system';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateFriendshipCard' });

const CARD_OPTIONS = [
  { label: '知己', value: 'CONFIDANT' },
  { label: '兄弟', value: 'BROTHER' },
  { label: '姐妹', value: 'SISTER' },
  { label: '兄弟、姐妹', value: 'BROTHER_SISTER' },
  { label: '亲密的朋友', value: 'CLOSE_FRIEND' },
];

const SHOWCASE_OPTIONS = [
  { label: '上架', value: true },
  { label: '下架', value: false },
];

function createForm() {
  return {
    cardBack: '',
    cardMoney: '',
    cardType: '',
    id: '',
    showcase: '',
    sysOrigin: '',
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0
    ? options
    : [{ label: 'HALAR', value: 'HALAR' }];
});

const loading = ref(false);
const saving = ref(false);
const uploadLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const query = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});

const form = reactive(createForm());

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'cardBack', key: 'cardBack', title: '图片', width: 120 },
  { dataIndex: 'cardType', key: 'cardType', title: '类型', width: 180 },
  { dataIndex: 'showcase', key: 'showcase', title: '状态', width: 120 },
  { dataIndex: 'cardMoney', key: 'cardMoney', title: '金额', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

const isEditing = computed(() => Boolean(form.id));

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || 'HALAR');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function resetForm() {
  Object.assign(form, createForm(), {
    sysOrigin: query.sysOrigin || String(sysOriginOptions.value[0]?.value || 'HALAR'),
  });
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openUpdate(record: Record<string, any>) {
  Object.assign(form, createForm(), {
    cardBack: record.cardBack || '',
    cardMoney: String(record.cardMoney ?? ''),
    cardType: record.cardType || '',
    id: String(record.id || ''),
    showcase: record.showcase,
    sysOrigin: record.sysOrigin || query.sysOrigin,
  });
  modalOpen.value = true;
}

function closeModal() {
  if (saving.value) {
    return;
  }
  modalOpen.value = false;
  resetForm();
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    list.value = [];
    total.value = 0;
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await userFriendshipCardConfigTable({ ...query });
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

function openUpload() {
  fileInput.value?.click();
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.cardBack = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    uploadLoading.value = false;
    target.value = '';
  }
}

function validateForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.cardBack) {
    message.warning('请上传图片');
    return false;
  }
  if (form.showcase === '') {
    message.warning('请选择状态');
    return false;
  }
  if (!form.cardType) {
    message.warning('请选择卡片类型');
    return false;
  }
  if (!String(form.cardMoney || '').trim()) {
    message.warning('请填写金额');
    return false;
  }
  return true;
}

async function submitForm() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    const payload = {
      cardBack: form.cardBack,
      cardMoney: String(form.cardMoney || '').trim(),
      cardType: form.cardType,
      id: form.id,
      showcase: form.showcase,
      sysOrigin: form.sysOrigin,
    };
    if (isEditing.value) {
      await updateUserFriendshipCardConfig(payload);
    } else {
      await addUserFriendshipCardConfig(payload);
    }
    message.success('保存成功');
    modalOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page title="用户友谊卡配置">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Button @click="openCreate">新增</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 920 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cardBack'">
            <Image
              :src="record.cardBack"
              class="card-image"
            />
          </template>
          <template v-else-if="column.key === 'showcase'">
            {{ record.showcase === true ? '上架' : '下架' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openUpdate(record)">
              修改
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
        />
      </div>
    </Card>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      :title="isEditing ? '修改' : '添加'"
      width="520px"
      @cancel="closeModal"
    >
      <div class="form-grid">
        <div class="field">
          <div class="label">系统</div>
          <SysOriginSelect v-model:value="form.sysOrigin" style="width: 100%"
            :options="sysOriginOptions"
          ></SysOriginSelect>
        </div>
        <div class="field">
          <div class="label">图片</div>
          <input
            ref="fileInput"
            accept="image/png,image/jpg,image/jpeg"
            class="hidden-input"
            type="file"
            @change="handleFileChange"
          >
          <div class="upload-box">
            <Image
              v-if="form.cardBack"
              :src="form.cardBack"
              class="upload-preview"
            />
            <Button :loading="uploadLoading" @click="openUpload">
              {{ form.cardBack ? '重新上传' : '点击上传' }}
            </Button>
          </div>
        </div>
        <div class="field">
          <div class="label">状态</div>
          <Select option-label-prop="label" v-model:value="form.showcase" style="width: 100%">
            <SelectOption
              v-for="item in SHOWCASE_OPTIONS"
              :key="String(item.value)"
              :value="item.value"
             :label="`${item.label}`">
              {{ item.label }}
            </SelectOption>
          </Select>
        </div>
        <div class="field">
          <div class="label">卡片</div>
          <Select option-label-prop="label" v-model:value="form.cardType" style="width: 100%">
            <SelectOption
              v-for="item in CARD_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.label}`">
              {{ item.label }}
            </SelectOption>
          </Select>
        </div>
        <div class="field">
          <div class="label">金额</div>
          <Input
            v-model:value="form.cardMoney"
            placeholder="金额"
            type="number"
          />
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <Button :disabled="saving" @click="closeModal">取消</Button>
          <Button :loading="saving" type="primary" @click="submitForm">
            保存
          </Button>
        </div>
      </template>
    </Modal>
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

.card-image {
  border-radius: 8px;
  height: 80px;
  overflow: hidden;
  width: 60px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.hidden-input {
  display: none;
}

.upload-box {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-preview {
  border-radius: 10px;
  height: 120px;
  overflow: hidden;
  width: 96px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
