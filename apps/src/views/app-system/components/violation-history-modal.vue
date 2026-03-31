<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  getViolationHistoryPage,
} from '#/api/legacy/approval';
import {
  APPROVAL_TYPE_OPTIONS,
  formatDate,
} from '#/views/system/shared';

import {
  Button,
  DateRangePicker,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  userAvatar?: string;
  userId: number | string;
  userNickname?: string;
  vipStatusName?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive({
  cursor: 1,
  endDateTime: '',
  limit: 20,
  startDateTime: '',
  userId: '',
  violationType: '',
});

const columns = [
  { dataIndex: 'approvalUser', key: 'approvalUser', title: '审批人', width: 180 },
  { dataIndex: 'result', key: 'result', title: '审批结果', width: 180 },
  { dataIndex: 'content', key: 'content', title: '内容' },
  { dataIndex: 'description', key: 'description', title: '审核描述', width: 220 },
  { dataIndex: 'createTime', key: 'createTime', title: '审批时间', width: 180 },
];

watch(rangeDate, (value) => {
  query.startDateTime = value?.[0] || '';
  query.endDateTime = value?.[1] || '';
});

watch(
  () => [props.open, props.userId],
  ([open, userId]) => {
    if (!open || !userId) {
      return;
    }
    query.userId = String(userId);
    loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.userId) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getViolationHistoryPage({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openUserDetails() {
  emit('close');
  router.push(`/common/user/deatils/${props.userId}`);
}

function isImageRecord(record: Record<string, any>) {
  return ['AVATAR', 'PHOTO_WALL', 'ROOM_AVATAR'].includes(
    String(record.violationType || ''),
  );
}

function isVideoRecord(record: Record<string, any>) {
  return ['LIVE', 'SHORT_VIDEO'].includes(String(record.violationType || ''));
}

function resolveApprovalUser(record: Record<string, any>) {
  return (
    record.approvalUserBaseInfo?.userNickname ||
    record.approvalNickname ||
    record.approvalUserName ||
    '-'
  );
}
</script>

<template>
  <Modal
    :open="open"
    destroy-on-close
    title="违规记录"
    width="1180"
    @cancel="emit('close')"
    @ok="emit('close')"
  >
    <div class="user-summary">
      <div class="user-meta">
        <img :src="userAvatar || 'https://dummyimage.com/72x72/e2e8f0/64748b&text=U'" alt="" class="user-avatar">
        <div>
          <div class="user-name">{{ userNickname || `用户 ${userId}` }}</div>
          <Space wrap>
            <Tag>ID {{ userId }}</Tag>
            <Tag v-if="vipStatusName">{{ vipStatusName }}</Tag>
          </Space>
        </div>
      </div>
      <Button type="link" @click="openUserDetails">查看用户详情</Button>
    </div>

    <div class="toolbar">
      <Space wrap>
        <Select option-label-prop="label"
          v-model:value="query.violationType"
          allow-clear
          placeholder="审批类型"
          style="width: 240px"
        >
          <SelectOption
            v-for="item in APPROVAL_TYPE_OPTIONS"
            :key="item.value"
            :value="item.value"
           :label="`${item.label}`">
            {{ item.label }}
          </SelectOption>
        </Select>
        <DateRangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Input :value="String(userId)" disabled style="width: 180px" />
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      :scroll="{ x: 1080 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'approvalUser'">
          {{ resolveApprovalUser(record) }}
        </template>
        <template v-else-if="column.key === 'result'">
          <div class="result-cell">
            <div>{{ record.violationTypeName || '-' }}</div>
            <Tag>{{ record.approvalResultName || '-' }}</Tag>
          </div>
        </template>
        <template v-else-if="column.key === 'content'">
          <div class="content-cell">
            <template v-if="isImageRecord(record) && record.content">
              <Image :src="record.content" class="history-image" />
            </template>
            <template v-else-if="isVideoRecord(record) && record.content">
              <video class="history-video" controls muted :src="record.content" />
            </template>
            <template v-else>
              {{ record.content || '-' }}
            </template>
            <div v-if="record.labelNames && record.labelNames !== '-'" class="extra-line">
              机器标签：{{ record.labelNames }}
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'description'">
          <div class="desc-cell">{{ record.description || '-' }}</div>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
      </template>
    </Table>

    <div class="pager">
      <Pagination
        :current="query.cursor"
        :page-size="query.limit"
        :total="total"
        show-size-changer
        @change="handlePageChange"
        @showSizeChange="handlePageChange"
      />
    </div>
  </Modal>
</template>

<style scoped>
.user-summary {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.user-meta {
  align-items: center;
  display: flex;
  gap: 16px;
}

.user-avatar {
  border-radius: 18px;
  height: 72px;
  object-fit: cover;
  width: 72px;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.toolbar {
  margin-bottom: 16px;
}

.result-cell {
  display: grid;
  gap: 8px;
}

.content-cell,
.desc-cell {
  white-space: normal;
  word-break: break-word;
}

.extra-line {
  color: rgb(100 116 139);
  margin-top: 8px;
}

.history-image {
  border-radius: 12px;
  height: 96px;
  object-fit: cover;
  width: 96px;
}

.history-video {
  border-radius: 12px;
  height: 96px;
  width: 180px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
