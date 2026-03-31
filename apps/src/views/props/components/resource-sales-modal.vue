<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { useAccessStore } from '@vben/stores';
import dayjs from 'dayjs';

import { getPropsSaleSinge } from '#/api/legacy/statistics';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Modal,
  Space,
  Table,
} from 'antdv-next';

defineOptions({ name: 'PropsResourceSalesModal' });

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const rows = ref<Array<Record<string, any>>>([]);
const summary = ref<Record<string, any>>({});

const query = reactive({
  date: '',
  propsSourceId: '',
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'date', key: 'date', title: '日期', width: 160 },
  { dataIndex: 'saleQuantity', key: 'saleQuantity', title: '销量', width: 120 },
];

async function loadData() {
  if (!props.open || !query.propsSourceId || !query.sysOrigin || !query.date) {
    return;
  }
  loading.value = true;
  try {
    const result = await getPropsSaleSinge({
      date: query.date,
      dateType: 'DAY',
      propsSourceId: query.propsSourceId,
      sysOrigin: query.sysOrigin,
    });
    summary.value = result || {};
    rows.value = result?.propsSaleQuotas || [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    query.sysOrigin = sysOriginOptions.value[0]?.value || 'LIKEI';
    query.date = dayjs().format('YYYYMM');
    query.propsSourceId = String(props.record?.id || '');
    void loadData();
  },
  { immediate: true },
);
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="销售报表"
    width="900"
    @cancel="emit('close')"
  >
    <Space class="toolbar" wrap>
      <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px" @change="loadData"
        :options="sysOriginOptions"
      ></SysOriginSelect>
      <DatePicker
        v-model:value="query.date"
        :allow-clear="false"
        format="YYYYMM"
        picker="month"
        value-format="YYYYMM"
        @change="loadData"
      />
    </Space>

    <Descriptions bordered class="summary" size="small">
      <DescriptionsItem label="月销售总额">
        {{ summary.monthTotal ?? '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="年销售总额">
        {{ summary.yearTotal ?? '-' }}
      </DescriptionsItem>
    </Descriptions>

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="date"
    />
  </Modal>
</template>

<style scoped>
.summary {
  margin-bottom: 16px;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
