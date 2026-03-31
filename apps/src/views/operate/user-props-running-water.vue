<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { userPropsTable } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Image,
  Input,
  Pagination,
  Table,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';
import { PROPS_ORIGIN_OPTIONS } from './shared';

defineOptions({ name: 'OperateUserPropsRunningWater' });

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<null | [string, string]>(null);
const originKeyword = ref('');

const query = reactive<Record<string, any>>({
  buyerId: '',
  cursor: 1,
  endTime: '',
  limit: 20,
  origin: '',
  propsId: '',
  receiverId: '',
  startTime: '',
});

const columns: any[] = [
  { dataIndex: 'buyerUserProfile', key: 'buyerUserProfile', title: '购买人', width: 240 },
  { dataIndex: 'propsCandy', key: 'propsCandy', title: '金额', width: 100 },
  { dataIndex: 'receiverUserProfile', key: 'receiverUserProfile', title: '接收人', width: 240 },
  { dataIndex: 'propsOriginDesc', key: 'propsOriginDesc', title: '来源描述', width: 220 },
  { dataIndex: 'propsCover', key: 'propsCover', title: '封面', width: 100 },
  { dataIndex: 'propsId', key: 'propsId', title: '道具ID', width: 120 },
  { dataIndex: 'propsName', key: 'propsName', title: '道具名称', width: 160 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const originOptions = computed(() => {
  const keyword = originKeyword.value.trim().toLowerCase();
  const target = keyword
    ? PROPS_ORIGIN_OPTIONS.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.value.toLowerCase().includes(keyword),
      )
    : PROPS_ORIGIN_OPTIONS;
  return target.map((item) => ({
    label: `${item.name} / ${item.value}`,
    value: item.value,
  }));
});

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

function normalizeOriginValue() {
  if (!query.origin) {
    return;
  }
  const hit = PROPS_ORIGIN_OPTIONS.find(
    (item) =>
      item.value.toLowerCase().includes(String(query.origin).toLowerCase()) ||
      item.name.toLowerCase().includes(String(query.origin).toLowerCase()),
  );
  if (hit) {
    query.origin = hit.value;
  }
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    normalizeOriginValue();
    const result = await userPropsTable({
      ...query,
      buyerAccount: query.buyerId,
      receiverAccount: query.receiverId,
    });
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
  <Page title="用户道具流水">
    <Card>
      <div class="toolbar">
        <AutoComplete
          v-model:value="query.origin"
          :options="originOptions"
          allow-clear
          placeholder="请输入或选择内容"
          style="width: 260px"
          @search="originKeyword = $event"
        />
        <Input
          v-model:value="query.propsId"
          placeholder="道具ID"
          style="width: 140px"
        />
        <AccountInput
          v-model:value="query.buyerId"
          placeholder="购买人ID"
          style="width: 260px"
        />
        <AccountInput
          v-model:value="query.receiverId"
          placeholder="接收人ID"
          style="width: 260px"
        />
        <DatePicker.RangePicker
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
        :scroll="{ x: 1360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'buyerUserProfile'">
            <UserProfileLink :profile="record.buyerUserProfile" />
          </template>
          <template v-else-if="column.key === 'receiverUserProfile'">
            <UserProfileLink :profile="record.receiverUserProfile" />
          </template>
          <template v-else-if="column.key === 'propsCover'">
            <Image
              :preview="false"
              :src="record.propsCover"
              class="props-cover"
            />
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

.props-cover {
  border-radius: 10px;
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
