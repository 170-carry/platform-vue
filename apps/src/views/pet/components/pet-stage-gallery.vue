<script lang="ts" setup>
import { computed } from 'vue';

import { getAccessImgUrl } from '#/api/legacy/oss';
import { PET_STAGE_DEFINITIONS } from '#/views/pet/shared';

import { Image, Tag } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    list?: Array<Record<string, any>>;
  }>(),
  {
    list: () => [],
  },
);

const cards = computed(() =>
  PET_STAGE_DEFINITIONS.map((definition, index) => ({
    ...definition,
    row: props.list[index] || {},
  })),
);

function getCover(value?: string) {
  return getAccessImgUrl(value || '');
}
</script>

<template>
  <div class="stage-gallery">
    <div
      v-for="item in cards"
      :key="item.key"
      class="stage-card"
    >
      <div class="stage-card__cover">
        <Image
          v-if="getCover(item.row.cover)"
          :preview="true"
          :src="getCover(item.row.cover)"
          class="stage-card__image"
        />
        <div v-else class="stage-card__placeholder">
          {{ item.label }}
        </div>
      </div>
      <div class="stage-card__meta">
        <div class="stage-card__title">{{ item.label }}</div>
        <Tag color="default">Lv.{{ item.row.level || '-' }}</Tag>
      </div>
      <div class="stage-card__stats">
        <span>喂养 {{ item.row.upgradeFeedingNum ?? 0 }}</span>
        <span>收益 {{ item.row.revenue ?? 0 }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-gallery {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.stage-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  display: grid;
  gap: 10px;
  padding: 12px;
}

.stage-card__cover {
  overflow: hidden;
}

.stage-card__image,
.stage-card__placeholder {
  align-items: center;
  border-radius: 14px;
  display: flex;
  height: 120px;
  justify-content: center;
  overflow: hidden;
  width: 100%;
}

.stage-card__image :deep(img) {
  height: 120px;
  object-fit: cover;
  width: 100%;
}

.stage-card__placeholder {
  background: linear-gradient(135deg, #e2e8f0, #f8fafc);
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
}

.stage-card__meta {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.stage-card__title {
  color: #0f172a;
  font-weight: 600;
}

.stage-card__stats {
  color: #64748b;
  display: flex;
  font-size: 12px;
  gap: 12px;
}
</style>
