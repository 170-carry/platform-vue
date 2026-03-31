<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  deleteTrumpet,
  listTrumpet,
  } from '#/api/legacy/game';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Select,
  Table,
  message
} from 'antdv-next';

import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';

defineOptions({ name: 'OperateTrumpetList' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const notMore = ref(false);
const accountHandleOpen = ref(false);
const activeUserId = ref<number | string>('');
const list = ref<Array<Record<string, any>>>([]);

const query = reactive<Record<string, any>>({
  del: 0,
  lastId: '',
  limit: 50,
  sysOrigin: '',
  userId: '',
});

const columns = computed<any[]>(() => {
  const base: any[] = [
    { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '来源系统', width: 120 },
    { dataIndex: 'user', key: 'user', title: '用户', width: 220 },
    { dataIndex: 'account', key: 'account', title: '账号', width: 180 },
    { dataIndex: 'amount', key: 'amount', title: '支付金币', width: 120 },
    { dataIndex: 'message', key: 'message', title: '内容', width: 320 },
    { dataIndex: 'createTime', key: 'createTime', title: '发送时间', width: 180 },
  ];
  if (Number(query.del) === 1) {
    base.push(
      { dataIndex: 'updateTime', key: 'updateTime', title: '删除时间', width: 180 },
      { dataIndex: 'sysUser', key: 'sysUser', title: '操作人', width: 140 },
    );
  } else {
    base.push({
      dataIndex: 'actions',
      key: 'actions',
      title: '操作',
      width: 160,
      fixed: 'right' as const,
    });
  }
  return base;
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

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openAccountHandle(userId?: number | string) {
  if (!userId) {
    return;
  }
  activeUserId.value = userId;
  accountHandleOpen.value = true;
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
  }
  if (query.lastId) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listTrumpet({ ...query });
    const current = result || [];
    notMore.value = current.length <= 0;
    list.value = [...list.value, ...current];
    if (list.value.length > 0) {
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

function handleDelete(record: Record<string, any>) {
  if (!record.id) {
    return;
  }
  Modal.confirm({
    title: '确定删除选择的喇叭记录吗?',
    async onOk() {
      await deleteTrumpet(record.id);
      message.success('删除成功');
      await loadData(true);
    },
  });
}
</script>

<template>
  <Page title="喇叭列表">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.del"
          style="width: 140px"
          @change="handleSearch"
        
          :options="[{ label: '未删除', value: 0 as any }, { label: '已删除', value: 1 as any }]"
        />
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="发送人账号"
          style="width: 320px"
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
        :scroll="{ x: 1320 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <button
              class="user-cell"
              type="button"
              @click="openUserDetails(record.userId)"
            >
              <img
                :src="record.userProfile?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-copy">
                <div>{{ record.userProfile?.userNickname || '-' }}</div>
                <div class="user-sub">用户ID {{ record.userId || '-' }}</div>
              </div>
            </button>
          </template>
          <template v-else-if="column.key === 'account'">
            <div>短ID: {{ record.userProfile?.actualAccount || '-' }}</div>
            <div>用户ID: {{ record.userId || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'sysUser'">
            {{ record.sysUser?.nickname || '-' }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="handleDelete(record)">
              删除
            </Button>
            <Button
              size="small"
              type="link"
              @click="openAccountHandle(record.userId)"
            >
              账号处理
            </Button>
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="more">
        <Button
          v-if="!notMore"
          :disabled="loading"
          :loading="loadMoreLoading"
          size="small"
          @click="loadData()"
        >
          加载更多
        </Button>
        <span v-else>已加载全部</span>
      </div>
    </Card>

    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeUserId"
      @close="accountHandleOpen = false"
      @success="loadData(true)"
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

.user-cell {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 0;
  text-align: left;
}

.user-avatar {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.user-sub {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}

.more {
  margin-top: 16px;
  text-align: center;
}
</style>
