<script lang="ts" setup>
import { computed } from 'vue';

import { Drawer, Empty, Tag } from 'antdv-next';

import { formatDate } from '#/views/system/shared';

import { TEAM_BILL_STATUS_MAP } from '../shared';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const billStatus = computed(() => {
  const key = String(props.row?.status || '');
  return TEAM_BILL_STATUS_MAP[key] || null;
});
</script>

<template>
  <Drawer
    :open="open"
    title="详情"
    width="760px"
    @close="emit('close')"
  >
    <div class="team-bill-content">
      <section class="section">
        <div class="section-title">代理</div>
        <div class="section-card">
          <div>{{ row?.ownUserProfile?.userNickname || '-' }}</div>
          <div class="muted">
            {{ row?.ownUserProfile?.actualAccount || row?.ownUserProfile?.id || '-' }}
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-title">账单信息</div>
        <div class="section-card">
          <div class="pair-grid">
            <div>ID: {{ row?.id || '-' }}</div>
            <div>区域: {{ row?.regionName || '-' }}</div>
            <div>账单归属: {{ row?.billBelong || '-' }}</div>
            <div>账单标题: {{ row?.billTitle || '-' }}</div>
            <div>
              状态:
              <Tag :color="billStatus?.tag || 'default'">
                {{ billStatus?.name || row?.status || '-' }}
              </Tag>
            </div>
          </div>

          <template v-if="row?.settleResult">
            <div class="pair-grid settle-grid">
              <div>工作人数: {{ row?.settleResult?.workMembers || 0 }}</div>
              <div>完成人数: {{ row?.settleResult?.finishMembers || 0 }}</div>
              <div>成员工资: {{ row?.settleResult?.memberSalary || 0 }}</div>
              <div>团长工资: {{ row?.settleResult?.ownSalary || 0 }}</div>
              <div>扣除工资: {{ row?.settleResult?.deductSalary || 0 }}</div>
              <div>合计工资: {{ row?.settleResult?.totalSalary || 0 }}</div>
            </div>
          </template>

          <div v-if="row?.remarks" class="remark-row">对外备注: {{ row.remarks }}</div>
        </div>
      </section>

      <section
        v-if="Array.isArray(row?.internalRemarks) && row.internalRemarks.length > 0"
        class="section"
      >
        <div class="section-title">内部备注</div>
        <div class="section-card">
          <div
            v-for="(item, index) in row.internalRemarks"
            :key="item.remarkId || index"
            class="remark-item"
          >
            <div class="remark-meta">
              <span>{{ item.createBackUserName || '-' }}</span>
              <span>{{ formatDate(item.createTime) }}</span>
            </div>
            <div>{{ item.remark || '-' }}</div>
          </div>
        </div>
      </section>

      <section
        v-if="row?.settleResult?.bankCardArchives"
        class="section"
      >
        <div class="section-title">银行卡</div>
        <div class="bank-card">
          <div class="bank-card-no">
            {{ row?.settleResult?.bankCardArchives?.cardNo || '-' }}
          </div>
          <div class="bank-card-payee">
            payee: {{ row?.settleResult?.bankCardArchives?.payee || '-' }}
          </div>
        </div>
      </section>

      <Empty
        v-if="!row || Object.keys(row).length === 0"
        description="暂无账单详情"
      />
    </div>
  </Drawer>
</template>

<style scoped>
.team-bill-content {
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

.settle-grid {
  margin-top: 14px;
}

.remark-row {
  margin-top: 14px;
}

.remark-item + .remark-item {
  border-top: 1px solid #e2e8f0;
  margin-top: 12px;
  padding-top: 12px;
}

.remark-meta {
  color: #64748b;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.bank-card {
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  border-radius: 18px;
  color: #eff6ff;
  padding: 18px;
}

.bank-card-no {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.bank-card-payee {
  margin-top: 10px;
}

.muted {
  color: #64748b;
  margin-top: 4px;
}
</style>
