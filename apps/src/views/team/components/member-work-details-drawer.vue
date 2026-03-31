<script lang="ts" setup>
import { computed } from 'vue';

import { formatDate } from '#/views/system/shared';

import {
  Card,
  Col,
  Drawer,
  Row,
  Space,
  Tag,
} from 'antdv-next';

import { TEAM_BILL_STATUS_MAP } from '../shared';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const settleRes = computed(() => props.row?.target?.settleRes || {});
const dailyTargets = computed(() => props.row?.target?.dailyTargets || []);
const existsPropsRewards = computed(
  () => (settleRes.value?.propsRewards || []).length > 0,
);
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="详情"
    width="920"
    @close="emit('close')"
  >
    <div class="page-grid">
      <Card :bordered="false" title="代理">
        <div class="user-card">
          <img
            :src="row.ownUserProfile?.userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
            alt=""
            class="avatar"
          >
          <div>
            <div>{{ row.ownUserProfile?.userNickname || '-' }}</div>
            <div class="user-sub">
              {{ row.ownUserProfile?.actualAccount || row.ownUserProfile?.id || '-' }}
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" title="成员">
        <div class="user-card">
          <img
            :src="row.memberProfile?.userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
            alt=""
            class="avatar"
          >
          <div>
            <div>{{ row.memberProfile?.userNickname || '-' }}</div>
            <div class="user-sub">
              {{ row.memberProfile?.actualAccount || row.memberProfile?.id || '-' }}
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" title="工作数据">
        <Row :gutter="[16, 16]">
          <Col :md="12" :xs="24">周期: {{ row.billBelong || '-' }}</Col>
          <Col :md="12" :xs="24">
            状态:
            <Tag :color="TEAM_BILL_STATUS_MAP[row.billStatus]?.tag || 'default'">
              {{ TEAM_BILL_STATUS_MAP[row.billStatus]?.name || row.billStatus || '-' }}
            </Tag>
          </Col>
          <Col :md="12" :xs="24">时长(我的): {{ row.target?.ownOnlineTime || 0 }}</Col>
          <Col :md="12" :xs="24">时长(其他): {{ row.target?.otherOnlineTime || 0 }}</Col>
          <Col :md="12" :xs="24">礼物(送): {{ row.target?.giveGiftValue || 0 }}</Col>
          <Col :md="12" :xs="24">礼物(收): {{ row.target?.acceptGiftValue || 0 }}</Col>
          <Col :md="12" :xs="24">粉丝: {{ row.memberFans || 0 }}</Col>
          <Col :md="12" :xs="24">
            <div v-if="settleRes.policyType === 'MONEY'">
              成员工资$: {{ settleRes.memberSalary ?? '?' }}
            </div>
            <div v-else>
              成员工资钻石: {{ settleRes.memberSalary ?? '?' }}
            </div>
          </Col>
          <Col :md="12" :xs="24">
            <div v-if="settleRes.policyType === 'MONEY'">
              代理工资$: {{ settleRes.ownSalary ?? '?' }}
            </div>
            <div v-else>
              代理工资钻石: {{ settleRes.ownSalary ?? '?' }}
            </div>
          </Col>
          <Col :md="12" :xs="24">
            <div v-if="settleRes.policyType === 'MONEY'">
              合计工资$: {{ settleRes.totalSalary ?? '?' }}
            </div>
            <div v-else>
              合计工资钻石: {{ settleRes.totalSalary ?? '?' }}
            </div>
          </Col>
          <Col v-if="settleRes.policyType === 'SALARY_DIAMOND'" :md="12" :xs="24">
            已兑换钻石: {{ settleRes.exchangeDiamonds ?? '?' }}
          </Col>
          <Col v-if="settleRes.policyType === 'SALARY_DIAMOND'" :md="12" :xs="24">
            剩余钻石: {{ settleRes.surplusDiamonds ?? '?' }}
          </Col>
          <Col :md="12" :xs="24">
            道具奖励: {{ existsPropsRewards ? 'Yes' : 'No' }}
          </Col>
          <Col v-if="existsPropsRewards" :md="12" :xs="24">
            领取状态: {{ settleRes.propsRewardReceive ? '已领取' : '待领取' }}
          </Col>
          <Col v-if="existsPropsRewards" :span="24">
            <Space wrap>
              <Tag
                v-for="(item, index) in settleRes.propsRewards || []"
                :key="`${item.propsId || index}`"
              >
                {{ item.propsName || item.name || '-' }} x {{ item.quantity || 0 }}
              </Tag>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card :bordered="false" title="每天工作数据">
        <div class="daily-grid">
          <Card
            v-for="(item, index) in dailyTargets"
            :key="`${item.dateNumber || index}`"
            :bordered="true"
            size="small"
          >
            <template #title>{{ item.dateNumber || '-' }}</template>
            <Row :gutter="[12, 12]">
              <Col :md="12" :xs="24">时长(我的): {{ item.ownOnlineTime || 0 }}</Col>
              <Col :md="12" :xs="24">时长(其他): {{ item.otherOnlineTime || 0 }}</Col>
              <Col :md="12" :xs="24">礼物(送): {{ item.giveGiftValue || 0 }}</Col>
              <Col :md="12" :xs="24">有效天: {{ item.effectiveDay || 0 }}</Col>
              <Col :md="12" :xs="24">礼物(收): {{ item.acceptGiftValue || 0 }}</Col>
              <Col :md="12" :xs="24">房间: {{ row.roomValue || 0 }}</Col>
            </Row>
          </Card>
        </div>
      </Card>

      <Card :bordered="false" title="时间信息">
        <Row :gutter="[16, 16]">
          <Col :md="12" :xs="24">创建: {{ formatDate(row.createTime) }}</Col>
          <Col :md="12" :xs="24">修改: {{ formatDate(row.updateTime) }}</Col>
        </Row>
      </Card>
    </div>
  </Drawer>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: 16px;
}

.user-card {
  align-items: center;
  display: flex;
  gap: 12px;
}

.avatar {
  border-radius: 999px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.user-sub {
  color: #64748b;
  margin-top: 4px;
}

.daily-grid {
  display: grid;
  gap: 12px;
}
</style>
