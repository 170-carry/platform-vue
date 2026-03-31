<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  listActivityRewardRank,
  sendActivityReward,
} from '#/api/legacy/system';

import {
  Button,
  Drawer,
  Empty,
  Space,
  Spin,
  Tag,
  message,
} from 'antdv-next';

import RewardRow from '#/views/props/components/reward-row.vue';

import UserProfileLink from './user-profile-link.vue';

defineOptions({ name: 'OperateActivityRewardRankDrawer' });

const props = defineProps<{
  activityId: number | string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const sending = ref(false);
const rewardRank = ref<Record<string, any>>({});

watch(
  () => (props.open ? props.activityId : ''),
  async (activityId) => {
    if (!activityId) {
      return;
    }
    loading.value = true;
    try {
      rewardRank.value = (await listActivityRewardRank(activityId)) || {};
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

async function handleSend() {
  if (!props.activityId) {
    return;
  }
  sending.value = true;
  try {
    await sendActivityReward(props.activityId);
    rewardRank.value = {
      ...rewardRank.value,
      awardStatus: true,
    };
    message.success('发送成功');
    emit('success');
  } finally {
    sending.value = false;
  }
}

function getRewardList(item: Record<string, any>) {
  return item.reward?.rewards || item.rewardConfigList || [];
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    :title="`活动排名奖品-${rewardRank.awardStatus ? '快照' : '实时'}`"
    width="960"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <div class="section">
        <div class="section__title">按钮1</div>
        <div v-if="(rewardRank.butOneRanks || []).length > 0" class="group-list">
          <div
            v-for="(item, index) in rewardRank.butOneRanks || []"
            :key="`one-${index}`"
            class="group-card"
          >
            <div class="group-header">
              <span>TOP{{ item.reward?.rankRange || '-' }}</span>
              <Tag
                v-if="(item.rankUsers || []).length > 0"
                :color="item.status ? 'success' : 'default'"
              >
                {{ item.status ? '已发送' : '未发送' }}
              </Tag>
            </div>
            <div v-if="(item.rankUsers || []).length > 0" class="user-list">
              <div
                v-for="(userItem, userIndex) in item.rankUsers || []"
                :key="`one-user-${userIndex}`"
                class="user-item"
              >
                <UserProfileLink :profile="userItem.userProfile" />
                <Tag>{{ userItem.quantity || 0 }} / {{ userItem.quantityFormat || '-' }}</Tag>
              </div>
            </div>
            <RewardRow :list="getRewardList(item)" />
          </div>
        </div>
        <Empty v-else description="暂无数据" />
      </div>

      <div class="section">
        <div class="section__title">按钮2</div>
        <div v-if="(rewardRank.butTwoRanks || []).length > 0" class="group-list">
          <div
            v-for="(item, index) in rewardRank.butTwoRanks || []"
            :key="`two-${index}`"
            class="group-card"
          >
            <div class="group-header">
              <span>TOP{{ item.reward?.rankRange || '-' }}</span>
              <Tag
                v-if="(item.rankUsers || []).length > 0"
                :color="item.status ? 'success' : 'default'"
              >
                {{ item.status ? '已发送' : '未发送' }}
              </Tag>
            </div>
            <div v-if="(item.rankUsers || []).length > 0" class="user-list">
              <div
                v-for="(userItem, userIndex) in item.rankUsers || []"
                :key="`two-user-${userIndex}`"
                class="user-item"
              >
                <UserProfileLink :profile="userItem.userProfile" />
                <Tag>{{ userItem.quantity || 0 }} / {{ userItem.quantityFormat || '-' }}</Tag>
              </div>
            </div>
            <RewardRow :list="getRewardList(item)" />
          </div>
        </div>
        <Empty v-else description="暂无数据" />
      </div>
    </Spin>

    <template v-if="!rewardRank.awardStatus" #footer>
      <Space>
        <Button @click="emit('close')">关闭</Button>
        <Button :loading="sending" type="primary" @click="handleSend">
          发送
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.section {
  display: grid;
  gap: 12px;
  margin-bottom: 20px;
}

.section__title {
  color: #0f172a;
  font-weight: 600;
}

.group-list {
  display: grid;
  gap: 12px;
}

.group-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  display: grid;
  gap: 12px;
  padding: 14px;
}

.group-header,
.user-item {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.user-list {
  display: grid;
  gap: 8px;
}
</style>
