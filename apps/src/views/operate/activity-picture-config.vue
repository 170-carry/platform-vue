<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  activityPicture,
  deleteActivityPicture,
} from '#/api/legacy/activity';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Modal,
  Pagination,
  Table,
  Tag,
  message,
} from 'antdv-next';

import ActivityPictureFormModal from './components/activity-picture-form-modal.vue';
import { copyText } from './shared';

defineOptions({ name: 'OperateActivityPictureConfig' });

const accessStore = useAccessStore();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<null | Record<string, any>>(null);

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});

const columns: any[] = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 140 },
  { dataIndex: 'picture', key: 'picture', title: '活动图片', width: 220 },
  { dataIndex: 'name', key: 'name', title: '描述', width: 240 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220, fixed: 'right' as const },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await activityPicture({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function handleCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function handleUpdate(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteActivityPicture(record.id);
      message.success('删除成功');
      await loadData();
    },
  });
}

async function handleCopy(id?: number | string) {
  if (!id) {
    return;
  }
  await copyText(`https://web.aswat1304.com/#/activity_picture_config/${id}`);
  message.success('复制成功');
}
</script>

<template>
  <Page title="活动配置">
    <Card>
      <div class="toolbar">
        <Tag>{{ query.sysOrigin || '-' }}</Tag>
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="handleCreate">新增</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <Tag>{{ record.sysOrigin || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'picture'">
            <Image :src="record.picture" class="picture" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-row">
              <Button size="small" type="link" @click="handleCopy(record.id)">
                复制活动内容
              </Button>
              <Button size="small" type="link" @click="handleUpdate(record)">
                修改
              </Button>
              <Button size="small" type="link" danger @click="handleDelete(record)">
                删除
              </Button>
            </div>
          </template>
        </template>
      </Table>

      <div v-if="total > 0" class="pager">
        <Pagination
          :current="query.cursor"
          :page-size="query.limit"
          :total="total"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <ActivityPictureFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      @close="formOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.toolbar,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar {
  margin-bottom: 16px;
}

.picture {
  border-radius: 12px;
  height: 111px;
  object-fit: cover;
  width: 150px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
