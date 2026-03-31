<script lang="ts" setup>
import { computed } from 'vue';

import { Image } from 'antdv-next';

import {
  isCurrencyRewardType,
  isGameCouponType,
  isPropsCouponType,
} from '../shared';

const props = withDefaults(
  defineProps<{
    item: Record<string, any>;
    size?: number;
  }>(),
  {
    size: 48,
  },
);

const type = computed(() => props.item.detailType || props.item.type || '');
const sizeStyle = computed(() => ({
  height: `${props.size}px`,
  width: `${props.size}px`,
}));

const tokenLabel = computed(() => {
  if (isCurrencyRewardType(type.value)) {
    return type.value === 'GOLD' ? '金币' : '钻石';
  }
  if (type.value === 'SPECIAL_ID') {
    return '靓号';
  }
  if (isGameCouponType(type.value)) {
    return '券';
  }
  if (isPropsCouponType(type.value)) {
    return '道具券';
  }
  if (type.value === 'EMOJI') {
    return '表情';
  }
  return type.value || '资源';
});

const tokenClassName = computed(() => {
  if (type.value === 'GOLD') {
    return 'reward-icon__token reward-icon__token--gold';
  }
  if (type.value === 'DIAMOND') {
    return 'reward-icon__token reward-icon__token--diamond';
  }
  if (type.value === 'SPECIAL_ID') {
    return 'reward-icon__token reward-icon__token--special';
  }
  return 'reward-icon__token reward-icon__token--default';
});
</script>

<template>
  <div class="reward-icon" :style="sizeStyle">
    <Image
      v-if="item.cover && !isCurrencyRewardType(type) && !isGameCouponType(type) && !isPropsCouponType(type) && type !== 'SPECIAL_ID'"
      class="reward-icon__image"
      :preview="{ src: item.cover }"
      :src="item.cover"
    />
    <div v-else :class="tokenClassName">
      {{ tokenLabel }}
    </div>
  </div>
</template>

<style scoped>
.reward-icon {
  align-items: center;
  background: #fff;
  border: 1px solid rgb(226 232 240);
  border-radius: 14px;
  display: inline-flex;
  justify-content: center;
  overflow: hidden;
}

.reward-icon__image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.reward-icon__token {
  align-items: center;
  color: #fff;
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  height: 100%;
  justify-content: center;
  line-height: 1.2;
  padding: 4px;
  text-align: center;
  width: 100%;
}

.reward-icon__token--gold {
  background: linear-gradient(135deg, #d97706, #f59e0b);
}

.reward-icon__token--diamond {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
}

.reward-icon__token--special {
  background: linear-gradient(135deg, #475569, #0f172a);
}

.reward-icon__token--default {
  background: linear-gradient(135deg, #64748b, #334155);
}
</style>
