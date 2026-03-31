<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';

import type { LegacyUser } from '#/api/legacy/system';
import {
  pageUsers,
  resetUserPassword,
  switchUserStatus,
  } from '#/api/legacy/system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  message
} from 'antdv-next';

import UserEditDrawer from './components/user-edit-drawer.vue';

defineOptions({ name: 'SystemUserManager' });

const loading = ref(false);
const total = ref(0);
const list = ref<LegacyUser[]>([]);
const drawerOpen = ref(false);
const activeRow = ref<LegacyUser | null>(null);

const query = reactive({
  cursor: 1,
  limit: 20,
  loginName: '',
  nickname: '',
  status: '',
});

const accountStatus = [
  { label: '正常', value: 0 },
  { label: '禁用', value: 1 },
];

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'loginName', key: 'loginName', title: '账号', width: 180 },
  { dataIndex: 'nickname', key: 'nickname', title: '昵称', width: 140 },
  { dataIndex: 'roles', key: 'roles', title: '角色', width: 220 },
  { dataIndex: 'phone', key: 'phone', title: '手机号码', width: 160 },
  { dataIndex: 'email', key: 'email', title: '邮箱', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 160 },
];

const tableScroll = computed(() => ({ x: 1320 }));

function joinRoles(row: any) {
  return (
    row.userRoles
      ?.map((item: { roleName?: string }) => item.roleName)
      .filter(Boolean)
      .join(', ') || '-'
  );
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUsers({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  activeRow.value = null;
  drawerOpen.value = true;
}

function openUpdate(row: any) {
  activeRow.value = { ...row };
  drawerOpen.value = true;
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

async function handleStatusChange(row: any, checked: boolean) {
  const targetStatus = checked ? 0 : 1;
  const currentStatus = row.status;
  row.status = targetStatus;
  try {
    await switchUserStatus(row.id, targetStatus);
    message.success('状态已更新');
  } catch (error) {
    row.status = currentStatus;
    throw error;
  }
}

function handleResetPassword(row: any) {
  Modal.confirm({
    async onOk() {
      await resetUserPassword(row.id);
      message.success('密码已重置');
    },
    title: `是否确认重置“${row.nickname || row.loginName}”登录密码？`,
  });
}

loadData(true);
</script>

<template>
  <Page title="用户管理">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="账号">
          <Input
            v-model:value="query.loginName"
            allow-clear
            placeholder="账号"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="昵称">
          <Input
            v-model:value="query.nickname"
            allow-clear
            placeholder="昵称"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="状态">
          <Select
            v-model:value="query.status"
            allow-clear
            option-label-prop="label"
            placeholder="状态"
            style="width: 120px"
          
            :options="accountStatus.map((item) => ({ label: item.label, value: item.value as any }))"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
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
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            {{ joinRoles(record) }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Switch
              :checked="Number(record.status ?? 0) === 0"
              checked-children="正常"
              un-checked-children="禁用"
              @change="(checked: boolean) => handleStatusChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openUpdate(record)">
                修改
              </Button>
              <Button
                size="small"
                type="link"
                @click="handleResetPassword(record)"
              >
                重置密码
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

    <UserEditDrawer
      :open="drawerOpen"
      :update-data="activeRow"
      @close="drawerOpen = false"
      @success="loadData()"
    />
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
</style>
