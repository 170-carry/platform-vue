<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import type { Dayjs } from 'dayjs';

import {
  getBonusAmountBalanceTeenPatti,
  getConfigTeenPatti,
  getIncomeAndExpenditureTeenPatti,
  pageTableTeenPatti,
  pageTableUserBetTeenPatti,
  updateConfigTeenPatti,
  } from '#/api/legacy/game';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Collapse,
  CollapsePanel,
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Form,
  FormItem,
  Input,
  Pagination,
  Space,
  TabPane,
  Table,
  Tabs,
  Tag,
  message
} from 'antdv-next';

import AccountInput from '#/components/account-input.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateTeenPatti' });

const { RangePicker } = DatePicker;

const activeTab = ref('list');
const recordLoading = ref(false);
const recordTotal = ref(0);
const recordList = ref<Array<Record<string, any>>>([]);
const recordRange = ref<[Dayjs, Dayjs] | null>(null);
const gameTotals = ref<Record<string, any> | null>(null);
const betUserOpen = ref(false);
const selectedRoundId = ref('');
const betUserLoading = ref(false);
const betUserTotal = ref(0);
const betUserList = ref<Array<Record<string, any>>>([]);
const configLoading = ref(false);
const configSaving = ref(false);
const bonusBalance = ref<number | string>(0);

const recordQuery = reactive({
  cursor: 1,
  endTime: '',
  limit: 20,
  rounds: '',
  startTime: '',
  userBet: true as any,
});

const betUserQuery = reactive({
  cursor: 1,
  limit: 20,
  roundId: '',
  userId: '',
});

const configForm = reactive({
  extractAmountRatio: '',
  lotteryRatio: '',
});

