<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, TabPane, Tabs } from 'antdv-next';

import GamePkRoomPanel from './components/game-pk-room-panel.vue';
import GamePkTeamPanel from './components/game-pk-team-panel.vue';

defineOptions({ name: 'OperateGamePk' });

const activeTab = ref('room');
</script>

<template>
  <Page title="PK记录">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="room" tab="房间PK" />
        <TabPane key="team" tab="团队PK" />
      </Tabs>

      <GamePkRoomPanel v-if="activeTab === 'room'" />
      <GamePkTeamPanel v-else />
    </Card>
  </Page>
</template>
