<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  pagePayOpenCounty,
  updatePayOpenCountryCurrent,
  updatePayOpenCountryExchangeRate,
  updatePayOpenCountrySort,
  updatePayOpenCountyShelf,
  } from '#/api/legacy/pay';

import {
  Button,
  Card,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Switch,
  Table,
  message
} from 'antdv-next';

import PayCountryAssociatedChannelsModal from './components/pay-country-associated-channels-modal.vue';
import PayCountrySelectModal from './components/pay-country-select-modal.vue';

defineOptions({ name: 'OperatePayCountry' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const countrySelectOpen = ref(false);
const associatedOpen = ref(false);
const activeRow = ref<Record<string, any>>({});
const editOpen = ref(false);
const editLoading = ref(false);
const editValue = ref('');
const editConfig = reactive({
  field: '' as 'currency' | 'rate' | 'sort' | '',
  title: '',
  rowId: '',
});

const query = reactive<Record<string, any>>({
  countryId: '',
  cursor: 1,
  id: '',
  limit: 30,
  shelf: true,
});

const columns: any[] = [
  { dataIndex: 'country', key: 'country', title: '国家信息', width: 120 },
  { dataIndex: 'aliasName', key: 'aliasName', title: '国家名称', width: 180 },
  { dataIndex: 'currency', key: 'currency', title: '国家货币', width: 160 },
  {
    dataIndex: 'usdExchangeRate',
    key: 'usdExchangeRate',
    title: '美元汇率(?=$)',
    width: 180,
  },
  { dataIndex: 'sort', key: 'sort', title: '展示权重', width: 140 },
  { dataIndex: 'shelf', key: 'shelf', title: '上/下架', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

const shelfOptions = computed(() => [
  { label: '上架', value: true },
  { label: '下架', value: false },
]);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePayOpenCounty({ ...query });
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

function openEdit(row: Record<string, any>, field: 'currency' | 'rate' | 'sort') {
  editConfig.field = field;
  editConfig.rowId = String(row.id || '');
  editConfig.title =
    field === 'currency'
      ? '请输入新的国家货币Code'
      : field === 'rate'
        ? '请输入新的美元汇率'
        : '请输入新的权重数';
  editValue.value =
    field === 'currency'
      ? String(row.currency || '')
      : field === 'rate'
        ? String(row.usdExchangeRate || '')
        : String(row.sort || '');
  editOpen.value = true;
}

function validateEditValue() {
  if (editConfig.field === 'currency') {
    return true;
  }
  if (editConfig.field === 'rate') {
    return /^\d{1,5}(\.\d{0,8})?$/.test(editValue.value);
  }
  if (editConfig.field === 'sort') {
    return /^\d{1,5}$/.test(editValue.value);
  }
  return false;
}

async function submitEdit() {
  if (!validateEditValue()) {
    message.warning(
      editConfig.field === 'rate'
        ? '范围0~99999小数最多八位'
        : editConfig.field === 'sort'
          ? '范围0~99999'
          : '请输入正确内容',
    );
    return;
  }
  editLoading.value = true;
  try {
    if (editConfig.field === 'currency') {
      await updatePayOpenCountryCurrent(editConfig.rowId, editValue.value);
    } else if (editConfig.field === 'rate') {
      await updatePayOpenCountryExchangeRate(editConfig.rowId, editValue.value);
    } else if (editConfig.field === 'sort') {
      await updatePayOpenCountrySort(editConfig.rowId, editValue.value);
    }
    message.success('保存成功');
    editOpen.value = false;
    await loadData();
  } finally {
    editLoading.value = false;
  }
}

async function handleSwitchChange(record: Record<string, any>, checked: boolean) {
  const previous = !checked;
  try {
    await updatePayOpenCountyShelf(record.id, checked);
  } catch {
    record.shelf = previous;
  }
}

function openAssociated(row: Record<string, any>) {
  activeRow.value = row;
  associatedOpen.value = true;
}

void loadData(true);
</script>

<template>
  <Page title="开通支付国家">
    <Card>
      <div class="toolbar">
        <Select option-label-prop="label"
          v-model:value="query.shelf"
          style="width: 140px"
          @change="handleSearch"
        
          :options="shelfOptions.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
        />
        <Button type="primary" @click="countrySelectOpen = true">添加</Button>
        <Button type="primary" @click="handleSearch">刷新</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'country'">
            <Image
              :preview="false"
              :src="record.country?.nationalFlag"
              class="flag"
            />
          </template>
          <template v-else-if="column.key === 'aliasName'">
            {{ record.country?.aliasName || '-' }}
          </template>
          <template v-else-if="column.key === 'currency'">
            <Button type="link" @click="openEdit(record, 'currency')">
              {{ record.currency || '点击输入货币' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'usdExchangeRate'">
            <Button type="link" @click="openEdit(record, 'rate')">
              {{ record.usdExchangeRate || '点击入汇率' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'sort'">
            <Button type="link" @click="openEdit(record, 'sort')">
              {{ record.sort || '点击输入权重' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'shelf'">
            <Switch
              v-model:checked="record.shelf"
              @change="(checked) => handleSwitchChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button type="link" @click="openAssociated(record)">关联渠道</Button>
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

    <PayCountrySelectModal
      :open="countrySelectOpen"
      @close="countrySelectOpen = false"
      @success="loadData(true)"
    />

    <PayCountryAssociatedChannelsModal
      :open="associatedOpen"
      :row="activeRow"
      @close="associatedOpen = false"
    />

    <Modal
      :confirm-loading="editLoading"
      :open="editOpen"
      :title="editConfig.title"
      @cancel="editOpen = false"
      @ok="submitEdit"
    >
      <Input v-model:value="editValue" />
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

.flag {
  height: 30px;
  width: 45px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