const recordColumns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 100 },
  { dataIndex: 'type', key: 'type', title: '中奖类型', width: 120 },
  { dataIndex: 'profit', key: 'profit', title: '盈亏', width: 160 },
  { dataIndex: 'draw', key: 'draw', title: '状态', width: 100 },
  { dataIndex: 'gameStatus', key: 'gameStatus', title: '游戏状态', width: 120 },
  { dataIndex: 'rounds', key: 'rounds', title: '回合数', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

const betUserColumns = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 220 },
  { dataIndex: 'type', key: 'type', title: '押注类型', width: 120 },
  { dataIndex: 'betQuantity', key: 'betQuantity', title: '押注数量', width: 120 },
  { dataIndex: 'multiple', key: 'multiple', title: '倍数', width: 100 },
  { dataIndex: 'lottery', key: 'lottery', title: '是否中奖', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

watch(recordRange, (value) => {
  if (!value?.length) {
    recordQuery.startTime = '';
    recordQuery.endTime = '';
    return;
  }
  recordQuery.startTime = String(value[0].valueOf());
  recordQuery.endTime = String(value[1].valueOf());
});

async function loadTotals() {
  gameTotals.value = await getIncomeAndExpenditureTeenPatti({ ...recordQuery });
}

async function loadRecords(reset = false) {
  if (reset) {
    recordQuery.cursor = 1;
  }
  recordLoading.value = true;
  try {
    const [result] = await Promise.all([
      pageTableTeenPatti({ ...recordQuery }),
      loadTotals(),
    ]);
    recordList.value = result.records || [];
    recordTotal.value = result.total || 0;
  } finally {
    recordLoading.value = false;
  }
}

async function loadBetUsers(reset = false) {
  if (!selectedRoundId.value) {
    return;
  }
  if (reset) {
    betUserQuery.cursor = 1;
  }
  betUserLoading.value = true;
  try {
    const result = await pageTableUserBetTeenPatti({
      ...betUserQuery,
      roundId: selectedRoundId.value,
    });
    betUserList.value = result.records || [];
    betUserTotal.value = result.total || 0;
  } finally {
    betUserLoading.value = false;
  }
}

async function loadConfig() {
  configLoading.value = true;
  try {
    const [config, balance] = await Promise.all([
      getConfigTeenPatti(),
      getBonusAmountBalanceTeenPatti(),
    ]);
    Object.assign(configForm, {
      extractAmountRatio: String(config?.extractAmountRatio || ''),
      lotteryRatio: String(config?.lotteryRatio || ''),
    });
    bonusBalance.value = balance || 0;
  } finally {
    configLoading.value = false;
  }
}

function handleRecordPageChange(page: number, pageSize: number) {
  recordQuery.cursor = page;
  recordQuery.limit = pageSize;
  void loadRecords();
}

function handleBetUserPageChange(page: number, pageSize: number) {
  betUserQuery.cursor = page;
  betUserQuery.limit = pageSize;
  void loadBetUsers();
}

function openBetUsers(record: Record<string, any>) {
  selectedRoundId.value = String(record.id || '');
  betUserQuery.userId = '';
  betUserOpen.value = true;
  void loadBetUsers(true);
}

async function handleSaveConfig() {
  if (!String(configForm.lotteryRatio).trim() || !String(configForm.extractAmountRatio).trim()) {
    message.warning('请补全参数配置');
    return;
  }
  configSaving.value = true;
  try {
    await updateConfigTeenPatti({ ...configForm });
    message.success('保存成功');
    await loadConfig();
  } finally {
    configSaving.value = false;
  }
}

const expandedRowKeys = computed(() => recordList.value.map((item) => item.id));

loadRecords(true);
loadConfig();
</script>

<template>
  <Page title="炸金花">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="list" tab="记录" />
        <TabPane key="config" tab="配置" />
      </Tabs>

      <template v-if="activeTab === 'list'">
        <div class="toolbar">
          <Space wrap>
            <Select option-label-prop="label" v-model:value="recordQuery.userBet" allow-clear style="width: 120px"
              :options="[{ label: '有押注', value: true as any }, { label: '没有押注', value: false as any }]"
            />
            <RangePicker v-model:value="recordRange" show-time />
            <Input v-model:value="recordQuery.rounds" placeholder="回合数(只查下注局)" style="width: 220px" />
            <Button :loading="recordLoading" type="primary" @click="loadRecords(true)">
              搜索
            </Button>
          </Space>
        </div>

        <Card v-if="gameTotals" class="summary" size="small">
          <Tag>
            押注 {{ gameTotals.totalBet || 0 }} - 支出 {{ gameTotals.odds || 0 }} = 余{{ gameTotals.balance || 0 }}
          </Tag>
        </Card>

        <Table
          :columns="recordColumns"
          :data-source="recordList"
          :expanded-row-keys="expandedRowKeys"
          :loading="recordLoading"
          :pagination="false"
          row-key="id"
        >
          <template #expandedRowRender="{ record }">
            <div v-if="record.parseCards" class="cards-wrap">
              <div
                v-for="seat in ['A', 'B', 'C']"
                :key="seat"
                class="seat-card"
              >
                <div class="seat-title">座位 {{ seat }}</div>
                <div class="seat-desc">
                  {{
                    record.parseCards?.[seat]?.cards?.join(', ') || '无牌'
                  }}
                </div>
                <div class="seat-meta">
                  类型: {{ record.parseCards?.[seat]?.type || '-' }} / 牌类:
                  {{ record.parseCards?.[seat]?.resultType || '-' }} / 得分:
                  {{ record.parseCards?.[seat]?.score || '-' }}
                </div>
              </div>
            </div>
            <div v-else>没有更多内容</div>
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'profit'">
              {{ record.betTotal || 0 }} - {{ record.oddsTotal || 0 }} = {{
                Number(record.betTotal || 0) - Number(record.oddsTotal || 0)
              }}
            </template>
            <template v-else-if="column.key === 'draw'">
              {{ record.draw ? '已开奖' : '未开奖' }}
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                v-if="record.draw"
                size="small"
                type="link"
                @click="openBetUsers(record)"
              >
                押注用户
              </Button>
            </template>
          </template>
        </Table>

        <div class="pagination">
          <Pagination
            :current="recordQuery.cursor"
            :page-size="recordQuery.limit"
            :total="recordTotal"
            show-size-changer
            @change="handleRecordPageChange"
            @showSizeChange="handleRecordPageChange"
          />
        </div>
      </template>

      <template v-else>
        <Collapse :active-key="['config']">
          <CollapsePanel key="config" header="参数配置">
            <Form layout="vertical">
              <div class="grid-two">
                <FormItem label="中奖概率">
                  <Input v-model:value="configForm.lotteryRatio" placeholder="有效范围0~100" />
                </FormItem>
                <FormItem label="系统抽取比率">
                  <Input
                    v-model:value="configForm.extractAmountRatio"
                    placeholder="有效范围0~100"
                  />
                </FormItem>
              </div>
              <Descriptions :column="1" bordered size="small">
                <DescriptionsItem label="奖金池余额">
                  {{ bonusBalance }}
                </DescriptionsItem>
              </Descriptions>
              <div class="save-bar">
                <Button :loading="configSaving" type="primary" @click="handleSaveConfig">
                  提交
                </Button>
              </div>
            </Form>
          </CollapsePanel>
        </Collapse>
      </template>
    </Card>

    <Drawer
      :open="betUserOpen"
      destroy-on-close
      title="押注用户"
      width="920px"
      @close="betUserOpen = false"
    >
      <div class="toolbar">
        <Space wrap>
          <AccountInput
            v-model:value="betUserQuery.userId"
            placeholder="用户ID"
            style="width: 260px"
          />
          <Button :loading="betUserLoading" type="primary" @click="loadBetUsers(true)">
            搜索
          </Button>
        </Space>
      </div>

      <Table
        :columns="betUserColumns"
        :data-source="betUserList"
        :loading="betUserLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'type'">
            {{ record.userBet?.type || '-' }}
          </template>
          <template v-else-if="column.key === 'betQuantity'">
            {{ record.userBet?.betQuantity || 0 }}
          </template>
          <template v-else-if="column.key === 'multiple'">
            {{ record.userBet?.multiple || 0 }}
          </template>
          <template v-else-if="column.key === 'lottery'">
            {{
              record.userBet?.lottery
                ? `中奖(${record.userBet?.receiveStatus || '-'})`
                : '未中奖'
            }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.userBet?.createTime) }}
          </template>
        </template>
      </Table>

      <div class="pagination">
        <Pagination
          :current="betUserQuery.cursor"
          :page-size="betUserQuery.limit"
          :total="betUserTotal"
          show-size-changer
          @change="handleBetUserPageChange"
          @showSizeChange="handleBetUserPageChange"
        />
      </div>
    </Drawer>
  </Page>
</template>

<style scoped>
.toolbar,
.summary {
  margin-bottom: 16px;
}

.cards-wrap {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.seat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.seat-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.seat-desc,
.seat-meta {
  color: #475569;
  font-size: 12px;
}

.grid-two {
  column-gap: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.save-bar,
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
