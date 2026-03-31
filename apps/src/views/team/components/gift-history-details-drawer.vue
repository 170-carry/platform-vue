<script lang="ts" setup>
import { ref } from 'vue';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Image,
  Space,
  Tag,
  Timeline,
  TimelineItem,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const roomDetailsOpen = ref(false);

async function copyText(text?: string) {
  const value = String(text || '');
  if (!value) {
    message.warning('暂无可复制内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success('复制成功');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.left = '-9999px';
    textarea.style.position = 'fixed';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    message.success('复制成功');
  }
}

function getRoomId() {
  return props.row?.originId || props.row?.roomProfile?.id || '';
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="详情"
    width="920"
    @close="emit('close')"
  >
    <div class="gift-history-content">
      <Card :bordered="false" title="发送人">
        <div class="user-row">
          <img
            :src="row.userProfile?.userAvatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
            alt=""
            class="user-avatar"
          >
          <div>
            <div class="user-name">
              {{ row.userProfile?.userNickname || '-' }}
              <Tag v-if="row.anchor === true" color="error">主播</Tag>
            </div>
            <div class="user-sub">
              {{ row.userProfile?.actualAccount || row.userProfile?.id || '-' }}
            </div>
          </div>
        </div>
      </Card>

      <Card v-if="row.roomProfile" :bordered="false" title="发送房间">
        <div class="room-row">
          <Image
            :preview="false"
            :src="row.roomProfile?.roomCover || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=R'"
            class="room-cover"
          />
          <div class="room-main">
            <div class="room-name-row">
              <Button type="link" @click="roomDetailsOpen = true">
                {{ row.roomProfile?.roomName || '-' }}
              </Button>
              <Tag v-if="row.roomProfile?.countryCode">
                {{ row.roomProfile?.countryCode }}
              </Tag>
            </div>
            <div class="user-sub">房间ID {{ getRoomId() || '-' }}</div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" title="信息快照">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="礼物ID">{{ row.giftId || '-' }}</DescriptionsItem>
          <DescriptionsItem label="礼物封面">
            <Image :src="row.giftCover" class="gift-cover" />
          </DescriptionsItem>
          <DescriptionsItem label="礼物货币">
            {{ row.giftValue?.currencyType || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="礼物类型">
            {{ row.giftValue?.giftType || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="礼物单价">
            {{ row.giftValue?.unitPrice || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="礼物价值">
            {{ row.giftValue?.giftValue || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="实际价值">
            {{ row.giftValue?.actualAmount || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="发送数量">
            {{ row.giftValue?.quantity || 0 }} 个
          </DescriptionsItem>
          <DescriptionsItem label="接收用户">
            {{ row.giftValue?.userSize || 0 }} 人
          </DescriptionsItem>
          <DescriptionsItem label="背包">
            {{ row.giftValue?.bag ? 'Yes' : 'No' }}
          </DescriptionsItem>
          <DescriptionsItem label="跟踪ID">{{ row.trackId || '-' }}</DescriptionsItem>
          <DescriptionsItem label="请求平台">
            {{ row.requestPlatform || '-' }}
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card :bordered="false" title="接收用户">
        <div class="accept-list">
          <div
            v-for="(item, index) in row.acceptUsers || []"
            :key="`${item.acceptUserId || index}`"
            class="accept-item"
          >
            <div class="user-row">
              <img
                :src="item.userProfile?.userAvatar || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
                alt=""
                class="user-avatar small"
              >
              <div>
                <div class="user-name">
                  {{ item.userProfile?.userNickname || '-' }}
                  <Tag v-if="item.anchor === true" color="error">主播</Tag>
                </div>
                <div class="user-sub">
                  {{ item.userProfile?.actualAccount || item.userProfile?.id || '-' }}
                </div>
              </div>
            </div>
            <Space wrap class="accept-tags">
              <Tag v-if="item.anchor === true">接收目标: {{ item.targetAmount }}</Tag>
              <Tag>接收金额: {{ item.acceptAmount }}</Tag>
              <Tag>
                接收概率:
                {{
                  ((item.acceptUserId !== row.userId
                    ? item.percentage
                    : item.selfPercentage) || 0) * 100
                }}%
              </Tag>
              <Tag v-if="item.region">
                区域(发-接): {{ item.region }}
                <span v-if="item.hasOwnProperty('regionEq')">
                  、{{ item.regionEq ? 'Yes' : 'No' }}
                </span>
              </Tag>
              <Tag v-if="item.hasOwnProperty('countTargetAmount')">
                统计状态: {{ item.countTargetAmount ? 'Yes' : 'No' }}
              </Tag>
              <Button size="small" type="link" @click="copyText(item.receiptId)">
                复制单据ID
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <Card :bordered="false" title="日志事件">
        <Timeline>
          <TimelineItem
            v-for="(item, index) in row.logs || []"
            :key="`${item.createTime || index}`"
          >
            <div class="timeline-time">{{ item.createTime || '-' }}</div>
            <div>{{ item.content || '-' }}</div>
          </TimelineItem>
        </Timeline>
      </Card>
    </div>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="getRoomId()"
      @close="roomDetailsOpen = false"
    />
  </Drawer>
</template>

<style scoped>
.gift-history-content {
  display: grid;
  gap: 16px;
}

.user-row,
.room-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.user-avatar {
  border-radius: 999px;
  height: 56px;
  object-fit: cover;
  width: 56px;
}

.user-avatar.small {
  height: 48px;
  width: 48px;
}

.user-name {
  align-items: center;
  display: flex;
  gap: 8px;
}

.user-sub {
  color: #64748b;
  margin-top: 4px;
}

.room-cover {
  border-radius: 999px;
  height: 56px;
  overflow: hidden;
  width: 56px;
}

.room-main {
  min-width: 0;
}

.room-name-row {
  align-items: center;
  display: flex;
  gap: 8px;
}

.gift-cover {
  height: 36px;
  width: 36px;
}

.accept-list {
  display: grid;
  gap: 12px;
}

.accept-item {
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 14px;
  padding: 12px;
}

.accept-tags {
  margin-top: 10px;
}

.timeline-time {
  color: #94a3b8;
  margin-bottom: 4px;
}
</style>
