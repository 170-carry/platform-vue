<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore,
  useUserStore } from '@vben/stores';

import {
  deleteBdLead,
  pageBdLead,
  } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import SysOriginLabel from '#/components/sys-origin-label.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

import BdLeadBindModal from './components/bd-lead-bind-modal.vue';
import BdLeadFormModal from './components/bd-lead-form-modal.vue';

defineOptions({ name: 'TeamBdLead' });

const accessStore = useAccessStore();
const userStore = useUserStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const bindOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const query = reactive({
  createUser: (accessStore.accessCodes || []).includes('select:all:bd:lead')
    ? null
    : userStore.userInfo?.userId || '',
  cursor: 1,
  limit: 20,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 120 },
  { dataIndex: 'bdQuantity', key: 'bdQuantity', title: 'BD数量', width: 100 },
  { dataIndex: 'contact', key: 'contact', title: '联系方式', width: 180 },
  { dataIndex: 'createUserName', key: 'createUserName', title: '创建人', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

function hasPermission(code: string) {
  const codes = accessStore.accessCodes || [];
  return codes.length === 0 || codes.includes(code);
}

const canCreate = computed(() => hasPermission('bd:lead:list:add'));
const canEdit = computed(() => hasPermission('bd:lead:list:edit'));
const canDelete = computed(() => hasPermission('bd:lead:list:del'));
const canBindMember = computed(() => hasPermission('bd:lead:list:add:member'));
const showOperationCol = computed(
  () => canEdit.value || canDelete.value || canBindMember.value,
);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageBdLead({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openCreate() {
  activeRow.value = {
    sysOrigin: query.sysOrigin,
  };
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = {
    ...record,
    sysOrigin: query.sysOrigin,
  };
  formOpen.value = true;
}

function openBind(record: Record<string, any>) {
  activeRow.value = { ...record };
  bindOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '您确定要删除吗(将与名下BD解除绑定, 不影响其他BD身份)?',
    async onOk() {
      await deleteBdLead(record.id);
      message.success('删除成功');
      await loadData(true);
    },
  });
}

loadData(true);
</script>

<template>
  <Page title="BD Lead">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.userId"
            placeholder="BD Leader用户ID"
            style="width: 220px"
            :sys-origin="query.sysOrigin"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button v-if="canCreate" @click="openCreate">新增BD Lead</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <SysOriginLabel :value="record.sysOrigin" />
          </template>
          <template v-else-if="column.key === 'userProfile'">
            <div class="user-cell">
              <img
                :src="record.userProfile?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-info">
                <div>{{ record.userProfile?.userNickname || '-' }}</div>
                <div class="user-sub">
                  {{ record.userProfile?.actualAccount || record.userProfile?.id || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'contact'">
            {{ canEdit ? record.contact || '-' : '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions' && showOperationCol">
            <Space wrap>
              <Button
                v-if="canBindMember"
                size="small"
                type="link"
                @click="openBind(record)"
              >
                增加子级BD
              </Button>
              <Button
                v-if="canEdit"
                size="small"
                type="link"
                @click="openEdit(record)"
              >
                编辑
              </Button>
              <Button
                v-if="canDelete"
                danger
                size="small"
                type="link"
                @click="handleDelete(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="pagination">
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

    <BdLeadFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      @close="formOpen = false"
      @success="loadData(true)"
    />

    <BdLeadBindModal
      :open="bindOpen"
      :row="activeRow"
      @close="bindOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  align-items: center;
  display: flex;
  gap: 10px;
}

.user-avatar {
  border-radius: 999px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.user-sub {
  color: #64748b;
  margin-top: 4px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
