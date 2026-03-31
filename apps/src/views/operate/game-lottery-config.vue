<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  pageGameLotteryGroup,
  saveOrUpdateGameLotteryGroup,
  } from '#/api/legacy/game';
import RewardRow from '#/views/props/components/reward-row.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  TextArea,
  message
} from 'antdv-next';

import { LOTTERY_GAME_TYPE_OPTIONS } from './constants';

defineOptions({ name: 'OperateGameLotteryConfig' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const editorOpen = ref(false);
const editorTitle = ref('添加');
const editorJson = ref('{}');
const editorSaving = ref(false);

const query = reactive({
  cursor: 1,
  gameType: '',
  id: '',
  limit: 20,
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'gameType', key: 'gameType', title: '类型', width: 120 },
  { dataIndex: 'rewardConfigList', key: 'rewardConfigList', title: '道具', width: 360 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

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

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageGameLotteryGroup({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function openCreate() {
  editorTitle.value = '添加';
  editorJson.value = JSON.stringify(
    {
      gameType: 'EGG',
      rewardConfigList: [],
      sysOrigin: query.sysOrigin,
    },
    null,
    2,
  );
  editorOpen.value = true;
}

function openEdit(row: Record<string, any>) {
  editorTitle.value = '编辑';
  editorJson.value = JSON.stringify(row || {}, null, 2);
  editorOpen.value = true;
}

async function handleSave() {
  let payload: Record<string, any> = {};
  try {
    payload = JSON.parse(editorJson.value || '{}');
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      message.warning('配置必须是对象');
      return;
    }
  } catch {
    message.warning('JSON 格式不正确');
    return;
  }

  if (!payload.gameType) {
    message.warning('gameType 不能为空');
    return;
  }

  payload.sysOrigin = payload.sysOrigin || query.sysOrigin;
  payload.rewardConfigList = Array.isArray(payload.rewardConfigList)
    ? payload.rewardConfigList.map((item: Record<string, any>, index: number) => ({
        ...item,
        sort: item.sort || index + 1,
      }))
    : [];

  const probabilitySum = payload.rewardConfigList.reduce(
    (sum: number, item: Record<string, any>) =>
      sum + Number(item.probability || 0),
    0,
  );
  if (payload.rewardConfigList.length > 0 && probabilitySum.toFixed(3) !== '1.000') {
    message.warning('rewardConfigList 概率总和必须等于 1');
    return;
  }

  editorSaving.value = true;
  try {
    await saveOrUpdateGameLotteryGroup(payload);
    message.success('保存成功');
    editorOpen.value = false;
    await loadData(true);
  } finally {
    editorSaving.value = false;
  }
}
</script>

<template>
  <Page title="抽奖概率配置">
    <Card>
      <Space class="toolbar" wrap>
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 160px"
          @change="loadData(true)"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Input
          v-model:value="query.id"
          allow-clear
          placeholder="ID"
          style="width: 180px"
        />
        <Select option-label-prop="label"
          v-model:value="query.gameType"
          allow-clear
          placeholder="游戏类型"
          style="width: 160px"
          @change="loadData(true)"
        
          :options="LOTTERY_GAME_TYPE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button type="primary" @click="openCreate">
          添加
        </Button>
      </Space>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 920 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'gameType'">
            {{
              LOTTERY_GAME_TYPE_OPTIONS.find((item) => item.value === record.gameType)?.name
                || record.gameType
                || '-'
            }}
          </template>
          <template v-else-if="column.key === 'rewardConfigList'">
            <RewardRow :list="record.rewardConfigList" />
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建：{{ formatDate(record.createTime) }}</div>
            <div>修改：{{ formatDate(record.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
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
    </Card>

    <Modal
      :confirm-loading="editorSaving"
      :open="editorOpen"
      destroy-on-close
      :title="editorTitle"
      width="980"
      @cancel="editorOpen = false"
      @ok="handleSave"
    >
      <div class="editor-tips">
        <div>这里保持原项目保存的完整数据结构。</div>
        <div>请直接编辑 `gameType / sysOrigin / rewardConfigList` 等字段。</div>
      </div>
      <TextArea
        v-model:value="editorJson"
        :auto-size="{ minRows: 24, maxRows: 36 }"
        class="json-editor"
        spellcheck="false"
      />
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.editor-tips {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #475569;
  line-height: 1.7;
  margin-bottom: 12px;
  padding: 12px 14px;
}

.json-editor {
  font-family:
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    monospace;
}
</style>
