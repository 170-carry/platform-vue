<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { getPurchaseTable } from '#/api/legacy/operate';
import { formatDate } from '#/views/system/shared';

defineOptions({ name: 'StatisticsDatavLatestPurchase' });

const props = withDefaults(
  defineProps<{
    sysOriginCodes?: string[];
    timeOutSecond?: number;
  }>(),
  {
    sysOriginCodes: () => [],
    timeOutSecond: 60,
  },
);

const list = ref<Array<Record<string, any>>>([]);
const viewportRef = ref<HTMLElement>();
const paused = ref(false);

let refreshTimer: number | undefined;
let scrollTimer: number | undefined;

const sysOriginKey = computed(() => props.sysOriginCodes.join(','));
const canScroll = computed(() => list.value.length > 4);
const renderList = computed(() =>
  canScroll.value ? [...list.value, ...list.value] : list.value,
);

function formatPrice(value: any) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) {
    return String(value || '-');
  }
  return amount.toLocaleString('en-US', {
    maximumFractionDigits: 2,
  });
}

function resetScrollPosition() {
  if (viewportRef.value) {
    viewportRef.value.scrollTop = 0;
  }
}

function stopScroll() {
  if (scrollTimer) {
    window.clearInterval(scrollTimer);
    scrollTimer = undefined;
  }
}

function startScroll() {
  stopScroll();
  const element = viewportRef.value;
  if (!element || !canScroll.value) {
    return;
  }
  scrollTimer = window.setInterval(() => {
    const target = viewportRef.value;
    if (!target || paused.value) {
      return;
    }
    const loopHeight = target.scrollHeight / 2;
    if (target.scrollTop >= loopHeight) {
      target.scrollTop = 0;
    }
    target.scrollTop += 1;
  }, 40);
}

async function loadData() {
  const result = await getPurchaseTable({
    cursor: 1,
    limit: 60,
    sysOrigin: sysOriginKey.value,
  });
  list.value = result.records || [];
  await nextTick();
  resetScrollPosition();
  startScroll();
}

watch(sysOriginKey, () => {
  void loadData();
});

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
  stopScroll();
});
</script>

<template>
  <div
    ref="viewportRef"
    class="latest-purchase"
    @mouseleave="paused = false"
    @mouseenter="paused = true"
  >
    <div v-if="renderList.length > 0" class="latest-purchase__list">
      <div
        v-for="(item, index) in renderList"
        :key="`${item.orderPurchase?.id || 'purchase'}-${index}`"
        class="latest-purchase__item"
      >
        <img
          :src="
            item.userBaseInfo?.userAvatar ||
            'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'
          "
          alt=""
          class="latest-purchase__avatar"
        >
        <div class="latest-purchase__content">
          <div class="latest-purchase__header">
            <span
              v-if="item.userBaseInfo?.countryCode"
              class="latest-purchase__country"
            >
              {{ item.userBaseInfo?.countryCode }}
            </span>
            <span class="latest-purchase__nickname">
              {{ item.userBaseInfo?.userNickname || '-' }}
            </span>
          </div>
          <div class="latest-purchase__meta">
            <span>{{ formatDate(item.orderPurchase?.createTime) }}</span>
            <span class="latest-purchase__product">
              {{ item.orderPurchase?.productDescription || '-' }}
            </span>
            <span>{{ formatPrice(item.orderPurchase?.unitPrice) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="latest-purchase__empty">暂无购买记录</div>
  </div>
</template>

<style scoped>
.latest-purchase {
  height: clamp(360px, 72vh, 720px);
  overflow: hidden;
  padding-right: 6px;
}

.latest-purchase__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.latest-purchase__item {
  align-items: center;
  background: rgba(40, 49, 99, 0.62);
  border: 1px solid rgba(79, 189, 255, 0.16);
  border-radius: 16px;
  display: flex;
  gap: 14px;
  padding: 14px;
}

.latest-purchase__avatar {
  background: #d8e4ff;
  border-radius: 999px;
  flex-shrink: 0;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.latest-purchase__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.latest-purchase__header {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.latest-purchase__country {
  background: rgba(3, 194, 236, 0.14);
  border: 1px solid rgba(3, 194, 236, 0.24);
  border-radius: 999px;
  color: #9cecff;
  flex-shrink: 0;
  font-size: 12px;
  line-height: 1;
  padding: 5px 8px;
}

.latest-purchase__nickname {
  color: #f8fbff;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.latest-purchase__meta {
  color: rgba(210, 223, 246, 0.7);
  display: grid;
  gap: 6px;
}

.latest-purchase__product {
  color: #03c2ec;
}

.latest-purchase__empty {
  align-items: center;
  color: rgba(210, 223, 246, 0.7);
  display: flex;
  height: 100%;
  justify-content: center;
}

@media (max-width: 960px) {
  .latest-purchase {
    height: 420px;
  }

  .latest-purchase__meta {
    font-size: 12px;
  }
}
</style>
