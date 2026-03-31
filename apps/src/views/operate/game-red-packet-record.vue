<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import type { Dayjs } from 'dayjs';

import { flowGameRedPacket } from '#/api/legacy/room';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Space,
  Table,
  Tag,
  Timeline,
  TimelineItem
} from 'antdv-next';

import RoomDetailsDrawer from '../app-system/components/room-details-drawer.vue';
import AccountInput from '#/components/account-input.vue';
import UserProfileLink from './components/user-profile-link.vue';
import RoomSearchInput from './components/room-search-input.vue';

defineOptions({ name: 'OperateGameRedPacketRecord' });

const { RangePicker } = DatePicker;

const RED_PACKET_TYPE_OPTIONS = [
  { label: '房间内', value: 'ROOM' },
  { label: '用户1V1', value: 'USER' },
  { label: '家族群聊', value: 'FAMILY_GROUP_CHAT' },
];

const STATUS_MAP: Record<string, string> = {
  AVAILABLE: '等待领取',
  NOT_RECEIVE: '已抢完',
  REIMBURSE: '已处理退款',
  NOT_REIMBURSE: '已处理退款, 抽成没有可退',
};

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadingMore = ref(false);
const notMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[Dayjs, Dayjs] | null>(null);
const detailOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);
const roomDetailsOpen = ref(false);
const activeRoomId = ref('');

