<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { useRouter } from 'vue-router';

import AccountInput from '#/components/account-input.vue';
import { getUserDeviceTable } from '#/api/legacy/user';
import { copyText } from '#/views/operate/shared';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Input,
  Pagination,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateUserDeviceList' });

const accessStore = useAccessStore();
const router = useRouter();

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  imei: '',
  limit: 20,
  startTime: '',
  sysOrigin: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 160 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 120 },
  { dataIndex: 'userNickname', key: 'userNickname', title: '用户', width: 180 },
  { dataIndex: 'registerNumber', key: 'registerNumber', title: '注册数量', width: 100 },
  { dataIndex: 'ip', key: 'ip', title: '最近登录IP', width: 180 },
  { dataIndex: 'imei', key: 'imei', title: '设备号', width: 140 },
  { dataIndex: 'requestClient', key: 'requestClient', title: '请求平台', width: 120 },
  { dataIndex: 'phoneModel', key: 'phoneModel', title: '手机型号', width: 180 },
  { dataIndex: 'phoneSysVersion', key: 'phoneSysVersion', title: '操作系统', width: 140 },
  { dataIndex: 'appVersion', key: 'appVersion', title: 'App版本', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
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
      if (query.sysOrigin) {
        void loadData(true);
      }
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
    const result = await getUserDeviceTable({ ...query });
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

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function handleCopy(imei?: string) {
  if (!imei) {
    return;
  }
  try {
    await copyText(imei);
    message.success('设备号已复制');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Page title="用户最新设备列表">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <div class="account-filter">
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
          />
        </div>
        <Input
          v-model:value="query.imei"
          placeholder="设备号"
          style="width: 220px"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1820 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userNickname'">
            <Button
              v-if="record.userId"
              type="link"
              @click="openUserDetails(record.userId)"
            >
              {{ record.userNickname || record.userId }}
            </Button>
            <span v-else>{{ record.userNickname || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'imei'">
            <Button type="link" @click="handleCopy(record.imei)">点击复制</Button>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
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
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.account-filter {
  min-width: 280px;
  width: 320px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
