<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { teamProcessApprovalTable } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import { getAllowedSysOrigins,
  formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Select,
  Space,
  Table
} from 'antdv-next';

import {
  BD_APPROVAL_REASONS,
  TEAM_APPROVAL_REASONS,
  buildReasonLabelMap,
} from './shared';

defineOptions({ name: 'TeamApplicationProcessList' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const teamReasonMap = buildReasonLabelMap([...TEAM_APPROVAL_REASONS]);
const bdReasonMap = buildReasonLabelMap([...BD_APPROVAL_REASONS]);

const loading = ref(false);
const loadMoreLoading = ref(false);
const notMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  associateId: '',
  beProcessUserId: '',
  lastId: '',
  reason: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  type: 'TEAM',
});

const reasonOptions = computed(() =>
  query.type === 'BD' ? BD_APPROVAL_REASONS : TEAM_APPROVAL_REASONS,
);

const columns = [
  { dataIndex: 'index', key: 'index', title: 'No', width: 70 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 100 },
  { dataIndex: 'reason', key: 'reason', title: '原因', width: 220 },
  { dataIndex: 'beProcessUser', key: 'beProcessUser', title: '申请人', width: 220 },
  { dataIndex: 'createUser', key: 'createUser', title: '操作人', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '操作时间', width: 180 },
];

function getReasonLabel(record: Record<string, any>) {
  return record.type === 'BD'
    ? bdReasonMap[record.reason] || record.reason || '-'
    : teamReasonMap[record.reason] || record.reason || '-';
}

function getUserText(profile?: Record<string, any>) {
  if (!profile) {
    return '-';
  }
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account;
  return account ? `${nickname} / ${account}` : nickname;
}

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function loadData(reset = false) {
  if (reset) {
    query.lastId = '';
    list.value = [];
  }
  if (loadMoreLoading.value) {
    return;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await teamProcessApprovalTable({ ...query });
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
  loadData(true);
}

loadData(true);
</script>

<template>
  <Page title="成员审核日志">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label"
            v-model:value="query.type"
            allow-clear
            placeholder="类型"
            style="width: 140px"
            @change="handleSearch"
          
            :options="[{ label: '团队', value: 'TEAM' as any }, { label: 'BD', value: 'BD' as any }]"
          />
          <AccountInput
            v-model:value="query.beProcessUserId"
            placeholder="申请人"
            style="width: 220px"
            :sys-origin="query.sysOrigin"
          />
          <Select option-label-prop="label"
            v-model:value="query.reason"
            allow-clear
            placeholder="原因"
            style="width: 220px"
            @change="handleSearch"
          
            :options="reasonOptions.map((item) => ({ label: item.name, value: item.value as any }))"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            查询
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
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'type'">
            {{ record.type === 'BD' ? 'BD' : '团队' }}
          </template>
          <template v-else-if="column.key === 'reason'">
            {{ getReasonLabel(record) }}
          </template>
          <template v-else-if="column.key === 'beProcessUser'">
            <Button
              v-if="record.beProcessUser?.id"
              type="link"
              @click="openUserDetails(record.beProcessUser?.id)"
            >
              {{ getUserText(record.beProcessUser) }}
            </Button>
            <span v-else>{{ getUserText(record.beProcessUser) }}</span>
          </template>
          <template v-else-if="column.key === 'createUser'">
            <span v-if="record.createUserOrigin === 1">
              {{ record.createSysUser?.nickname || '-' }}
            </span>
            <Button
              v-else-if="record.createUserProfile?.id"
              type="link"
              @click="openUserDetails(record.createUserProfile?.id)"
            >
              {{ getUserText(record.createUserProfile) }}
            </Button>
            <span v-else>{{ getUserText(record.createUserProfile) }}</span>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <span v-if="notMore">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData()"
        >
          加载更多
        </Button>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
