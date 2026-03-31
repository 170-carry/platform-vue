<script lang="ts" setup>
import {
  reactive,
  ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addDynamicBlacklist,
  deleteDynamicBlacklist,
  dynamicBlacklistPage,
  } from '#/api/legacy/dynamic';
import AccountInput from '#/components/account-input.vue';
import SysOriginLabel from '#/components/sys-origin-label.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Table,
  Tag,
  message,
} from 'antdv-next';

defineOptions({ name: 'DynamicBlacklist' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);

const query = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const form = reactive({
  account: '',
});

const columns = [
  { dataIndex: 'originSys', key: 'originSys', title: '系统', width: 120 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 220 },
  { dataIndex: 'nickname', key: 'nickname', title: '昵称', width: 180 },
  { dataIndex: 'userSex', key: 'userSex', title: '性别', width: 100 },
  { dataIndex: 'country', key: 'country', title: '国家/地区', width: 160 },
  { dataIndex: 'createTime', key: 'createTime', title: '拉黑时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await dynamicBlacklistPage({ ...query });
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
  form.account = '';
  modalOpen.value = true;
}

function openUserDetails(record: Record<string, any>) {
  const userId = record.id || record.userId;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function handleDelete(record: Record<string, any>) {
  loading.value = true;
  try {
    await deleteDynamicBlacklist(record.id);
    message.success('删除成功');
    await loadData();
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  if (!form.account.trim()) {
    message.warning('请输入账号');
    return;
  }
  saving.value = true;
  try {
    await addDynamicBlacklist({
      account: form.account.trim(),
      sysOrigin: query.sysOrigin,
    });
    message.success('保存成功');
    modalOpen.value = false;
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

loadData(true);
</script>

<template>
  <Page title="黑名单">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="用户ID"
          style="width: 220px"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button @click="openCreate">加入黑名单</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'originSys'">
            <SysOriginLabel :value="record.originSys || record.sysOrigin" />
          </template>
          <template v-else-if="column.key === 'user'">
            <div class="user-cell">
              <img
                :src="record.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-info">
                <div>{{ record.actualAccount || '-' }}</div>
                <Tag v-if="record.countryCode">{{ record.countryCode }}</Tag>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'nickname'">
            <Button type="link" @click="openUserDetails(record)">
              {{ record.userNickname || '-' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'userSex'">
            {{ Number(record.userSex) === 1 ? '男' : '女' }}
          </template>
          <template v-else-if="column.key === 'country'">
            {{ record.countryName || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button danger size="small" type="link" @click="handleDelete(record)">
              删除
            </Button>
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

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      destroy-on-close
      title="动态-禁止用户发动态"
      @cancel="modalOpen = false"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem label="平台">
          <Input :value="query.sysOrigin" disabled />
        </FormItem>
        <FormItem label="账号">
          <Input v-model:value="form.account" />
        </FormItem>
      </Form>
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

.user-info {
  min-width: 0;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
