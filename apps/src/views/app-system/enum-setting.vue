<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { ENUM_CONFIG_GROUP_NAMES } from '#/views/system/shared';

import { Card } from 'antdv-next';

import EnumSettingConfigPanel from './components/enum-setting-config-panel.vue';

defineOptions({ name: 'AppSystemEnumSetting' });

const parentGroups = ENUM_CONFIG_GROUP_NAMES;
const activeParent = ref(parentGroups[0]?.value ?? '');
const activeChild = ref(parentGroups[0]?.children?.[0]?.value ?? '');

const currentParent = computed(
  () => parentGroups.find((item) => item.value === activeParent.value) || null,
);
const childGroups = computed(() => currentParent.value?.children || []);
const activeGroup = computed(() =>
  childGroups.value.length > 0 && activeChild.value
    ? `${activeParent.value},${activeChild.value}`
    : activeParent.value,
);

watch(
  () => activeParent.value,
  (value) => {
    const target = parentGroups.find((item) => item.value === value);
    activeChild.value = target?.children?.[0]?.value ?? '';
  },
  { immediate: true },
);
</script>

<template>
  <Page title="参数配置">
    <Card>
      <div class="switcher">
        <button
          v-for="item in parentGroups"
          :key="item.value"
          class="switcher-item"
          :class="{ active: item.value === activeParent }"
          type="button"
          @click="activeParent = item.value"
        >
          {{ item.name }}
        </button>
      </div>

      <div v-if="childGroups.length > 0" class="switcher sub-switcher">
        <button
          v-for="item in childGroups"
          :key="item.value"
          class="switcher-item sub-item"
          :class="{ active: item.value === activeChild }"
          type="button"
          @click="activeChild = item.value"
        >
          {{ item.name }}
        </button>
      </div>

      <EnumSettingConfigPanel :group="activeGroup" />
    </Card>
  </Page>
</template>

<style scoped>
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sub-switcher {
  margin-top: 12px;
}

.switcher-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #334155;
  cursor: pointer;
  font-size: 14px;
  padding: 8px 18px;
  transition: all 0.2s ease;
}

.switcher-item.active {
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  border-color: #2563eb;
  color: #fff;
}

.sub-item {
  background: #fff;
}
</style>
