<script lang="ts" setup>
import {
  reactive,
  ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pagePetFeeding } from '#/api/legacy/pet';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';
import { PET_FEED_TYPE_MAP } from '#/views/pet/shared';

import {
  Button,
  Card,
  Input,
  Pagination,
  Table,
  Tag,
} from 'antdv-next';

defineOptions({ name: 'PetFeeding' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  limit: 20,
  petId: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const columns = [
  { dataIndex: 'user', key: 'user', title: '用户名称', width: 280 },
  { dataIndex: 'feedingNum', key: 'feedingNum', title: '喂粮数量', width: 110 },
  { dataIndex: 'feedType', key: 'feedType', title: '喂养类型', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePetFeeding({ ...query });
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

void loadData(true);
</script>

<template>
  <Page title="宠物喂养记录">
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
          placeholder="用户ID"
          style="width: 220px"
          :sys-origin="query.sysOrigin"
        />
        <Input
          v-model:value="query.petId"
          allow-clear
          placeholder="宠物ID"
          style="width: 180px"
          @press-enter="handleSearch"
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
        :scroll="{ x: 760 }"
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
          <template v-else-if="column.key === 'feedType'">
            <Tag color="processing">
              {{ PET_FEED_TYPE_MAP[Number(record.feedType)] || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
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
