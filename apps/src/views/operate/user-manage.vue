<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRoute,
  useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getCountryAlls } from '#/api/legacy/system';
import {
  getUserBaseInfoByAccount,
  pageUserBaseInfo,
  } from '#/api/legacy/user';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  Pagination,
  Select,
  Space,
  TabPane,
  Table,
  Tabs,
  Tag,
  message
} from 'antdv-next';

import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';
import EditUserDrawer from '#/views/approval/components/edit-user-drawer.vue';
import AccountStatusLogModal from '#/views/app-system/components/account-status-log-modal.vue';
import ViolationHistoryModal from '#/views/app-system/components/violation-history-modal.vue';

import {
  GENDER_OPTIONS,
  ORIGIN_PLATFORM_OPTIONS,
  REGISTER_ORIGIN_OPTIONS,
  USER_TYPE_OPTIONS,
} from './constants';
import UserProfileLink from './components/user-profile-link.vue';
import UserAuthInfoDrawer from './components/user-auth-info-drawer.vue';
import UserBalanceHandleModal from './components/user-balance-handle-modal.vue';
import UserResetPasswordModal from './components/user-reset-password-modal.vue';

defineOptions({ name: 'OperateUserManage' });

function createQuery() {
  return {
    account: '',
    authType: '',
    countryCode: '',
    del: '0',
    deviceId: '',
    endCreateDate: '',
    originPlatform: '',
    pageIndex: 1,
    pageSize: 20,
    startCreateDate: '',
    sysOrigins: [] as string[],
    userId: '',
    userSex: '',
    userType: '',
  };
}

const router = useRouter();
const route = useRoute();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const activeTab = ref('table');
const showAllCondition = ref(false);
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const countries = ref<Array<Record<string, any>>>([]);
const countryKeyword = ref('');
const rangeDate = ref<[string, string] | null>(null);

const editOpen = ref(false);
const accountHandleOpen = ref(false);
const accountLogOpen = ref(false);
const violationOpen = ref(false);
const authInfoOpen = ref(false);
const resetPasswordOpen = ref(false);
const balanceOpen = ref(false);

const activeUserId = ref<number | string>('');
const activeUserRecord = ref<Record<string, any> | null>(null);
const balanceAction = ref<'deduct' | 'reward'>('reward');
const balanceType = ref<'diamond' | 'gameCoupon' | 'gold'>('gold');

const query = reactive(createQuery());

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 280 },
  { dataIndex: 'goldBalance', key: 'goldBalance', title: '金币余额', width: 120 },
  { dataIndex: 'diamondBalance', key: 'diamondBalance', title: '钻石余额', width: 120 },
  {
    dataIndex: 'salaryDiamondBalance',
    key: 'salaryDiamondBalance',
    title: '工资钻石余额',
    width: 140,
  },
  { dataIndex: 'accountStatus', key: 'accountStatus', title: '账户', width: 120 },
  { dataIndex: 'registerSource', key: 'registerSource', title: '注册来源', width: 180 },
  { dataIndex: 'ids', key: 'ids', title: '编号', width: 180 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 320 },
];

