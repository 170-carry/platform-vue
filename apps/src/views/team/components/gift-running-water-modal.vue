<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  listGiftGiveAwayRunningWater,
} from '#/api/legacy/gift';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Modal,
  Table,
} from 'antdv-next';

import GiftHistoryDetailsDrawer from './gift-history-details-drawer.vue';

const props = defineProps<{
  open: boolean;
  type: string;
  userId: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const notMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const activeRow = ref<Record<string, any> | null>(null);
const detailsOpen = ref(false);

const query = ref<Record<string, any>>({
  acceptUserId: '',
  lastId: '',
  limit: 20,
  sendUserId: '',
  userId: '',
});

watch(
  () => [props.open, props.type, props.userId],
  ([open, type, userId]) => {
    if (!open || !userId) {
      return;
    }
    query.value = {
      acceptUserId: type === 'ACCEPT' ? userId : '',
      lastId: '',
      limit: 20,
      sendUserId: type === 'SEND' ? userId : '',
      userId: '',
    };
    list.value = [];
    void loadData(true);
  },
  { immediate: true },
);

const columns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '发送人', width: 220 },
  { dataIndex: 'giftValue', key: 'giftValue', title: '礼物数量', width: 120 },
  { dataIndex: 'userSize', key: 'userSize', title: '接收人数', width: 100 },
  { dataIndex: 'actualAmount', key: 'actualAmount', title: '消费金额', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 80 },
];

async function loadData(reset = false) {
  loading.value = true;
  try {
    if (reset) {
      list.value = [];
      query.value.lastId = '';
    }
    const result = await listGiftGiveAwayRunningWater(query.value);
    const current = result || [];
    notMore.value = current.length <= 0;
    list.value = [...list.value, ...current];
    if (list.value.length > 0) {
      query.value.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
  }
}

function openDetails(record: Record<string, any>) {
  activeRow.value = record;
  detailsOpen.value = true;
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="礼物流水"
    width="1080"
    @cancel="emit('close')"
  >
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 900, y: 500 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userProfile'">
          <div class="user-cell">
            <img
              :src="record.userProfile?.userAvatar || 'https://dummyimage.com/44x44/e2e8f0/64748b&text=U'"
              alt=""
              class="user-avatar"
            >
            <div>
              <div>{{ record.userProfile?.userNickname || '-' }}</div>
              <div class="user-sub">
                {{ record.userProfile?.actualAccount || record.userProfile?.id || '-' }}
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'giftValue'">
          <div class="gift-cell">
            <img
              :src="record.giftCover || 'https://dummyimage.com/30x30/e2e8f0/64748b&text=G'"
              alt=""
              class="gift-cover"
            >
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
        :loading="loading"
        size="small"
        @click="loadData()"
      >
        加载更多
      </Button>
      <span v-else>已加载全部</span>
    </div>

    <GiftHistoryDetailsDrawer
      :open="detailsOpen"
      :row="activeRow || {}"
      @close="detailsOpen = false"
    />
  </Modal>
</template>

<style scoped>
.user-cell,
.gift-cell {
  align-items: center;
  display: flex;
  gap: 8px;
}

.user-avatar,
.gift-cover {
  border-radius: 999px;
  height: 32px;
  object-fit: cover;
  width: 32px;
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
