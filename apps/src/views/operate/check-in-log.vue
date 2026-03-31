<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { pageUserCheckLog } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Pagination,
  Table,
} from 'antdv-next';

defineOptions({ name: 'OperateCheckInLog' });

const router = useRouter();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<null | [string, string]>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  endTime: '',
  limit: 20,
  startTime: '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'userId', key: 'userId', title: '用户ID', width: 120 },
  { dataIndex: 'userNickname', key: 'userNickname', title: '昵称', width: 220 },
  { dataIndex: 'userSexName', key: 'userSexName', title: '性别', width: 120 },
  {
    dataIndex: 'checkInNumber',
    key: 'checkInNumber',
    title: '连续签到天数',
    width: 140,
  },
  {
    dataIndex: 'reward',
    key: 'reward',
    title: '签到奖励(道具/糖果数)',
    width: 220,
  },
  { dataIndex: 'createTime', key: 'createTime', title: '签到时间', width: 180 },
];

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserCheckLog({ ...query });
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

void loadData(true);
</script>

<template>
  <Page title="用户签到">
    <Card>
      <div class="toolbar">
        <AccountInput
          v-model:value="query.userId"
          placeholder="用户ID"
          style="width: 300px"
        />
        <DateRangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
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
          <template v-if="column.key === 'userNickname'">
            <Button
              v-if="record.userNickname"
              type="link"
              @click="openUserDetails(record.userId)"
            >
              {{ record.userNickname }}
            </Button>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'reward'">
            <img
              v-if="record.propsId"
              :src="record.propsSourceRecord?.cover || ''"
              alt=""
              class="reward-cover"
            >
            <span v-else>{{ record.quantity || 0 }}</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
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
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.reward-cover {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
