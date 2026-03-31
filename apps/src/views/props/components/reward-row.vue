<script lang="ts" setup>
import { Tooltip } from 'antdv-next';

import RewardIcon from './reward-icon.vue';
import { formatRewardText, getPropsTypeName } from '../shared';

defineProps<{
  list?: Array<Record<string, any>>;
}>();
</script>

<template>
  <div class="reward-row">
    <Tooltip
      v-for="(item, index) in list || []"
      :key="`${item.id || item.content || item.detailType || item.type}-${index}`"
      :title="`${getPropsTypeName(item.detailType || item.type)} ${formatRewardText(item)}`"
    >
      <div class="reward-row__item">
        <RewardIcon :item="item" />
        <div class="reward-row__text">
          {{ formatRewardText(item) }}
        </div>
      </div>
    </Tooltip>
  </div>
</template>

<style scoped>
.reward-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.reward-row__item {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 6px;
  max-width: 72px;
}

.reward-row__text {
  color: rgb(71 85 105);
  font-size: 12px;
  line-height: 1.3;
  text-align: center;
  word-break: break-all;
}
</style>
