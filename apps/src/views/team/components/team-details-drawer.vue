<script lang="ts" setup>
import { ref, watch } from 'vue';

import { getTeamDetails } from '#/api/legacy/team';
import { formatDate } from '#/views/system/shared';

import { Card, Drawer, Empty, Spin, Tag } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  teamId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const profile = ref<Record<string, any>>({});

watch(
  () => props.open,
  (open) => {
    if (open && props.teamId) {
      void loadTeamDetails();
    }
  },
  { immediate: true },
);

function renderReward(item: Record<string, any>) {
  const quantity =
    item.quantity ??
    item.count ??
    item.rewardCount ??
    item.propsQuantity ??
    1;
  return `${item.propsName || item.name || item.id || '道具'} x${quantity}`;
}

async function loadTeamDetails() {
  loading.value = true;
  try {
    profile.value = (await getTeamDetails(props.teamId)) || {};
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="资料详情"
    width="760px"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <div class="details-grid">
        <Card v-if="profile.ownUserProfile" size="small" title="代理">
          <div>{{ profile.ownUserProfile.userNickname || '-' }}</div>
          <div class="muted">
            {{ profile.ownUserProfile.actualAccount || profile.ownUserProfile.id || '-' }}
          </div>
        </Card>

        <Card v-if="profile.teamProfile" size="small" title="设置资料">
          <div class="pair-grid">
            <div>ID: {{ profile.teamProfile.id || '-' }}</div>
            <div>
              状态:
              <Tag :color="profile.teamProfile.status === 'AVAILABLE' ? 'green' : 'red'">
                {{ profile.teamProfile.status === 'AVAILABLE' ? '正常' : '关闭' }}
              </Tag>
            </div>
            <div>区域ID: {{ profile.teamProfile.region || '-' }}</div>
            <div>区域: {{ profile.regionName || '-' }}</div>
            <div>
              成员:
              {{ profile.teamProfile.counter?.memberQuantity || 0 }}/{{ profile.teamProfile.setting?.maxMember || '-' }}
            </div>
            <div>国家: {{ profile.teamProfile.country?.countryName || '-' }}</div>
            <div>创建时间: {{ formatDate(profile.teamProfile.createTime) }}</div>
            <div>修改时间: {{ formatDate(profile.teamProfile.updateTime) }}</div>
          </div>
        </Card>

        <Card
          v-if="profile.createUserProfile || profile.createUserNickname"
          size="small"
          title="创建用户"
        >
          <div>{{ profile.createUserProfile?.userNickname || profile.createUserNickname || '-' }}</div>
          <div class="muted">
            {{ profile.createUserProfile?.actualAccount || profile.createUserProfile?.id || '-' }}
          </div>
        </Card>

        <Card
          v-if="profile.updateUserProfile || profile.updateUserNickname"
          size="small"
          title="最近操作用户"
        >
          <div>{{ profile.updateUserProfile?.userNickname || profile.updateUserNickname || '-' }}</div>
          <div class="muted">
            {{ profile.updateUserProfile?.actualAccount || profile.updateUserProfile?.id || '-' }}
          </div>
        </Card>

        <Card v-if="profile.releasePolicy" size="small" title="发布政策">
          <div
            v-for="item in profile.releasePolicy.policy || []"
            :key="item.level"
            class="policy-card"
          >
            <div class="policy-title">Lv.{{ item.level }}</div>
            <div class="pair-grid">
              <div>时长: {{ item.onlineTime || 0 }}</div>
              <div>礼物值: {{ item.target || 0 }}</div>
              <div>主播工资: {{ item.memberSalary || 0 }}</div>
              <div>代理工资: {{ item.ownSalary || 0 }}</div>
              <div>总工资: {{ item.totalSalary || 0 }}</div>
            </div>
            <div
              v-if="Array.isArray(item.propsRewards) && item.propsRewards.length > 0"
              class="policy-reward"
            >
              奖励:
              {{ item.propsRewards.map(renderReward).join('，') }}
            </div>
          </div>
          <Empty
            v-if="!Array.isArray(profile.releasePolicy.policy) || profile.releasePolicy.policy.length === 0"
            description="暂无政策数据"
          />
        </Card>
      </div>
    </Spin>
  </Drawer>
</template>

<style scoped>
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pair-grid {
  display: grid;
  gap: 10px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.muted {
  color: #64748b;
  margin-top: 4px;
}

.policy-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.policy-card + .policy-card {
  margin-top: 12px;
}

.policy-title {
  color: #1d4ed8;
  font-weight: 600;
  margin-bottom: 10px;
}

.policy-reward {
  color: #475569;
  margin-top: 10px;
}
</style>
