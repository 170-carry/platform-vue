<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { refundAnchorTrackRecordPage } from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Pagination,
  Table,
} from 'antdv-next';

defineOptions({ name: 'OperateRefundDeductTagLog' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive<Record<string, any>>({
  anchorUserId: '',
  cursor: 1,
  limit: 20,
  refunderUserId: '',
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'anchorUserProfile', key: 'anchorUserProfile', title: '主播信息', width: 280 },
  { dataIndex: 'refundUserProfile', key: 'refundUserProfile', title: '退款人信息', width: 280 },
  { dataIndex: 'candyQuantity', key: 'candyQuantity', title: '扣除目标', width: 120 },
  { dataIndex: 'years', key: 'years', title: '扣除日期', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
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

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);

function getAccountText(userInfo?: Record<string, any>) {
  if (!userInfo) {
    return '';
  }
  const account = userInfo.account || userInfo.actualAccount || '';
  if (userInfo.ownSpecialId?.account) {
    return `${account} / ${userInfo.ownSpecialId.account}靓`;
  }
  return account;
}

function openUserDetails(userId: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    list.value = [];
    total.value = 0;
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await refundAnchorTrackRecordPage({ ...query });
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
</script>

<template>
  <Page title="退款扣除目标">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <AccountInput
          v-model:value="query.anchorUserId"
          :sys-origin="query.sysOrigin"
          placeholder="主播ID"
          style="width: 240px"
        />
        <AccountInput
          v-model:value="query.refunderUserId"
          :sys-origin="query.sysOrigin"
          placeholder="退款人ID"
          style="width: 240px"
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
        :scroll="{ x: 980 }"
      >
        <template #bodyCell="{ column, record }">
          <template
            v-if="
              column.key === 'anchorUserProfile' ||
                column.key === 'refundUserProfile'
            "
          >
            <div class="user-cell">
              <img
                :src="record[column.key]?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-copy">
                <Button
                  size="small"
                  type="link"
                  @click="openUserDetails(record[column.key]?.id)"
                >
                  {{ record[column.key]?.userNickname || '-' }}
                </Button>
                <div class="user-meta">
                  {{ getAccountText(record[column.key]) || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'candyQuantity'">
            {{ record.trackRecord?.candyQuantity || '-' }}
          </template>
          <template v-else-if="column.key === 'years'">
            {{ record.trackRecord?.years || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.trackRecord?.createTime) }}
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
        />
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  align-items: center;
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
  background: #e2e8f0;
  border-radius: 999px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.user-copy {
  min-width: 0;
}

.user-meta {
  color: #64748b;
  font-size: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
