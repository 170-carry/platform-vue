<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, TabPane, Tabs } from 'antdv-next';

import FamilyCreateRulePanel from './components/family-create-rule-panel.vue';
import FamilyLevelPanel from './components/family-level-panel.vue';
import FamilyRewardRulePanel from './components/family-reward-rule-panel.vue';

defineOptions({ name: 'FamilyConfig' });

const activeTab = ref('level');
</script>

<template>
  <Page title="家族配置">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="level" tab="家族等级配置" />
        <TabPane key="createRule" tab="创建家族规则" />
        <TabPane key="rewardRule" tab="创建每周奖励规则" />
      </Tabs>

      <FamilyLevelPanel v-if="activeTab === 'level'" />
      <FamilyCreateRulePanel v-else-if="activeTab === 'createRule'" />
      <FamilyRewardRulePanel v-else />
    </Card>
  </Page>
</template>
