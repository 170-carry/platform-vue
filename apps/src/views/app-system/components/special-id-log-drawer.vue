<script lang="ts" setup>
import { ref, watch } from 'vue';

import { listSpecialIdLatestLog } from '#/api/legacy/app-system';
import { formatDate } from '#/views/system/shared';

import { Drawer, Empty, Spin } from 'antdv-next';

const props = defineProps<{
  account: number | string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);

watch(
  () => ({ account: props.account, open: props.open }),
  async ({ account, open }) => {
    if (!open || !account) {
      return;
    }
    loading.value = true;
    try {
      list.value = await listSpecialIdLatestLog(account as number | string);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="账号日志"
    width="460"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <div v-if="list.length > 0" class="timeline">
        <div v-for="item in list" :key="item.id || item.createTime" class="timeline-item">
          <img
            :src="item.userBaseInfo?.userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
            alt=""
            class="avatar"
          >
          <div class="content">
            <div class="time">{{ formatDate(item.createTime) }}</div>
            <div class="desc">{{ item.optUserNickname || '-' }}，{{ item.eventDesc || '-' }}</div>
            <div class="sub">
              用户ID {{ item.userBaseInfo?.id || '-' }} / {{ item.userBaseInfo?.userNickname || '-' }}
            </div>
          </div>
        </div>
      </div>
      <Empty v-else description="暂无日志" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.timeline {
  display: grid;
  gap: 16px;
}

.timeline-item {
  display: grid;
  gap: 12px;
  grid-template-columns: 40px 1fr;
}

.avatar {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.content {
  display: grid;
  gap: 4px;
}

.time {
  color: #64748b;
  font-size: 12px;
}

.desc {
  color: #0f172a;
}

.sub {
  color: #64748b;
  font-size: 12px;
}
</style>
