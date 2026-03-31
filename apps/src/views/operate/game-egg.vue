<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getEggConfig,
  getEggExtractRatio,
  getEggPrizePool,
  pageEggExchangeRecord,
  pageEggLotteryRecord,
  resetEggConsumeStockQuantity,
  setEggExtractRatio,
  updateEggConfig,
  } from '#/api/legacy/game';
import AccountInput from '#/components/account-input.vue';
import RewardRow from '#/views/props/components/reward-row.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Image,
  Input,
  InputNumber,
  Pagination,
  Space,
  Table,
  Tabs,
  TabPane,
  Tag,
  message,
} from 'antdv-next';

import PropsSourceSelectDrawer from './components/props-source-select-drawer.vue';

defineOptions({ name: 'OperateGameEgg' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const activeTab = ref('exchange');
const sysOrigin = ref('');

const exchangeLoading = ref(false);
const exchangeList = ref<Array<Record<string, any>>>([]);
const exchangeTotal = ref(0);
const exchangeQuery = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const lotteryLoading = ref(false);
const lotteryList = ref<Array<Record<string, any>>>([]);
const lotteryTotal = ref(0);
const lotteryQuery = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const configLoading = ref(false);
const configSaving = ref(false);
const configList = ref<Array<Record<string, any>>>([]);
const removeIds = ref<Array<number | string>>([]);
const selectedConfigIndex = ref(-1);
const propsDrawerOpen = ref(false);
const extractRatio = ref<number | string>('');
const prizePool = ref<number | string>('');
const ratioSaving = ref(false);

const exchangeColumns = [
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 260 },
  { dataIndex: 'quantity', key: 'quantity', title: '兑换数量', width: 120 },
  { dataIndex: 'prize', key: 'prize', title: '奖品', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const lotteryColumns = [
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '用户', width: 260 },
  { dataIndex: 'fee', key: 'fee', title: '付费 / 抽次数', width: 160 },
  { dataIndex: 'winningDetailsList', key: 'winningDetailsList', title: '中奖碎片', width: 320 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const configColumns = [
  { dataIndex: 'sort', key: 'sort', title: '序号', width: 100 },
  { dataIndex: 'sourceType', key: 'sourceType', title: '奖品', width: 220 },
  { dataIndex: 'prizeQuantity', key: 'prizeQuantity', title: '奖品量', width: 120 },
  { dataIndex: 'fragmentsSize', key: 'fragmentsSize', title: '碎片', width: 120 },
  { dataIndex: 'fragmentsAmount', key: 'fragmentsAmount', title: '碎片价值', width: 120 },
  { dataIndex: 'stockQuantity', key: 'stockQuantity', title: '库存', width: 120 },
  { dataIndex: 'consumeStockQuantity', key: 'consumeStockQuantity', title: '已消耗', width: 140 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!sysOrigin.value && options.length > 0) {
      sysOrigin.value = String(options[0]?.value || '');
      exchangeQuery.sysOrigin = sysOrigin.value;
      lotteryQuery.sysOrigin = sysOrigin.value;
      void refreshAll();
    }
  },
  { immediate: true },
);

watch(sysOrigin, (value) => {
  exchangeQuery.sysOrigin = value;
  lotteryQuery.sysOrigin = value;
  removeIds.value = [];
  void refreshAll();
});

function createConfigItem() {
  return {
    fragmentsAmount: 1,
    fragmentsSize: 1,
    id: '',
    prizeQuantity: 1,
    sort: 0,
    sourceCover: '',
    sourceDetailType: '',
    sourceId: '',
    sourceType: '',
    sourceUrl: '',
    stockQuantity: -1,
    sysOrigin: sysOrigin.value,
  };
}

async function loadExchange(reset = false) {
  if (!exchangeQuery.sysOrigin) {
    return;
  }
  if (reset) {
    exchangeQuery.cursor = 1;
  }
  exchangeLoading.value = true;
  try {
    const result = await pageEggExchangeRecord({ ...exchangeQuery });
    exchangeList.value = result.records || [];
    exchangeTotal.value = result.total || 0;
  } finally {
    exchangeLoading.value = false;
  }
}

async function loadLottery(reset = false) {
  if (!lotteryQuery.sysOrigin) {
    return;
  }
  if (reset) {
    lotteryQuery.cursor = 1;
  }
  lotteryLoading.value = true;
  try {
    const result = await pageEggLotteryRecord({ ...lotteryQuery });
    lotteryList.value = result.records || [];
    lotteryTotal.value = result.total || 0;
  } finally {
    lotteryLoading.value = false;
  }
}

async function loadConfig() {
  if (!sysOrigin.value) {
    return;
  }
  configLoading.value = true;
  try {
    configList.value = (await getEggConfig({ sysOrigin: sysOrigin.value })) || [];
    prizePool.value = (await getEggPrizePool(sysOrigin.value)) || '';
    extractRatio.value = (await getEggExtractRatio(sysOrigin.value)) || '';
  } finally {
    configLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([
    loadExchange(true),
    loadLottery(true),
    loadConfig(),
  ]);
}

function handleExchangePageChange(page: number, pageSize: number) {
  exchangeQuery.cursor = page;
  exchangeQuery.limit = pageSize;
  void loadExchange();
}

function handleLotteryPageChange(page: number, pageSize: number) {
  lotteryQuery.cursor = page;
  lotteryQuery.limit = pageSize;
  void loadLottery();
}

function handleSelectPropsSource(item: Record<string, any>) {
  const row = configList.value[selectedConfigIndex.value];
  if (!row) {
    return;
  }
  row.sourceCover = item.cover;
  row.sourceDetailType = item.type;
  row.sourceId = item.id;
  row.sourceType = 'PROPS';
  row.sourceUrl = item.sourceUrl || '';
  if (item.amount && Number(row.prizeQuantity) > 0 && Number(row.fragmentsSize) > 0) {
    row.fragmentsAmount = Math.floor(
      (Number(item.amount) * Number(row.prizeQuantity)) / Number(row.fragmentsSize),
    );
  }
  propsDrawerOpen.value = false;
}

function openPropsDrawer(index: number) {
  selectedConfigIndex.value = index;
  propsDrawerOpen.value = true;
}

function setSimpleRewardType(index: number, type: string) {
  const row = configList.value[index];
  if (!row) {
    return;
  }
  row.sourceType = type;
  row.sourceDetailType = type;
  row.sourceCover = '';
  row.sourceId = '';
  row.sourceUrl = '';
}

function addConfigRow() {
  configList.value.push(createConfigItem());
}

function removeConfigRow(index: number) {
  const row = configList.value[index];
  if (!row) {
    return;
  }
  configList.value.splice(index, 1);
  if (row.id) {
    removeIds.value.push(row.id);
  }
}

async function handleResetConsume(row: Record<string, any>) {
  if (!row.id) {
    return;
  }
  await resetEggConsumeStockQuantity(row.id);
  message.success('已重置');
}

function validNumber(value: unknown, start: number, end: number) {
  return /^-?\d+$/.test(String(value)) && Number(value) >= start && Number(value) <= end;
}

async function handleSaveConfig() {
  const errors: string[] = [];
  configList.value.forEach((item, index) => {
    if (!validNumber(item.sort, 0, 99_999_999)) {
      errors.push(`[${index + 1}行] 序号必须是 0~99999999 的整数`);
    }
    if (!item.sourceType) {
      errors.push(`[${index + 1}行] 奖品不能为空`);
    }
    if (!validNumber(item.prizeQuantity, 1, 99_999_999)) {
      errors.push(`[${index + 1}行] 奖品数量必须是 1~99999999 的整数`);
    }
    if (!validNumber(item.stockQuantity, -1, 99_999_999)) {
      errors.push(`[${index + 1}行] 库存必须是 -1~99999999 的整数`);
    }
    if (!validNumber(item.fragmentsSize, 1, 99_999_999)) {
      errors.push(`[${index + 1}行] 碎片数量必须是 1~99999999 的整数`);
    }
    if (!validNumber(item.fragmentsAmount, 1, 99_999_999)) {
      errors.push(`[${index + 1}行] 碎片价值必须是 1~99999999 的整数`);
    }
  });

  if (errors.length > 0) {
    message.warning(errors[0]);
    return;
  }

  configSaving.value = true;
  try {
    await updateEggConfig({
      configs: configList.value,
      removeIds: removeIds.value,
      sysOrigin: sysOrigin.value,
    });
    message.success('保存成功');
    removeIds.value = [];
    await loadConfig();
  } finally {
    configSaving.value = false;
  }
}

async function handleSaveRatio() {
  ratioSaving.value = true;
  try {
    await setEggExtractRatio(sysOrigin.value, extractRatio.value || 0);
    message.success('保存成功');
    extractRatio.value = (await getEggExtractRatio(sysOrigin.value)) || '';
  } finally {
    ratioSaving.value = false;
  }
}

function renderEggRewardTitle(row: Record<string, any>) {
  if (row.sourceCover) {
    return row.sourceDetailType || row.sourceType || '-';
  }
  return row.sourceType || '-';
}
</script>

<template>
  <Page title="砸金蛋">
    <Card>
      <Space class="toolbar" wrap>
        <SysOriginSelect v-model:value="sysOrigin" style="width: 180px"
          :options="sysOriginOptions"
        ></SysOriginSelect>
      </Space>

      <Tabs v-model:activeKey="activeTab">
        <TabPane key="exchange" tab="碎片兑换" />
        <TabPane key="lottery" tab="抽奖记录" />
        <TabPane key="config" tab="配置" />
      </Tabs>

      <div v-if="activeTab === 'exchange'">
        <Space class="toolbar" wrap>
          <AccountInput
            v-model:value="exchangeQuery.userId"
            :sys-origin="sysOrigin"
            placeholder="用户ID"
            style="width: 280px"
          />
          <Button :loading="exchangeLoading" type="primary" @click="loadExchange(true)">
            搜索
          </Button>
        </Space>

        <Table
          :columns="exchangeColumns"
          :data-source="exchangeList"
          :loading="exchangeLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 900 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'userBaseInfo'">
              <div>{{ record.userBaseInfo?.userNickname || '-' }}</div>
              <div>{{ record.userBaseInfo?.actualAccount || record.userBaseInfo?.id || '-' }}</div>
            </template>
            <template v-else-if="column.key === 'prize'">
              <div class="prize-cell">
                <Image
                  v-if="record.cover"
                  :src="record.cover"
                  class="prize-image"
                />
                <Tag v-else>{{ record.type || '-' }}</Tag>
              </div>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="exchangeQuery.cursor"
            :page-size="exchangeQuery.limit"
            :total="exchangeTotal"
            show-size-changer
            @change="handleExchangePageChange"
            @showSizeChange="handleExchangePageChange"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'lottery'">
        <Space class="toolbar" wrap>
          <AccountInput
            v-model:value="lotteryQuery.userId"
            :sys-origin="sysOrigin"
            placeholder="用户ID"
            style="width: 280px"
          />
          <Button :loading="lotteryLoading" type="primary" @click="loadLottery(true)">
            搜索
          </Button>
        </Space>

        <Table
          :columns="lotteryColumns"
          :data-source="lotteryList"
          :loading="lotteryLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 980 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'userBaseInfo'">
              <div>{{ record.userBaseInfo?.userNickname || '-' }}</div>
              <div>{{ record.userBaseInfo?.actualAccount || record.userBaseInfo?.id || '-' }}</div>
            </template>
            <template v-else-if="column.key === 'fee'">
              {{ record.lotteryFee || 0 }} / {{ record.quantity || 0 }}
            </template>
            <template v-else-if="column.key === 'winningDetailsList'">
              <RewardRow :list="record.winningDetailsList" />
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="lotteryQuery.cursor"
            :page-size="lotteryQuery.limit"
            :total="lotteryTotal"
            show-size-changer
            @change="handleLotteryPageChange"
            @showSizeChange="handleLotteryPageChange"
          />
        </div>
      </div>

      <div v-else>
        <Alert
          :closable="false"
          class="config-alert"
          description="不要随意删除配置记录；已有用户的碎片数据会同步受影响。"
          type="info"
        />

        <Space class="toolbar" wrap>
          <Tag>奖金池 {{ prizePool || '-' }}</Tag>
          <Input
            v-model:value="extractRatio"
            placeholder="抽取率"
            style="width: 180px"
          />
          <Button :loading="ratioSaving" @click="handleSaveRatio">
            保存抽取率
          </Button>
          <Button @click="addConfigRow">添加</Button>
          <Button :loading="configSaving" type="primary" @click="handleSaveConfig">
            保存配置
          </Button>
        </Space>

        <Table
          :columns="configColumns"
          :data-source="configList"
          :loading="configLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1360 }"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'sort'">
              <InputNumber v-model:value="record.sort" :min="0" :precision="0" />
            </template>
            <template v-else-if="column.key === 'sourceType'">
              <div class="source-cell">
                <div class="source-preview">
                  <Image v-if="record.sourceCover" :src="record.sourceCover" class="prize-image" />
                  <Tag v-else>{{ renderEggRewardTitle(record) }}</Tag>
                </div>
                <Space wrap>
                  <Button size="small" @click="openPropsDrawer(index)">道具</Button>
                  <Button size="small" @click="setSimpleRewardType(index, 'SPECIAL_ID')">靓号</Button>
                  <Button size="small" @click="setSimpleRewardType(index, 'GOLD')">金币</Button>
                  <Button size="small" @click="setSimpleRewardType(index, 'DIAMOND')">钻石</Button>
                  <Button size="small" @click="setSimpleRewardType(index, 'GAME_COUPON')">游戏券</Button>
                </Space>
              </div>
            </template>
            <template v-else-if="column.key === 'prizeQuantity'">
              <InputNumber v-model:value="record.prizeQuantity" :min="1" :precision="0" />
            </template>
            <template v-else-if="column.key === 'fragmentsSize'">
              <InputNumber v-model:value="record.fragmentsSize" :min="1" :precision="0" />
            </template>
            <template v-else-if="column.key === 'fragmentsAmount'">
              <InputNumber v-model:value="record.fragmentsAmount" :min="1" :precision="0" />
            </template>
            <template v-else-if="column.key === 'stockQuantity'">
              <InputNumber v-model:value="record.stockQuantity" :min="-1" :precision="0" />
            </template>
            <template v-else-if="column.key === 'consumeStockQuantity'">
              <Space>
                <span>{{ record.consumeStockQuantity || 0 }}</span>
                <Button
                  v-if="record.id"
                  size="small"
                  type="link"
                  @click="handleResetConsume(record)"
                >
                  重置
                </Button>
              </Space>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button danger size="small" type="link" @click="removeConfigRow(index)">
                删除
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </Card>

    <PropsSourceSelectDrawer
      :open="propsDrawerOpen"
      :sys-origin="sysOrigin"
      @close="propsDrawerOpen = false"
      @select="handleSelectPropsSource"
    />
  </Page>
</template>

<style scoped>
.toolbar,
.config-alert {
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.prize-cell,
.source-cell {
  display: grid;
  gap: 8px;
}

.source-preview {
  align-items: center;
  display: flex;
  min-height: 36px;
}

.prize-image {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}
</style>
