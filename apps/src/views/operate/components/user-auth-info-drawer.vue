<script lang="ts" setup>
import { ref, watch } from 'vue';

import { getUserRegisterInfo } from '#/api/legacy/approval';
import { getUserIdentity, getUserVipEquity } from '#/api/legacy/user';
import { formatDate } from '#/views/system/shared';

import {
  Col,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  Row,
  Spin,
  Tag,
} from 'antdv-next';

defineOptions({ name: 'OperateUserAuthInfoDrawer' });

const props = defineProps<{
  open: boolean;
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const vipEquity = ref<Record<string, any>>({});
const identity = ref<Record<string, any>>({});
const registerInfo = ref<Record<string, any>>({});

watch(
  () => (props.open ? props.userId : ''),
  async (userId) => {
    if (!userId) {
      return;
    }
    loading.value = true;
    try {
      const [vip, idInfo, register] = await Promise.all([
        getUserVipEquity(userId),
        getUserIdentity(userId),
        getUserRegisterInfo(userId),
      ]);
      vipEquity.value = vip || {};
      identity.value = idInfo || {};
      registerInfo.value = register || {};
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function buildIdentityTags() {
  const target = identity.value || {};
  const pairs = [
    ['主播', target.anchor],
    ['主播代理', target.agent],
    ['货运代理', target.freightAgent],
    ['BD', target.bd],
    ['BD Leader', target.bdLeader],
  ];
  return pairs.filter(([, enabled]) => Boolean(enabled));
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="认证信息"
    width="760"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <Row :gutter="[16, 16]">
        <Col :span="24">
          <Descriptions bordered size="small" title="注册信息">
            <DescriptionsItem label="注册时间">
              {{ formatDate(registerInfo.createTime || registerInfo.registerTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="注册来源">
              {{ registerInfo.authType || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="来源平台">
              {{ registerInfo.originPlatform || registerInfo.platform || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="设备号">
              {{ registerInfo.deviceNo || registerInfo.imei || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="注册IP">
              {{ registerInfo.registerIp || registerInfo.ip || '-' }}
            </DescriptionsItem>
          </Descriptions>
        </Col>

        <Col :span="24">
          <Descriptions bordered size="small" title="VIP权益">
            <DescriptionsItem label="会员名">
              {{ vipEquity.vipName || vipEquity.name || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="到期时间">
              {{ formatDate(vipEquity.expiredTime || vipEquity.invalidTime) }}
            </DescriptionsItem>
            <DescriptionsItem label="权益描述" :span="2">
              {{ vipEquity.equityDesc || vipEquity.description || '-' }}
            </DescriptionsItem>
          </Descriptions>
        </Col>

        <Col :span="24">
          <Descriptions bordered size="small" title="身份信息">
            <DescriptionsItem label="当前身份" :span="2">
              <div v-if="buildIdentityTags().length > 0" class="tag-row">
                <Tag v-for="[label] in buildIdentityTags()" :key="label">
                  {{ label }}
                </Tag>
              </div>
              <Empty v-else description="暂无身份信息" />
            </DescriptionsItem>
            <DescriptionsItem label="历史身份" :span="2">
              {{
                Array.isArray(identity.historyIdentity)
                  ? identity.historyIdentity.join('，')
                  : '-'
              }}
            </DescriptionsItem>
          </Descriptions>
        </Col>
      </Row>
    </Spin>
  </Drawer>
</template>

<style scoped>
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
