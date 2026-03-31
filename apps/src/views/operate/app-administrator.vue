<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  changeStatusAdministrator,
  changeSysAdministratorRoles,
  deleteAdministrator,
  deleteAdministratorAuth,
  getAdministratorAuthTable,
  getAdministratorTable,
} from '#/api/legacy/administrator';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  Tabs,
  TabPane,
  message,
} from 'antdv-next';

import AccountInput from '#/components/account-input.vue';

import AdministratorAuthModal from './components/administrator-auth-modal.vue';
import AdministratorFormModal from './components/administrator-form-modal.vue';
import AdministratorResourceFormModal from './components/administrator-resource-form-modal.vue';

defineOptions({ name: 'OperateAppAdministrator' });

const ROLE_OPTIONS = [
  { label: '管理员', value: 'ADMIN' },
  { label: '超级管理员', value: 'SUPER_ADMIN' },
  { label: '经理', value: 'MANAGER' },
];

const GROUP_LABELS: Record<string, string> = {
  OTHER: '其它',
  ROOM: '房间',
  USER: '用户',
};

const activeTab = ref('administrator');

const adminLoading = ref(false);
const adminTotal = ref(0);
const adminList = ref<Array<Record<string, any>>>([]);
const roleLoadingId = ref<number | string>('');
const adminFormOpen = ref(false);
const authModalOpen = ref(false);
const activeUserId = ref<number | string>('');

const resourceLoading = ref(false);
const resourceList = ref<Array<Record<string, any>>>([]);
const resourceFormOpen = ref(false);
const activeResource = ref<Record<string, any>>({});

const adminQuery = reactive<Record<string, any>>({
  account: '',
  cursor: 1,
  limit: 20,
  userId: '',
  userNickname: '',
});

const adminColumns: any[] = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'countryName', key: 'countryName', title: '国家', width: 140 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
  { dataIndex: 'roles', key: 'roles', title: '角色', width: 160 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 160 },
];

