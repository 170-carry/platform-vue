<script lang="ts" setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { Tag } from 'antdv-next';

import {
  getUserDisplayText,
  getUserProfileAvatar,
  getUserProfileId,
} from '../shared';

const props = defineProps<{
  profile?: null | Record<string, any>;
  tagName?: string;
}>();

const router = useRouter();

const userId = computed(() => String(getUserProfileId(props.profile) || ''));
const avatar = computed(() => getUserProfileAvatar(props.profile));
const displayText = computed(() => getUserDisplayText(props.profile));

function openUserDetails() {
  if (!userId.value) {
    return;
  }
  router.push(`/common/user/deatils/${userId.value}`);
}
</script>

<template>
  <button
    v-if="userId"
    class="user-link"
    type="button"
    @click="openUserDetails"
  >
    <img
      :src="avatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
      alt=""
      class="user-link__avatar"
    >
    <span class="user-link__copy">
      <span class="user-link__name-row">
        <span class="user-link__name">{{ displayText }}</span>
        <Tag v-if="tagName" color="blue">{{ tagName }}</Tag>
      </span>
      <span class="user-link__meta">ID {{ userId }}</span>
    </span>
  </button>
  <div v-else class="user-link user-link--static">
    <img
      :src="avatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
      alt=""
      class="user-link__avatar"
    >
    <span class="user-link__copy">
      <span class="user-link__name-row">
        <span class="user-link__name">{{ displayText }}</span>
        <Tag v-if="tagName" color="blue">{{ tagName }}</Tag>
      </span>
      <span class="user-link__meta">暂无用户ID</span>
    </span>
  </div>
</template>

<style scoped>
.user-link {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  gap: 10px;
  padding: 0;
  text-align: left;
}

.user-link--static {
  cursor: default;
}

.user-link__avatar {
  background: #e2e8f0;
  border-radius: 999px;
  flex-shrink: 0;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.user-link__copy {
  color: #0f172a;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.user-link__name-row {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.user-link__name {
  font-weight: 600;
  word-break: break-all;
}

.user-link__meta {
  color: #64748b;
  font-size: 12px;
}
</style>
