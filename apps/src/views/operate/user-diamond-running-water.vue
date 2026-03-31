<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pageUserDiamondRunWater } from '#/api/legacy/user';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  AutoComplete,
  Button,
  Card,
  Pagination,
  Select,
  Table
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateUserDiamondRunningWater' });

const route = useRoute();

const DIAMOND_ORIGIN_OPTIONS = [
  { value: 'ACTIVITY_REWARD', name: '活动奖励' },
  { value: 'ROOM_SUPPORT_REWARD', name: '房间扶持奖励' },
  { value: 'ROOM_HOMEOWNER_SUPPORT_REWARD', name: '房间扶持奖励 - 房主奖励' },
  { value: 'CP_REWARD', name: 'cp奖励' },
  { value: 'GAME_BURST_CRYSTAL', name: '爆水晶游戏' },
  { value: 'ROOM_REWARD', name: '房间奖励' },
  { value: 'WEEK_STAR', name: '周星' },
  { value: 'INVITED_NEW_USER_REWARD', name: '邀请新用户注册奖励' },
  { value: 'INVITED_USER_FIRST_RECHARGE_REWARD', name: '邀请用户首次充值奖励' },
  { value: 'INVITE_REGISTER', name: '邀请用户注册' },
  { value: 'INVITE_FIRST_RECHARGE', name: '邀请的用户首次充值' },
  { value: 'INVITED_USER_EACH_RECHARGE', name: '邀请用户每笔充值奖励百分比' },
  { value: 'PURCHASE_NOBLE_VIP', name: '购买贵族vip' },
  { value: 'PURCHASE_NOBLE_VIP_GIVEAWAY', name: '购买赠送贵族vip-钻石' },
  { value: 'PURCHASING_AVATAR_FRAME', name: '购买头像框-钻石' },
  { value: 'PURCHASING_DATA_CARD', name: '购买资料卡-钻石' },
  { value: 'PURCHASING_CHAT_BUBBLE', name: '购买聊天气泡-钻石' },
  { value: 'PURCHASING_CAR', name: '购买车辆-钻石' },
  { value: 'PURCHASING_LAYOUT', name: '购买装扮-钻石' },
  { value: 'PURCHASING_AVATAR_FRAME_GIVEAWAY', name: '赠送头像框-钻石' },
  { value: 'PURCHASING_DATA_CARD_GIVEAWAY', name: '购买资料卡-钻石' },
  { value: 'PURCHASING_CHAT_BUBBLE_GIVEAWAY', name: '赠送聊天气泡-钻石' },
  { value: 'PURCHASING_THEME', name: '购买主题-钻石' },
  { value: 'PURCHASING_THEME_GIVEAWAY', name: '赠送主题-钻石' },
  { value: 'PURCHASING_CAR_GIVEAWAY', name: '赠送车辆' },
  { value: 'PURCHASING_LAYOUT_GIVEAWAY', name: '赠送装扮' },
  { value: 'GIVE_GIFT', name: '赠送礼物' },
  { value: 'ACCEPT_GIFT', name: '接收礼物' },
  { value: 'COMPENSATE', name: '补给' },
  { value: 'REMOVE', name: '违规扣除' },
  { value: 'WEEK_USER_CONSUME', name: '国王王后king' },
  { value: 'DIAMOND_EXCHANGE_GOLD', name: '砖石兑换金币' },
  { value: 'LIVE_BROADCAST_INTEGRAL', name: '直播积分' },
  { value: 'DAILY_TASK', name: '每日任务' },
  { value: 'CHECK_IN_DIAMOND', name: '钻石打卡' },
  { value: 'CUMULATIVE_RECHARGE_REWARDS', name: '累计充值奖励' },
  { value: 'OFFICIAL_GIFT', name: '官方赠送' },
  { value: 'EXPIRED', name: '过期' },
  { value: 'INVITE_USER_RED_PACKET_LOTTERY', name: '邀请用户红包抽奖' },
  { value: 'REWARD_DIAMOND', name: '后台奖励钻石' },
  { value: 'DEDUCT_DIAMOND', name: '后台扣除钻石' },
];

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const originKeyword = ref('');

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  origin: '',
  sysOrigin: '',
  type: '',
  userId: '',
});

const originOptions = computed(() => {
  const keyword = originKeyword.value.trim().toLowerCase();
  const target = keyword
    ? DIAMOND_ORIGIN_OPTIONS.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.value.toLowerCase().includes(keyword),
      )
    : DIAMOND_ORIGIN_OPTIONS;

  return target.map((item) => ({
    label: `${item.name} / ${item.value}`,
    value: item.value,
  }));
});

const columns: any[] = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 280 },
  { dataIndex: 'balance', key: 'balance', title: '钻石余额', width: 120 },
  { dataIndex: 'quantity', key: 'quantity', title: '钻石', width: 120 },
  { dataIndex: 'origin', key: 'origin', title: '来源', width: 220 },
  { dataIndex: 'originDesc', key: 'originDesc', title: '来源描述', width: 180 },
  { dataIndex: 'typeDesc', key: 'typeDesc', title: '类型', width: 120 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin =
        String(route.query.sysOrigin || '') || String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

function normalizeOrigin() {
  const keyword = originKeyword.value.trim();
  if (!keyword) {
    query.origin = '';
    return;
  }
  const matched = DIAMOND_ORIGIN_OPTIONS.find(
    (item) =>
      item.name.toLowerCase().includes(keyword.toLowerCase()) ||
      item.value.toLowerCase().includes(keyword.toLowerCase()),
  );
  query.origin = matched?.value || keyword;
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageUserDiamondRunWater({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  normalizeOrigin();
  void loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function handleOriginSelect(value: string) {
  originKeyword.value = value;
  query.origin = value;
}

if (route.query.userId) {
  query.userId = String(route.query.userId);
}

if (route.query.origin) {
  originKeyword.value = String(route.query.origin);
  query.origin = String(route.query.origin);
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="用户钻石流水列表">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="query.sysOrigin"
          placeholder="用户ID"
          style="width: 300px"
        />
        <Select option-label-prop="label"
          v-model:value="query.type"
          allow-clear
          placeholder="类型"
          style="width: 140px"
          @change="handleSearch"
        
          :options="[{ label: '收入', value: false as any }, { label: '支出', value: true as any }]"
        />
        <AutoComplete
          v-model:value="originKeyword"
          :options="originOptions"
          allow-clear
          placeholder="请输入或选择来源"
          style="width: 320px"
          @select="handleOriginSelect"
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
        :scroll="{ x: 1420 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
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

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
