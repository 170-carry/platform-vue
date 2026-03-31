<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  exportBankWithdrawMoneyApply,
  pageBankWithdrawMoneyApply,
} from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import {
  BANK_CARD_TYPES,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Drawer,
  InputNumber,
  Select,
  Space,
  Table,
  message,
} from 'antdv-next';

import {
  BANK_ACCEPT_METHOD_OPTIONS,
  WITHDRAW_APPROVAL_STATUS_OPTIONS,
  buildDateRangePresets,
  type DayjsRange,
} from './shared';
import UserProfileLink from './components/user-profile-link.vue';
import WithdrawApplyApprovalDrawer from './components/withdraw-apply-approval-drawer.vue';
import WithdrawApplyDetailsDrawer from './components/withdraw-apply-details-drawer.vue';

const props = withDefaults(
  defineProps<{
    amountType?: string;
    exportPermissionCode?: string;
    title: string;
  }>(),
  {
    amountType: '',
    exportPermissionCode: '',
  },
);

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const exportLoading = ref(false);
const exportOpen = ref(false);
const detailsOpen = ref(false);
const approvalOpen = ref(false);
const notData = ref(false);
const activeRow = ref<Record<string, any> | null>(null);
const activeIndex = ref(-1);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<DayjsRange | null>(null);
const exportDate = ref<DayjsRange | null>(null);

const query = reactive<Record<string, any>>({
  acceptMethod: '',
  bankCardType: '',
  endTime: '',
  lastId: '',
  latestApprovalStatus: '',
  limit: 20,
  startTime: '',
  submitUserId: '',
  sysOrigin: '',
});

if (props.amountType) {
  query.amountType = props.amountType;
}

const exportQuery = reactive<Record<string, any>>({
  bankCardType: '',
  endTime: '',
  latestApprovalStatus: '',
  limit: 1000,
  startTime: '',
  submitUserId: '',
  sysOrigin: '',
});

watch(rangeDate, (value) => {
  query.startTime = value?.[0]?.valueOf() || '';
  query.endTime = value?.[1]?.valueOf() || '';
});

watch(exportDate, (value) => {
  exportQuery.startTime = value?.[0]?.valueOf() || '';
  exportQuery.endTime = value?.[1]?.valueOf() || '';
});

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 90 },
  { dataIndex: 'submitUser', key: 'submitUser', title: '提交用户', width: 260 },
  { dataIndex: 'amount', key: 'amount', title: '提交金额', width: 120 },
  { dataIndex: 'amountType', key: 'amountType', title: '类型', width: 90 },
  { dataIndex: 'serviceCharge', key: 'serviceCharge', title: '手续费(%)', width: 120 },
  { dataIndex: 'actualAmount', key: 'actualAmount', title: '实际提现金额', width: 130 },
  { dataIndex: 'acceptMethodName', key: 'acceptMethodName', title: '接收方式', width: 120 },
  { dataIndex: 'latestApprovalStatusName', key: 'latestApprovalStatusName', title: '最新审核状态', width: 130 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140, fixed: 'right' as const },
];

function hasPermission(code: string) {
  const codes = accessStore.accessCodes || [];
  return codes.length === 0 || codes.includes(code);
}

