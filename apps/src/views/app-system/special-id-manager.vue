<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import type {
  LegacySpecialIdFlowItem,
  LegacySpecialIdLogItem,
  } from '#/api/legacy/app-system';
import {
  pageSpecialIdLogs,
  removeSpecialId,
  saveOrUpdateSpecialId,
  specialIdFlow,
  updateSpecialIdAccount,
  updateSpecialIdExpiredTime,
  } from '#/api/legacy/app-system';
import AccountInput from '#/components/account-input.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  Tabs,
  TabPane,
  Tag,
  message,
} from 'antdv-next';

import SpecialIdCustomizeModal from './components/special-id-customize-modal.vue';
import SpecialIdFormDrawer from './components/special-id-form-drawer.vue';
import SpecialIdLogDrawer from './components/special-id-log-drawer.vue';

defineOptions({ name: 'AppSystemSpecialIdManager' });

const router = useRouter();
const accessStore = useAccessStore();

const activeTab = ref('setting');
const loading = ref(false);
const loadMoreLoading = ref(false);
const notData = ref(false);
const list = ref<LegacySpecialIdFlowItem[]>([]);
const formOpen = ref(false);
const latestLogOpen = ref(false);
const customizeOpen = ref(false);
const editTimeOpen = ref(false);
const editAccountOpen = ref(false);
const saving = ref(false);
const logLoading = ref(false);
const logTotal = ref(0);
const logList = ref<LegacySpecialIdLogItem[]>([]);
const selectedRow = ref<LegacySpecialIdFlowItem | null>(null);
const editFormRecord = ref<Record<string, any> | null>(null);

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const settingQuery = reactive({
  account: '',
  lastId: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const logQuery = reactive({
  cursor: 1,
  limit: 20,
  userId: '',
});

const editTimeDays = ref('');
const editAccountForm = reactive({
  expiredDays: '',
  id: '',
  newAccount: '',
  remark: '',
});

const settingColumns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 220 },
  { dataIndex: 'account', key: 'account', title: '靓号', width: 140 },
  { dataIndex: 'expiredTime', key: 'expiredTime', title: '过期时间', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'optUserNickname', key: 'optUserNickname', title: '操作人', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 360 },
];

