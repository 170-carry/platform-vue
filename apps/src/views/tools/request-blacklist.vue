<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  addBlackListIP,
  addBlackListPhoneModel,
  delBlackList,
  requestBlackList,
} from '#/api/legacy/tools';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Space,
  Spin,
  message,
} from 'antdv-next';

defineOptions({ name: 'ToolsRequestBlacklist' });

const loading = ref(false);
const modalOpen = ref(false);
const submitLoading = ref(false);
const createType = ref<'IP' | 'PHONE_MODEL'>('IP');
const list = ref<string[]>([]);
const form = reactive({
  value: '',
});

async function loadData() {
  loading.value = true;
  try {
    list.value = await requestBlackList();
  } finally {
    loading.value = false;
  }
}

function openCreate(type: 'IP' | 'PHONE_MODEL') {
  createType.value = type;
  form.value = '';
  modalOpen.value = true;
}

async function handleSubmit() {
  const value = form.value.trim();
  if (!value) {
    message.warning(createType.value === 'IP' ? '请输入 IP' : '请输入手机型号');
    return;
  }
  submitLoading.value = true;
  try {
    if (createType.value === 'IP') {
      await addBlackListIP(value);
    } else {
      await addBlackListPhoneModel(value);
    }
    message.success('添加成功');
    modalOpen.value = false;
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(content: string) {
  Modal.confirm({
    async onOk() {
      await delBlackList(content);
      message.success('删除成功');
      await loadData();
    },
    title: '确认删除吗？',
  });
}

loadData();
</script>

<template>
  <Page title="请求黑名单">
    <Card>
      <div class="toolbar">
        <Space>
          <Button type="primary" @click="openCreate('IP')">新增IP</Button>
          <Button @click="openCreate('PHONE_MODEL')">新增手机型号</Button>
        </Space>
      </div>

      <Spin :spinning="loading">
        <div class="list-grid">
          <div
            v-for="item in list"
            :key="item"
            class="list-item"
          >
            <span>{{ item }}</span>
            <Button danger size="small" type="link" @click="handleDelete(item)">
              删除
            </Button>
          </div>
        </div>
      </Spin>
    </Card>

    <Modal
      :open="modalOpen"
      :title="createType === 'IP' ? '新增IP' : '新增手机型号'"
      :confirm-loading="submitLoading"
      destroy-on-close
      @cancel="modalOpen = false"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem :label="createType === 'IP' ? 'IP' : '手机型号'">
          <Input
            v-model:value="form.value"
            :placeholder="
              createType === 'IP'
                ? '如: 127.0.0.1 或 127.0.0'
                : '请输入手机型号，最终系统保存为大写'
            "
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.list-grid {
  display: grid;
  gap: 10px;
}

.list-item {
  align-items: center;
  background: rgb(37 99 235 / 6%);
  border: 1px solid rgb(37 99 235 / 8%);
  border-radius: 12px;
  color: #475569;
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
}
</style>
