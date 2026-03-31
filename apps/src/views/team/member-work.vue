<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { DateRangePicker } from 'antdv-next';
import { useAccessStore } from '@vben/stores';

import { listTeamMemberWork } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import { TEAM_BILL_STATUS_MAP } from './shared';
import GiftRunningWaterModal from './components/gift-running-water-modal.vue';
import MemberWorkDetailsDrawer from './components/member-work-details-drawer.vue';

defineOptions({ name: 'TeamMemberWork' });

const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const loadMoreLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const detailsOpen = ref(false);
const giftOpen = ref(false);
const giftType = ref<'ACCEPT' | 'SEND'>('ACCEPT');
const activeRecord = ref<Record<string, any> | null>(null);

const query = reactive({
  billId: '',
  endTime: '',
  lastId: '',
  limit: 20,
  memberUserId: '',
  ownUserId: '',
  startTime: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

watch(rangeDate, (value: [string, string] | null) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

const columns = [
  { dataIndex: 'ownUserProfile', key: 'ownUserProfile', title: '代理', width: 220 },
  { dataIndex: 'memberProfile', key: 'memberProfile', title: '成员', width: 220 },
  { dataIndex: 'salarySettlementMode', key: 'salarySettlementMode', title: '工资模式', width: 100 },
  { dataIndex: 'billBelong', key: 'billBelong', title: '周期', width: 180 },
  { dataIndex: 'onlineTime', key: 'onlineTime', title: '时长', width: 120 },
  { dataIndex: 'effectiveDay', key: 'effectiveDay', title: '有效天', width: 80 },
  { dataIndex: 'memberFans', key: 'memberFans', title: '粉丝', width: 80 },
  { dataIndex: 'gift', key: 'gift', title: '礼物', width: 160 },
  { dataIndex: 'salary', key: 'salary', title: '工资$', width: 140 },
  { dataIndex: 'diamondSalary', key: 'diamondSalary', title: '工资钻石', width: 150 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 200 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 80 },
];

async function loadData(reset = false, append = false) {
  if (reset) {
    query.lastId = '';
    list.value = [];
  }
  if (append) {
    loadMoreLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await listTeamMemberWork({ ...query });
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

function openGift(record: Record<string, any>, type: 'ACCEPT' | 'SEND') {
  activeRecord.value = record;
  giftType.value = type;
  giftOpen.value = true;
}

function openDetails(record: Record<string, any>) {
  activeRecord.value = record;
  detailsOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="成员工作">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Input
            v-model:value="query.billId"
            allow-clear
            placeholder="账单ID"
            style="width: 160px"
            @press-enter="handleSearch"
          />
          <AccountInput
            v-model:value="query.ownUserId"
            placeholder="代理ID"
            style="width: 180px"
            :sys-origin="query.sysOrigin"
          />
          <AccountInput
            v-model:value="query.memberUserId"
            placeholder="成员ID"
            style="width: 180px"
            :sys-origin="query.sysOrigin"
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
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1700 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'ownUserProfile'">
            <div class="user-cell">
              <img
                :src="record.ownUserProfile?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div>
                <div>{{ record.ownUserProfile?.userNickname || '-' }}</div>
                <div class="user-sub">
                  {{ record.ownUserProfile?.actualAccount || record.ownUserProfile?.id || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'memberProfile'">
            <div class="user-cell">
              <img
                :src="record.memberProfile?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar"
              >
              <div>
                <div>{{ record.memberProfile?.userNickname || '-' }}</div>
                <div class="user-sub">
                  {{ record.memberProfile?.actualAccount || record.memberProfile?.id || '-' }}
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'billBelong'">
            {{ record.billBelong || '-' }}
            <Tag :color="TEAM_BILL_STATUS_MAP[record.billStatus]?.tag || 'default'">
              {{ TEAM_BILL_STATUS_MAP[record.billStatus]?.name || record.billStatus || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'onlineTime'">
            <div>我的: {{ record.target?.ownOnlineTime || 0 }}</div>
            <div>其他: {{ record.target?.otherOnlineTime || 0 }}</div>
          </template>
          <template v-else-if="column.key === 'effectiveDay'">
            {{ record.target?.effectiveDay || 0 }}
          </template>
          <template v-else-if="column.key === 'memberFans'">
            {{ record.memberFans || 0 }}
          </template>
          <template v-else-if="column.key === 'gift'">
            <div>
              <Button size="small" type="link" @click="openGift(record, 'ACCEPT')">
                收{{ record.target?.settleRes ? ` Lv.${record.target?.settleRes?.level || 0}` : '' }}:
                {{ record.target?.acceptGiftValue || 0 }}
              </Button>
            </div>
            <div>
              <Button size="small" type="link" @click="openGift(record, 'SEND')">
                送: {{ record.target?.giveGiftValue || 0 }}
              </Button>
            </div>
          </template>
          <template v-else-if="column.key === 'salary'">
            <div v-if="record.target?.settleRes?.policyType !== 'SALARY_DIAMOND'">
              <div>成员: {{ record.target?.settleRes?.memberSalary ?? '?' }}</div>
              <div>代理: {{ record.target?.settleRes?.ownSalary ?? '?' }}</div>
            </div>
            <div v-else>
              <div>成员: ?</div>
              <div>代理: ?</div>
            </div>
          </template>
          <template v-else-if="column.key === 'diamondSalary'">
            <div v-if="record.target?.settleRes?.policyType === 'SALARY_DIAMOND'">
              <div>成员: {{ record.target?.settleRes?.memberSalary ?? '?' }}</div>
              <div>代理: {{ record.target?.settleRes?.ownSalary ?? '?' }}</div>
              <div>成员剩余: {{ record.target?.settleRes?.surplusDiamonds ?? '?' }}</div>
            </div>
            <div v-else>?</div>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建: {{ formatDate(record.createTime) }}</div>
            <div>修改: {{ formatDate(record.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button
              v-if="record.role !== 'OWN'"
              size="small"
              type="link"
              @click="openDetails(record)"
            >
              详情
            </Button>
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

    <GiftRunningWaterModal
      :open="giftOpen"
      :type="giftType"
      :user-id="String(activeRecord?.memberProfile?.id || '')"
      @close="giftOpen = false"
    />

    <MemberWorkDetailsDrawer
      :open="detailsOpen"
      :row="activeRecord || {}"
      @close="detailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.user-cell {
  align-items: center;
  display: flex;
  gap: 10px;
}

.user-avatar {
  border-radius: 999px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.user-sub {
  color: #64748b;
  margin-top: 4px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
