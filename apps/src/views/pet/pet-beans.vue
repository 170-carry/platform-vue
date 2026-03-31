<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pageUserBeanBalance } from '#/api/legacy/pet';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Modal,
  Pagination,
  Table,
} from 'antdv-next';

import BeanAdjustModal from './components/bean-adjust-modal.vue';
import BeanRunningWaterPanel from './components/bean-running-water-panel.vue';

defineOptions({ name: 'PetBeans' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const adjustOpen = ref(false);
const runningWaterOpen = ref(false);
const activeUserId = ref('');

const query = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const columns = [
  { dataIndex: 'user', key: 'user', title: '用户名称', width: 280 },
  { dataIndex: 'earnPoints', key: 'earnPoints', title: '获得金币', width: 120 },
  { dataIndex: 'consumptionPoints', key: 'consumptionPoints', title: '消耗金币', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '金币余额', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 180, fixed: 'right' as const },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserBeanBalance({ ...query });
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

function openUserDetails(record: Record<string, any>) {
  const userId = record.userBaseInfo?.id;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openAdjust(record: Record<string, any>) {
  activeUserId.value = String(record.userId || record.userBaseInfo?.id || '');
  adjustOpen.value = true;
}

function openRunningWater(record: Record<string, any>) {
  activeUserId.value = String(record.userId || record.userBaseInfo?.id || '');
  runningWaterOpen.value = true;
}

void loadData(true);
</script>

<template>
  <Page title="豆子账户">
    <Card>
      <div class="toolbar">
        <AccountInput
          v-model:value="query.userId"
          placeholder="用户ID"
          style="width: 240px"
          :sys-origin="query.sysOrigin"
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
        :scroll="{ x: 1180 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'user'">
            <button class="user-cell" type="button" @click="openUserDetails(record)">
              <img
                :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div class="user-copy">
                <div>{{ record.userBaseInfo?.userNickname || '-' }}</div>
                <div class="user-sub">
                  {{ record.userBaseInfo?.account || '-' }}
                  ({{ record.userBaseInfo?.accountStatusName || '-' }})
                </div>
              </div>
            </button>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openAdjust(record)">
              赠送/扣除
            </Button>
            <Button size="small" type="link" @click="openRunningWater(record)">
              流水
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

    <BeanAdjustModal
      :open="adjustOpen"
      :user-id="activeUserId"
      @close="adjustOpen = false"
      @success="loadData(true)"
    />

    <Modal
      :footer="null"
      :open="runningWaterOpen"
      destroy-on-close
      title="流水"
      width="1180"
      @cancel="runningWaterOpen = false"
    >
      <BeanRunningWaterPanel :user-id="activeUserId" />
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
