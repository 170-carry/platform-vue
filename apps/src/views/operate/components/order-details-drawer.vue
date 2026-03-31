<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { getInAppPurchase } from '#/api/legacy/operate';
import { formatDate } from '#/views/system/shared';

import {
  Descriptions,
  DescriptionsItem,
  Drawer,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import { ORDER_STATUS_TAG_MAP } from '../constants';
import UserProfileLink from './user-profile-link.vue';

const props = defineProps<{
  open: boolean;
  orderId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const record = ref<Record<string, any> | null>(null);

const metadataList = computed(() => {
  const metadata = record.value?.details?.metadata || {};
  return Object.keys(metadata).map((key) => ({
    key,
    value: metadata[key],
  }));
});

watch(
  () => [props.open, props.orderId],
  async ([open, orderId]) => {
    if (!open || !orderId) {
      return;
    }
    loading.value = true;
    try {
      record.value = await getInAppPurchase(orderId as number | string);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="详情"
    width="960"
    @close="emit('close')"
  >
    <div v-if="!record?.details && !loading">没有更多信息</div>

    <Space
      v-else
      direction="vertical"
      size="large"
      style="display: flex"
    >
      <Descriptions bordered size="small" title="用户信息">
        <DescriptionsItem label="接收用户" :span="3">
          <UserProfileLink :profile="record?.acceptUserProfile" />
        </DescriptionsItem>
        <DescriptionsItem v-if="record?.createUserProfile" label="创建用户" :span="3">
          <UserProfileLink :profile="record?.createUserProfile" />
        </DescriptionsItem>
        <DescriptionsItem v-else-if="record?.createNickname" label="创建用户" :span="3">
          {{ record?.createNickname || '-' }}
        </DescriptionsItem>
      </Descriptions>

      <Descriptions bordered size="small" title="订单信息">
        <DescriptionsItem label="环境">
          <Tag :color="record?.details?.env === 'PROD' ? 'success' : 'warning'">
            {{ record?.details?.env || '-' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="类型">
          {{ record?.details?.receiptType === 'PAYMENT' ? '付款' : '收款' }}
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <Tag :color="ORDER_STATUS_TAG_MAP[record?.details?.status || '']?.tagType || 'default'">
            {{ ORDER_STATUS_TAG_MAP[record?.details?.status || '']?.label || record?.details?.status || '-' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="ID">{{ record?.details?.id || '-' }}</DescriptionsItem>
        <DescriptionsItem label="跟踪ID">{{ record?.details?.trackId || '-' }}</DescriptionsItem>
        <DescriptionsItem label="订阅ID">{{ record?.details?.subscribeId || '-' }}</DescriptionsItem>
        <DescriptionsItem label="订单ID" :span="2">{{ record?.details?.orderId || '-' }}</DescriptionsItem>
        <DescriptionsItem label="系统">{{ record?.details?.sysOrigin || '-' }}</DescriptionsItem>
        <DescriptionsItem label="平台">{{ record?.details?.factory?.platform || '-' }}</DescriptionsItem>
        <DescriptionsItem label="渠道">{{ record?.details?.factory?.factoryCode || '-' }}</DescriptionsItem>
        <DescriptionsItem label="国家编号">{{ record?.details?.countryCode || '-' }}</DescriptionsItem>
        <DescriptionsItem label="货币">{{ record?.details?.currency || '-' }}</DescriptionsItem>
        <DescriptionsItem label="金额">
          {{ record?.details?.amount || '-' }} {{ record?.details?.currency || '' }}
        </DescriptionsItem>
        <DescriptionsItem label="美元">{{ record?.details?.amountUsd || '-' }} USD</DescriptionsItem>
        <DescriptionsItem label="免费试用">
          {{ record?.details?.trialPeriod === true ? 'Yes' : 'No' }}
        </DescriptionsItem>
        <DescriptionsItem label="原因">{{ record?.details?.reason || '-' }}</DescriptionsItem>
        <DescriptionsItem label="购买时间">{{ formatDate(record?.details?.purchaseDateMs) }}</DescriptionsItem>
        <DescriptionsItem label="创建时间">{{ formatDate(record?.details?.createTime) }}</DescriptionsItem>
        <DescriptionsItem label="修改时间">{{ formatDate(record?.details?.updateTime) }}</DescriptionsItem>
        <DescriptionsItem label="锁版本">{{ record?.details?.version || '-' }}</DescriptionsItem>
      </Descriptions>

      <Descriptions
        v-if="record?.details?.products?.length"
        bordered
        size="small"
        title="商品信息"
      >
        <DescriptionsItem
          v-for="item in record?.details?.products || []"
          :key="item.id"
          :label="item.name || item.code || item.id"
          :span="3"
        >
          <div>ID: {{ item.id || '-' }}</div>
          <div>编号: {{ item.code || '-' }}</div>
          <div>内容: {{ item.content || '-' }}</div>
          <div>金额: {{ item.amountUsd || '-' }} USD</div>
          <div>数量: {{ item.quantity || '-' }}</div>
          <div>描述: {{ item.describe || '-' }}</div>
        </DescriptionsItem>
      </Descriptions>

      <Table
        v-if="metadataList.length > 0"
        :columns="[
          { dataIndex: 'key', key: 'key', title: '字段' },
          { dataIndex: 'value', key: 'value', title: '值' },
        ]"
        :data-source="metadataList"
        :pagination="false"
        row-key="key"
      />

      <div v-if="record?.details?.payNotices?.length" class="notice-list">
        <div class="section-title">事件通知</div>
        <div
          v-for="(item, index) in record?.details?.payNotices || []"
          :key="`${item.eventId || index}`"
          class="notice-item"
        >
          <div>事件ID: {{ item.eventId || '-' }}</div>
          <div>事件类型: {{ item.noticeType || '-' }}</div>
          <div>创建时间: {{ formatDate(item.createTime) }}</div>
          <pre>{{ JSON.stringify(item.noticeData || {}, null, 2) }}</pre>
        </div>
      </div>
    </Space>
  </Drawer>
</template>

<style scoped>
.notice-list {
  display: grid;
  gap: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
}

.notice-item {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
}

.notice-item pre {
  background: #111827;
  border-radius: 8px;
  color: #e5e7eb;
  margin-top: 8px;
  overflow: auto;
  padding: 12px;
}
</style>
