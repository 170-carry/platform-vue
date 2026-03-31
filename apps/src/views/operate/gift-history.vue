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
  countGiftAcceptQuantity,
  countGiftAmount,
  listGiftGiveAwayRunningWater,
  } from '#/api/legacy/gift';
import AccountInput from '#/components/account-input.vue';
import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Image,
  Input,
  Select,
  Space,
  Table
} from 'antdv-next';

import GiftHistoryDetailsDrawer from '../team/components/gift-history-details-drawer.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateGiftHistory' });

const GIFT_CONFIG_TAB_OPTIONS = [
  { value: 'ORDINARY', name: '普通礼物' },
  { value: 'NATIONAL_FLAG', name: '国旗礼物' },
  { value: 'CP', name: 'CP礼物' },
  { value: 'FAMILY', name: '家族礼物' },
  { value: 'EXCLUSIVE', name: '专属礼物' },
  { value: 'ARISTOCRACY', name: '贵族礼物' },
  { value: 'LUCKY_GIFT', name: '幸运礼物' },
  { value: 'ACTIVITY', name: '活动礼物' },
  { value: 'MAGIC', name: '魔法礼物' },
  { value: 'CUSTOMIZED', name: '定制礼物' },
];

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notMore = ref(false);
const totalAmount = ref<number | string>('-');
const acceptQuantity = ref<number | string>('-');
const detailsOpen = ref(false);
const roomOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);
const rangeDate = ref<[string, string] | null>(null);
const showAllCondition = ref(false);

const query = reactive<Record<string, any>>({
  acceptUserId: '',
  giftId: '',
  giftValueType: undefined,
  lastId: '',
  limit: 20,
  sendUserId: '',
  startTime: '',
  sysOrigin: '',
  trackId: '',
  endTime: '',
});

const columns = [
  { dataIndex: 'sender', key: 'sender', title: '发送人', width: 280 },
  { dataIndex: 'giftValue', key: 'giftValue', title: '礼物数量', width: 130 },
  { dataIndex: 'userSize', key: 'userSize', title: '接收人数', width: 100 },
  { dataIndex: 'actualAmount', key: 'actualAmount', title: '消费金额', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 90 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

async function loadStats() {
  totalAmount.value = '-';
  acceptQuantity.value = '-';

  if (
    query.sendUserId &&
    query.acceptUserId &&
    query.startTime &&
    query.endTime
  ) {
    totalAmount.value = await countGiftAmount({ ...query });
  }

  if (
    query.acceptUserId &&
    query.giftId &&
    query.startTime &&
    query.endTime
  ) {
    acceptQuantity.value = await countGiftAcceptQuantity({ ...query });
  }
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await listGiftGiveAwayRunningWater({ ...query });
    const current = result || [];
    list.value = reset ? current : [...list.value, ...current];
    notMore.value = current.length < Number(query.limit || 20);
    query.lastId = String(list.value.at(-1)?.id || '');
    await loadStats();
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailsOpen.value = true;
}

function openRoom(record: Record<string, any>) {
  activeRow.value = record;
  roomOpen.value = true;
}

function openUserDetails(userId: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

void loadData(true);
</script>

<template>
  <Page title="礼物赠送记录">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <AccountInput
          v-model:value="query.sendUserId"
          :sys-origin="query.sysOrigin"
          placeholder="发送用户"
          style="width: 240px"
        />
        <AccountInput
          v-model:value="query.acceptUserId"
          :sys-origin="query.sysOrigin"
          placeholder="接收用户"
          style="width: 240px"
        />
        <Input v-model:value="query.giftId" placeholder="礼物ID" style="width: 140px" />
        <Select option-label-prop="label"
          v-if="showAllCondition"
          v-model:value="query.giftValueType"
          allow-clear
          placeholder="礼物类型"
          style="width: 180px"
        
          :options="GIFT_CONFIG_TAB_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          style="width: 320px"
          value-format="x"
        />
        <Input
          v-if="showAllCondition"
          v-model:value="query.trackId"
          placeholder="跟踪ID"
          style="width: 160px"
        />
        <Space>
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Checkbox v-model:checked="showAllCondition">显示所有条件</Checkbox>
        </Space>
      </div>

      <div class="summary">
        <div>礼物总价值: {{ totalAmount }}</div>
        <div>接收礼物数量: {{ acceptQuantity }}</div>
        <div>注意: 每条数据的生命周期30天, 30天后记录将会清理</div>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 980 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sender'">
            <div class="sender-cell">
              <UserProfileLink
                :profile="record.userProfile"
                :show-sys-origin="true"
              />
              <div class="associate-list">
                <div
                  v-if="record.roomProfile"
                  class="associate-item"
                  @click="openRoom(record)"
                >
                  <Image
                    :preview="false"
                    :src="record.roomProfile?.roomCover"
                    class="mini-avatar"
                  />
                </div>
                <div
                  v-for="(item, index) in record.acceptUsers || []"
                  :key="`${item.acceptUserId || index}`"
                  class="associate-item"
                  @click="openUserDetails(item.userProfile?.id)"
                >
                  <Image
                    v-if="Number(index) < 10"
                    :preview="false"
                    :src="item.userProfile?.userAvatar"
                    class="mini-avatar"
                  />
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'giftValue'">
            <div class="gift-cell">
              <Image :preview="false" :src="record.giftCover" class="gift-cover" />
              x {{ record.giftValue?.quantity || 0 }}
            </div>
          </template>
          <template v-else-if="column.key === 'userSize'">
            {{ record.giftValue?.userSize || 0 }}
          </template>
          <template v-else-if="column.key === 'actualAmount'">
            {{ record.giftValue?.actualAmount || 0 }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetails(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <Button
          v-if="!notMore"
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false)"
        >
          加载更多
        </Button>
        <span v-else>已加载全部</span>
      </div>
    </Card>

    <GiftHistoryDetailsDrawer
      :open="detailsOpen"
      :row="activeRow || {}"
      @close="detailsOpen = false"
    />

    <RoomDetailsDrawer
      :open="roomOpen"
      :room-id="activeRow?.originId || activeRow?.roomProfile?.id || ''"
      @close="roomOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.summary {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  color: #ad6800;
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
  padding: 10px 12px;
}

.sender-cell {
  display: grid;
  gap: 8px;
}

.associate-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.associate-item {
  cursor: pointer;
}

.mini-avatar {
  border-radius: 999px;
  height: 24px;
  object-fit: cover;
  width: 24px;
}

.gift-cell {
  align-items: center;
  display: flex;
  gap: 8px;
}

.gift-cover {
  border-radius: 8px;
  height: 30px;
  object-fit: cover;
  width: 30px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
