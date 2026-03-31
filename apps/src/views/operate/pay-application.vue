<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { listPayApplication } from '#/api/legacy/pay';
import { copyText } from '#/views/operate/shared';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Empty,
  Tabs,
  TabPane,
  Tag,
  message,
} from 'antdv-next';

import PayApplicationEditModal from './components/pay-application-edit-modal.vue';
import PayCommodityPanel from './components/pay-commodity-panel.vue';

defineOptions({ name: 'OperatePayApplication' });

const loading = ref(false);
const submitLoading = ref(false);
const activeTab = ref('commodity');
const appEditOpen = ref(false);
const appList = ref<Array<Record<string, any>>>([]);
const selectedApp = ref<Record<string, any>>({});
const activeRow = ref<Record<string, any>>({});

async function loadData() {
  loading.value = true;
  try {
    appList.value = (await listPayApplication()) || [];
  } finally {
    loading.value = false;
  }
}

function openApplication(record: Record<string, any>) {
  selectedApp.value = record;
  activeTab.value = 'commodity';
}

function handleCreate() {
  activeRow.value = {};
  appEditOpen.value = true;
}

function handleEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  appEditOpen.value = true;
}

async function handleCopyLink(record: Record<string, any>) {
  try {
    await copyText(`https://web.sugartimeapp.com/#/recharge/${record.id}`);
    message.success('支付链接已复制');
  } catch {
    message.error('复制失败');
  }
}

function handleBack() {
  selectedApp.value = {};
}

loadData();
</script>

<template>
  <Page title="应用管理">
    <div v-if="!selectedApp.id" class="stack">
      <Card
        :loading="loading"
        title="应用列表"
      >
        <div class="app-grid">
          <div
            v-for="item in appList"
            :key="item.id"
            class="app-card"
            @click="openApplication(item)"
          >
            <div class="app-head">
              <div class="app-badge">{{ item.appCode || '-' }}</div>
              <div class="app-name">{{ item.appName || '-' }}</div>
            </div>
            <div class="app-meta">
              <div>ID：{{ item.id || '-' }}</div>
              <div>Android：{{ item.androidLink || '-' }}</div>
              <div>iOS：{{ item.iosLink || '-' }}</div>
            </div>
            <div class="app-foot">
              <span>创建时间：{{ formatDate(item.createTime) }}</span>
            </div>
            <div class="app-actions">
              <Button size="small" type="link" @click.stop="handleCopyLink(item)">
                支付链接
              </Button>
              <Button size="small" type="link" @click.stop="handleEdit(item)">
                编辑
              </Button>
            </div>
          </div>

          <button class="create-card" type="button" @click="handleCreate">
            <span class="create-plus">+</span>
            <span>创建新的应用</span>
          </button>
        </div>

        <Empty v-if="!loading && appList.length === 0" description="暂无应用数据" />
      </Card>
    </div>

    <div v-else class="stack">
      <Card>
        <div class="detail-head">
          <div class="detail-title">
            <Button type="default" @click="handleBack">返回</Button>
            <div class="title-text">
              <strong>{{ selectedApp.appName || '-' }}</strong>
              <Tag color="blue">{{ selectedApp.appCode || '-' }}</Tag>
            </div>
          </div>
          <div class="detail-actions">
            <Button type="link" @click="handleCopyLink(selectedApp)">复制支付链接</Button>
            <Button type="link" @click="handleEdit(selectedApp)">编辑应用</Button>
          </div>
        </div>
      </Card>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="commodity" tab="商品管理" />
        <TabPane key="commodityV2" tab="商品管理V2" />
      </Tabs>

      <PayCommodityPanel
        v-if="activeTab === 'commodity'"
        :app-info="{ appList, appSelect: selectedApp }"
        mode="country"
      />

      <PayCommodityPanel
        v-else
        :app-info="{ appList, appSelect: selectedApp }"
        mode="region"
      />
    </div>

    <PayApplicationEditModal
      v-model:loading="submitLoading"
      :open="appEditOpen"
      :row="activeRow"
      @close="appEditOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 16px;
}

.app-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.app-card,
.create-card {
  background: linear-gradient(180deg, rgb(255 255 255), rgb(248 250 252));
  border: 1px solid rgb(226 232 240);
  border-radius: 18px;
  cursor: pointer;
  min-height: 220px;
  padding: 18px;
  text-align: left;
}

.app-card:hover,
.create-card:hover {
  border-color: var(--ant-color-primary);
  box-shadow: 0 12px 32px rgb(15 23 42 / 8%);
}

.app-head {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.app-badge {
  background: var(--ant-color-primary-bg);
  border-radius: 999px;
  color: var(--ant-color-primary);
  font-size: 12px;
  padding: 6px 10px;
}

.app-name {
  font-size: 18px;
  font-weight: 600;
}

.app-meta {
  color: rgb(71 85 105);
  display: grid;
  gap: 8px;
  word-break: break-all;
}

.app-foot {
  color: rgb(100 116 139);
  margin-top: 18px;
}

.app-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}

.create-card {
  align-items: center;
  border-style: dashed;
  color: var(--ant-color-primary);
  display: flex;
  flex-direction: column;
  font-size: 18px;
  font-weight: 600;
  gap: 12px;
  justify-content: center;
}

.create-plus {
  font-size: 40px;
  line-height: 1;
}

.detail-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
}

.detail-title {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.title-text {
  align-items: center;
  display: flex;
  gap: 10px;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
