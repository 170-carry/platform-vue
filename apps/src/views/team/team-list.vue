<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore, useUserStore } from '@vben/stores';

import { regionConfigTable } from '#/api/legacy/system';
import {
  delTeamBatch,
  listMembers,
  listTeamTable,
} from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Empty,
  Input,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import {
  TEAM_STATUS_OPTIONS,
} from './shared';
import TeamApplicationProcessDrawer from './components/team-application-process-drawer.vue';
import TeamBindBdModal from './components/team-bind-bd-modal.vue';
import TeamContactDrawer from './components/team-contact-drawer.vue';
import TeamCreateDrawer from './components/team-create-drawer.vue';
import TeamDetailsDrawer from './components/team-details-drawer.vue';
import TeamEditDrawer from './components/team-edit-drawer.vue';
import TeamNoticeListDrawer from './components/team-notice-list-drawer.vue';
import TeamNoticeSendDrawer from './components/team-notice-send-drawer.vue';
import TeamRemarkDrawer from './components/team-remark-drawer.vue';

defineOptions({ name: 'TeamList' });

const accessStore = useAccessStore();
const userStore = useUserStore();

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const deleteLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const members = ref<Array<Record<string, any>>>([]);
const regionOptions = ref<Array<Record<string, any>>>([]);
const selectedRows = ref<Array<Record<string, any>>>([]);
const createOpen = ref(false);
const editOpen = ref(false);
const remarkOpen = ref(false);
const contactOpen = ref(false);
const detailsOpen = ref(false);
const noticeSendOpen = ref(false);
const noticeListOpen = ref(false);
const applicationOpen = ref(false);
const bindBdOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);
const activeTeamId = ref('');

const query = reactive({
  createUser: '',
  endTime: '',
  id: '',
  lastId: '',
  limit: 20,
  memberQuantityRange: '',
  ownUserId: '',
  region: '',
  startTime: '',
  status: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? '',
});

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

const accessCodes = computed(() => accessStore.accessCodes || []);

function hasPermission(code: string) {
  const codes = accessCodes.value;
  return codes.length === 0 || codes.includes(code);
}

const isQueryPermissions = computed(
  () => hasPermission('team:list:query:all') || hasPermission('team:list:query:self'),
);
const backUserConditionVisible = computed(() => hasPermission('team:list:query:all'));
const canCreate = computed(() => hasPermission('team:list:add'));
const canDelete = computed(() => hasPermission('team:list:del'));
const canEdit = computed(() => hasPermission('team:list:edit'));
const canBindBd = computed(() => hasPermission('team:list:bind:bd'));
const canSendNotice = computed(() => hasPermission('team:list:send:notice'));
const canQueryNotice = computed(() => hasPermission('team:list:query:send:notice'));
const canQueryApply = computed(() => hasPermission('team:list:query:apply'));

const columns = [
  { dataIndex: 'index', key: 'index', title: 'No', width: 70 },
  { dataIndex: 'ownUserProfile', key: 'ownUserProfile', title: '代理', width: 260 },
  { dataIndex: 'info', key: 'info', title: '信息', width: 180 },
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 120 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 120 },
  { dataIndex: 'createUser', key: 'createUser', title: '创建人', width: 220 },
  { dataIndex: 'updateUser', key: 'updateUser', title: '修改人', width: 220 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 340, fixed: 'right' as const },
];

const rowSelection = computed(() => ({
  onChange: (_keys: Array<number | string>, rows: Array<Record<string, any>>) => {
    selectedRows.value = rows;
  },
  selectedRowKeys: selectedRows.value.map((item) => String(item.teamProfile?.id || '')),
}));

async function loadRegions(sysOrigin: string) {
  if (!sysOrigin) {
    regionOptions.value = [];
    return;
  }
  regionOptions.value = await regionConfigTable({ sysOrigin });
}

async function loadMembersData() {
  members.value = await listMembers();
}

function getUserText(profile?: Record<string, any>) {
  if (!profile) {
    return '-';
  }
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account || profile.id;
  return account ? `${nickname} / ${account}` : nickname;
}

