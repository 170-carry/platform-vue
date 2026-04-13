<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { listApiOperationLog } from '#/api/legacy/tools';
import { API_REQUEST_LOGS, formatDate } from '#/views/system/shared';

import {
  Button,
  Drawer,
  Empty,
  Modal,
  Select,
  Space,
  Tag,
} from 'antdv-next';

defineOptions({ name: 'OperateRoomOperationLogDrawer' });

const props = defineProps<{
  open: boolean;
  roomId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const detailsOpen = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const jsonText = ref('');
const apiRequestLogOptions = API_REQUEST_LOGS.map((item) => ({
  label: item.label,
  value: item.value as any,
}));

const query = reactive({
  businessCode: '',
  businessContent: '',
});

watch(
  () => [props.open, props.roomId],
  ([open, roomId]) => {
    if (!open || !roomId) {
      return;
    }
    query.businessCode = '';
    query.businessContent = String(roomId);
    void loadData();
  },
  { immediate: true },
);

async function loadData() {
  if (!query.businessContent) {
    return;
  }
  loading.value = true;
  try {
    list.value = (await listApiOperationLog({ ...query })) || [];
  } finally {
    loading.value = false;
  }
}

function openDetails(record: Record<string, any>) {
  try {
    jsonText.value = JSON.stringify(
      record.cmd ? JSON.parse(record.cmd) : {},
      null,
      2,
    );
  } catch {
    jsonText.value = record.cmd || '{}';
  }
  detailsOpen.value = true;
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="房间操作日志"
    width="760"
    @close="emit('close')"
  >
    <Space class="toolbar" wrap>
      <Select option-label-prop="label"
        v-model:value="query.businessCode"
        allow-clear
        :options="apiRequestLogOptions"
        placeholder="业务CODE"
        style="width: 260px"
      />
      <Button :loading="loading" type="primary" @click="loadData">
        搜索
      </Button>
    </Space>

    <div v-if="list.length > 0" class="timeline">
      <div v-for="item in list" :key="item.id || item.createTime" class="timeline-item">
        <div class="timeline-item__head">
          <div class="timeline-item__title">
            {{ item.apiDesc || item.businessCode || '-' }}
          </div>
          <Tag v-if="item.expiredTime">expiredTime: {{ item.expiredTime }}</Tag>
        </div>
        <div class="timeline-item__time">{{ formatDate(item.createTime) }}</div>
        <Button size="small" type="link" @click="openDetails(item)">
          查看命令
        </Button>
      </div>
    </div>
    <Empty v-else description="暂无日志" />

    <Modal
      :open="detailsOpen"
      destroy-on-close
      title="命令内容"
      width="720"
      @cancel="detailsOpen = false"
      @ok="detailsOpen = false"
    >
      <pre class="json-box">{{ jsonText }}</pre>
    </Modal>
  </Drawer>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.timeline {
  display: grid;
  gap: 16px;
}

.timeline-item {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.timeline-item__head {
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.timeline-item__title {
  font-weight: 600;
}

.timeline-item__time {
  color: #64748b;
  font-size: 12px;
  margin: 8px 0 4px;
}

.json-box {
  background: #0f172a;
  border-radius: 12px;
  color: #e2e8f0;
  margin: 0;
  max-height: 60vh;
  overflow: auto;
  padding: 16px;
}
</style>