const showExportButton = computed(() =>
  props.exportPermissionCode ? hasPermission(props.exportPermissionCode) : false,
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
    notData.value = false;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await pageBankWithdrawMoneyApply({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailsOpen.value = true;
}

function openApproval(record: Record<string, any>, index: number) {
  activeRow.value = record;
  activeIndex.value = index;
  approvalOpen.value = true;
}

function handleApproved(record: Record<string, any>) {
  if (activeIndex.value >= 0) {
    list.value.splice(activeIndex.value, 1, record);
  }
  approvalOpen.value = false;
}

function openExportDrawer() {
  exportQuery.sysOrigin = query.sysOrigin;
  exportOpen.value = true;
}

async function submitExport() {
  if (!exportQuery.sysOrigin || !exportQuery.startTime || !exportQuery.endTime) {
    message.warning('请填写完整导出条件');
    return;
  }
  if (!exportQuery.limit) {
    message.warning('请输入导出数量');
    return;
  }
  exportLoading.value = true;
  try {
    await exportBankWithdrawMoneyApply({ ...exportQuery });
    exportOpen.value = false;
  } finally {
    exportLoading.value = false;
  }
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page :title="title">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            :options="sysOriginOptions"
          />
          <Select
            option-label-prop="label"
            v-model:value="query.bankCardType"
            allow-clear
            placeholder="卡片类型"
            style="width: 140px"
            @change="handleSearch"
          
            :options="BANK_CARD_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
          <AccountInput
            v-model:value="query.submitUserId"
            :sys-origin="query.sysOrigin"
            placeholder="提交用户ID"
            style="width: 220px"
          />
          <Select
            option-label-prop="label"
            v-model:value="query.acceptMethod"
            allow-clear
            placeholder="类型"
            style="width: 120px"
            @change="handleSearch"
          
            :options="BANK_ACCEPT_METHOD_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <Select
            option-label-prop="label"
            v-model:value="query.latestApprovalStatus"
            allow-clear
            placeholder="状态"
            style="width: 120px"
            @change="handleSearch"
          
            :options="WITHDRAW_APPROVAL_STATUS_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <DatePicker.RangePicker
            v-model:value="rangeDate"
            :presets="buildDateRangePresets()"
            show-time
            style="width: 360px"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button v-if="showExportButton" type="primary" @click="openExportDrawer">
            导出
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1380 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'submitUser'">
            <UserProfileLink :profile="record.submitUser" />
          </template>
          <template v-else-if="column.key === 'amountType'">
            {{ record.amountType === 'SALARY_DIAMOND' ? '钻石' : '美金' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openDetails(record)">
                查看
              </Button>
              <Button
                v-if="record.latestApprovalStatus === 'SUBMIT'"
                size="small"
                type="link"
                @click="openApproval(record, index)"
              >
                审核
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          size="small"
          :disabled="loadMoreLoading"
          :loading="loadMoreLoading"
          @click="loadData(false)"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <WithdrawApplyDetailsDrawer
      :open="detailsOpen"
      :row="activeRow || {}"
      @close="detailsOpen = false"
    />

    <WithdrawApplyApprovalDrawer
      :open="approvalOpen"
      :row="activeRow || {}"
      @approval-close="handleApproved"
      @close="approvalOpen = false"
    />

    <Drawer
      :open="exportOpen"
      title="导出条件"
      width="420px"
      @close="exportOpen = false"
    >
      <div class="export-form">
        <div class="field">
          <div class="label">系统</div>
          <SysOriginSelect
            v-model:value="exportQuery.sysOrigin"
            :options="sysOriginOptions"
          />
        </div>
        <div class="field">
          <div class="label">类型</div>
          <Select option-label-prop="label" v-model:value="exportQuery.bankCardType" allow-clear
            :options="BANK_CARD_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </div>
        <div class="field">
          <div class="label">用户</div>
          <AccountInput
            v-model:value="exportQuery.submitUserId"
            :sys-origin="exportQuery.sysOrigin || query.sysOrigin"
            placeholder="提交用户ID"
          />
        </div>
        <div class="field">
          <div class="label">状态</div>
          <Select option-label-prop="label" v-model:value="exportQuery.latestApprovalStatus" allow-clear
            :options="WITHDRAW_APPROVAL_STATUS_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
        </div>
        <div class="field">
          <div class="label">时间</div>
          <DatePicker.RangePicker
            v-model:value="exportDate"
            :presets="buildDateRangePresets()"
            show-time
            style="width: 100%"
          />
        </div>
        <div class="field">
          <div class="label">数量</div>
          <InputNumber
            v-model:value="exportQuery.limit"
            :min="1"
            style="width: 100%"
          />
        </div>
        <div class="drawer-footer">
          <Button :disabled="exportLoading" @click="exportOpen = false">
            关闭
          </Button>
          <Button :loading="exportLoading" type="primary" @click="submitExport">
            导出
          </Button>
        </div>
      </div>
    </Drawer>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.load-more {
  padding: 20px 0 0;
  text-align: center;
}

.export-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
