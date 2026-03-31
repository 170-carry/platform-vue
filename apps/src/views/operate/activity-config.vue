<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { listActivityConf } from '#/api/legacy/system';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antdv-next';

import { copyText } from './shared';
import ActivityFormModal from './components/activity-form-modal.vue';
import ActivityRankDrawer from './components/activity-rank-drawer.vue';
import ActivityRewardRankDrawer from './components/activity-reward-rank-drawer.vue';

defineOptions({ name: 'OperateActivityConfig' });

const router = useRouter();
const accessStore = useAccessStore();

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const notMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);

const formOpen = ref(false);
const rankOpen = ref(false);
const rewardRankOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive({
  id: '',
  lastId: '',
  limit: 20,
  showcase: 1 as number | undefined,
  sysOrigin: '',
  templateId: '',
});

const SHOWCASE_OPTIONS = [
  { label: '已开始', value: 1 },
  { label: '已结束', value: 2 },
  { label: '上架', value: 3 },
  { label: '下架', value: 4 },
];

const columns = [
  { dataIndex: 'templateName', key: 'templateName', title: '关联模版', width: 180 },
  { dataIndex: 'remark', key: 'remark', title: '备注', width: 220 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 160 },
  { dataIndex: 'time', key: 'time', title: '活动时间', width: 220 },
  { dataIndex: 'user', key: 'user', title: '修改/创建人', width: 180 },
  { dataIndex: 'operateTime', key: 'operateTime', title: '修改/创建时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 320 },
];

function resetList() {
  list.value = [];
  query.lastId = '';
  notMore.value = false;
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    resetList();
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = (await listActivityConf({ ...query })) || [];
    list.value = reset ? result : [...list.value, ...result];
    notMore.value = result.length < query.limit;
    if (list.value.length > 0) {
      query.lastId = String(list.value[list.value.length - 1]?.config?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
      void loadData(true);
    }
  },
  { immediate: true },
);

function handleSearch() {
  void loadData(true);
}

function openCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function openEdit(row: Record<string, any>) {
  activeRow.value = row;
  formOpen.value = true;
}

function openRank(row: Record<string, any>) {
  activeRow.value = row;
  rankOpen.value = true;
}

function openRewardRank(row: Record<string, any>) {
  activeRow.value = row;
  rewardRankOpen.value = true;
}

function copyActivity(row: Record<string, any>) {
  const next = JSON.parse(JSON.stringify(row || {}));
  next.status = 0;
  next.config = {
    ...(next.config || {}),
    awardStatus: false,
    id: null,
  };
  next.butOneRewards = (next.butOneRewards || []).map((item: Record<string, any>) => ({
    ...item,
    rankUsers: [],
    status: false,
  }));
  next.butTwoRewards = (next.butTwoRewards || []).map((item: Record<string, any>) => ({
    ...item,
    rankUsers: [],
    status: false,
  }));
  activeRow.value = next;
  formOpen.value = true;
}

async function handleCopy(text: string) {
  try {
    await copyText(text);
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}

function copyActivityLink(row: Record<string, any>) {
  handleCopy(`${window.location.origin}/#/activity/${row.config?.id}`);
}

function editTemplate(row: Record<string, any>) {
  const templateId = row.config?.templateId;
  if (!templateId) {
    return;
  }
  const confirmed = window.confirm(
    '模版发生改变后，相关引用都会同步变化，是否继续？',
  );
  if (!confirmed) {
    return;
  }
  router.push({
    path: '/operate/manager/activity/template',
    query: { id: String(templateId) },
  });
}

function getRunStatusType(status?: number) {
  if (status === 1) {
    return 'success';
  }
  if (status === 2) {
    return 'warning';
  }
  return 'default';
}
</script>

<template>
  <Page title="活动配置">
    <Card>
      <Space class="toolbar" wrap>
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select option-label-prop="label"
          v-model:value="query.showcase"
          allow-clear
          style="width: 140px"
          placeholder="状态"
          @change="handleSearch"
        
          :options="SHOWCASE_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
        />
        <Input
          v-model:value="query.id"
          allow-clear
          placeholder="活动ID"
          style="width: 180px"
        />
        <Input
          v-model:value="query.templateId"
          allow-clear
          placeholder="模版ID"
          style="width: 180px"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="openCreate">
          新增
        </Button>
      </Space>

      <Alert :closable="false" class="help" type="info">
        <template #message>
          <div>先在“活动模版”创建模版，再在这里创建活动并关联模版。</div>
          <div>活动结束后不可重新编辑；如需复用，请使用“复制活动”。</div>
          <div>奖品发送后会保留排行榜快照记录。</div>
        </template>
      </Alert>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="config.id"
        :scroll="{ x: 1480 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'templateName'">
            {{ record.templateName || '-' }}
          </template>
          <template v-else-if="column.key === 'remark'">
            {{ record.config?.remark || '-' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Space wrap>
              <Tag :color="record.config?.showcase ? 'processing' : 'default'">
                {{ record.config?.showcase ? '上架' : '下架' }}
              </Tag>
              <Tag :color="getRunStatusType(record.status)">
                {{
                  Number(record.status) === 2
                    ? '已结束'
                    : Number(record.status) === 1
                      ? '已开始'
                      : '未开始'
                }}
              </Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>开始：{{ formatDate(record.config?.startTime) }}</div>
            <div>结束：{{ formatDate(record.config?.endTime) }}</div>
          </template>
          <template v-else-if="column.key === 'user'">
            <div>修改：{{ record.updateUserName || '-' }}</div>
            <div>创建：{{ record.createUserName || '-' }}</div>
          </template>
          <template v-else-if="column.key === 'operateTime'">
            <div>修改：{{ formatDate(record.config?.updateTime) }}</div>
            <div>创建：{{ formatDate(record.config?.createTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button size="small" type="link" @click="openEdit(record)">
                {{ Number(record.status) === 2 ? '查看' : '编辑' }}
              </Button>
              <Button
                v-if="Number(record.status) !== 0"
                size="small"
                type="link"
                @click="openRank(record)"
              >
                排行榜
              </Button>
              <Button
                v-if="Number(record.status) !== 2"
                size="small"
                type="link"
                @click="editTemplate(record)"
              >
                编辑模版
              </Button>
              <Button size="small" type="link" @click="copyActivity(record)">
                复制活动
              </Button>
              <Button
                v-if="Number(record.status) === 2"
                size="small"
                type="link"
                @click="openRewardRank(record)"
              >
                {{ record.config?.awardStatus ? '奖品发送记录' : '发送奖品' }}
              </Button>
              <Button size="small" type="link" @click="handleCopy(String(record.config?.id || ''))">
                复制活动ID
              </Button>
              <Button
                size="small"
                type="link"
                @click="handleCopy(String(record.config?.templateId || ''))"
              >
                复制模版ID
              </Button>
              <Button size="small" type="link" @click="copyActivityLink(record)">
                复制活动链接
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="load-more">
        <span v-if="notMore">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false)"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <ActivityFormModal
      :open="formOpen"
      :row="activeRow"
      :sys-origin="query.sysOrigin"
      @close="formOpen = false"
      @success="loadData(true)"
    />
    <ActivityRankDrawer
      :activity-id="activeRow?.config?.id || ''"
      :open="rankOpen"
      @close="rankOpen = false"
    />
    <ActivityRewardRankDrawer
      :activity-id="activeRow?.config?.id || ''"
      :open="rewardRankOpen"
      @close="rewardRankOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar,
.help {
  margin-bottom: 16px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