async function loadData(reset = false, append = false) {
  if (!isQueryPermissions.value || !query.sysOrigin) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
    selectedRows.value = [];
  }
  if (append) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listTeamTable({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.lastId = String(list.value[list.value.length - 1]?.teamProfile?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

async function handleSysOriginChange(value: string) {
  query.sysOrigin = value;
  query.region = '';
  await loadRegions(value);
  await loadData(true);
}

function handleBatchDelete() {
  const ids = selectedRows.value
    .map((item) => item.teamProfile?.id)
    .filter(Boolean);
  if (ids.length === 0) {
    return;
  }
  Modal.confirm({
    title: '系统将移除团队所有数据, 操作不可逆!!!! (主播工作/账单/团队信息/团队成员/BD关系等所有)',
    async onOk() {
      deleteLoading.value = true;
      try {
        await delTeamBatch(ids);
        message.success('删除成功');
        await loadData(true);
      } finally {
        deleteLoading.value = false;
      }
    },
  });
}

function handleEditSuccess(form: Record<string, any>, regionRow: Record<string, any> | null) {
  if (!activeRow.value) {
    return;
  }
  activeRow.value.teamProfile = form;
  if (regionRow) {
    activeRow.value.regionName = regionRow.regionName;
  }
}

function handleAddRemarks(remark: Record<string, any>) {
  if (!activeRow.value) {
    return;
  }
  activeRow.value.teamProfile.remarks = [
    ...(activeRow.value.teamProfile.remarks || []),
    remark,
  ];
}

function handleRemoveRemarks(index: number) {
  if (!activeRow.value?.teamProfile?.remarks) {
    return;
  }
  activeRow.value.teamProfile.remarks.splice(index, 1);
}

function handleAddContact(contact: Record<string, any>) {
  if (!activeRow.value) {
    return;
  }
  activeRow.value.teamProfile.contacts = [
    ...(activeRow.value.teamProfile.contacts || []),
    contact,
  ];
}

function handleRemoveContact(index: number) {
  if (!activeRow.value?.teamProfile?.contacts) {
    return;
  }
  activeRow.value.teamProfile.contacts.splice(index, 1);
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailsOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = record;
  editOpen.value = true;
}

function openRemark(record: Record<string, any>) {
  activeRow.value = record;
  remarkOpen.value = true;
}

function openContact(record: Record<string, any>) {
  activeRow.value = record;
  contactOpen.value = true;
}

function openNoticeSend(record: Record<string, any>) {
  activeTeamId.value = String(record.teamProfile?.id || '');
  noticeSendOpen.value = true;
}

function openNoticeList(record: Record<string, any>) {
  activeTeamId.value = String(record.teamProfile?.id || '');
  noticeListOpen.value = true;
}

function openApplication(record: Record<string, any>) {
  activeTeamId.value = String(record.teamProfile?.id || '');
  applicationOpen.value = true;
}

function openBindBd(record: Record<string, any>) {
  activeRow.value = record.teamProfile;
  bindBdOpen.value = true;
}

watch(
  isQueryPermissions,
  async (allowed) => {
    if (!allowed) {
      return;
    }
    if (!query.sysOrigin) {
      query.sysOrigin = sysOriginOptions.value[0]?.value ?? '';
    }
    if (hasPermission('team:list:query:self') && !hasPermission('team:list:query:all')) {
      query.createUser = String(userStore.userInfo?.userId || '');
    }
    await Promise.all([loadRegions(query.sysOrigin), loadMembersData()]);
    await loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <Page title="团队列表">
    <template v-if="isQueryPermissions">
      <Card>
        <InlineFilterToolbar class="toolbar">
          <InlineFilterField label="系统" :control-width="140">
            <SysOriginSelect
              v-model:value="query.sysOrigin"
              @change="handleSysOriginChange"

              :options="sysOriginOptions"
            ></SysOriginSelect>
          </InlineFilterField>
          <InlineFilterField label="区域" :control-width="160">
            <Select option-label-prop="label"
              v-model:value="query.region"
              allow-clear
              placeholder="区域"
              @change="handleSearch"
            
              :options="regionOptions.map((item) => ({ label: item.regionName, value: item.id as any }))"
            />
          </InlineFilterField>
          <InlineFilterField label="状态" :control-width="140">
            <Select option-label-prop="label"
              v-model:value="query.status"
              allow-clear
              placeholder="状态"
              @change="handleSearch"
            
              :options="TEAM_STATUS_OPTIONS.map((item) => ({ label: item.name, value: item.value as any }))"
            />
          </InlineFilterField>
          <InlineFilterField label="代理ID" :control-width="220">
            <AccountInput
              v-model:value="query.ownUserId"
              :sys-origin="query.sysOrigin"
              placeholder="代理ID"
            />
          </InlineFilterField>
          <InlineFilterField label="成员数量" :control-width="180">
            <Input
              v-model:value="query.memberQuantityRange"
              allow-clear
              placeholder="开始~结束成员数量"
              @press-enter="handleSearch"
            />
          </InlineFilterField>
          <InlineFilterField label="时间" :control-width="360">
            <DateRangePicker
              v-model:value="rangeDate"
              show-time
              value-format="x"
            />
          </InlineFilterField>
          <InlineFilterField
            v-if="backUserConditionVisible"
            label="后台成员"
            :control-width="160"
          >
            <Select option-label-prop="label"
              v-model:value="query.createUser"
              allow-clear
              placeholder="后台成员"
              show-search
              @change="handleSearch"
            
              :options="members.map((item) => ({ label: item.nickname, value: item.id as any }))"
            />
          </InlineFilterField>
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button v-if="canCreate" @click="createOpen = true">新增</Button>
          <Button
            v-if="selectedRows.length > 0 && canDelete"
            danger
            :loading="deleteLoading"
            @click="handleBatchDelete"
          >
            删除
          </Button>
        </InlineFilterToolbar>

        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="false"
          :row-selection="rowSelection"
          :row-key="(record: any) => String(record.teamProfile?.id || record.id || '')"
          :scroll="{ x: 1780 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
            </template>
            <template v-else-if="column.key === 'ownUserProfile'">
              <div class="user-cell">
                <div>{{ getUserText(record.ownUserProfile) }}</div>
                <div v-if="record.bdUserProfile" class="muted">
                  BD: {{ getUserText(record.bdUserProfile) }}
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'info'">
              <div>成员: {{ record.teamProfile?.counter?.memberQuantity || 0 }}/{{ record.teamProfile?.setting?.maxMember || '-' }}</div>
              <div>
                状态:
                <Tag :color="record.teamProfile?.status === 'AVAILABLE' ? 'green' : 'red'">
                  {{ record.teamProfile?.status === 'AVAILABLE' ? '正常' : '关闭' }}
                </Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'remarks'">
              <Button type="link" @click="openRemark(record)">
                {{ record.teamProfile?.remarks?.length || 0 }}
              </Button>
            </template>
            <template v-else-if="column.key === 'createUser'">
              {{ getUserText(record.createUserProfile) || record.createUserNickname || '-' }}
            </template>
            <template v-else-if="column.key === 'updateUser'">
              {{ getUserText(record.updateUserProfile) || record.updateUserNickname || '-' }}
            </template>
            <template v-else-if="column.key === 'time'">
              <div>创建: {{ formatDate(record.teamProfile?.createTime) }}</div>
              <div>修改: {{ formatDate(record.teamProfile?.updateTime) }}</div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space wrap>
                <Button size="small" type="link" @click="openDetails(record)">
                  资料详情
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="openEdit(record)"
                >
                  修改资料
                </Button>
                <Button
                  v-if="canBindBd"
                  size="small"
                  type="link"
                  @click="openBindBd(record)"
                >
                  绑定BD
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="openRemark(record)"
                >
                  备注信息
                </Button>
                <Button
                  v-if="canEdit"
                  size="small"
                  type="link"
                  @click="openContact(record)"
                >
                  联系方式
                </Button>
                <Button
                  v-if="canSendNotice"
                  size="small"
                  type="link"
                  @click="openNoticeSend(record)"
                >
                  发送通知
                </Button>
                <Button
                  v-if="canQueryNotice"
                  size="small"
                  type="link"
                  @click="openNoticeList(record)"
                >
                  通知记录
                </Button>
                <Button
                  v-if="canQueryApply"
                  size="small"
                  type="link"
                  @click="openApplication(record)"
                >
                  团队申请
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
    </template>

    <Card v-else>
      <Empty description="抱歉您无权查看，请联系管理员开通查看权限" />
    </Card>

    <TeamCreateDrawer
      :open="createOpen"
      :sys-origin="query.sysOrigin"
      @close="createOpen = false"
      @success="loadData(true)"
    >
      <template #regions>
        <SelectOption
          v-for="item in regionOptions"
          :key="item.id"
          :label="item.regionName"
          :value="item.id"
        >
          {{ item.regionName }}
        </SelectOption>
      </template>
    </TeamCreateDrawer>

    <TeamEditDrawer
      :open="editOpen"
      :profile="activeRow?.teamProfile || null"
      @close="editOpen = false"
      @success="handleEditSuccess"
    />

    <TeamRemarkDrawer
      :open="remarkOpen"
      :profile="activeRow?.teamProfile || null"
      @add-remarks="handleAddRemarks"
      @close="remarkOpen = false"
      @revemo-remarks="handleRemoveRemarks"
    />

    <TeamContactDrawer
      :open="contactOpen"
      :profile="activeRow?.teamProfile || null"
      @add-contact="handleAddContact"
      @close="contactOpen = false"
      @revemo-contact="handleRemoveContact"
    />

    <TeamDetailsDrawer
      :open="detailsOpen"
      :team-id="activeRow?.teamProfile?.id || ''"
      @close="detailsOpen = false"
    />

    <TeamNoticeSendDrawer
      :open="noticeSendOpen"
      :team-id="activeTeamId"
      @close="noticeSendOpen = false"
    />

    <TeamNoticeListDrawer
      :open="noticeListOpen"
      :team-id="activeTeamId"
      @close="noticeListOpen = false"
    />

    <TeamApplicationProcessDrawer
      :open="applicationOpen"
      :team-id="activeTeamId"
      @close="applicationOpen = false"
    />

    <TeamBindBdModal
      :open="bindBdOpen"
      :row="activeRow"
      @close="bindBdOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.muted {
  color: #64748b;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
