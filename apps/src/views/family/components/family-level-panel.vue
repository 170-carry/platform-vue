<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { listBadgeByType } from '#/api/legacy/badge';
import { listByTab } from '#/api/legacy/gift';
import {
  addOrUpdateFamilyLevelConfig,
  pageFamilyLevelConfig,
} from '#/api/legacy/family';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { listSysOriginTypeList } from '#/api/legacy/props';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Image,
  InputNumber,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import {
  FAMILY_LEVEL_OPTIONS,
  FAMILY_TYPE_OPTIONS,
  buildLabelMap,
} from '../shared';

defineOptions({ name: 'FamilyLevelPanel' });

function createForm() {
  return {
    avatarFrameId: undefined as number | string | undefined,
    badgeId: undefined as number | string | undefined,
    giftId: undefined as number | string | undefined,
    id: undefined as number | string | undefined,
    levelBackgroundPicture: '',
    levelExp: undefined as number | undefined,
    levelKey: '',
    levelType: '',
    maxManager: undefined as number | undefined,
    maxMember: undefined as number | undefined,
    sort: undefined as number | undefined,
    sysOrigin: '',
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const levelLabelMap = buildLabelMap(FAMILY_LEVEL_OPTIONS);
const typeLabelMap = buildLabelMap(FAMILY_TYPE_OPTIONS);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);
const uploadLoading = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);
const avatarFrameOptions = ref<Array<Record<string, any>>>([]);
const badgeOptions = ref<Array<Record<string, any>>>([]);
const giftOptions = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});

const form = reactive(createForm());

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'levelKey', key: 'levelKey', title: '等级', width: 130 },
  { dataIndex: 'levelType', key: 'levelType', title: '等级类型', width: 120 },
  { dataIndex: 'levelExp', key: 'levelExp', title: '等级经验值', width: 140 },
  { dataIndex: 'maxMember', key: 'maxMember', title: '最大成员数', width: 120 },
  { dataIndex: 'maxManager', key: 'maxManager', title: '最大管理员数', width: 130 },
  { dataIndex: 'sort', key: 'sort', title: '顺序', width: 90 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
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

async function loadBadgeOptions() {
  badgeOptions.value = (await listBadgeByType('FAMILY')) || [];
}

async function loadAvatarFrameOptions() {
  if (!form.sysOrigin) {
    avatarFrameOptions.value = [];
    return;
  }
  avatarFrameOptions.value =
    (await listSysOriginTypeList(form.sysOrigin, 'AVATAR_FRAME')) || [];
}

async function loadGiftOptions() {
  if (!form.sysOrigin) {
    giftOptions.value = [];
    return;
  }
  giftOptions.value = (await listByTab(form.sysOrigin, 'FAMILY')) || [];
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageFamilyLevelConfig({ ...query });
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
  Object.assign(form, createForm(), {
    sysOrigin: query.sysOrigin,
  });
  avatarFrameOptions.value = [];
  giftOptions.value = [];
}

async function openCreate() {
  resetForm();
  modalOpen.value = true;
  await loadBadgeOptions();
  await Promise.all([loadAvatarFrameOptions(), loadGiftOptions()]);
}

async function openEdit(record: Record<string, any>) {
  Object.assign(form, createForm(), {
    ...record,
    id: record.id,
    levelBackgroundPicture: record.levelBackgroundPicture || '',
    levelExp: record.levelExp ?? undefined,
    maxManager: record.maxManager ?? undefined,
    maxMember: record.maxMember ?? undefined,
    sort: record.sort ?? undefined,
    sysOrigin: record.sysOrigin || query.sysOrigin,
  });
  modalOpen.value = true;
  await loadBadgeOptions();
  await Promise.all([loadAvatarFrameOptions(), loadGiftOptions()]);
}

function openUpload() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.svgaCover);
    form.levelBackgroundPicture = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
    (event.target as HTMLInputElement).value = '';
  }
}

function handleRemoveCover() {
  form.levelBackgroundPicture = '';
}

async function handleFormSysOriginChange(value: string) {
  form.sysOrigin = value;
  await Promise.all([loadAvatarFrameOptions(), loadGiftOptions()]);
}

function validateForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.id && !form.levelKey) {
    message.warning('请选择等级Key');
    return false;
  }
  if (!form.badgeId) {
    message.warning('请选择等级徽章');
    return false;
  }
  if (form.levelExp === undefined || form.levelExp === null) {
    message.warning('请输入等级经验值');
    return false;
  }
  if (form.maxManager === undefined || form.maxManager === null) {
    message.warning('请输入最大管理员数');
    return false;
  }
  if (form.maxMember === undefined || form.maxMember === null) {
    message.warning('请输入最大成员数');
    return false;
  }
  if (form.sort === undefined || form.sort === null) {
    message.warning('请输入顺序');
    return false;
  }
  if (!form.levelType) {
    message.warning('请选择等级类型');
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
    await addOrUpdateFamilyLevelConfig({ ...form });
    message.success('保存成功');
    modalOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

watch(
  () => query.sysOrigin,
  (value, oldValue) => {
    if (!value || value === oldValue) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <div class="panel-grid">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Button :loading="loading" type="primary" @click="handleSearch">
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
        :scroll="{ x: 1120 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'levelKey'">
            {{ levelLabelMap[record.levelKey] || record.levelKey || '-' }}
          </template>
          <template v-else-if="column.key === 'levelType'">
            <Tag color="blue">
              {{ typeLabelMap[record.levelType] || record.levelType || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
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
      :title="form.id ? '修改家族等级' : '新增家族等级'"
      width="720px"
      @cancel="
        modalOpen = false;
        resetForm();
      "
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <div class="modal-grid">
          <FormItem label="系统">
            <SysOriginSelect
              v-model:value="form.sysOrigin"
              @change="handleFormSysOriginChange"

              :options="sysOriginOptions"
            ></SysOriginSelect>
          </FormItem>
          <FormItem v-if="!form.id" label="等级Key">
            <Select option-label-prop="children" v-model:value="form.levelKey">
              <SelectOption
                v-for="item in FAMILY_LEVEL_OPTIONS"
                :key="item.value"
                :value="item.value"
              >
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="等级类型">
            <Select option-label-prop="children" v-model:value="form.levelType">
              <SelectOption
                v-for="item in FAMILY_TYPE_OPTIONS"
                :key="item.value"
                :value="item.value"
              >
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="头像框">
            <Select option-label-prop="children" v-model:value="form.avatarFrameId" allow-clear>
              <SelectOption
                v-for="item in avatarFrameOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name || item.id }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="徽章">
            <Select option-label-prop="children" v-model:value="form.badgeId">
              <SelectOption
                v-for="item in badgeOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name || item.id }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="礼物">
            <Select option-label-prop="children" v-model:value="form.giftId" allow-clear>
              <SelectOption
                v-for="item in giftOptions"
                :key="item.id"
                :value="item.id"
              >
                {{ item.giftCode ? `${item.giftCode} - ${item.giftName}` : item.giftName || item.id }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="贡献值">
            <InputNumber
              v-model:value="form.levelExp"
              :min="0"
              style="width: 100%"
            />
          </FormItem>
          <FormItem label="管理员数">
            <InputNumber
              v-model:value="form.maxManager"
              :min="0"
              style="width: 100%"
            />
          </FormItem>
          <FormItem label="成员数">
            <InputNumber
              v-model:value="form.maxMember"
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
          <FormItem class="modal-grid__full" label="背景图">
            <div class="upload-row">
              <Image
                v-if="form.levelBackgroundPicture"
                :preview="false"
                :src="form.levelBackgroundPicture"
                class="upload-preview"
              />
              <Button :loading="uploadLoading" @click="openUpload">
                {{ form.levelBackgroundPicture ? '重新上传' : '上传背景图' }}
              </Button>
              <Button v-if="form.levelBackgroundPicture" @click="handleRemoveCover">
                删除
              </Button>
              <input
                ref="fileInputRef"
                accept="image/*"
                class="hidden"
                type="file"
                @change="handleFileChange"
              >
            </div>
          </FormItem>
        </div>
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.modal-grid {
  display: grid;
  gap: 0 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.modal-grid__full {
  grid-column: 1 / -1;
}

.hidden {
  display: none;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.upload-preview {
  border-radius: 12px;
  height: 88px;
  object-fit: cover;
  width: 88px;
}
</style>
