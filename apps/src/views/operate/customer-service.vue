<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addCustomerService,
  deleteCustomerService,
  listCustomerService,
  regionConfigTable,
  updateCustomerService,
} from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  CheckboxGroup,
  Input,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  message,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateCustomerService' });

function createForm() {
  return {
    id: '',
    regionList: [] as Array<number | string>,
    timeSlots: [] as number[],
    userId: '',
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const timeSlotList = Array.from({ length: 24 }, (_, index) => index);
const loading = ref(false);
const regionsLoading = ref(false);
const saving = ref(false);
const modalOpen = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);

const query = reactive({
  region: '',
  sysOrigin: '',
});

const form = reactive(createForm());

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '来源系统', width: 120 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '客服', width: 280 },
  { dataIndex: 'regionNameStr', key: 'regionNameStr', title: '区域', width: 220 },
  { dataIndex: 'timeSlots', key: 'timeSlots', title: '上班时间段', width: 360 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

const tableScroll = computed(() => ({ x: 1260 }));
const isEditing = computed(() => Boolean(form.id));

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
    query.region = '';
    void loadRegions();
    void loadData();
  },
  { immediate: true },
);

function resetForm() {
  Object.assign(form, createForm());
}

function fillForm(record?: Record<string, any> | null) {
  resetForm();
  if (!record) {
    return;
  }
  const regionList = String(record.regions || '')
    .split(',')
    .filter(Boolean);
  Object.assign(form, {
    id: String(record.id || ''),
    regionList,
    timeSlots: Array.isArray(record.timeSlots)
      ? record.timeSlots.map((item: any) => Number(item))
      : [],
    userId:
      record.userProfile?.account ||
      record.userProfile?.actualAccount ||
      record.userProfile?.id ||
      '',
  });
}

async function loadRegions() {
  if (!query.sysOrigin) {
    regions.value = [];
    return;
  }
  regionsLoading.value = true;
  try {
    regions.value = await regionConfigTable({ sysOrigin: query.sysOrigin });
  } finally {
    regionsLoading.value = false;
  }
}

async function loadData() {
  if (!query.sysOrigin) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    list.value = await listCustomerService(query.sysOrigin, query.region || '');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData();
}

function openCreate() {
  fillForm(null);
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  fillForm(record);
  modalOpen.value = true;
}

function closeModal() {
  if (saving.value) {
    return;
  }
  modalOpen.value = false;
  resetForm();
}

async function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await deleteCustomerService(record.id);
      message.success('删除成功');
      await loadData();
    },
    title: '确定删除客服人员吗？',
  });
}

function validateForm() {
  if (!isEditing.value && !String(form.userId || '').trim()) {
    message.warning('请填写客服');
    return false;
  }
  if (!Array.isArray(form.regionList) || form.regionList.length <= 0) {
    message.warning('请选择区域');
    return false;
  }
  if (!Array.isArray(form.timeSlots) || form.timeSlots.length <= 0) {
    message.warning('请选择时间段');
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
      id: form.id,
      regionList: [...form.regionList],
      sysOrigin: query.sysOrigin,
      timeSlots: [...form.timeSlots].sort((left, right) => left - right),
      userId: String(form.userId || '').trim(),
    };
    if (isEditing.value) {
      await updateCustomerService(payload);
    } else {
      await addCustomerService(payload);
    }
    message.success(isEditing.value ? '修改成功' : '添加成功');
    modalOpen.value = false;
    resetForm();
    await loadData();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page title="客服列表">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label"
            v-model:value="query.region"
            allow-clear
            :loading="regionsLoading"
            placeholder="区域"
            style="width: 160px"
            @change="handleSearch"
          
            :options="regions.map((item) => ({ label: `${item.regionName}`, value: item.id as any }))"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="openCreate">新增</Button>
        </Space>
      </div>

      <Alert
        banner
        :closable="false"
        message="排班统一“上海时间”,不区分国家,时差等因素"
        type="success"
      />

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'timeSlots'">
            <div class="time-slot-list">
              <span
                v-for="item in record.timeSlots || []"
                :key="`${record.id}-${item}`"
                class="time-slot-tag"
              >
                {{ item }}:00
              </span>
            </div>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Button size="small" type="link" @click="openEdit(record)">
                修改
              </Button>
              <Button size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      :title="isEditing ? '修改' : '新增'"
      width="960px"
      @cancel="closeModal"
    >
      <div class="form-grid">
        <div class="field">
          <div class="label">平台</div>
          <Input :value="query.sysOrigin" disabled />
        </div>
        <div v-if="!isEditing" class="field">
          <div class="label">客服</div>
          <AccountInput
            v-model:value="form.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
          />
        </div>
        <div class="field">
          <div class="label">区域</div>
          <Select option-label-prop="label"
            v-model:value="form.regionList"
            mode="multiple"
            :loading="regionsLoading"
            placeholder="请选择区域"
            style="width: 100%"
          >
            <SelectOption
              v-for="item in regions"
              :key="item.id"
              :value="item.id"
             :label="`${item.regionName}`">
              {{ item.regionName }}
            </SelectOption>
          </Select>
        </div>
        <div class="field">
          <div class="label">时间段</div>
          <CheckboxGroup v-model:value="form.timeSlots" class="time-slot-picker">
            <Checkbox
              v-for="slot in timeSlotList"
              :key="slot"
              :value="slot"
            >
              {{ slot }}:00
            </Checkbox>
          </CheckboxGroup>
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <Button :disabled="saving" @click="closeModal">取消</Button>
          <Button :loading="saving" type="primary" @click="submitForm">
            {{ isEditing ? '修改' : '添加' }}
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

.time-slot-list,
.time-slot-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-slot-tag {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  padding: 4px 10px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
