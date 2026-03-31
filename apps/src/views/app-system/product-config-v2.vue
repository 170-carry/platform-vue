<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import type { LegacyProductConfigItem } from '#/api/legacy/app-system';
import {
  addProductConfig,
  listProductConfigs,
  updateProductConfig,
} from '#/api/legacy/app-system';
import { regionConfigTable } from '#/api/legacy/system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  PLATFORM_ORIGINS_V2,
  PRODUCT_SHOWCASE_OPTIONS,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Select,
  SelectOption,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'AppSystemProductConfigV2' });

const accessStore = useAccessStore();

const loading = ref(false);
const regionLoading = ref(false);
const submitLoading = ref(false);
const formOpen = ref(false);
const list = ref<LegacyProductConfigItem[]>([]);
const regions = ref<Array<Record<string, any>>>([]);
const modalTitle = ref('新增内购产品');

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const query = reactive({
  platform: 'AppStore',
  region: '',
  showcase: true,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const form = reactive<Record<string, any>>({
  description: '',
  id: '',
  obtainCandy: '',
  platform: '',
  productPackage: '',
  regionList: [],
  rewardCandy: '',
  showcase: '',
  sort: '',
  sysOrigin: '',
  unitPrice: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'productPackage', key: 'productPackage', title: '包名', width: 260 },
  { dataIndex: 'unitPrice', key: 'unitPrice', title: '产品单价', width: 120 },
  { dataIndex: 'obtainCandy', key: 'obtainCandy', title: '获得糖果数量', width: 140 },
  { dataIndex: 'rewardCandy', key: 'rewardCandy', title: '奖励糖果', width: 120 },
  { dataIndex: 'platform', key: 'platform', title: '平台', width: 120 },
  { dataIndex: 'regionNameStr', key: 'regionNameStr', title: '区域', width: 180 },
  { dataIndex: 'description', key: 'description', title: '描述', width: 180 },
  { dataIndex: 'sort', key: 'sort', title: '序号', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

function createFormState() {
  return {
    description: '',
    id: '',
    obtainCandy: '',
    platform: '',
    productPackage: '',
    regionList: [],
    rewardCandy: '',
    showcase: '',
    sort: '',
    sysOrigin: '',
    unitPrice: '',
  };
}

function resetForm() {
  Object.assign(form, createFormState());
}

async function loadRegions() {
  regionLoading.value = true;
  try {
    regions.value = await regionConfigTable({ sysOrigin: query.sysOrigin });
  } finally {
    regionLoading.value = false;
  }
}

async function loadData() {
  loading.value = true;
  try {
    list.value = await listProductConfigs({ ...query });
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData();
}

function handleSysOriginChange() {
  query.region = '';
  loadRegions();
  loadData();
}

function openCreate() {
  modalTitle.value = '新增内购产品';
  resetForm();
  formOpen.value = true;
}

function openUpdate(record: LegacyProductConfigItem) {
  modalTitle.value = '修改内购产品';
  resetForm();
  form.description = record.description ?? '';
  form.id = record.id ?? '';
  form.obtainCandy = record.obtainCandy ?? '';
  form.platform = record.platform ?? '';
  form.productPackage = record.productPackage ?? '';
  form.regionList = Array.isArray(record.regionList) ? [...record.regionList] : [];
  form.rewardCandy = record.rewardCandy ?? '';
  form.showcase = record.showcase ?? true;
  form.sort = record.sort ?? '';
  form.sysOrigin = record.sysOrigin ?? '';
  form.unitPrice = record.unitPrice ?? '';
  formOpen.value = true;
}

function validateForm() {
  if (!form.platform) {
    message.warning('请选择支付平台');
    return false;
  }
  if (!Array.isArray(form.regionList) || form.regionList.length === 0) {
    message.warning('请选择区域');
    return false;
  }
  if (form.showcase === '' || form.showcase === null || form.showcase === undefined) {
    message.warning('请选择状态');
    return false;
  }
  if (!String(form.productPackage || '').trim()) {
    message.warning('请输入包名');
    return false;
  }
  if (!String(form.unitPrice || '').trim()) {
    message.warning('请输入单价');
    return false;
  }
  if (!String(form.obtainCandy || '').trim()) {
    message.warning('请输入获得糖果数');
    return false;
  }
  if (!String(form.sort || '').trim()) {
    message.warning('请输入序号');
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
      ...form,
      description: String(form.description || '').trim(),
      obtainCandy: form.obtainCandy,
      productPackage: String(form.productPackage || '').trim(),
      rewardCandy: form.rewardCandy,
      sort: form.sort,
      sysOrigin: query.sysOrigin,
      unitPrice: form.unitPrice,
    };
    if (!form.id) {
      await addProductConfig(payload);
    } else {
      await updateProductConfig(payload);
    }
    message.success('保存成功');
    formOpen.value = false;
    resetForm();
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

loadRegions();
loadData();
</script>

<template>
  <Page title="内购产品配置V2">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSysOriginChange"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="平台">
          <Select
            v-model:value="query.platform"
            option-label-prop="label"
            style="width: 140px"
            @change="handleSearch"
          
            :options="PLATFORM_ORIGINS_V2.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="状态">
          <Select
            v-model:value="query.showcase"
            option-label-prop="label"
            style="width: 140px"
            @change="handleSearch"
          
            :options="PRODUCT_SHOWCASE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="区域">
          <Select
            v-model:value="query.region"
            :loading="regionLoading"
            allow-clear
            option-label-prop="label"
            placeholder="区域"
            style="width: 160px"
            @change="handleSearch"
          
            :options="regions.map((item) => ({ label: `${item.regionName}`, value: item.id as any }))"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button @click="openCreate">添加</Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1540 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openUpdate(record)">
              修改
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      ok-text="保存"
      :title="modalTitle"
      width="720"
      @cancel="formOpen = false"
      @ok="handleSubmit"
    >
      <div class="form-grid">
        <div class="form-item">
          <label class="form-label">平台</label>
          <Select option-label-prop="label" v-model:value="form.platform" placeholder="支付平台">
            <SelectOption
              v-for="item in PLATFORM_ORIGINS_V2"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">区域</label>
          <Select option-label-prop="label"
            v-model:value="form.regionList"
            :loading="regionLoading"
            mode="multiple"
            placeholder="请选择区域"
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

        <div class="form-item">
          <label class="form-label">状态</label>
          <Select option-label-prop="label" v-model:value="form.showcase" placeholder="状态">
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
          <label class="form-label">包名</label>
          <input v-model="form.productPackage" class="input-control" placeholder="请输入包名">
        </div>

        <div class="form-item">
          <label class="form-label">产品单价</label>
          <input v-model="form.unitPrice" class="input-control" placeholder="请输入单价" type="number">
        </div>

        <div class="form-item">
          <label class="form-label">获得糖果数量</label>
          <input v-model="form.obtainCandy" class="input-control" placeholder="请输入获得糖果数量">
        </div>

        <div class="form-item">
          <label class="form-label">奖励糖果</label>
          <input v-model="form.rewardCandy" class="input-control" placeholder="请输入奖励糖果">
        </div>

        <div class="form-item">
          <label class="form-label">描述</label>
          <input v-model="form.description" class="input-control" placeholder="请输入描述">
        </div>

        <div class="form-item">
          <label class="form-label">顺序</label>
          <input
            v-model="form.sort"
            class="input-control"
            placeholder="数字越小越靠前(升序排列)"
            type="number"
          >
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
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

.input-control {
  background: #fff;
  border: 1px solid #d9e0ea;
  border-radius: 8px;
  min-height: 32px;
  padding: 0 11px;
}
</style>
