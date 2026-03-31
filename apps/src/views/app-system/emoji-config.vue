<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Tabs, TabPane } from 'antdv-next';

import EmojiGroupPanel from './components/emoji-group-panel.vue';
import EmojiResourcePanel from './components/emoji-resource-panel.vue';

defineOptions({ name: 'AppSystemEmojiConfig' });

const activeTab = ref('group');
</script>

<template>
  <Page title="表情管理">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="group" tab="分组" />
        <TabPane key="resource" tab="资源" />
      </Tabs>

      <EmojiGroupPanel v-if="activeTab === 'group'" />
      <EmojiResourcePanel v-else />
    </Card>
  </Page>
</template>
