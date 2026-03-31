<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { loginLoggerPage } from '#/api/legacy/app-system';
import AccountInput from '#/components/account-input.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate } from '#/views/system/shared';
import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';

import {
  Button,
  Card,
  Input,
  Pagination,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import AccountStatusLogModal from './components/account-status-log-modal.vue';
import ViolationHistoryModal from './components/violation-history-modal.vue';

defineOptions({ name: 'AppSystemLoginLogger' });

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const activeRow = ref<Record<string, any> | null>(null);
const violationOpen = ref(false);
const accountStatusOpen = ref(false);
const accountHandleOpen = ref(false);

const query = reactive({
  cursor: 1,
  deviceId: '',
  limit: 20,
  userId: '',
});

const columns = [
  { dataIndex: 'appPlatform', key: 'appPlatform', title: '平台', width: 120 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 240 },
  { dataIndex: 'deviceId', key: 'deviceId', title: '设备ID', width: 220 },
  { dataIndex: 'ip', key: 'ip', title: 'IP', width: 160 },
  { dataIndex: 'loginTypeName', key: 'loginTypeName', title: '登录方式', width: 120 },
  { dataIndex: 'appVersion', key: 'appVersion', title: 'App版本', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '登录时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

const tableScroll = computed(() => ({ x: 1480 }));

function getUserId(record: Record<string, any>) {
  return String(record.userProfile?.id || record.id || record.userId || '');
}

function getUserName(record: Record<string, any>) {
  return (
    record.userProfile?.userNickname ||
    record.userNickname ||
    `用户 ${getUserId(record)}`
  );
}

function getUserAvatar(record: Record<string, any>) {
  return record.userProfile?.userAvatar || record.userAvatar || '';
}

function getVipStatusName(record: Record<string, any>) {
  return record.userProfile?.vipStatusName || record.vipStatusName || '';
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await loginLoggerPage({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openUserDetails(record: Record<string, any>) {
  const userId = getUserId(record);
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openViolation(record: Record<string, any>) {
  activeRow.value = record;
  violationOpen.value = true;
}

function openAccountStatus(record: Record<string, any>) {
  activeRow.value = record;
  accountStatusOpen.value = true;
}

function openAccountHandle(record: Record<string, any>) {
  activeRow.value = record;
  accountHandleOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="登陆日志">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="用户ID">
          <AccountInput
            v-model:value="query.userId"
            placeholder="用户ID"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="设备ID">
          <Input
            v-model:value="query.deviceId"
            allow-clear
            placeholder="设备ID"
            style="width: 260px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'appPlatform'">
            <Tag>{{ record.appPlatform || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'user'">
            <button class="user-cell" type="button" @click="openUserDetails(record)">
              <img
                :src="getUserAvatar(record) || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-copy">
                <span class="user-name">{{ getUserName(record) }}</span>
                <span class="user-sub">ID {{ getUserId(record) || '-' }}</span>
              </div>
            </button>
          </template>
          <template v-else-if="column.key === 'ip'">
            <a
              :href="`https://www.ip138.com/iplookup.asp?ip=${record.ip}&action=2`"
              rel="noreferrer"
              target="_blank"
            >
              {{ record.ip || '-' }}
            </a>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap size="small">
              <Button size="small" type="link" @click="openViolation(record)">
                违规记录
              </Button>
              <Button size="small" type="link" @click="openAccountStatus(record)">
                账号处理记录
              </Button>
              <Button size="small" type="link" @click="openAccountHandle(record)">
                账号处理
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="pager">
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

    <ViolationHistoryModal
      :open="violationOpen"
      :user-avatar="activeRow ? getUserAvatar(activeRow) : ''"
      :user-id="activeRow ? getUserId(activeRow) : ''"
      :user-nickname="activeRow ? getUserName(activeRow) : ''"
      :vip-status-name="activeRow ? getVipStatusName(activeRow) : ''"
      @close="violationOpen = false"
    />

    <AccountStatusLogModal
      :open="accountStatusOpen"
      :user-id="activeRow ? getUserId(activeRow) : ''"
      @close="accountStatusOpen = false"
    />

    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeRow ? getUserId(activeRow) : ''"
      @close="accountHandleOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 0;
  text-align: left;
}

.user-avatar {
  border-radius: 14px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.user-copy {
  display: grid;
  gap: 4px;
}

.user-name {
  color: rgb(15 23 42);
  font-weight: 600;
}

.user-sub {
  color: rgb(100 116 139);
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
