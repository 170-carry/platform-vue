<script lang="ts" setup>
import { computed } from 'vue';

import { Drawer, Empty, Tag, Timeline, TimelineItem } from 'antdv-next';

import { formatDate } from '#/views/system/shared';

import { formatPropsRewardText } from '../shared';
import UserProfileLink from './user-profile-link.vue';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const rewards = computed(() =>
  Array.isArray(props.row?.policy?.propsRewards)
    ? props.row.policy.propsRewards
    : [],
);
</script>

<template>
  <Drawer
    :open="open"
    title="详情"
    width="760px"
    @close="emit('close')"
  >
    <div class="details-content">
      <section class="section">
        <div class="section-title">团长</div>
        <div class="section-card">
          <UserProfileLink :profile="row?.teamOwnProfile" />
        </div>
      </section>

      <section class="section">
        <div class="section-title">成员</div>
        <div class="section-card">
          <UserProfileLink :profile="row?.teamMemberProfile" />
        </div>
      </section>

      <section v-if="row?.recycled" class="section">
        <div class="section-title">退款用户</div>
        <div class="section-card">
          <UserProfileLink :profile="row?.refundUser" />
        </div>
      </section>

      <section class="section">
        <div class="section-title">账单信息</div>
        <div class="section-card pair-grid">
          <div>工资凭据ID: {{ row?.id || '-' }}</div>
          <div>区域: {{ row?.teamRegionName || '-' }}</div>
          <div>工资($): {{ row?.salary || 0 }}</div>
          <div>工资接收方: {{ row?.anchor ? '成员' : '团长' }}</div>
          <div>是否团长代收: {{ row?.hostSalaryToAgent ? '是' : '否' }}</div>
          <div>是否已收回: {{ row?.recycled ? '是' : '否' }}</div>
          <div>
            实际收款账户:
            {{
              row?.hostSalaryToAgent
                ? '团长账户'
                : row?.anchor
                  ? '成员账户'
                  : '团长账户'
            }}
          </div>
          <div v-if="row?.recycled">
            <Tag color="error">
              实际扣款账户:
              {{
                row?.hostSalaryToAgent
                  ? '团长账户'
                  : row?.anchor
                    ? '成员账户'
                    : '团长账户'
              }}
            </Tag>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">备注</div>
        <div class="section-card">
          <Timeline
            v-if="Array.isArray(row?.remarks) && row.remarks.length > 0"
          >
            <TimelineItem
              v-for="(item, index) in row.remarks"
              :key="item.id || index"
            >
              <div class="timeline-item">
                <div class="timeline-time">{{ item.createTime || '-' }}</div>
                <div>{{ item.remark || '-' }}</div>
              </div>
            </TimelineItem>
          </Timeline>
          <Empty v-else description="暂无备注" />
        </div>
      </section>

      <section class="section">
        <div class="section-title">
          政策: Lv.{{ row?.policy?.level || '-' }}
        </div>
        <div class="section-card">
          <div class="policy-grid">
            <div>Time(Hours): {{ row?.policy?.onlineTime || 0 }}</div>
            <div>GiftValue: {{ row?.policy?.target || 0 }}</div>
            <div>MemberSalary: {{ row?.policy?.memberSalary || 0 }}</div>
            <div>OwnSalary: {{ row?.policy?.ownSalary || 0 }}</div>
            <div>TotalSalary: {{ row?.policy?.totalSalary || 0 }}</div>
          </div>
          <div v-if="rewards.length > 0" class="reward-list">
            <Tag
              v-for="(item, index) in rewards"
              :key="item.id || index"
              color="blue"
            >
              {{ item.name || item.type || '奖励' }} / {{ formatPropsRewardText(item) }}
            </Tag>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">时间</div>
        <div class="section-card pair-grid">
          <div>创建时间: {{ formatDate(row?.createTime) }}</div>
          <div>修改时间: {{ formatDate(row?.updateTime) }}</div>
        </div>
      </section>
    </div>
  </Drawer>
</template>

<style scoped>
.details-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;
}

.section-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.pair-grid,
.policy-grid {
  display: grid;
  gap: 12px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.timeline-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.timeline-time {
  color: #64748b;
  font-size: 12px;
  margin-bottom: 6px;
}

.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}
</style>
