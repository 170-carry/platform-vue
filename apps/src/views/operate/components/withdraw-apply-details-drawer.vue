<script lang="ts" setup>
import { computed } from 'vue';

import {
  Button,
  Drawer,
  Empty,
  Image,
  Tag,
  Timeline,
  TimelineItem,
} from 'antdv-next';

import { formatDate } from '#/views/system/shared';

import {
  copyText,
  getApprovalStatusName,
  normalizeCredentialValue,
} from '../shared';
import UserProfileLink from './user-profile-link.vue';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const credentials = computed(() =>
  Array.isArray(props.row?.settlementResult?.credential)
    ? props.row.settlementResult.credential
        .map((item: any) => normalizeCredentialValue(item))
        .filter(Boolean)
    : [],
);

const hasCardRisk = computed(() => {
  const bankCard = props.row?.settlementResult?.acceptBankCard;
  return Boolean(
    bankCard &&
      props.row?.latestApprovalStatus === 'SUBMIT' &&
      (bankCard.del || bankCard.status !== 'PASS'),
  );
});

async function handleCopyBankCard() {
  const bankCard = props.row?.settlementResult?.acceptBankCard;
  if (!bankCard) {
    return;
  }
  await copyText(
    `卡号: ${bankCard.cardNo || '?'}, 收款人: ${bankCard.payee || '?'}, 银行: ${bankCard.cardName || '?'}`,
  );
}
</script>

<template>
  <Drawer
    :open="open"
    title="提现申请详情"
    width="760px"
    @close="emit('close')"
  >
    <div class="details-content">
      <section class="section">
        <div class="section-title">提交人</div>
        <div class="section-card">
          <UserProfileLink :profile="row?.submitUser" />
        </div>
      </section>

      <section v-if="row?.settlementResult?.acceptBankCard" class="section">
        <div class="section-title">银行卡</div>
        <div class="section-card">
          <div class="bank-card-row">
            <Tag>卡号: {{ row?.settlementResult?.acceptBankCard?.cardNo || '-' }}</Tag>
            <Tag>收款人: {{ row?.settlementResult?.acceptBankCard?.payee || '-' }}</Tag>
            <Tag>银行: {{ row?.settlementResult?.acceptBankCard?.cardName || '-' }}</Tag>
            <Button size="small" type="link" @click="handleCopyBankCard">
              复制
            </Button>
          </div>
          <Tag v-if="hasCardRisk" color="error">
            该银行卡可能已被用户删除或没有通审核,请核实.
          </Tag>
        </div>
      </section>

      <section class="section">
        <div class="section-title">提现信息</div>
        <div class="section-card pair-grid">
          <div>提现金额: {{ row?.amount || 0 }}</div>
          <div>手续费(%): {{ row?.serviceCharge || 0 }}</div>
          <div>实际提现金额: {{ row?.actualAmount || 0 }}</div>
          <div>接收方式: {{ row?.acceptMethodName || '-' }}</div>
          <div>最新审核状态: {{ row?.latestApprovalStatusName || row?.latestApprovalStatus || '-' }}</div>
          <div>创建时间: {{ formatDate(row?.createTime) }}</div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">凭证</div>
        <div class="section-card">
          <div v-if="credentials.length > 0" class="credential-grid">
            <Image
              v-for="(item, index) in credentials"
              :key="`${item}-${index}`"
              :src="item"
              class="credential-image"
            />
          </div>
          <Empty v-else description="暂无凭证" />
        </div>
      </section>

      <section class="section">
        <div class="section-title">审批记录</div>
        <div class="section-card">
          <Timeline
            v-if="Array.isArray(row?.approvalProcesses) && row.approvalProcesses.length > 0"
            class="timeline"
          >
            <TimelineItem
              v-for="(item, index) in row.approvalProcesses"
              :key="item.id || index"
            >
              <div class="timeline-card">
                <div class="timeline-title">
                  {{ getApprovalStatusName(item.status) }}
                </div>
                <div class="timeline-time">{{ formatDate(item.createTime) }}</div>
                <div class="timeline-remark">备注: {{ item.remark || '-' }}</div>
              </div>
            </TimelineItem>
          </Timeline>
          <Empty v-else description="暂无审批记录" />
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

.pair-grid {
  display: grid;
  gap: 12px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.bank-card-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.credential-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.credential-image {
  border-radius: 12px;
  overflow: hidden;
}

.timeline {
  margin-top: 4px;
}

.timeline-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.timeline-title {
  font-weight: 600;
}

.timeline-time {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}

.timeline-remark {
  margin-top: 8px;
}
</style>
