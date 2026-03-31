<script lang="ts" setup>
import { onBeforeUnmount, onMounted, reactive } from 'vue';

import { onlineRoomCount, onlineUserCount } from '#/api/legacy/datav';

defineOptions({ name: 'StatisticsDatavOnlineUserCountOrigin' });

const props = withDefaults(
  defineProps<{
    origin: string;
    timeOutSecond?: number;
  }>(),
  {
    timeOutSecond: 60,
  },
);

const summary = reactive({
  femaleUserCount: 0,
  maleUserCount: 0,
  roomCount: 0,
  userTotal: 0,
});

let refreshTimer: number | undefined;

function normalizeNumber(value: any) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

async function loadData() {
  const [userTotal, femaleUserCount, maleUserCount, roomCount] =
    await Promise.allSettled([
      onlineUserCount({ sysOrigin: props.origin }),
      onlineUserCount({ gender: 0, sysOrigin: props.origin }),
      onlineUserCount({ gender: 1, sysOrigin: props.origin }),
      onlineRoomCount({ sysOrigin: props.origin }),
    ]);

  summary.userTotal =
    userTotal.status === 'fulfilled' ? normalizeNumber(userTotal.value) : 0;
  summary.femaleUserCount =
    femaleUserCount.status === 'fulfilled'
      ? normalizeNumber(femaleUserCount.value)
      : 0;
  summary.maleUserCount =
    maleUserCount.status === 'fulfilled'
      ? normalizeNumber(maleUserCount.value)
      : 0;
  summary.roomCount =
    roomCount.status === 'fulfilled' ? normalizeNumber(roomCount.value) : 0;
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
      <div class="stat-card__label">总人数</div>
      <div class="stat-card__value">{{ summary.userTotal }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">女生</div>
      <div class="stat-card__value">{{ summary.femaleUserCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">男生</div>
      <div class="stat-card__value">{{ summary.maleUserCount }}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">房间</div>
      <div class="stat-card__value">{{ summary.roomCount }}</div>
    </div>
  </div>
</template>

<style scoped>
.stat-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  font-size: clamp(22px, 3vw, 36px);
  font-weight: 700;
  line-height: 1.15;
  word-break: break-all;
}

@media (max-width: 960px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