const filteredCountries = computed(() => {
  const keyword = countryKeyword.value.trim().toLowerCase();
  if (!keyword) {
    return countries.value;
  }
  return countries.value.filter((item) =>
    [
      item.phonePrefix,
      item.countryName,
      item.aliasName,
      item.alphaTwo,
      item.alphaThree,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(keyword),
  );
});

watch(
  sysOriginOptions,
  (options) => {
    if (query.sysOrigins.length === 0 && options.length > 0) {
      query.sysOrigins = [String(options[0]?.value || '')];
      void loadData(true);
    }
  },
  { immediate: true },
);

watch(rangeDate, (value) => {
  query.startCreateDate = value?.[0] || '';
  query.endCreateDate = value?.[1] || '';
});

watch(
  () => route.query.tab,
  (value) => {
    if (value === 'role' || value === 'table') {
      activeTab.value = String(value);
    }
  },
  { immediate: true },
);

async function loadCountries() {
  countries.value = (await getCountryAlls()) || [];
}

function buildPayload() {
  return {
    account: query.account,
    authType: query.authType,
    countryCode: query.countryCode,
    del: query.del,
    deviceId: query.deviceId,
    endCreateDate: query.endCreateDate,
    originPlatform: query.originPlatform,
    pageIndex: query.pageIndex,
    pageSize: query.pageSize,
    startCreateDate: query.startCreateDate,
    sysOrigins: query.sysOrigins,
    userIds: query.userId ? [query.userId] : [],
    userSex: query.userSex,
    userType: query.userType,
  };
}

async function loadData(reset = false) {
  if (query.sysOrigins.length === 0) {
    return;
  }
  if (reset) {
    query.pageIndex = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserBaseInfo(buildPayload());
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.pageIndex = page;
  query.pageSize = pageSize;
  void loadData();
}

function resolveRegisterSource(record: Record<string, any>) {
  const authType = record.userRegisterInfo?.authType || '';
  const platform = record.userRegisterInfo?.originPlatform || '';
  const authLabel =
    REGISTER_ORIGIN_OPTIONS.find((item) => item.value === authType)?.name ||
    authType ||
    '-';
  const platformLabel =
    ORIGIN_PLATFORM_OPTIONS.find((item) => item.value === platform)?.name ||
    platform ||
    '-';
  return `${authLabel} / ${platformLabel}`;
}

function getStatusColor(status?: string) {
  if (status === 'NORMAL') {
    return 'success';
  }
  if (status === 'FREEZE') {
    return 'warning';
  }
  if (status === 'ARCHIVE') {
    return 'error';
  }
  return 'default';
}

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openEdit(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  editOpen.value = true;
}

function openAccountHandle(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  accountHandleOpen.value = true;
}

function openAccountLog(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  accountLogOpen.value = true;
}

function openViolation(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  activeUserRecord.value = record;
  violationOpen.value = true;
}

function openAuthInfo(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  authInfoOpen.value = true;
}

function openResetPassword(record: Record<string, any>) {
  activeUserId.value = record.userProfile?.id || '';
  resetPasswordOpen.value = true;
}

function openBalanceModal(
  record: Record<string, any>,
  type: 'diamond' | 'gameCoupon' | 'gold',
  action: 'deduct' | 'reward',
) {
  activeUserId.value = record.userProfile?.id || '';
  balanceType.value = type;
  balanceAction.value = action;
  balanceOpen.value = true;
}

function buildEncodedAccount(sysOrigin: string, userId: number | string) {
  return `*type:USER,accountType:LONG,sysOrigin:${sysOrigin},content:${userId}*`;
}

function openRunningWater(record: Record<string, any>, kind: 'diamond' | 'gameCoupon' | 'gold') {
  const userId = record.userProfile?.id;
  if (!userId) {
    return;
  }
  const sysOrigin =
    record.userProfile?.sysOriginChild ||
    record.userProfile?.originSys ||
    query.sysOrigins[0] ||
    '';
  const encoded = buildEncodedAccount(sysOrigin, userId);
  if (kind === 'gold') {
    router.push({
      path: '/operate/manager/running/water',
      query: { userId: encoded },
    });
    return;
  }
  if (kind === 'diamond') {
    router.push({
      path: '/user/diamond-run-water',
      query: { sysOrigin, userId: encoded },
    });
    return;
  }
  router.push({
    path: '/game/coupon/running/water',
    query: { userId: encoded },
  });
}

async function copyUserId(value?: number | string) {
  if (!value) {
    return;
  }
  await navigator.clipboard.writeText(String(value));
  message.success('复制成功');
}

async function openByShortAccount(account?: number | string) {
  if (!account) {
    return;
  }
  const result = await getUserBaseInfoByAccount(account);
  const userId = result?.id || result?.userId;
  if (!userId) {
    message.warning('未找到用户');
    return;
  }
  openUserDetails(userId);
}

void loadCountries();
</script>

<template>
  <Page title="用户管理">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="table" tab="用户列表" />
        <TabPane key="role" tab="用户列表(旧 role 版)" />
      </Tabs>

      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.del" style="width: 120px" @change="loadData(true)"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <template v-if="showAllCondition">
            <Select option-label-prop="label"
              v-model:value="query.authType"
              allow-clear
              placeholder="注册来源"
              style="width: 140px"
            
              :options="REGISTER_ORIGIN_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
            />
            <Select option-label-prop="label"
              v-model:value="query.originPlatform"
              allow-clear
              placeholder="来源平台"
              style="width: 140px"
            
              :options="ORIGIN_PLATFORM_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
            />
            <Select option-label-prop="label"
              v-model:value="query.userSex"
              allow-clear
              placeholder="性别"
              style="width: 120px"
            
              :options="GENDER_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
            />
            <Select option-label-prop="label"
              v-model:value="query.countryCode"
              allow-clear
              show-search
              :filter-option="false"
              placeholder="国家"
              style="width: 220px"
              @change="loadData(true)"
              @search="countryKeyword = $event"
            
              :options="filteredCountries.map((item) => ({ label: `${`${item.phonePrefix || ''} ${item.countryName || item.aliasName || ''}`}`, value: item.alphaTwo as any }))"
            />
            <Select option-label-prop="label"
              v-model:value="query.userType"
              allow-clear
              placeholder="账号类型"
              style="width: 140px"
            
              :options="USER_TYPE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
            />
          </template>
          <DatePicker.RangePicker
            v-model:value="rangeDate"
            show-time
            value-format="x"
          />
          <Input v-model:value="query.userId" allow-clear placeholder="长UID" style="width: 180px" />
          <Input v-model:value="query.account" allow-clear placeholder="短账号" style="width: 180px" />
          <Input v-model:value="query.deviceId" allow-clear placeholder="设备ID" style="width: 180px" />
          <Button :loading="loading" type="primary" @click="loadData(true)">搜索</Button>
          <Checkbox v-model:checked="showAllCondition">显示所有条件</Checkbox>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1760 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'goldBalance'">
            <Button size="small" type="link" @click="openRunningWater(record, 'gold')">
              {{ record.goldBalance || 0 }}
            </Button>
          </template>
          <template v-else-if="column.key === 'diamondBalance'">
            <Button size="small" type="link" @click="openRunningWater(record, 'diamond')">
              {{ record.diamondBalance || 0 }}
            </Button>
          </template>
          <template v-else-if="column.key === 'salaryDiamondBalance'">
            {{ record.salaryDiamondBalance || 0 }}
          </template>
          <template v-else-if="column.key === 'accountStatus'">
            <Tag :color="getStatusColor(record.userProfile?.accountStatus)">
              {{ record.userProfile?.accountStatusName || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'registerSource'">
            {{ resolveRegisterSource(record) }}
          </template>
          <template v-else-if="column.key === 'ids'">
            <div class="id-cell">
              <button type="button" @click="copyUserId(record.userProfile?.id)">
                用户ID：{{ record.userProfile?.id || '-' }}
              </button>
              <button type="button" @click="openByShortAccount(record.userProfile?.actualAccount)">
                短账号：{{ record.userProfile?.actualAccount || '-' }}
              </button>
            </div>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建时间：{{ record.userProfile?.createTime || '-' }}</div>
            <div>最近活跃：{{ record.lastActiveTime || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button size="small" type="link" @click="openUserDetails(record.userProfile?.id)">
                资料详情
              </Button>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑用户
              </Button>
              <Button size="small" type="link" @click="openViolation(record)">
                违规记录
              </Button>
              <Button size="small" type="link" @click="openAccountHandle(record)">
                账号处理
              </Button>
              <Button size="small" type="link" @click="openAccountLog(record)">
                处理记录
              </Button>
              <Button size="small" type="link" @click="openBalanceModal(record, 'gold', 'reward')">
                金币奖励
              </Button>
              <Button size="small" type="link" @click="openBalanceModal(record, 'gold', 'deduct')">
                金币扣除
              </Button>
              <Button size="small" type="link" @click="openBalanceModal(record, 'diamond', 'reward')">
                钻石奖励
              </Button>
              <Button size="small" type="link" @click="openBalanceModal(record, 'diamond', 'deduct')">
                钻石扣除
              </Button>
              <Button size="small" type="link" @click="openAuthInfo(record)">
                认证信息
              </Button>
              <Button
                v-if="activeTab === 'table'"
                size="small"
                type="link"
                @click="openResetPassword(record)"
              >
                重置密码
              </Button>
              <Button
                v-if="activeTab === 'table'"
                size="small"
                type="link"
                @click="openRunningWater(record, 'gameCoupon')"
              >
                游戏券收支
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="pager">
        <Pagination
          :current="query.pageIndex"
          :page-size="query.pageSize"
          :total="total"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <EditUserDrawer
      :open="editOpen"
      :user-id="activeUserId"
      @close="editOpen = false"
      @success="editOpen = false; loadData()"
    />
    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeUserId"
      @close="accountHandleOpen = false"
      @success="accountHandleOpen = false; loadData()"
    />
    <AccountStatusLogModal
      :open="accountLogOpen"
      :user-id="activeUserId"
      @close="accountLogOpen = false"
    />
    <ViolationHistoryModal
      :open="violationOpen"
      :user-avatar="activeUserRecord?.userProfile?.userAvatar"
      :user-id="activeUserId"
      :user-nickname="activeUserRecord?.userProfile?.userNickname"
      :vip-status-name="activeUserRecord?.userProfile?.vipStatusName"
      @close="violationOpen = false"
    />
    <UserAuthInfoDrawer
      :open="authInfoOpen"
      :user-id="activeUserId"
      @close="authInfoOpen = false"
    />
    <UserResetPasswordModal
      :open="resetPasswordOpen"
      :user-id="activeUserId"
      @close="resetPasswordOpen = false"
      @success="resetPasswordOpen = false"
    />
    <UserBalanceHandleModal
      :action="balanceAction"
      :open="balanceOpen"
      :type="balanceType"
      :user-id="activeUserId"
      @close="balanceOpen = false"
      @success="balanceOpen = false; loadData()"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.id-cell {
  display: grid;
  gap: 4px;
}

.id-cell button {
  background: transparent;
  border: 0;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
