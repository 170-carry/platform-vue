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
  listMemberTable,
  removeTeamMember,
  } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antdv-next';

import {
  TEAM_MEMBER_ROLE_OPTIONS,
} from './shared';
import MemberAddModal from './components/member-add-modal.vue';
import MemberChangeModal from './components/member-change-modal.vue';
import MemberRemarkModal from './components/member-remark-modal.vue';
import MemberTargetResetModal from './components/member-target-reset-modal.vue';

defineOptions({ name: 'TeamMemberList' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const loadMoreLoading = ref(false);
const deleteLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const selectedRowKeys = ref<Array<number | string>>([]);
const selectedRows = ref<Array<Record<string, any>>>([]);
const addOpen = ref(false);
const changeOpen = ref(false);
const remarkOpen = ref(false);
const resetOpen = ref(false);
const activeRecord = ref<null | Record<string, any>>(null);

const roleLabelMap = TEAM_MEMBER_ROLE_OPTIONS.reduce<Record<string, string>>(
  (result, item) => {
    result[item.value] = item.name;
    return result;
  },
  {},
);

const query = reactive({
  endTime: '',
  lastId: '',
  limit: 20,
  memberId: '',
  notActiveDays: '',
  ownUserId: '',
  role: '',
  startTime: '',
  sysOrigin: sysOriginOptions[0]?.value ?? '',
  teamId: '',
});

const columns = [
  { dataIndex: 'index', key: 'index', title: 'No', width: 70 },
  { dataIndex: 'ownUserProfile', key: 'ownUserProfile', title: '代理', width: 240 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '成员', width: 260 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 220 },
  { dataIndex: 'createUserProfile', key: 'createUserProfile', title: '创建人', width: 240 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120, fixed: 'right' as const },
];

const rowSelection = computed(() => ({
  getCheckboxProps: (record: Record<string, any>) => ({
    disabled: record.role === 'OWN',
  }),
  onChange: (keys: Array<number | string>, rows: Array<Record<string, any>>) => {
    selectedRowKeys.value = keys;
    selectedRows.value = rows;
  },
  selectedRowKeys: selectedRowKeys.value,
}));

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

function getUserText(profile?: Record<string, any>) {
  if (!profile) {
    return '-';
  }
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account || profile.id;
  return account ? `${nickname} / ${account}` : nickname;
}

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function clearSelection() {
  selectedRowKeys.value = [];
  selectedRows.value = [];
}

async function loadData(reset = false, append = false) {
  if (reset) {
    query.lastId = '';
    list.value = [];
    clearSelection();
  }
  if (append) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listMemberTable({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
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

function openChange(record: Record<string, any>) {
  activeRecord.value = record;
  changeOpen.value = true;
}

function openRemark(record: Record<string, any>) {
  activeRecord.value = record;
  remarkOpen.value = true;
}

function openReset(record: Record<string, any>) {
  activeRecord.value = record;
  resetOpen.value = true;
}

async function removeMembers(ids: Array<number | string>) {
  deleteLoading.value = true;
  try {
    await removeTeamMember({ ids });
    message.success('操作成功');
    list.value = list.value.filter((item) => {
      const userId = item.userProfile?.id;
      return !ids.some((id) => String(id) === String(userId));
    });
    query.lastId = String(list.value[list.value.length - 1]?.id || '');
    clearSelection();
  } finally {
    deleteLoading.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  const memberId = record.userProfile?.id;
  if (!memberId) {
    return;
  }
  Modal.confirm({
    title: '是否确认删除, 本期账单工作数据将会同步移除?',
    async onOk() {
      await removeMembers([memberId]);
    },
  });
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    return;
  }
  const ids = selectedRows.value
    .map((item) => item.userProfile?.id)
    .filter(Boolean);
  if (ids.length === 0) {
    return;
  }
  Modal.confirm({
    title: '是否确认删除, 本期账单工作数据将会同步移除?',
    async onOk() {
      await removeMembers(ids);
    },
  });
}

function handleRemarkSuccess(payload: Record<string, any>) {
  const current = activeRecord.value;
  if (!current) {
    return;
  }
  current.remarks = payload.remarks;
}

loadData(true);
</script>

<template>
  <Page title="成员列表">
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
            v-model:value="query.role"
            allow-clear
            placeholder="角色"
            style="width: 140px"
            @change="handleSearch"
          
            :options="TEAM_MEMBER_ROLE_OPTIONS.map((item) => ({ label: item.name, value: item.value as any }))"
          />
          <AccountInput
            v-model:value="query.ownUserId"
            :sys-origin="query.sysOrigin"
            placeholder="代理ID"
            style="width: 220px"
          />
          <AccountInput
            v-model:value="query.memberId"
            :sys-origin="query.sysOrigin"
            placeholder="成员ID"
            style="width: 220px"
          />
          <Input
            v-model:value="query.notActiveDays"
            allow-clear
            placeholder="不活跃天数"
            style="width: 160px"
            @press-enter="handleSearch"
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
          <Button @click="addOpen = true">新增</Button>
          <Button
            v-if="selectedRowKeys.length > 0"
            danger
            :loading="deleteLoading"
            @click="handleBatchDelete"
          >
            删除
          </Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-selection="rowSelection"
        row-key="id"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'ownUserProfile'">
            <Button
              v-if="record.ownUserProfile?.id"
              class="user-cell user-cell--button"
              type="link"
              @click="openUserDetails(record.ownUserProfile?.id)"
            >
              <div class="user-main">
                <div>{{ getUserText(record.ownUserProfile) }}</div>
              </div>
            </Button>
            <span v-else>{{ getUserText(record.ownUserProfile) }}</span>
          </template>
          <template v-else-if="column.key === 'userProfile'">
            <Button
              v-if="record.userProfile?.id"
              class="user-cell user-cell--button"
              type="link"
              @click="openUserDetails(record.userProfile?.id)"
            >
              <div class="user-main">
                <div>{{ getUserText(record.userProfile) }}</div>
                <Tag class="user-role">
                  {{ roleLabelMap[record.role] || record.role || '-' }}
                </Tag>
              </div>
            </Button>
            <span v-else>{{ getUserText(record.userProfile) }}</span>
          </template>
          <template v-else-if="column.key === 'remarks'">
            {{ record.remarks || '-' }}
          </template>
          <template v-else-if="column.key === 'createUserProfile'">
            <Button
              v-if="record.createUserProfile?.id"
              class="user-cell user-cell--button"
              type="link"
              @click="openUserDetails(record.createUserProfile?.id)"
            >
              {{ getUserText(record.createUserProfile) }}
            </Button>
            <span v-else-if="record.createUserNickname">
              {{ record.createUserNickname }}
            </span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建: {{ formatDate(record.createTime) }}</div>
            <div>活跃: {{ formatDate(record.activeTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button
                v-if="record.role !== 'OWN'"
                size="small"
                type="link"
                @click="openChange(record)"
              >
                更换团队
              </Button>
              <Button
                v-if="record.role !== 'OWN'"
                danger
                size="small"
                type="link"
                @click="handleDelete(record)"
              >
                删除成员
              </Button>
              <Button
                size="small"
                type="link"
                @click="openRemark(record)"
              >
                修改备注
              </Button>
              <Button
                size="small"
                type="link"
                @click="openReset(record)"
              >
                重置目标
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false, true)"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <MemberAddModal
      :open="addOpen"
      :sys-origin="query.sysOrigin"
      @close="addOpen = false"
      @success="loadData(true)"
    />

    <MemberChangeModal
      :open="changeOpen"
      :row="activeRecord"
      @close="changeOpen = false"
      @success="loadData(true)"
    />

    <MemberRemarkModal
      :open="remarkOpen"
      :row="activeRecord"
      @close="remarkOpen = false"
      @success="handleRemarkSuccess"
    />

    <MemberTargetResetModal
      :open="resetOpen"
      :row="activeRecord"
      @close="resetOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  padding: 0;
}

.user-cell--button {
  justify-content: flex-start;
  white-space: normal;
}

.user-main {
  align-items: center;
  display: flex;
  gap: 8px;
  text-align: left;
}

.user-role {
  margin-inline-start: 4px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
