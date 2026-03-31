<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { listUserCandyTop } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import { Button,
  Card,
  Space,
  Table,
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateGoldBalance' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  limit: 200,
  sysOrigin: '',
  userId: '',
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

const columns = [
  { dataIndex: 'user', key: 'user', title: '用户', width: 320 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 160 },
];

async function loadData() {
  if (!query.sysOrigin) {
    return;
  }
  loading.value = true;
  try {
    list.value = (await listUserCandyTop({ ...query })) || [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="金币余额">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 260px"
          />
          <Button :loading="loading" type="primary" @click="loadData">
            搜索
          </Button>
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
          <template v-if="column.key === 'user'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
