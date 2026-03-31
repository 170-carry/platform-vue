<script lang="ts" setup>
import { computed } from 'vue';

import { getAccessImgUrl } from '#/api/legacy/oss';
import {
  getRewardAccentColor,
  getRewardPrimaryText,
  getRewardSecondaryText,
} from '#/views/pet/shared';

import { Image, Tag, Tooltip } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    list?: Array<Record<string, any>>;
  }>(),
  {
    list: () => [],
  },
);

const items = computed(() => (Array.isArray(props.list) ? props.list : []));

function getCover(item: Record<string, any>) {
  return getAccessImgUrl(item?.cover || item?.imageUrl || '');
}

function hasPreviewImage(item: Record<string, any>) {
  if (!item) {
    return false;
  }
  if (item.type === 'GOLD' || item.type === 'DIAMOND' || item.type === 'SPECIAL_ID') {
    return false;
  }
  return Boolean(getCover(item));
}
</script>

<template>
  <div class="reward-list">
    <div
      v-for="(item, index) in items"
      :key="`${item.id || item.type || 'reward'}-${index}`"
      class="reward-item"
    >
      <Tooltip :title="getRewardSecondaryText(item)">
        <div class="reward-item__media">
          <Image
            v-if="hasPreviewImage(item)"
            :preview="true"
            :src="getCover(item)"
            class="reward-item__image"
          />
          <div
            v-else
            class="reward-item__fallback"
            :style="{ background: `${getRewardAccentColor(item.type)}18`, color: getRewardAccentColor(item.type) }"
          >
            {{ getRewardPrimaryText(item).slice(0, 2) }}
          </div>
          <Tag v-if="item.sourceUrl" class="reward-item__tag" color="processing">
            动效
          </Tag>
        </div>
      </Tooltip>
      <div class="reward-item__title">{{ getRewardPrimaryText(item) }}</div>
      <div class="reward-item__desc">{{ getRewardSecondaryText(item) }}</div>
    </div>
  </div>
</template>

<style scoped>
.reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.reward-item {
  display: grid;
  gap: 6px;
  width: 84px;
}

.reward-item__media {
  position: relative;
}

.reward-item__image,
.reward-item__fallback {
  align-items: center;
  border-radius: 16px;
  display: flex;
  height: 64px;
  justify-content: center;
  overflow: hidden;
  width: 64px;
}

.reward-item__image :deep(img) {
  height: 64px;
  object-fit: cover;
  width: 64px;
}

.reward-item__fallback {
  font-size: 12px;
  font-weight: 600;
}

.reward-item__tag {
  border-radius: 999px;
  font-size: 11px;
  margin: 0;
  position: absolute;
  right: -4px;
  top: -4px;
}

.reward-item__title {
  color: #0f172a;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.reward-item__desc {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
}
</style>
