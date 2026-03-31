<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Tabs, TabPane } from 'antdv-next';

import GoldRunningWater from './gold-running-water.vue';
import UserFreightInfoList from './user-freight-info-list.vue';

defineOptions({ name: 'OperateInsideOperationGold' });

const activeTab = ref('gold');
</script>

<template>
  <Page title="内部操作金币">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="gold" tab="用户收支" />
        <TabPane key="freight" tab="货运流水" />
      </Tabs>

      <GoldRunningWater v-if="activeTab === 'gold'" query-back-operation />
      <UserFreightInfoList v-else query-back-operation />
    </Card>
  </Page>
</template>
