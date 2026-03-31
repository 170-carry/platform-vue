<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  deleteTeamNoticeById,
  listTeamNoticeByTeamId,
} from '#/api/legacy/team';

import {
  Button,
  Card,
  Drawer,
  Empty,
  Image,
  Modal,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  teamId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);

watch(
  () => props.open,
  (open) => {
    if (open) {
      void loadData();
    }
  },
  { immediate: true },
);

async function loadData() {
  if (!props.teamId) {
    return;
  }
  loading.value = true;
  try {
    list.value = await listTeamNoticeByTeamId(props.teamId);
  } finally {
    loading.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteTeamNoticeById(record.id);
      list.value = list.value.filter((item) => item.id !== record.id);
      message.success('删除成功');
    },
  });
}
</script>

<template>
  <Drawer
    :open="open"
    title="团队通知记录"
    width="760px"
    @close="emit('close')"
  >
    <div class="notice-list">
      <Empty v-if="!loading && list.length === 0" description="暂无通知记录" />
      <Card
        v-for="item in list"
        :key="item.id"
        class="notice-card"
        size="small"
      >
        <div class="notice-title">{{ item.title || '-' }}</div>
        <div class="notice-content">
          {{ item.content || '-' }}
        </div>
        <Image
          v-if="item.cover"
          :src="item.cover"
          class="notice-image"
        />
        <div class="notice-footer">
          <span>
            发送人: {{ item.createUser?.nickname || '-' }} / {{ item.createTime || '-' }}
          </span>
          <Button danger size="small" type="link" @click="handleDelete(item)">
            删除
          </Button>
        </div>
      </Card>
    </div>
  </Drawer>
</template>

<style scoped>
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-card {
  border-radius: 12px;
}

.notice-title {
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 8px;
}

.notice-content {
  color: #334155;
  line-height: 1.7;
  white-space: pre-wrap;
}

.notice-image {
  margin-top: 12px;
  max-width: 240px;
}

.notice-footer {
  color: #64748b;
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
</style>
