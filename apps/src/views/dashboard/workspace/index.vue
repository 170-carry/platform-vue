<script lang="ts" setup>
import type { WorkbenchQuickNavItem } from '@vben/common-ui';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import {
  WorkbenchHeader,
  WorkbenchQuickNav,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

const accessStore = useAccessStore();
const userStore = useUserStore();
const router = useRouter();
const quickNavColors = [
  '#1677ff',
  '#13c2c2',
  '#52c41a',
  '#faad14',
  '#722ed1',
  '#eb2f96',
  '#2f54eb',
  '#fa541c',
  '#389e0d',
];

function resolveMenuPath(
  menu: { children?: Array<any>; path: string },
): string {
  if (!menu.children || menu.children.length === 0) {
    return menu.path;
  }

  for (const child of menu.children) {
    const path = resolveMenuPath(child);
    if (path) {
      return path;
    }
  }

  return menu.path;
}

const quickNavItems = computed<WorkbenchQuickNavItem[]>(() => {
  return accessStore.accessMenus
    .filter((menu) => !menu.disabled && menu.show !== false)
    .map((menu, index) => ({
      color: quickNavColors[index % quickNavColors.length],
      icon: menu.icon || 'carbon:workspace',
      title: menu.name,
      url: resolveMenuPath(menu),
    }))
    .filter((item) => item.url && item.url.startsWith('/'))
    .slice(0, 9);
});

const moduleCount = computed(() => accessStore.accessMenus.length);
const currentUserName = computed(() => {
  return userStore.userInfo?.realName || userStore.userInfo?.username || '管理员';
});
const currentAccount = computed(() => userStore.userInfo?.username || '-');
const headerDescription = computed(() => {
  return `当前账号：${currentAccount.value}，可访问 ${moduleCount.value} 个业务模块。`;
});

function navTo(nav: WorkbenchQuickNavItem) {
  if (!nav.url) {
    return;
  }
  router.push(nav.url).catch((error) => {
    console.error('Navigation failed:', error);
  });
}
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title>
        早安，{{ currentUserName }}，欢迎进入数据平台。
      </template>
      <template #description>{{ headerDescription }}</template>
    </WorkbenchHeader>

    <div class="mt-5">
      <WorkbenchQuickNav
        v-if="quickNavItems.length > 0"
        :items="quickNavItems"
        title="常用入口"
        @click="navTo"
      />
      <div
        v-else
        class="card-box rounded-xl border border-dashed border-border px-6 py-10 text-center text-foreground/70"
      >
        当前账号暂无可展示的业务入口。
      </div>
    </div>
  </div>
</template>
