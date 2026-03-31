<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import {
  computed,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI,
  useEcharts } from '@vben/plugins/echarts';
import { useAccessStore } from '@vben/stores';

import { goldAnalyze } from '#/api/legacy/tools';
import AccountInput from '#/components/account-input.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Space,
  message,
} from 'antdv-next';

defineOptions({ name: 'ToolsGoldAnalyze' });

const COLORS = [
  '#5470c6',
  '#91cc75',
  '#fac858',
  '#ee6666',
  '#73c0de',
  '#3ba272',
  '#fc8452',
  '#9a60b4',
  '#ea7ccc',
  '#459AF0',
  '#38C3B0',
  '#86CA5A',
  '#BFD44F',
  '#FCC248',
  '#FCE448',
  '#F58B41',
  '#F7765B',
  '#525ECD',
  '#547FDB',
];

const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const incomeRef = ref<EchartsUIType>();
const outcomeRef = ref<EchartsUIType>();
const { renderEcharts: renderIncomeChart } = useEcharts(incomeRef);
const { renderEcharts: renderOutcomeChart } = useEcharts(outcomeRef);
type ChartOption = Parameters<typeof renderIncomeChart>[0];

const rangeDate = ref<[string, string] | null>(null);
const loadingIncome = ref(false);
const loadingOutcome = ref(false);

const query = ref({
  endTime: '',
  startTime: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  userId: '',
});

const subtext = computed(() => {
  return query.value.userId?.trim() ? '用户：数据分配图' : '系统：数据分配图';
});

watch(rangeDate, (value) => {
  query.value.startTime = value?.[0] || '';
  query.value.endTime = value?.[1] || '';
});

function toChartData(list: Array<Record<string, any>> = []) {
  return list.map((item) => ({
    name: item.originName,
    value: item.value,
  }));
}

function buildChartOption(title: string, data: Array<Record<string, any>>): ChartOption {
  return {
    color: COLORS,
    legend: {
      left: 'left',
      orient: 'vertical',
    },
    series: [
      {
        data: toChartData(data),
        radius: '56%',
        type: 'pie',
      },
    ],
    title: {
      left: 'center',
      subtext: subtext.value,
      text: title,
    },
    tooltip: {
      trigger: 'item',
    },
  };
}

async function loadIncome() {
  loadingIncome.value = true;
  try {
    const result = await goldAnalyze({
      ...query.value,
      type: 0,
    });
    renderIncomeChart(buildChartOption('金币收入', result || []));
  } finally {
    loadingIncome.value = false;
  }
}

async function loadOutcome() {
  loadingOutcome.value = true;
  try {
    const result = await goldAnalyze({
      ...query.value,
      type: 1,
    });
    renderOutcomeChart(buildChartOption('金币支出', result || []));
  } finally {
    loadingOutcome.value = false;
  }
}

async function handleSearch() {
  if (!rangeDate.value) {
    message.warning('请选择时间');
    return;
  }
  const start = Number(query.value.startTime);
  const end = Number(query.value.endTime);
  if (end - start > 2_592_000_000) {
    message.warning('时间必须在1个月以内');
    return;
  }
  await Promise.all([loadIncome(), loadOutcome()]);
}
</script>

<template>
  <Page title="金币分析">
    <div class="page-grid">
      <Card>
        <div class="toolbar">
          <Space wrap>
            <SysOriginSelect
              v-model:value="query.sysOrigin"
              style="width: 140px"
              @change="handleSearch"

              :options="sysOriginOptions"
            ></SysOriginSelect>
            <AccountInput
              v-model:value="query.userId"
              :sys-origin="query.sysOrigin"
              placeholder="用户ID"
              style="width: 220px"
            />
            <DateRangePicker
              v-model:value="rangeDate"
              show-time
              style="width: 360px"
              value-format="x"
            />
            <Button :loading="loadingIncome || loadingOutcome" type="primary" @click="handleSearch">
              搜索
            </Button>
          </Space>
        </div>
      </Card>

      <Card :loading="loadingIncome" title="金币收入">
        <EchartsUI ref="incomeRef" style="height: 520px" />
      </Card>

      <Card :loading="loadingOutcome" title="金币支出">
        <EchartsUI ref="outcomeRef" style="height: 520px" />
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: 16px;
}

.toolbar {
  min-height: 40px;
}
</style>
