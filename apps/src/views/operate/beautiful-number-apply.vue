<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  handleBeautifulNumberApplyState,
  userBeautifulNumberApplyTable,
  } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Pagination,
  Table,
  Tag,
  message,
} from 'antdv-next';

import BeautifulNumberApplyHandleModal from './components/beautiful-number-apply-handle-modal.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateBeautifulNumberApply' });

const accessStore = useAccessStore();
const loading = ref(false);
const rejectLoading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rejectOpen = ref(false);
const rejectTargetId = ref<number | string>('');

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '来源系统', width: 120 },
  { dataIndex: 'applyAccount', key: 'applyAccount', title: 'ID', width: 120 },
  { dataIndex: 'wealthLevel', key: 'wealthLevel', title: '财富等级', width: 120 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '申请人', width: 260 },
  { dataIndex: 'state', key: 'state', title: '状态', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140, fixed: 'right' as const },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
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
    const result = await userBeautifulNumberApplyTable({ ...query });
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

function openRejectModal(id?: number | string) {
  if (!id) {
    return;
  }
  rejectTargetId.value = id;
  rejectOpen.value = true;
}

function getStateMeta(state: number) {
  if (state === 1) {
    return { color: 'success', text: '同意' };
  }
  if (state === 2) {
    return { color: 'error', text: '驳回' };
  }
  return { color: 'processing', text: '待处理' };
}

function handleAgree(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    title: '是否同意该申请',
    async onOk() {
      await handleBeautifulNumberApplyState(id, 1, '');
      message.success('操作成功');
      await loadData();
    },
  });
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <Page title="用户申请靓号记录">
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
          style="width: 300px"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1100 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <Tag>{{ record.sysOrigin || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'userBaseInfo'">
            <UserProfileLink :profile="record.userBaseInfo" />
          </template>
          <template v-else-if="column.key === 'state'">
            <Tag :color="getStateMeta(record.state).color">
              {{ getStateMeta(record.state).text }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-row">
              <Button
                size="small"
                type="link"
                :disabled="record.state !== 0"
                @click="handleAgree(record.id)"
              >
                同意
              </Button>
              <Button
                size="small"
                type="link"
                :disabled="record.state !== 0"
                @click="openRejectModal(record.id)"
              >
                驳回
              </Button>
            </div>
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

    <BeautifulNumberApplyHandleModal
      v-model:loading="rejectLoading"
      :id="rejectTargetId"
      :open="rejectOpen"
      @close="rejectOpen = false"
      @success="loadData()"
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

.action-row {
  display: flex;
  gap: 4px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
