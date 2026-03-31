<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  querySysUserAdvertisingConfigDTO,
  updateSysUserAdvertisingConfigDTO,
} from '#/api/legacy/system';

import {
  Button,
  Card,
  Input,
  Modal,
  Switch,
  TabPane,
  Tabs,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateUserAdvertising' });

const activeTab = ref('HALAR');
const loading = ref(false);
const saving = ref(false);
const form = reactive({
  advertisingSwitch: false,
  gold: '',
  sysOrigin: 'HALAR',
  timeInterval: '',
  viewableAdvertisement: '',
});

function normalizeConfig(result: Record<string, any> | null | undefined) {
  const value = result?.result ?? result ?? {};
  form.advertisingSwitch = Boolean(value.advertisingSwitch);
  form.gold = String(value.gold ?? '');
  form.sysOrigin = String(value.sysOrigin || 'HALAR');
  form.timeInterval = String(value.timeInterval ?? '');
  form.viewableAdvertisement = String(value.viewableAdvertisement ?? '');
}

async function loadData() {
  loading.value = true;
  try {
    const result = await querySysUserAdvertisingConfigDTO('HALAR');
    normalizeConfig(result);
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    await updateSysUserAdvertisingConfigDTO({
      advertisingSwitch: form.advertisingSwitch,
      gold: String(form.gold || '').trim(),
      sysOrigin: 'HALAR',
      timeInterval: String(form.timeInterval || '').trim(),
      viewableAdvertisement: String(form.viewableAdvertisement || '').trim(),
    });
    message.success('操作成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}

function handleSubmit() {
  Modal.confirm({
    async onOk() {
      await submitForm();
    },
    title: '是否确定修改配置值？',
  });
}

void loadData();
</script>

<template>
  <Page title="用户观看广告配置">
    <Card :loading="loading">
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="HALAR" tab="Aswat" />
      </Tabs>

      <div v-if="activeTab === 'HALAR'" class="config-form">
        <div class="field">
          <div class="label">一个用户最多可查看广告</div>
          <div class="inline-control">
            <Input v-model:value="form.viewableAdvertisement" />
            <span class="suffix">条/天</span>
          </div>
        </div>

        <div class="field">
          <div class="label">间隔多少s（秒）可以查看下一个</div>
          <div class="inline-control">
            <Input v-model:value="form.timeInterval" />
            <span class="suffix">秒</span>
          </div>
        </div>

        <div class="field">
          <div class="label">查看一次得到金币</div>
          <div class="inline-control">
            <Input v-model:value="form.gold" />
          </div>
        </div>

        <div class="field">
          <div class="label">广告开关</div>
          <Switch
            v-model:checked="form.advertisingSwitch"
            checked-children="已结束"
            un-checked-children="运行中"
          />
        </div>

        <div class="actions">
          <Button :loading="saving" type="primary" @click="handleSubmit">
            修改
          </Button>
        </div>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.config-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.inline-control {
  align-items: center;
  display: flex;
  gap: 10px;
  max-width: 360px;
}

.suffix {
  color: #7f1d1d;
  flex-shrink: 0;
}

.actions {
  margin-top: 8px;
}
</style>
