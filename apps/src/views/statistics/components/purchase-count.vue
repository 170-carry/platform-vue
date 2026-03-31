<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive } from 'vue';

import {
  purchaseTodayTotal,
  purchaseTodayTotalBySysOrigin,
} from '#/api/legacy/operate';

defineOptions({ name: 'StatisticsDatavPurchaseCount' });

const props = withDefaults(
  defineProps<{
    timeOutSecond?: number;
  }>(),
  {
    timeOutSecond: 60,
  },
);

const summary = reactive({
  likeiTotal: 0,
  total: 0,
});

let refreshTimer: number | undefined;

function normalizeNumber(value: any) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function formatValue(value: number) {
  return value.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

async function loadData() {
  const [totalResult, likeiResult] = await Promise.allSettled([
    purchaseTodayTotal(),
    purchaseTodayTotalBySysOrigin('LIKEI'),
  ]);

  summary.total =
    totalResult.status === 'fulfilled'
      ? normalizeNumber(totalResult.value)
      : 0;
  summary.likeiTotal =
    likeiResult.status === 'fulfilled'
      ? normalizeNumber(likeiResult.value)
      : 0;
}

onMounted(() => {
  void loadData();
  refreshTimer = window.setInterval(() => {
    void loadData();
  }, props.timeOutSecond * 1000);
});

onBeforeUnmount(() => {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
  }
});
</script>

<template>
  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-card__label">总额</div>
      <div class="stat-card__value">{{ formatValue(summary.total) }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">LIKEI</div>
      <div class="stat-card__value">{{ formatValue(summary.likeiTotal) }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.stat-card {
  background: rgba(40, 49, 99, 0.62);
  border: 1px solid rgba(79, 189, 255, 0.16);
  border-radius: 16px;
  min-height: 124px;
  padding: 22px 20px;
}

.stat-card__label {
  color: rgba(210, 223, 246, 0.72);
  font-size: 14px;
  margin-bottom: 14px;
}

.stat-card__value {
  color: #f8fbff;
  font-size: clamp(24px, 4vw, 38px);
  font-weight: 700;
  line-height: 1.15;
  word-break: break-all;
}

@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
