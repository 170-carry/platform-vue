<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import { Card } from 'antdv-next';

import BeanRunningWaterPanel from './components/bean-running-water-panel.vue';

defineOptions({ name: 'PetBeansRunningWater' });
</script>

<template>
  <Page title="豆子流水">
    <Card>
      <BeanRunningWaterPanel />
    </Card>
  </Page>
</template>
