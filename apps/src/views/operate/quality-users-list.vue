<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, TabPane, Tabs } from 'antdv-next';

import QualityUsersMonthTab from './components/quality-users-month-tab.vue';
import QualityUsersTotalTab from './components/quality-users-total-tab.vue';

defineOptions({ name: 'OperateQualityUsersList' });

const activeTab = ref('total');
</script>

<template>
  <Page title="高产用户列表">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="total" tab="总预览" />
        <TabPane key="month" tab="每月预览" />
      </Tabs>
      <QualityUsersTotalTab v-if="activeTab === 'total'" />
      <QualityUsersMonthTab v-else />
    </Card>
  </Page>
</template>
