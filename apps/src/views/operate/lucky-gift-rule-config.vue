<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  addLuckyGiftRuleConfig,
  getLuckyGiftRuleConfig,
  } from '#/api/legacy/game-lucky-gift';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Space,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateLuckyGiftRuleConfig' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const saving = ref(false);

const query = reactive({
  sysOrigin: '',
});

const form = reactive({
  bigWinEnd: '',
  bigWinStart: '',
  giftShareRatio: '',
  id: '',
  superEnd: '',
  superStart: '',
  sysOrigin: '',
  winEnd: '',
  winStart: '',
});

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData();
  },
  { immediate: true },
);

async function loadData() {
  loading.value = true;
  try {
    const result = await getLuckyGiftRuleConfig({ ...query });
    Object.assign(form, {
      ...form,
      ...(result || {}),
      sysOrigin: query.sysOrigin,
    });
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  if (
    !String(form.winStart).trim() ||
    !String(form.winEnd).trim() ||
    !String(form.bigWinStart).trim() ||
    !String(form.bigWinEnd).trim() ||
    !String(form.superStart).trim() ||
    !String(form.superEnd).trim()
  ) {
    message.warning('请补全区间配置');
    return;
  }
  saving.value = true;
  try {
    await addLuckyGiftRuleConfig({
      ...form,
      sysOrigin: query.sysOrigin,
    });
    message.success('保存成功');
    await loadData();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Page title="幸运礼物规则配置">
    <Card :loading="loading">
      <div class="toolbar">
        <Space>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Button :loading="saving" type="primary" @click="handleSave">保存</Button>
        </Space>
      </div>

      <Form layout="vertical">
        <div class="grid-three">
          <FormItem label="Win图标(含)">
            <Input v-model:value="form.winStart" />
          </FormItem>
          <FormItem label="Win图标(止)">
            <Input v-model:value="form.winEnd" />
          </FormItem>
          <FormItem label="备注">
            <span class="helper">命中区间时展示 Win 图标</span>
          </FormItem>
          <FormItem label="BigWin图标(含)">
            <Input v-model:value="form.bigWinStart" />
          </FormItem>
          <FormItem label="BigWin图标(止)">
            <Input v-model:value="form.bigWinEnd" />
          </FormItem>
          <FormItem label="备注">
            <span class="helper">命中区间时展示 BigWin 图标</span>
          </FormItem>
          <FormItem label="SuperWin图标(含)">
            <Input v-model:value="form.superStart" />
          </FormItem>
          <FormItem label="SuperWin图标(止)">
            <Input v-model:value="form.superEnd" />
          </FormItem>
          <FormItem label="备注">
            <span class="helper">命中区间时展示 SuperWin 图标</span>
          </FormItem>
        </div>
      </Form>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.grid-three {
  column-gap: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.helper {
  color: #64748b;
  line-height: 32px;
}
</style>
