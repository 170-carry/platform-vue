<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  deductionFreight,
  pageFreight,
  pageFreightRunningWater,
  pageFreightSeller,
  pageFreightSellerRunningWater,
  removeFreightSeller,
  shipFreight,
  showStatusFreight,
  switchStatusDealer,
  switchStatusFreight,
  switchStatusSuperDealer,
  updateSellerQuantity,
} from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  message,
} from 'antdv-next';

import {
  FREIGHT_RECHARGE_TYPE_OPTIONS,
} from './constants';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateUserFreight' });

type ModalMode = 'create' | 'deduct' | 'edit' | 'ship';

function createModalForm() {
  return {
    amount: '',
    earnPoints: '',
    id: '',
    rechargeType: '',
    remark: '',
    sysOrigin: '',
    userId: '',
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);
const runningOpen = ref(false);
const sellerOpen = ref(false);
const sellerRunningOpen = ref(false);
const activeRecord = ref<Record<string, any> | null>(null);
const sellerRecord = ref<Record<string, any> | null>(null);
const sellerList = ref<Array<Record<string, any>>>([]);
const sellerTotal = ref(0);
const sellerLoading = ref(false);
const sellerWaterList = ref<Array<Record<string, any>>>([]);
const sellerWaterTotal = ref(0);
const sellerWaterLoading = ref(false);
const modalMode = ref<ModalMode>('create');

const query = reactive<Record<string, any>>({
  close: undefined,
  cursor: 1,
  dealer: undefined,
  h5Display: undefined,
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const modalForm = reactive(createModalForm());
const sellerQuery = reactive<Record<string, any>>({
  cursor: 1,
  freightId: '',
  limit: 20,
  sysOrigin: '',
});
const sellerWaterQuery = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  userId: '',
});
const sellerQuantityForm = reactive({
  sellerQuantity: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 240 },
  { dataIndex: 'earnPoints', key: 'earnPoints', title: '获得总额', width: 120 },
  { dataIndex: 'consumptionPoints', key: 'consumptionPoints', title: '出货总', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
  { dataIndex: 'h5Display', key: 'h5Display', title: '显示', width: 100 },
  { dataIndex: 'close', key: 'close', title: '正常', width: 100 },
  { dataIndex: 'dealer', key: 'dealer', title: '经销商', width: 100 },
  { dataIndex: 'superDealer', key: 'superDealer', title: '超级经销商', width: 120 },
  { dataIndex: 'sellerQuantity', key: 'sellerQuantity', title: '授权卖家数量', width: 140 },
  { dataIndex: 'realSellerQuantity', key: 'realSellerQuantity', title: '已授权卖家数量', width: 150 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
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

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageFreight({ ...query });
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

function resetModalForm() {
  Object.assign(modalForm, createModalForm(), {
    sysOrigin: query.sysOrigin,
  });
}

function openCreate() {
  modalMode.value = 'create';
  resetModalForm();
  modalOpen.value = true;
}

function openShip(record: Record<string, any>) {
  modalMode.value = 'ship';
  Object.assign(modalForm, createModalForm(), {
    sysOrigin: record.sysOrigin || query.sysOrigin,
    userId: record.userId || record.userBaseInfo?.id || '',
  });
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  modalMode.value = 'edit';
  Object.assign(modalForm, createModalForm(), {
    amount: record.amount || '',
    earnPoints: record.earnPoints || '',
    id: record.id || '',
    rechargeType: record.rechargeType || '',
    remark: record.remark || '',
    sysOrigin: record.sysOrigin || query.sysOrigin,
    userId: record.userId || record.userBaseInfo?.id || '',
  });
  modalOpen.value = true;
}

function openDeduct(record: Record<string, any>) {
  modalMode.value = 'deduct';
  Object.assign(modalForm, createModalForm(), {
    id: record.id || '',
    sysOrigin: record.sysOrigin || query.sysOrigin,
    userId: record.userId || record.userBaseInfo?.id || '',
  });
  modalOpen.value = true;
}

async function submitModal() {
  if (!modalForm.sysOrigin || !modalForm.userId) {
    message.warning('请填写系统和用户ID');
    return;
  }
  if (!String(modalForm.earnPoints || '').trim()) {
    message.warning('请输入金币数量');
    return;
  }
  if (modalMode.value !== 'deduct') {
    if (!String(modalForm.amount || '').trim()) {
      message.warning('请输入金额');
      return;
    }
    if (!String(modalForm.rechargeType || '').trim()) {
      message.warning('请选择充值类型');
      return;
    }
  }
  saving.value = true;
  try {
    if (modalMode.value === 'deduct') {
      await deductionFreight({ ...modalForm });
    } else {
      await shipFreight({ ...modalForm });
    }
    message.success('保存成功');
    modalOpen.value = false;
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

async function handleStatusChange(
  record: Record<string, any>,
  field: 'close' | 'dealer' | 'h5Display' | 'superDealer',
  value: any,
) {
  try {
    if (field === 'h5Display') {
      await showStatusFreight(record.id, value);
    } else if (field === 'close') {
      await switchStatusFreight(record.id, value);
    } else if (field === 'dealer') {
      await switchStatusDealer(record.id, value);
    } else {
      await switchStatusSuperDealer(record.id, value);
    }
    message.success('更新成功');
  } catch {
    record[field] = !value;
  }
}

async function loadRunningWater() {
  if (!activeRecord.value) {
    return;
  }
  const result = await pageFreightRunningWater({
    cursor: 1,
    limit: 20,
    sysOrigin: activeRecord.value.sysOrigin,
    userId: activeRecord.value.userId || activeRecord.value.userBaseInfo?.id,
  });
  activeRecord.value.runningWaters = result.records || [];
}

function openRunningWater(record: Record<string, any>) {
  activeRecord.value = record;
  runningOpen.value = true;
  void loadRunningWater();
}

async function loadSellerData(reset = false) {
  if (reset) {
    sellerQuery.cursor = 1;
  }
  sellerLoading.value = true;
  try {
    const result = await pageFreightSeller({ ...sellerQuery });
    sellerList.value = result.records || [];
    sellerTotal.value = result.total || 0;
  } finally {
    sellerLoading.value = false;
  }
}

function openSellerInfo(record: Record<string, any>) {
  activeRecord.value = record;
  sellerQuery.freightId = record.id;
  sellerQuery.sysOrigin = record.sysOrigin;
  sellerQuantityForm.sellerQuantity = String(record.sellerQuantity || '');
  sellerOpen.value = true;
  void loadSellerData(true);
}

async function submitSellerQuantity() {
  if (!activeRecord.value) {
    return;
  }
  await updateSellerQuantity({
    ...activeRecord.value,
    sellerQuantity: sellerQuantityForm.sellerQuantity,
  });
  message.success('保存成功');
  await loadSellerData(true);
  await loadData(true);
}

function handleSellerPageChange(page: number, pageSize: number) {
  sellerQuery.cursor = page;
  sellerQuery.limit = pageSize;
  void loadSellerData();
}

function handleRemoveSeller(record: Record<string, any>) {
  Modal.confirm({
    title: '此操作将删除该卖家, 是否继续?',
    async onOk() {
      await removeFreightSeller(record.id);
      message.success('删除成功');
      await loadSellerData(true);
    },
  });
}

async function loadSellerRunningWater(reset = false) {
  if (reset) {
    sellerWaterQuery.cursor = 1;
  }
  sellerWaterLoading.value = true;
  try {
    const result = await pageFreightSellerRunningWater({ ...sellerWaterQuery });
    sellerWaterList.value = result.records || [];
    sellerWaterTotal.value = result.total || 0;
  } finally {
    sellerWaterLoading.value = false;
  }
}

function openSellerRunningWater(record: Record<string, any>) {
  sellerRecord.value = record;
  sellerWaterQuery.userId = record.userId || record.userBaseInfo?.id || '';
  sellerRunningOpen.value = true;
  void loadSellerRunningWater(true);
}

function handleSellerWaterPageChange(page: number, pageSize: number) {
  sellerWaterQuery.cursor = page;
  sellerWaterQuery.limit = pageSize;
  void loadSellerRunningWater();
}

void loadData(true);
</script>

<template>
  <Page title="货运代理">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"
          :options="sysOriginOptions"
        />
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="用户ID"
          style="width: 240px"
        />
        <Select option-label-prop="label" v-model:value="query.h5Display" allow-clear style="width: 120px"
          :options="[{ label: '显示', value: true as any }, { label: '隐藏', value: false as any }]"
        />
        <Select option-label-prop="label" v-model:value="query.close" allow-clear style="width: 120px"
          :options="[{ label: '正常', value: false as any }, { label: '关闭', value: true as any }]"
        />
        <Select option-label-prop="label" v-model:value="query.dealer" allow-clear style="width: 120px"
          :options="[{ label: '经销商', value: true as any }, { label: '非经销商', value: false as any }]"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="openCreate">
          新增
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1920 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userBaseInfo'">
            <UserProfileLink :profile="record.userBaseInfo" />
          </template>
          <template v-else-if="column.key === 'h5Display'">
            <Switch
              :checked="Boolean(record.h5Display)"
              @change="handleStatusChange(record, 'h5Display', $event)"
            />
          </template>
          <template v-else-if="column.key === 'close'">
            <Switch
              :checked="!Boolean(record.close)"
              @change="handleStatusChange(record, 'close', !$event)"
            />
          </template>
          <template v-else-if="column.key === 'dealer'">
            <Switch
              :checked="Boolean(record.dealer)"
              @change="handleStatusChange(record, 'dealer', $event)"
            />
          </template>
          <template v-else-if="column.key === 'superDealer'">
            <Switch
              :checked="Boolean(record.superDealer)"
              @change="handleStatusChange(record, 'superDealer', $event)"
            />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button size="small" type="link" @click="openShip(record)">
                发货
              </Button>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="openDeduct(record)">
                扣款
              </Button>
              <Button size="small" type="link" @click="openRunningWater(record)">
                流水
              </Button>
              <Button size="small" type="link" @click="openSellerInfo(record)">
                卖家
              </Button>
            </Space>
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
      :confirm-loading="saving"
      :open="modalOpen"
      destroy-on-close
      :title="modalMode === 'create' ? '新增货运代理' : modalMode === 'deduct' ? '扣款' : modalMode === 'ship' ? '发货' : '编辑货运代理'"
      width="560px"
      @cancel="modalOpen = false"
      @ok="submitModal"
    >
      <Form layout="vertical">
        <FormItem label="系统">
          <SysOriginSelect
            v-model:value="modalForm.sysOrigin"
            :options="sysOriginOptions"
          />
        </FormItem>
        <FormItem label="用户ID">
          <AccountInput
            v-model:value="modalForm.userId"
            :sys-origin="modalForm.sysOrigin"
            placeholder="用户ID"
          />
        </FormItem>
        <FormItem label="金币">
          <Input
            v-model:value="modalForm.earnPoints"
            :placeholder="`请输入${modalMode === 'deduct' ? '扣款' : '发货'}金币数量`"
          />
        </FormItem>
        <FormItem v-if="modalMode !== 'deduct'" label="金额">
          <Input v-model:value="modalForm.amount" placeholder="请输入金额" />
        </FormItem>
        <FormItem v-if="modalMode !== 'deduct'" label="充值类型">
          <Select option-label-prop="label" v-model:value="modalForm.rechargeType" allow-clear>
            <SelectOption
              v-for="item in FREIGHT_RECHARGE_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="备注">
          <Input v-model:value="modalForm.remark" placeholder="请输入备注" />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      :footer="null"
      :open="runningOpen"
      destroy-on-close
      title="货运流水"
      width="960px"
      @cancel="runningOpen = false"
    >
      <Table
        :columns="[
          { dataIndex: 'acceptUser', key: 'acceptUser', title: '接收人', width: 220 },
          { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
          { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
          { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
          { dataIndex: 'originName', key: 'originName', title: '来源', width: 120 },
          { dataIndex: 'remark', key: 'remark', title: '备注', width: 200 },
          { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
        ]"
        :data-source="activeRecord?.runningWaters || []"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1080 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'acceptUser'">
            <UserProfileLink
              :profile="record.acceptUser"
              :tag-name="record.operationUserNickname"
            />
          </template>
          <template v-else-if="column.key === 'type'">
            {{ Number(record.type) === 0 ? '收入' : '支出' }}
          </template>
          <template v-else-if="column.key === 'quantity'">
            {{ Number(record.type) === 0 ? '+' : '-' }}{{ record.quantity || 0 }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      :footer="null"
      :open="sellerOpen"
      destroy-on-close
      title="授权卖家数量"
      width="1080px"
      @cancel="sellerOpen = false"
    >
      <div class="seller-header">
        <Form :label-col="{ span: 8 }" :model="sellerQuantityForm" :wrapper-col="{ span: 8 }">
          <FormItem label="最多授权卖家数量">
            <Input v-model:value="sellerQuantityForm.sellerQuantity" placeholder="请输入人数" />
          </FormItem>
        </Form>
        <Button type="primary" @click="submitSellerQuantity">保存</Button>
      </div>

      <Table
        :columns="[
          { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
          { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 220 },
          { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
          { dataIndex: 'actions', key: 'actions', title: '操作', width: 140 },
        ]"
        :data-source="sellerList"
        :loading="sellerLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userBaseInfo'">
            <UserProfileLink :profile="record.userBaseInfo" />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openSellerRunningWater(record)">
                流水
              </Button>
              <Button danger size="small" type="link" @click="handleRemoveSeller(record)">
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="sellerTotal > 0" class="pager">
        <Pagination
          :current="sellerQuery.cursor"
          :page-size="sellerQuery.limit"
          :total="sellerTotal"
          show-size-changer
          @change="handleSellerPageChange"
          @showSizeChange="handleSellerPageChange"
        />
      </div>
    </Modal>

    <Modal
      :footer="null"
      :open="sellerRunningOpen"
      destroy-on-close
      title="卖家流水"
      width="960px"
      @cancel="sellerRunningOpen = false"
    >
      <Table
        :columns="[
          { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
          { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
          { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
          { dataIndex: 'originName', key: 'originName', title: '来源', width: 120 },
          { dataIndex: 'remark', key: 'remark', title: '备注', width: 200 },
          { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
        ]"
        :data-source="sellerWaterList"
        :loading="sellerWaterLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ Number(record.type) === 0 ? '收入' : '支出' }}
          </template>
          <template v-else-if="column.key === 'quantity'">
            {{ Number(record.type) === 0 ? '+' : '-' }}{{ record.quantity || 0 }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div v-if="sellerWaterTotal > 0" class="pager">
        <Pagination
          :current="sellerWaterQuery.cursor"
          :page-size="sellerWaterQuery.limit"
          :total="sellerWaterTotal"
          show-size-changer
          @change="handleSellerWaterPageChange"
          @showSizeChange="handleSellerWaterPageChange"
        />
      </div>
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

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.seller-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}
</style>
