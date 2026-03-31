<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { getRoomProfileDetailsByRoomId } from '#/api/legacy/app-system';
import { formatDate } from '#/views/system/shared';

import {
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Image,
  Row,
  Space,
  Spin,
  Tag,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  roomId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const roomDetails = ref<Record<string, any>>({});
const userProfile = ref<Record<string, any>>({});

const roomStatus = computed(() => {
  switch (String(roomDetails.value.event || '')) {
    case 'AVAILABLE': {
      return { color: 'success', text: '正常' };
    }
    case 'ID_CHANGE': {
      return { color: 'processing', text: 'ID变更' };
    }
    case 'WAITING_CONFIRMED': {
      return { color: 'warning', text: '等待确认' };
    }
    case 'CLOSE': {
      return { color: 'error', text: '关闭' };
    }
    default: {
      return { color: 'default', text: '未知' };
    }
  }
});

const accountText = computed(() => {
  const account = userProfile.value.account;
  const special = userProfile.value.ownSpecialId?.account;
  if (account && special) {
    return `${account} / ${special}靓`;
  }
  return account || '-';
});

watch(
  () => ({ open: props.open, roomId: props.roomId }),
  async ({ open, roomId }) => {
    if (!open || !roomId) {
      return;
    }
    loading.value = true;
    try {
      const result = await getRoomProfileDetailsByRoomId(roomId);
      roomDetails.value = result.profile || {};
      userProfile.value = result.userProfile || {};
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
    title="房间资料详情"
    width="880"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <Card :bordered="false" class="hero-card">
        <div class="hero-head">
          <Image
            :preview="false"
            :src="roomDetails.roomCover || 'https://dummyimage.com/120x120/e2e8f0/64748b&text=Room'"
            class="hero-cover"
          />
          <div class="hero-copy">
            <h2>{{ roomDetails.roomName || `房间 ${roomId}` }}</h2>
            <Space wrap>
              <Tag>ID {{ roomDetails.id || roomId }}</Tag>
              <Tag>{{ roomStatus.text }}</Tag>
              <Tag v-if="roomDetails.countryName">{{ roomDetails.countryName }}</Tag>
              <Tag v-if="userProfile.userNickname">{{ userProfile.userNickname }}</Tag>
            </Space>
          </div>
        </div>
      </Card>

      <Row :gutter="[16, 16]">
        <Col :md="12" :xs="24">
          <Card :bordered="false" title="基本资料">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="房间ID">
                {{ roomDetails.id || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="账号">
                {{ accountText }}
              </DescriptionsItem>
              <DescriptionsItem label="用户ID">
                {{ roomDetails.userId || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="国家/地区">
                {{ roomDetails.countryName || roomDetails.countryCode || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="状态">
                {{ roomStatus.text }}
              </DescriptionsItem>
              <DescriptionsItem label="注销">
                {{ roomDetails.del ? 'Yes' : 'NO' }}
              </DescriptionsItem>
              <DescriptionsItem label="平台">
                {{ userProfile.sysOriginChild || userProfile.originSys || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="公告">
                {{ roomDetails.roomDesc || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="创建时间">
                {{ formatDate(roomDetails.createTime) }}
              </DescriptionsItem>
              <DescriptionsItem label="修改时间">
                {{ formatDate(roomDetails.updateTime) }}
              </DescriptionsItem>
            </Descriptions>
          </Card>
        </Col>

        <Col :md="12" :xs="24">
          <Card :bordered="false" title="设置信息">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="房间密码">
                {{ roomDetails.setting?.password || '无' }}
              </DescriptionsItem>
              <DescriptionsItem label="加入成员金币">
                {{ roomDetails.setting?.joinGolds || 0 }}
              </DescriptionsItem>
              <DescriptionsItem label="成员人数">
                {{ roomDetails.counter?.memberCount || 0 }} / {{ roomDetails.setting?.maxMember || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="管理员人数">
                {{ roomDetails.counter?.adminCount || 0 }} / {{ roomDetails.setting?.maxAdmin || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="麦克风权限">
                {{ roomDetails.setting?.takeMicRole || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="麦克风数量">
                {{ roomDetails.setting?.mikeSize || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="游客上麦">
                {{ roomDetails.setting?.touristMike ? '允许' : '不允许' }}
              </DescriptionsItem>
              <DescriptionsItem label="游客发消息">
                {{ roomDetails.setting?.touristMsg ? '允许' : '不允许' }}
              </DescriptionsItem>
              <DescriptionsItem label="播放音乐">
                {{ roomDetails.setting?.allowMusic ? '允许' : '不允许' }}
              </DescriptionsItem>
              <DescriptionsItem label="管理员锁麦克风">
                {{ roomDetails.setting?.adminLockSeat ? '允许' : '不允许' }}
              </DescriptionsItem>
              <DescriptionsItem label="显示心动值">
                {{ roomDetails.setting?.showHeartbeat ? '允许' : '不允许' }}
              </DescriptionsItem>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Spin>
  </Drawer>
</template>

<style scoped>
.hero-card {
  margin-bottom: 16px;
}

.hero-head {
  align-items: center;
  display: flex;
  gap: 16px;
}

.hero-cover {
  border-radius: 20px;
  height: 120px;
  object-fit: cover;
  overflow: hidden;
  width: 120px;
}

.hero-copy h2 {
  margin: 0 0 12px;
}

@media (max-width: 768px) {
  .hero-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
