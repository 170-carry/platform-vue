<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  getUserAccountStatus,
  getUserBaseInfo,
  getUserPhotoWallAll,
  getUserRegisterInfo,
} from '#/api/legacy/approval';

import {
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Empty,
  Image,
  Row,
  Space,
  Spin,
  Tag,
} from 'antdv-next';

defineOptions({ name: 'LegacyUserDetails' });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const baseInfo = ref<Record<string, any>>({});
const registerInfo = ref<Record<string, any>>({});
const accountStatus = ref<Record<string, any>>({});
const photoWall = ref<string[]>([]);

const userId = computed(() => String(route.params.id ?? ''));

const profileTags = computed(() => {
  const tags = [];
  if (baseInfo.value?.userSexName) {
    tags.push(baseInfo.value.userSexName);
  }
  if (baseInfo.value?.age) {
    tags.push(`${baseInfo.value.age}岁`);
  }
  if (accountStatus.value?.value || accountStatus.value?.name) {
    tags.push(accountStatus.value.value || accountStatus.value.name);
  }
  return tags;
});

watch(
  userId,
  async (id) => {
    if (!id) {
      return;
    }
    loading.value = true;
    try {
      const [base, register, status, photos] = await Promise.all([
        getUserBaseInfo(id),
        getUserRegisterInfo(id),
        getUserAccountStatus(id),
        getUserPhotoWallAll(id),
      ]);
      baseInfo.value = base || {};
      registerInfo.value = register || {};
      accountStatus.value = status || {};
      photoWall.value = (Array.isArray(photos) ? photos : [])
        .map((item: any) =>
          typeof item === 'string' ? item : item?.resourceUrl || item?.url || '',
        )
        .filter(Boolean);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="用户详情">
    <Spin :spinning="loading">
      <Card :bordered="false" class="hero-card mb-4">
        <div class="hero-head">
          <div class="hero-copy">
            <h2>{{ baseInfo.userNickname || `用户 ${userId}` }}</h2>
            <div class="hero-meta">
              <span>ID {{ userId }}</span>
              <span v-if="baseInfo.actualAccount">
                账号 {{ baseInfo.actualAccount }}
              </span>
              <span v-if="baseInfo.countryName">
                {{ baseInfo.countryName }}
              </span>
            </div>
            <Space wrap>
              <Tag v-for="item in profileTags" :key="item">{{ item }}</Tag>
            </Space>
          </div>

          <Space>
            <Button @click="router.back()">返回</Button>
            <Button type="primary" @click="router.push('/workspace')">
              返回数据平台
            </Button>
          </Space>
        </div>
      </Card>

      <Row :gutter="[16, 16]">
        <Col :md="16" :xs="24">
          <Card :bordered="false" class="mb-4" title="基础信息">
            <Descriptions :column="2" bordered size="middle">
              <DescriptionsItem label="用户ID">
                {{ userId || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="用户昵称">
                {{ baseInfo.userNickname || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="用户账号">
                {{ baseInfo.actualAccount || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="当前状态">
                {{ accountStatus.value || accountStatus.name || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="性别">
                {{ baseInfo.userSexName || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="年龄">
                {{ baseInfo.age || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="国家/地区">
                {{ baseInfo.countryName || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="注册时间">
                {{ registerInfo.createTime || registerInfo.registerTime || '-' }}
              </DescriptionsItem>
            </Descriptions>
          </Card>

          <Card :bordered="false" title="照片墙">
            <div v-if="photoWall.length" class="photo-grid">
              <div v-for="item in photoWall" :key="item" class="photo-item">
                <Image :src="item" class="photo-image" />
              </div>
            </div>
            <Empty v-else description="暂无照片墙" />
          </Card>
        </Col>

        <Col :md="8" :xs="24">
          <Card :bordered="false" class="mb-4" title="注册信息">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="注册来源">
                {{ registerInfo.registerOrigin || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="注册平台">
                {{ registerInfo.platform || registerInfo.originPlatform || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="设备号">
                {{ registerInfo.deviceNo || registerInfo.imei || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="IP">
                {{ registerInfo.registerIp || registerInfo.ip || '-' }}
              </DescriptionsItem>
            </Descriptions>
          </Card>

          <Card :bordered="false" title="补充信息">
            <Descriptions :column="1" bordered size="small">
              <DescriptionsItem label="签名">
                {{ baseInfo.profileDesc || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="邮箱">
                {{ baseInfo.email || '-' }}
              </DescriptionsItem>
              <DescriptionsItem label="手机号">
                {{ baseInfo.mobile || baseInfo.phone || '-' }}
              </DescriptionsItem>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </Spin>
  </Page>
</template>

<style scoped>
.hero-card {
  margin-bottom: 16px;
}

.hero-head {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.hero-copy h2 {
  margin: 0 0 8px;
}

.hero-meta {
  color: rgb(100 116 139);
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.photo-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
}

.photo-item {
  overflow: hidden;
}

.photo-image {
  border-radius: 12px;
  height: 140px;
  object-fit: cover;
  width: 100%;
}

@media (max-width: 768px) {
  .hero-head {
    flex-direction: column;
  }
}
</style>