const logColumns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'user', key: 'user', title: '用户', width: 220 },
  { dataIndex: 'eventDesc', key: 'eventDesc', title: '系统', width: 680 },
  { dataIndex: 'optUserNickname', key: 'optUserNickname', title: '操作用户', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const settingScroll = computed(() => ({ x: 1600 }));
const logScroll = computed(() => ({ x: 1340 }));
const showSettingTab = computed(() => hasPermission('user:special:table:query:list'));
const showLogTab = computed(() => hasPermission('user:special:log:table:query:list'));

function hasPermission(code: string) {
  const codes = accessStore.accessCodes || [];
  return codes.length === 0 || codes.includes(code);
}

if (!showSettingTab.value && showLogTab.value) {
  activeTab.value = 'logs';
}

function getEffectiveSpecialQuery() {
  const account = String(settingQuery.account || '').trim();
  const userId = String(settingQuery.userId || '').trim();
  return {
    ...settingQuery,
    account: account.length === 0 && userId.length === 0 ? 'aaaaa' : account,
    userId,
  };
}

function getUserInfo(record: LegacySpecialIdFlowItem) {
  return record.userBaseInfo || {};
}

function getSpecialInfo(record: LegacySpecialIdFlowItem) {
  return record.userSpecialId || {};
}

function openUserDetails(record: LegacySpecialIdFlowItem) {
  const userId = getUserInfo(record).id;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function loadSettingData(reset = false, append = false) {
  if (reset) {
    settingQuery.lastId = '';
    list.value = [];
  }
  if (append) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await specialIdFlow(getEffectiveSpecialQuery());
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      settingQuery.lastId = String(
        getSpecialInfo(list.value[list.value.length - 1] || {}).timeId || '',
      );
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

async function loadLogData(reset = false) {
  if (reset) {
    logQuery.cursor = 1;
  }
  logLoading.value = true;
  try {
    const result = await pageSpecialIdLogs({ ...logQuery });
    logList.value = result.records || [];
    logTotal.value = result.total || 0;
  } finally {
    logLoading.value = false;
  }
}

function handleLoadMore() {
  loadSettingData(false, true);
}

function openCreate() {
  editFormRecord.value = null;
  formOpen.value = true;
}

function openLatestLog(record: LegacySpecialIdFlowItem) {
  selectedRow.value = record;
  latestLogOpen.value = true;
}

function openEditAccount(record: LegacySpecialIdFlowItem) {
  selectedRow.value = record;
  editAccountForm.id = String(getSpecialInfo(record).id || '');
  editAccountForm.newAccount = '';
  editAccountForm.expiredDays = '';
  editAccountForm.remark = '';
  editAccountOpen.value = true;
}

function openEditTime(record: LegacySpecialIdFlowItem) {
  selectedRow.value = record;
  editTimeDays.value = '';
  editTimeOpen.value = true;
}

function openCustomize(record: LegacySpecialIdFlowItem) {
  selectedRow.value = record;
  customizeOpen.value = true;
}

function handleDelete(record: LegacySpecialIdFlowItem) {
  Modal.confirm({
    title: '是否确认删除?',
    async onOk() {
      await removeSpecialId(getSpecialInfo(record));
      message.success('操作成功');
      await loadSettingData(true, false);
    },
  });
}

async function handleCustomizeSubmit(value: Record<string, string>) {
  const record = selectedRow.value;
  if (!record) {
    return;
  }
  saving.value = true;
  try {
    await saveOrUpdateSpecialId({
      ...getSpecialInfo(record),
      customizeField: value,
    });
    message.success('操作成功');
    customizeOpen.value = false;
    await loadSettingData(true, false);
  } finally {
    saving.value = false;
  }
}

async function handleEditTimeSubmit() {
  const record = selectedRow.value;
  if (!record) {
    return;
  }
  if (!/^-?\d{1,4}$/.test(editTimeDays.value)) {
    message.warning('请输入有效数字-9999~9999');
    return;
  }
  saving.value = true;
  try {
    await updateSpecialIdExpiredTime({
      expiredDays: editTimeDays.value,
      id: getSpecialInfo(record).id,
    });
    message.success('操作成功');
    editTimeOpen.value = false;
    await loadSettingData(true, false);
  } finally {
    saving.value = false;
  }
}

async function handleEditAccountSubmit() {
  if (!String(editAccountForm.newAccount || '').trim()) {
    message.warning('请输入靓号');
    return;
  }
  if (!String(editAccountForm.expiredDays || '').trim()) {
    message.warning('请输入有效期');
    return;
  }
  saving.value = true;
  try {
    await updateSpecialIdAccount({
      ...editAccountForm,
      newAccount: String(editAccountForm.newAccount || '').trim(),
      remark: String(editAccountForm.remark || '').trim(),
    });
    message.success('操作成功');
    editAccountOpen.value = false;
    await loadSettingData(true, false);
  } finally {
    saving.value = false;
  }
}

function handleLogPageChange(page: number, pageSize: number) {
  logQuery.cursor = page;
  logQuery.limit = pageSize;
  loadLogData();
}

loadSettingData(true, false);
loadLogData(true);
</script>

<template>
  <Page title="靓号管理">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane
          v-if="hasPermission('user:special:table:query:list')"
          key="setting"
          tab="靓号管理"
        />
        <TabPane
          v-if="hasPermission('user:special:log:table:query:list')"
          key="logs"
          tab="靓号操作日志"
        />
      </Tabs>

      <template v-if="activeTab === 'setting'">
        <InlineFilterToolbar class="toolbar">
          <InlineFilterField label="系统">
            <SysOriginSelect
              v-model:value="settingQuery.sysOrigin"
              style="width: 140px"
              @change="loadSettingData(true, false)"

              :options="sysOriginOptions"
            ></SysOriginSelect>
          </InlineFilterField>
          <InlineFilterField label="用户ID">
            <AccountInput
              v-model:value="settingQuery.userId"
              :sys-origin="settingQuery.sysOrigin"
              placeholder="用户ID"
              style="width: 220px"
            />
          </InlineFilterField>
          <InlineFilterField label="靓号Account" :label-width="108">
            <Input
              v-model:value="settingQuery.account"
              allow-clear
              placeholder="靓号Account"
              style="width: 220px"
            />
          </InlineFilterField>
          <Button :loading="loading" type="primary" @click="loadSettingData(true, false)">
            搜索
          </Button>
          <Button
            v-if="hasPermission('user:special:add')"
            @click="openCreate"
          >
            添加
          </Button>
        </InlineFilterToolbar>

        <Table
          v-if="hasPermission('user:special:table:query:list')"
          :columns="settingColumns"
          :data-source="list"
          :loading="loading"
          :pagination="false"
          row-key="userSpecialId.id"
          :scroll="settingScroll"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sysOrigin'">
              <Tag>{{ getSpecialInfo(record).sysOrigin || '-' }}</Tag>
            </template>
            <template v-else-if="column.key === 'user'">
              <button class="user-cell" type="button" @click="openUserDetails(record)">
                <img
                  :src="getUserInfo(record).userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
                  alt=""
                  class="avatar"
                >
                <div class="user-copy">
                  <span class="user-name">{{ getUserInfo(record).userNickname || '-' }}</span>
                  <span class="user-sub">ID {{ getUserInfo(record).id || '-' }}</span>
                </div>
              </button>
            </template>
            <template v-else-if="column.key === 'account'">
              {{ getSpecialInfo(record).account || '-' }}
            </template>
            <template v-else-if="column.key === 'expiredTime'">
              {{ formatDate(getSpecialInfo(record).expiredTime) }}
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(getSpecialInfo(record).createTime) }}
            </template>
            <template v-else-if="column.key === 'updateTime'">
              {{ formatDate(getSpecialInfo(record).updateTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space wrap size="small">
                <Button
                  v-if="hasPermission('user:special:log:table:query:list')"
                  size="small"
                  type="link"
                  @click="openLatestLog(record)"
                >
                  查看日志
                </Button>
                <Button
                  v-if="hasPermission('user:special:update')"
                  size="small"
                  type="link"
                  @click="openEditAccount(record)"
                >
                  修改靓号
                </Button>
                <Button
                  v-if="hasPermission('user:special:editTime')"
                  size="small"
                  type="link"
                  @click="openEditTime(record)"
                >
                  编辑时间
                </Button>
                <Button
                  v-if="hasPermission('user:special:custom')"
                  size="small"
                  type="link"
                  @click="openCustomize(record)"
                >
                  自定义属性
                </Button>
                <Button
                  v-if="hasPermission('user:special:del')"
                  size="small"
                  type="link"
                  @click="handleDelete(record)"
                >
                  删除靓号
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <div v-if="settingQuery.lastId" class="load-more">
          <span v-if="notData">已加载全部</span>
          <Button
            v-else
            :loading="loadMoreLoading"
            size="small"
            @click="handleLoadMore"
          >
            加载更多
          </Button>
        </div>
      </template>

      <template v-else>
        <InlineFilterToolbar class="toolbar">
          <InlineFilterField label="用户ID">
            <AccountInput
              v-model:value="logQuery.userId"
              placeholder="用户ID"
              style="width: 220px"
            />
          </InlineFilterField>
          <Button :loading="logLoading" type="primary" @click="loadLogData(true)">
            搜索
          </Button>
        </InlineFilterToolbar>

        <Table
          :columns="logColumns"
          :data-source="logList"
          :loading="logLoading"
          :pagination="false"
          row-key="id"
          :scroll="logScroll"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sysOrigin'">
              <Tag>{{ record.sysOrigin || '-' }}</Tag>
            </template>
            <template v-else-if="column.key === 'user'">
              <button class="user-cell" type="button" @click="openUserDetails(record as any)">
                <img
                  :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
                  alt=""
                  class="avatar"
                >
                <div class="user-copy">
                  <span class="user-name">{{ record.userBaseInfo?.userNickname || '-' }}</span>
                  <span class="user-sub">ID {{ record.userBaseInfo?.id || '-' }}</span>
                </div>
              </button>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="logQuery.cursor"
            :page-size="logQuery.limit"
            :total="logTotal"
            show-size-changer
            @change="handleLogPageChange"
            @showSizeChange="handleLogPageChange"
          />
        </div>
      </template>
    </Card>

    <SpecialIdFormDrawer
      :initial-record="editFormRecord"
      :open="formOpen"
      :sys-origin="settingQuery.sysOrigin"
      @close="formOpen = false"
      @success="loadSettingData(true, false)"
    />

    <SpecialIdLogDrawer
      :account="getSpecialInfo(selectedRow || {}).userId || ''"
      :open="latestLogOpen"
      @close="latestLogOpen = false"
    />

    <SpecialIdCustomizeModal
      :customize-field="getSpecialInfo(selectedRow || {}).customizeField || {}"
      :open="customizeOpen"
      @close="customizeOpen = false"
      @submit="handleCustomizeSubmit"
    />

    <Modal
      :confirm-loading="saving"
      :open="editTimeOpen"
      destroy-on-close
      ok-text="提交"
      title="编辑时间"
      @cancel="editTimeOpen = false"
      @ok="handleEditTimeSubmit"
    >
      <Input
        v-model:value="editTimeDays"
        placeholder="请输入天数，负数表示减去天数，0代表永久"
      />
    </Modal>

    <Modal
      :confirm-loading="saving"
      :open="editAccountOpen"
      destroy-on-close
      ok-text="提交"
      title="修改靓号"
      @cancel="editAccountOpen = false"
      @ok="handleEditAccountSubmit"
    >
      <Space direction="vertical" style="width: 100%">
        <Input
          v-model:value="editAccountForm.newAccount"
          placeholder="请输入靓号"
        />
        <Input
          v-model:value="editAccountForm.expiredDays"
          placeholder="请输入有效期(天)"
        />
        <Input
          v-model:value="editAccountForm.remark"
          placeholder="请输入备注"
        />
      </Space>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  align-items: center;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 12px;
  padding: 0;
  text-align: left;
}

.avatar {
  border-radius: 14px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.user-copy {
  display: grid;
  gap: 4px;
}

.user-name {
  color: #0f172a;
  font-weight: 600;
}

.user-sub {
  color: #64748b;
  font-size: 12px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
