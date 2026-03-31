<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { useRouter } from 'vue-router';

import { flowMember } from '#/api/legacy/room';

import { Button, Card, Drawer, Empty, Space, Tag } from 'antdv-next';

import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';

const props = defineProps<{
  open: boolean;
  sessionId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const loading = ref(false);
const finished = ref(false);
const members = ref<Array<Record<string, any>>>([]);
const accountHandleOpen = ref(false);
const activeUserId = ref<number | string>('');

const query = reactive({
  lastId: '',
  sessionId: '',
});

watch(
  () => ({ open: props.open, sessionId: props.sessionId }),
  async ({ open, sessionId }) => {
    if (!open || !sessionId) {
      return;
    }
    members.value = [];
    finished.value = false;
    query.lastId = '';
    query.sessionId = String(sessionId);
    await loadData();
  },
  { immediate: true },
);

async function loadData() {
  if (!query.sessionId) {
    return;
  }
  loading.value = true;
  try {
    const result = (await flowMember({ ...query })) || [];
    if (result.length === 0) {
      finished.value = true;
      return;
    }
    members.value = [...members.value, ...result];
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  if (finished.value || members.value.length === 0) {
    return;
  }
  const last = members.value[members.value.length - 1];
  if (!last?.timingId) {
    finished.value = true;
    return;
  }
  query.lastId = String(last.timingId);
  void loadData();
}

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openAccountHandle(userId?: number | string) {
  if (!userId) {
    return;
  }
  activeUserId.value = userId;
  accountHandleOpen.value = true;
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="成员信息"
    width="480px"
    @close="emit('close')"
  >
    <div class="member-stack">
      <Card
        v-for="item in members"
        :key="item.timingId || item.userId"
        size="small"
      >
        <div class="member-card">
          <button class="member-main" type="button" @click="openUserDetails(item.userId)">
            <img
              :src="item.userAvatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
              alt=""
              class="member-avatar"
            >
            <div class="member-copy">
              <div class="member-name">{{ item.userNickname || item.userId || '-' }}</div>
              <Space size="small" wrap>
                <Tag v-if="item.genderName">{{ item.genderName }}</Tag>
                <Tag v-if="item.countryName">{{ item.countryName }}</Tag>
              </Space>
            </div>
          </button>
          <Button type="link" @click="openAccountHandle(item.userId)">账号处理</Button>
        </div>
      </Card>

      <Empty v-if="!loading && members.length === 0" description="暂无在线成员" />

      <div class="footer">
        <Button
          :loading="loading"
          :disabled="finished"
          @click="loadMore"
        >
          {{ finished ? '已加载全部' : '点击加载更多' }}
        </Button>
      </div>
    </div>

    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeUserId"
      @close="accountHandleOpen = false"
      @success="accountHandleOpen = false"
    />
  </Drawer>
</template>

<style scoped>
.member-stack {
  display: grid;
  gap: 12px;
}

.member-card {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.member-main {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: flex;
  gap: 12px;
  min-width: 0;
  padding: 0;
  text-align: left;
}

.member-avatar {
  border-radius: 999px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.member-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.member-name {
  font-weight: 600;
  word-break: break-all;
}

.footer {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
</style>
