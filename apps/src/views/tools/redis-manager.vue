<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  getAppEnumConfigCache,
  getCheckInDaysCache,
  getGiftConfigCache,
  getPlatformProductConfigCache,
} from '#/api/legacy/tools';
import { getAllowedSysOrigins } from '#/views/system/shared';
import { useAccessStore } from '@vben/stores';

import {
  Card,
  Modal,
  Space,
  Spin,
  Tag,
  message,
} from 'antdv-next';

defineOptions({ name: 'ToolsRedisManager' });

const accessStore = useAccessStore();

const loading = ref(false);
const promptOpen = ref(false);
const userId = ref('');
const result = ref<{ data: any; ttl: number }>({
  data: '',
  ttl: -2,
});

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

async function runTask(
  task: () => Promise<{ data: any; ttl: number }>,
) {
  loading.value = true;
  result.value = { data: '', ttl: -2 };
  try {
    result.value = await task();
  } finally {
    loading.value = false;
  }
}

function openCheckInPrompt() {
  userId.value = '';
  promptOpen.value = true;
}

async function handleCheckInSearch() {
  if (!userId.value.trim()) {
    message.warning('请输入用户ID');
    return;
  }
  promptOpen.value = false;
  await runTask(() => getCheckInDaysCache(userId.value.trim()));
}
</script>

<template>
  <Page title="Redis缓存管理">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <Tag class="tag-action" color="processing" @click="openCheckInPrompt">
            打卡信息
          </Tag>
          <Tag
            class="tag-action"
            color="processing"
            @click="runTask(() => getGiftConfigCache())"
          >
            礼物配置列表
          </Tag>
          <Tag
            class="tag-action"
            color="processing"
            @click="runTask(() => getAppEnumConfigCache())"
          >
            枚举配置列表
          </Tag>
          <Tag
            v-for="item in sysOriginOptions"
            :key="item.value"
            class="tag-action"
            color="processing"
            @click="runTask(() => getPlatformProductConfigCache(String(item.value)))"
          >
            产品配置列表 · {{ item.label }}
          </Tag>
        </Space>
      </div>

      <Spin :spinning="loading">
        <div class="result-box">
          <div v-if="result.ttl > 0" class="ttl">TTL：{{ result.ttl }}</div>
          <pre>{{ typeof result.data === 'string' ? result.data : JSON.stringify(result.data || '没有更多的信息', null, 2) }}</pre>
        </div>
      </Spin>
    </Card>

    <Modal
      :open="promptOpen"
      destroy-on-close
      title="查询打卡信息"
      @cancel="promptOpen = false"
      @ok="handleCheckInSearch"
    >
      <input
        v-model="userId"
        class="input-native"
        placeholder="请输入用户ID"
      />
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.tag-action {
  cursor: pointer;
  padding: 6px 12px;
}

.result-box {
  background: #0f172a;
  border-radius: 16px;
  color: #e2e8f0;
  min-height: 360px;
  padding: 18px;
}

.result-box pre {
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.ttl {
  color: #93c5fd;
  margin-bottom: 12px;
}

.input-native {
  border: 1px solid #d4d4d8;
  border-radius: 10px;
  outline: none;
  padding: 10px 12px;
  width: 100%;
}
</style>