const query = reactive({
  endCreateDate: '',
  lastId: '',
  limit: 20,
  receiverId: '',
  relationId: '',
  startCreateDate: '',
  sysOrigin: '',
  type: 'ROOM',
});

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'receiver', key: 'receiver', title: '接收用户', width: 220 },
  { dataIndex: 'roomProfile', key: 'roomProfile', title: '房间', width: 240 },
  { dataIndex: 'amount', key: 'amount', title: '金额', width: 120 },
  { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
  { dataIndex: 'receiveUsers', key: 'receiveUsers', title: '已领取', width: 100 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
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

watch(rangeDate, (value) => {
  if (!value?.length) {
    query.startCreateDate = '';
    query.endCreateDate = '';
    return;
  }
  query.startCreateDate = String(value[0].valueOf());
  query.endCreateDate = String(value[1].valueOf());
});

function getReceiveUsersLength(row: Record<string, any>) {
  return Array.isArray(row.receiveUsers) ? row.receiveUsers.length : 0;
}

async function loadData(reset = false, loadMore = false) {
  if (reset) {
    list.value = [];
    query.lastId = '';
    notMore.value = false;
  }
  if (loadMore) {
    loadingMore.value = true;
  } else {
    loading.value = true;
  }
  try {
    const result = await flowGameRedPacket({ ...query });
    const next = result || [];
    notMore.value = next.length <= 0;
    if (!notMore.value) {
      list.value = list.value.concat(next);
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = String(roomId);
  roomDetailsOpen.value = true;
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailOpen.value = true;
}

function handleRoomSuccess(item: Record<string, any>) {
  query.relationId = String(item?.id || '');
}

function handleRoomFail() {
  query.relationId = '';
}

loadData(true);
</script>

<template>
  <Page title="红包发送列表">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px" @change="handleSearch"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label" v-model:value="query.type" style="width: 140px" @change="handleSearch"
            :options="RED_PACKET_TYPE_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <RoomSearchInput
            v-if="query.type === 'ROOM'"
            :sys-origin="query.sysOrigin"
            @fail="handleRoomFail"
            @success="handleRoomSuccess"
          />
          <AccountInput
            v-else
            v-model:value="query.relationId"
            :sys-origin="query.sysOrigin"
            placeholder="发送用户"
            style="width: 260px"
          />
          <AccountInput
            v-if="query.type === 'USER'"
            v-model:value="query.receiverId"
            :sys-origin="query.sysOrigin"
            placeholder="接收用户"
            style="width: 260px"
          />
          <RangePicker v-model:value="rangeDate" show-time />
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
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'receiver'">
            <UserProfileLink
              v-if="query.type === 'USER'"
              :profile="record.designatedReceiverUser"
            />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'roomProfile'">
            <div v-if="query.type === 'ROOM' && record.roomProfile" class="room-cell">
              <img
                :src="record.roomProfile.roomCover || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=R'"
                alt=""
                class="room-cover"
              >
              <div class="room-copy">
                <Button
                  size="small"
                  type="link"
                  @click="openRoomDetails(record.roomProfile?.id)"
                >
                  {{ record.roomProfile?.roomName || '-' }}
                </Button>
                <div class="room-meta">
                  {{ record.roomProfile?.roomAccount || record.roomProfile?.id || '-' }}
                </div>
              </div>
            </div>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'receiveUsers'">
            {{ getReceiveUsersLength(record) }}
          </template>
          <template v-else-if="column.key === 'status'">
            {{
              getReceiveUsersLength(record) === Number(record.quantity || 0)
                ? STATUS_MAP.NOT_RECEIVE
                : (STATUS_MAP[record.status] || record.status || '-')
            }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetails(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notMore">已加载全部</span>
        <Button v-else :loading="loadingMore" @click="loadData(false, true)">加载更多</Button>
      </div>
    </Card>

    <Drawer
      :open="detailOpen"
      destroy-on-close
      title="详情"
      width="720px"
      @close="detailOpen = false"
    >
      <div v-if="activeRow" class="detail-stack">
        <Card size="small" title="发送人">
          <UserProfileLink :profile="activeRow.userProfile" />
        </Card>

        <Card v-if="activeRow.type === 'ROOM' && activeRow.roomProfile" size="small" title="发送房间">
          <div class="room-cell">
            <img
              :src="activeRow.roomProfile.roomCover || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=R'"
              alt=""
              class="room-cover"
            >
            <div class="room-copy">
              <Button
                size="small"
                type="link"
                @click="openRoomDetails(activeRow.roomProfile?.id)"
              >
                {{ activeRow.roomProfile?.roomName || '-' }}
              </Button>
              <div class="room-meta">
                {{ activeRow.roomProfile?.roomAccount || activeRow.roomProfile?.id || '-' }}
              </div>
            </div>
          </div>
        </Card>

        <Card size="small" title="基础信息">
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="ID">{{ activeRow.id || '-' }}</DescriptionsItem>
            <DescriptionsItem label="类型">{{ activeRow.type || '-' }}</DescriptionsItem>
            <DescriptionsItem label="金额">{{ activeRow.amount || 0 }}</DescriptionsItem>
            <DescriptionsItem label="数量">{{ activeRow.quantity || 0 }}</DescriptionsItem>
            <DescriptionsItem label="状态">
              {{
                getReceiveUsersLength(activeRow) === Number(activeRow.quantity || 0)
                  ? STATUS_MAP.NOT_RECEIVE
                  : (STATUS_MAP[activeRow.status] || activeRow.status || '-')
              }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ formatDate(activeRow.createTime) }}
            </DescriptionsItem>
          </Descriptions>
        </Card>

        <Card size="small" title="领取用户">
          <Timeline>
            <TimelineItem
              v-for="item in activeRow.receiveUsers || []"
              :key="`${item.userProfile?.id}-${item.createTime}`"
            >
              <UserProfileLink :profile="item.userProfile" />
              <div class="timeline-meta">
                <Tag>领取: {{ item.amount || 0 }}</Tag>
                <span>{{ formatDate(item.createTime) }}</span>
              </div>
            </TimelineItem>
          </Timeline>
        </Card>

        <Card size="small" title="日志事件">
          <Timeline>
            <TimelineItem
              v-for="(item, index) in activeRow.logs || []"
              :key="`${index}-${item.createTime}`"
            >
              {{ item.content || '-' }}
              <div class="timeline-meta">{{ formatDate(item.createTime) }}</div>
            </TimelineItem>
          </Timeline>
        </Card>
      </div>
    </Drawer>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="activeRoomId"
      @close="roomDetailsOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.room-cell {
  align-items: center;
  display: flex;
  gap: 12px;
}

.room-cover {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.room-meta {
  color: #64748b;
  font-size: 12px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.detail-stack {
  display: grid;
  gap: 16px;
}

.timeline-meta {
  color: #64748b;
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
</style>
