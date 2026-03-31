<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import { useRouter } from 'vue-router';

import { userPropsMikeType } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Pagination,
  Select,
  Table,
  Tag
} from 'antdv-next';

defineOptions({ name: 'OperateMikeTypeList' });

const accessStore = useAccessStore();
const router = useRouter();

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive<Record<string, any>>({
  cursor: 1,
  expireType: '',
  limit: 20,
  mikeType: '',
  sysOrigin: sysOriginOptions.value[0]?.value || '',
  userId: '',
});

const columns: any[] = [
  { dataIndex: 'buyerNickname', key: 'buyerNickname', title: '购买人', width: 180 },
  { dataIndex: 'mikeCover', key: 'mikeCover', title: '封面', width: 100 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'mikeType', key: 'mikeType', title: '麦位类型', width: 140 },
  { dataIndex: 'expireType', key: 'expireType', title: '过期类型', width: 120 },
  { dataIndex: 'propsCandy', key: 'propsCandy', title: '金额', width: 120 },
  { dataIndex: 'expireTime', key: 'expireTime', title: '过期时间', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await userPropsMikeType({ ...query });
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

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

loadData(true);
</script>

<template>
  <Page title="购买麦位类型流水">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <div class="account-filter">
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户id"
            type="USER"
          />
        </div>
        <Select option-label-prop="label"
          v-model:value="query.mikeType"
          allow-clear
          placeholder="麦位类型"
          style="width: 150px"
          @change="handleSearch"
        
          :options="[{ label: '特殊麦位', value: 'SPECIAL_MIKE' as any }, { label: '聚会麦位', value: 'PARTY_MIKE' as any }, { label: '尊贵麦位', value: 'HONORABLE_MIKE' as any }]"
        />
        <Select option-label-prop="label"
          v-model:value="query.expireType"
          allow-clear
          placeholder="过期类型"
          style="width: 150px"
          @change="handleSearch"
        
          :options="[{ label: '临时', value: 'TEMPORARY' as any }, { label: '永久', value: 'PERMANENT' as any }]"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">搜索</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'buyerNickname'">
            <Button type="link" @click="openUserDetails(record.userId)">
              {{ record.buyerNickname || record.userId || '-' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'mikeCover'">
            <Image :preview="false" :src="record.mikeCover" class="cover" />
          </template>
          <template v-else-if="column.key === 'mikeType'">
            <Tag>{{ record.mikeType || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'expireType'">
            <Tag>{{ record.expireType === 'TEMPORARY' ? '临时' : '永久' }}</Tag>
          </template>
          <template v-else-if="column.key === 'expireTime'">
            {{ formatDate(record.expireTime) }}
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

.account-filter {
  min-width: 260px;
  width: 300px;
}

.cover {
  border-radius: 8px;
  height: 50px;
  width: 50px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
