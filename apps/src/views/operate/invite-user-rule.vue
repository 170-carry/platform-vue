<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  querySysInviteUserConfig,
  updateSysInviteUserConfig,
} from '#/api/legacy/system';

import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  TabPane,
  Tabs,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateInviteUserRule' });

const activeTab = ref('LOTFUN');
const loading = ref(false);
const saving = ref(false);
const form = reactive({
  days: '',
  proportion: '',
  sysOrigin: 'LOTFUN',
});

function normalizeConfig(result: Record<string, any> | null | undefined) {
  const value = result?.result ?? result ?? {};
  form.days = String(value.days ?? '');
  form.proportion = String(value.proportion ?? '');
  form.sysOrigin = String(value.sysOrigin || 'LOTFUN');
}

async function loadData() {
  loading.value = true;
  try {
    const result = await querySysInviteUserConfig('LOTFUN');
    normalizeConfig(result);
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  saving.value = true;
  try {
    await updateSysInviteUserConfig({
      days: String(form.days || '').trim(),
      proportion: String(form.proportion || '').trim(),
      sysOrigin: 'LOTFUN',
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
  <Page title="邀请用户配置">
    <Card :loading="loading">
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="LOTFUN" tab="Lotfun" />
      </Tabs>

      <div v-if="activeTab === 'LOTFUN'" class="config-form">
        <Alert
          :closable="false"
          message="超过邀请时间配置天数，则不发佣金"
          type="info"
        />
        <div class="field">
          <div class="label">有效天数</div>
          <Input v-model:value="form.days" type="number" />
        </div>

        <Alert
          :closable="false"
          message="赚取的佣金比例(单位:%)"
          type="info"
        />
        <div class="field">
          <div class="label">比例</div>
          <Input v-model:value="form.proportion" type="number" />
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
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 280px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.actions {
  margin-top: 8px;
}
</style>
