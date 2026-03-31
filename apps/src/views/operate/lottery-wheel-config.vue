<script lang="ts" setup>
import {
  computed,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addLotteryConf,
  getLotteryConf,
  } from '#/api/legacy/system';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Space,
  Spin,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateLotteryWheelConfig' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const sysOrigin = ref('');
const loading = ref(false);
const saving = ref(false);
const body = ref<Record<string, any>>({});
const jsonText = ref('{}');

watch(
  sysOriginOptions,
  (options) => {
    if (!sysOrigin.value && options.length > 0) {
      sysOrigin.value = String(options[0]?.value || '');
      void loadData();
    }
  },
  { immediate: true },
);

async function loadData() {
  if (!sysOrigin.value) {
    return;
  }
  loading.value = true;
  try {
    body.value = (await getLotteryConf({ sysOrigin: sysOrigin.value })) || {};
    jsonText.value = JSON.stringify(body.value || {}, null, 2);
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (!sysOrigin.value) {
    return;
  }
  let parsed: Record<string, any> = {};
  try {
    parsed = JSON.parse(jsonText.value || '{}');
    if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) {
      message.warning('配置必须是对象');
      return;
    }
  } catch {
    message.warning('JSON 格式不正确');
    return;
  }
  saving.value = true;
  try {
    await addLotteryConf({
      body: parsed,
      sysOrigin: sysOrigin.value,
    });
    body.value = parsed;
    message.success('保存成功');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page title="抽奖品配置">
    <Card>
      <Space class="toolbar" wrap>
        <SysOriginSelect
          v-model:value="sysOrigin"
          style="width: 180px"
          @change="loadData"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Button :loading="loading" @click="loadData">刷新</Button>
        <Button :loading="saving" type="primary" @click="handleSave">
          保存
        </Button>
      </Space>

      <Alert :closable="false" class="tips" type="info">
        <template #message>
          <div>原项目这里直接维护完整转盘配置结构。</div>
          <div>当前保持同一份 `body` JSON 读写，不改动后台字段定义。</div>
        </template>
      </Alert>

      <Spin :spinning="loading">
        <Descriptions bordered class="summary" size="small">
          <DescriptionsItem label="直径">
            {{ body.diameter || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="启动消费">
            {{ body.startConsume || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="抽奖类型">
            {{ Number(body.type) === 1 ? '九宫格' : '转盘' }}
          </DescriptionsItem>
          <DescriptionsItem label="背景数">
            {{ Array.isArray(body.blocks) ? body.blocks.length : 0 }}
          </DescriptionsItem>
          <DescriptionsItem label="奖品数">
            {{ Array.isArray(body.prizes) ? body.prizes.length : 0 }}
          </DescriptionsItem>
          <DescriptionsItem label="按钮数">
            {{ Array.isArray(body.buttons) ? body.buttons.length : 0 }}
          </DescriptionsItem>
        </Descriptions>

        <TextArea
          v-model:value="jsonText"
          :auto-size="{ minRows: 28, maxRows: 40 }"
          class="json-editor"
          spellcheck="false"
        />
      </Spin>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar,
.tips,
.summary {
  margin-bottom: 16px;
}

.json-editor {
  font-family:
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    monospace;
}
</style>
