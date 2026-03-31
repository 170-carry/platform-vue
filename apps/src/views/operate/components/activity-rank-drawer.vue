<script lang="ts" setup>
import { ref, watch } from 'vue';

import { listActivityRank } from '#/api/legacy/system';

import {
  Alert,
  Drawer,
  Empty,
  Spin,
  Tag,
} from 'antdv-next';

import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateActivityRankDrawer' });

const props = defineProps<{
  activityId: number | string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const rank = ref<Record<string, any>>({});

watch(
  () => (props.open ? props.activityId : ''),
  async (activityId) => {
    if (!activityId) {
      return;
    }
    loading.value = true;
    try {
      rank.value = (await listActivityRank(activityId)) || {};
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
    title="活动排名"
    width="920"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <Alert :closable="false" class="tips" type="info">
        <template #message>
          <div>活动排行榜数据只保留 30 天。</div>
          <div>活动结束后不可再查看排行榜，请通过奖品记录查看获奖快照。</div>
        </template>
      </Alert>

      <div class="section">
        <div class="section__title">按钮1 TOP20</div>
        <div v-if="(rank.butOneRanks || []).length > 0" class="user-list">
          <div
            v-for="(item, index) in rank.butOneRanks || []"
            :key="`but1-${index}`"
            class="user-item"
          >
            <UserProfileLink :profile="item.userProfile" />
            <Tag>{{ item.quantity || 0 }} / {{ item.quantityFormat || '-' }}</Tag>
          </div>
        </div>
        <Empty v-else description="暂无数据" />
      </div>

      <div class="section">
        <div class="section__title">按钮2 TOP20</div>
        <div v-if="(rank.butTwoRanks || []).length > 0" class="user-list">
          <div
            v-for="(item, index) in rank.butTwoRanks || []"
            :key="`but2-${index}`"
            class="user-item"
          >
            <UserProfileLink :profile="item.userProfile" />
            <Tag>{{ item.quantity || 0 }} / {{ item.quantityFormat || '-' }}</Tag>
          </div>
        </div>
        <Empty v-else description="暂无数据" />
      </div>
    </Spin>
  </Drawer>
</template>

<style scoped>
.tips {
  margin-bottom: 16px;
}

.section {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.section__title {
  color: #0f172a;
  font-weight: 600;
}

.user-list {
  display: grid;
  gap: 12px;
}

.user-item {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 12px 14px;
}
</style>