const resourceColumns: any[] = [
  { dataIndex: 'resourceName', key: 'resourceName', title: '名称', width: 180 },
  { dataIndex: 'auth', key: 'auth', title: 'Key', width: 220 },
  { dataIndex: 'groupName', key: 'groupName', title: '分组', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '注册时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120 },
];

const showAdminPager = computed(() => adminTotal.value > 0);

async function loadAdminList(reset = false) {
  if (reset) {
    adminQuery.cursor = 1;
  }
  adminLoading.value = true;
  try {
    const result = await getAdministratorTable({ ...adminQuery });
    adminList.value = result.records || [];
    adminTotal.value = result.total || 0;
  } finally {
    adminLoading.value = false;
  }
}

async function loadResourceList() {
  resourceLoading.value = true;
  try {
    resourceList.value = (await getAdministratorAuthTable()) || [];
  } finally {
    resourceLoading.value = false;
  }
}

function handleAdminSearch() {
  void loadAdminList(true);
}

function handleAdminPageChange(page: number, pageSize: number) {
  adminQuery.cursor = page;
  adminQuery.limit = pageSize;
  void loadAdminList();
}

async function handleStatusChange(record: Record<string, any>, checked: boolean) {
  const previous = checked ? 0 : 1;
  try {
    await changeStatusAdministrator({
      id: record.id,
      status: checked ? 1 : 0,
      userId: record.userId,
    });
  } catch {
    record.status = previous;
  }
}

async function handleRoleChange(record: Record<string, any>, value: string) {
  const previous = record.roles;
  roleLoadingId.value = record.id;
  try {
    await changeSysAdministratorRoles(record.id, value);
  } catch {
    record.roles = previous;
  } finally {
    roleLoadingId.value = '';
  }
}

function openCreate() {
  adminFormOpen.value = true;
}

function openAuth(record: Record<string, any>) {
  activeUserId.value = record.userId;
  authModalOpen.value = true;
}

function handleDeleteAdmin(record: Record<string, any>) {
  Modal.confirm({
    title: '您确定要删除该管理员吗',
    async onOk() {
      await deleteAdministrator(record.id);
      message.success('删除成功');
      await loadAdminList(true);
    },
  });
}

function openResourceCreate() {
  activeResource.value = {};
  resourceFormOpen.value = true;
}

function openResourceEdit(record: Record<string, any>) {
  activeResource.value = { ...record };
  resourceFormOpen.value = true;
}

function handleDeleteResource(record: Record<string, any>) {
  Modal.confirm({
    title: '您确定要删除该权限吗',
    async onOk() {
      await deleteAdministratorAuth(record.id);
      message.success('删除成功');
      await loadResourceList();
    },
  });
}

loadAdminList(true);
loadResourceList();
</script>

<template>
  <Page title="APP管理员">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="administrator" tab="管理员列表" />
        <TabPane key="resource" tab="权限管理" />
      </Tabs>

      <template v-if="activeTab === 'administrator'">
        <div class="toolbar">
          <AccountInput
            v-model:value="adminQuery.userId"
            placeholder="用户ID"
            style="width: 280px"
          />
          <input
            v-model="adminQuery.account"
            class="plain-input"
            placeholder="账号"
          >
          <input
            v-model="adminQuery.userNickname"
            class="plain-input"
            placeholder="昵称"
          >
          <Button :loading="adminLoading" type="primary" @click="handleAdminSearch">
            搜索
          </Button>
          <Button @click="openCreate">新增管理员</Button>
        </div>

        <Table
          :columns="adminColumns"
          :data-source="adminList"
          :loading="adminLoading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'userProfile'">
              <div class="user-cell">
                <img
                  :src="record.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                  alt=""
                  class="user-avatar"
                >
                <div class="user-copy">
                  <div>{{ record.userNickname || '-' }}</div>
                  <div class="sub">
                    {{ record.account || record.userId || '-' }}
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'countryName'">
              {{ record.countryName || record.countryCode || '-' }}
            </template>
            <template v-else-if="column.key === 'status'">
              <Select option-label-prop="label"
                :value="record.status"
                style="width: 100px"
                @change="(value) => {
                  record.status = value;
                  handleStatusChange(record, Number(value) === 1);
                }"
              >
                <SelectOption :value="1" label="正常">正常</SelectOption>
                <SelectOption :value="0" label="禁用">禁用</SelectOption>
              </Select>
            </template>
            <template v-else-if="column.key === 'roles'">
              <Select option-label-prop="label"
                :loading="record.id === roleLoadingId"
                :value="record.roles"
                style="width: 130px"
                @change="(value) => {
                  record.roles = value;
                  handleRoleChange(record, value);
                }"
              >
                <SelectOption
                  v-for="item in ROLE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                 :label="`${item.label}`">
                  {{ item.label }}
                </SelectOption>
              </Select>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space wrap>
                <Button size="small" type="link" @click="openAuth(record)">
                  权限分配
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="handleDeleteAdmin(record)"
                >
                  移除管理
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <div v-if="showAdminPager" class="pager">
          <Pagination
            :current="adminQuery.cursor"
            :page-size="adminQuery.limit"
            :total="adminTotal"
            show-size-changer
            @change="handleAdminPageChange"
            @showSizeChange="handleAdminPageChange"
          />
        </div>
      </template>

      <template v-else>
        <div class="toolbar">
          <Button @click="openResourceCreate">新增权限</Button>
        </div>

        <Table
          :columns="resourceColumns"
          :data-source="resourceList"
          :loading="resourceLoading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'groupName'">
              {{ GROUP_LABELS[record.groupName] || record.groupName || '-' }}
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space wrap>
                <Button size="small" type="link" @click="openResourceEdit(record)">
                  修改
                </Button>
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="handleDeleteResource(record)"
                >
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>
      </template>
    </Card>

    <AdministratorFormModal
      :open="adminFormOpen"
      @close="adminFormOpen = false"
      @success="loadAdminList(true)"
    />

    <AdministratorAuthModal
      :open="authModalOpen"
      :user-id="activeUserId"
      @close="authModalOpen = false"
      @success="loadAdminList()"
    />

    <AdministratorResourceFormModal
      :open="resourceFormOpen"
      :row="activeResource"
      @close="resourceFormOpen = false"
      @success="loadResourceList()"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.plain-input {
  border: 1px solid var(--ant-color-border);
  border-radius: 6px;
  min-width: 180px;
  padding: 4px 11px;
}

.user-cell {
  align-items: center;
  display: flex;
  gap: 10px;
}

.user-avatar {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.sub {
  color: rgb(100 116 139);
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
