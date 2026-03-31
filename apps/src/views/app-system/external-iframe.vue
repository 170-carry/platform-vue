<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

defineOptions({ name: 'LegacyExternalIframe' });

const route = useRoute();

const title = computed(() => String(route.meta.title || '外部页面'));
const iframeSrc = computed(() => String(route.meta.iframeSrc || ''));
</script>

<template>
  <Page :title="title">
    <div class="iframe-shell">
      <iframe
        v-if="iframeSrc"
        :src="iframeSrc"
        class="iframe-view"
        frameborder="0"
        scrolling="auto"
      />
    </div>
  </Page>
</template>

<style scoped>
.iframe-shell {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  overflow: hidden;
}

.iframe-view {
  display: block;
  height: calc(100vh - 240px);
  min-height: 720px;
  width: 100%;
}
</style>
