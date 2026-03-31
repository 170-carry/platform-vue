<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { regionConfigTable } from '#/api/legacy/system';
import {
  excelAnchorBill,
  listTeamBillTable,
} from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  DateRangePicker,
  Drawer,
  Form,
  FormItem,
  Input,
  Select,
  SelectOption,
  Table,
  Tag,
  message,
} from 'antdv-next';

import {
  TEAM_BILL_STATUS_MAP,
  TEAM_BILL_STATUS_OPTIONS,
} from './shared';
import TeamBillDetailsDrawer from './components/team-bill-details-drawer.vue';

defineOptions({ name: 'TeamBillList' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const exportLoading = ref(false);
const exportDrawerOpen = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const billDetailsOpen = ref(false);
const activeRow = ref<Record<string, any>>({});
const regionOptions = ref<Array<Record<string, any>>>([]);
const exportRegionOptions = ref<Array<Record<string, any>>>([]);

const query = reactive({
  endTime: '',
  id: '',
  lastId: '',
  limit: 20,
  ownUserId: '',
  region: '',
  settleType: '',
  startTime: '',
  status: String(TEAM_BILL_STATUS_OPTIONS[0]?.value ?? 'UNPAID'),
  sysOrigin: sysOriginOptions.value[0]?.value ?? '',
  teamId: '',
});

const excelQuery = reactive({
  billStatusList: [] as string[],
  billStatusStr: '',
  monthDate: '',
  region: '',
  sysOrigin: '',
});

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

const columns = computed(() => {
  const base: Array<Record<string, any>> = [
    { dataIndex: 'index', key: 'index', title: 'No', width: 70 },
    { dataIndex: 'ownUserProfile', key: 'ownUserProfile', title: '代理', width: 240 },
    { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 120 },
    { dataIndex: 'billBelong', key: 'billBelong', title: '归属', width: 120 },
  ];

  if (String(query.status) === 'SETTLED') {
    base.push({
      dataIndex: 'salary',
      key: 'salary',
      title: '工资',
      width: 240,
    });
  }

  base.push(
    { dataIndex: 'updateUserNickname', key: 'updateUserNickname', title: '修改人', width: 120 },
    { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
    { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
  );

  return base;
});

async function loadRegions(sysOrigin: string, type: 'export' | 'query' = 'query') {
  if (!sysOrigin) {
    if (type === 'query') {
      regionOptions.value = [];
    } else {
      exportRegionOptions.value = [];
    }
    return;
  }
  const result = await regionConfigTable({ sysOrigin });
  if (type === 'query') {
    regionOptions.value = result || [];
  } else {
    exportRegionOptions.value = result || [];
  }
}

async function loadData(reset = false, append = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
  }
  if (append) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listTeamBillTable({ ...query });
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

async function handleSysOriginChange(value: string) {
  query.sysOrigin = value;
  query.region = '';
  await loadRegions(value, 'query');
  await loadData(true);
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  billDetailsOpen.value = true;
}

function openExportDrawer() {
  excelQuery.sysOrigin = query.sysOrigin;
  excelQuery.region = '';
  excelQuery.monthDate = '';
  excelQuery.billStatusList = [];
  void loadRegions(excelQuery.sysOrigin, 'export');
  exportDrawerOpen.value = true;
}

async function handleExport() {
  if (!excelQuery.region) {
    message.warning('请选择区域');
    return;
  }
  if (excelQuery.billStatusList.length === 0) {
    message.warning('请选择账单状态');
    return;
  }
  if (!excelQuery.monthDate) {
    message.warning('请选择时间');
    return;
  }
  exportLoading.value = true;
  try {
    excelQuery.billStatusStr = excelQuery.billStatusList.join(',');
    await excelAnchorBill({ ...excelQuery }, 'AnchorWorkDetails');
    exportDrawerOpen.value = false;
  } catch {
    message.error('下载失败！');
  } finally {
    exportLoading.value = false;
  }
}

function getUserText(profile?: Record<string, any>) {
  if (!profile) {
    return '-';
  }
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account || profile.id;
  return account ? `${nickname} / ${account}` : nickname;
}

watch(
  sysOriginOptions,
  async (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = options[0]?.value ?? '';
    }
    if (!query.sysOrigin) {
      return;
    }
    await loadRegions(query.sysOrigin, 'query');
    await loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <Page title="账单列表">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统" :control-width="140">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            @change="handleSysOriginChange"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="区域" :control-width="160">
          <Select option-label-prop="label"
            v-model:value="query.region"
            allow-clear
            placeholder="区域"
            @change="handleSearch"
          
            :options="regionOptions.map((item) => ({ label: item.regionName, value: item.id as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="账单状态" :control-width="140">
          <Select option-label-prop="label"
            v-model:value="query.status"
            @change="handleSearch"
          
            :options="TEAM_BILL_STATUS_OPTIONS.map((item) => ({ label: item.name, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="代理ID" :control-width="220">
          <AccountInput
            v-model:value="query.ownUserId"
            :sys-origin="query.sysOrigin"
            placeholder="代理ID"
          />
        </InlineFilterField>
        <InlineFilterField label="账单ID" :control-width="160">
          <Input
            v-model:value="query.id"
            allow-clear
            placeholder="账单ID"
            @press-enter="handleSearch"
          />
        </InlineFilterField>
        <InlineFilterField label="时间" :control-width="360">
          <DateRangePicker
            v-model:value="rangeDate"
            show-time
            value-format="x"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button :loading="exportLoading" @click="openExportDrawer">
          导出
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'ownUserProfile'">
            <div class="user-cell">
              <div>{{ getUserText(record.ownUserProfile) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'salary'">
            <div class="settled-row">
              <div>
                成员/代理:
                {{ record.settleResult?.memberSalary || 0 }}/{{ record.settleResult?.ownSalary || 0 }}
              </div>
              <div>合计: {{ record.settleResult?.totalSalary || 0 }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建: {{ formatDate(record.createTime) }}</div>
            <div>修改: {{ formatDate(record.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetails(record)">
              详情
            </Button>
          </template>
          <template v-else-if="column.key === 'billBelong'">
            <div class="bill-belong-cell">
              <div>{{ record.billBelong || '-' }}</div>
              <Tag :color="TEAM_BILL_STATUS_MAP[record.status]?.tag || 'default'">
                {{ TEAM_BILL_STATUS_MAP[record.status]?.name || record.status || '-' }}
              </Tag>
            </div>
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false, true)"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <Drawer
      :open="exportDrawerOpen"
      title="导出条件"
      width="480px"
      @close="exportDrawerOpen = false"
    >
      <Form layout="vertical">
        <FormItem label="区域">
          <Select option-label-prop="label"
            v-model:value="excelQuery.region"
            placeholder="区域"
          >
            <SelectOption
              v-for="item in exportRegionOptions"
              :key="item.id"
              :label="item.regionName"
              :value="item.id"
            >
              {{ item.regionName }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="状态">
          <Select option-label-prop="label"
            v-model:value="excelQuery.billStatusList"
            mode="multiple"
            placeholder="账单状态"
          >
            <SelectOption
              v-for="item in TEAM_BILL_STATUS_OPTIONS"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            >
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="时间">
          <DatePicker
            v-model:value="excelQuery.monthDate"
            format="YYYYMM"
            picker="month"
            value-format="YYYYMM"
          />
        </FormItem>
      </Form>

      <template #footer>
        <div class="drawer-footer">
          <Button :disabled="exportLoading" @click="exportDrawerOpen = false">
            取消
          </Button>
          <Button
            :disabled="exportLoading"
            :loading="exportLoading"
            type="primary"
            @click="handleExport"
          >
            确定
          </Button>
        </div>
      </template>
    </Drawer>

    <TeamBillDetailsDrawer
      :open="billDetailsOpen"
      :row="activeRow"
      @close="billDetailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.settled-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bill-belong-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
