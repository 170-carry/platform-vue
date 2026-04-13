<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import { getPropsSale } from '#/api/legacy/statistics';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  DatePicker,
  Descriptions,
  DescriptionsItem,
  Modal,
  Select,
  Space,
  Table,
} from 'antdv-next';

import {
  ACTIVITY_DATE_TYPE_MAP,
  ACTIVITY_DATE_TYPE_OPTIONS,
  PROPS_TYPES,
} from '../shared';

defineOptions({ name: 'PropsResourceOverviewModal' });

const props = defineProps<{
  open: boolean;
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
  dateType: 'MONTH',
  propsType: PROPS_TYPES[0]?.value ?? 'AVATAR_FRAME',
  sysOrigin: '',
});

const columns = [
  { dataIndex: 'propsSourceId', key: 'propsSourceId', title: '资源ID', width: 120 },
  { dataIndex: 'propsName', key: 'propsName', title: '资源名称', width: 220 },
  { dataIndex: 'saleQuantity', key: 'saleQuantity', title: '销量', width: 120 },
];

const datePickerType = computed(
  () => ACTIVITY_DATE_TYPE_MAP[query.dateType as keyof typeof ACTIVITY_DATE_TYPE_MAP].picker,
);

const dateValueFormat = computed(
  () => ACTIVITY_DATE_TYPE_MAP[query.dateType as keyof typeof ACTIVITY_DATE_TYPE_MAP].format,
);
const dateTypeOptions = ACTIVITY_DATE_TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value as any,
}));
const propsTypeOptions = PROPS_TYPES.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

async function loadData() {
  if (!props.open || !query.sysOrigin || !query.date || !query.propsType) {
    return;
  }
  loading.value = true;
  try {
    const result = await getPropsSale({ ...query });
    summary.value = result || {};
    rows.value = (result?.propsSales || []).map((item: Record<string, any>) => ({
      propsName: item.propsSource?.name || '-',
      propsSourceId: item.propsSource?.id || '-',
      saleQuantity: item.saleQuantity || 0,
    }));
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
    query.dateType = 'MONTH';
    query.propsType = PROPS_TYPES[0]?.value ?? 'AVATAR_FRAME';
    query.date = ACTIVITY_DATE_TYPE_MAP.MONTH.defaultDate;
    void loadData();
  },
  { immediate: true },
);

watch(
  () => query.dateType,
  (value) => {
    query.date =
      ACTIVITY_DATE_TYPE_MAP[value as keyof typeof ACTIVITY_DATE_TYPE_MAP].defaultDate;
  },
);
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="销售情况"
    width="960"
    @cancel="emit('close')"
  >
    <Space class="toolbar" wrap>
      <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px" @change="loadData"
        :options="sysOriginOptions"
      ></SysOriginSelect>
      <Select
        option-label-prop="label"
        v-model:value="query.dateType"
        :options="dateTypeOptions"
        style="width: 120px"
        @change="loadData"
      />
      <Select
        option-label-prop="label"
        v-model:value="query.propsType"
        :options="propsTypeOptions"
        style="width: 160px"
        @change="loadData"
      />
      <DatePicker
        v-model:value="query.date"
        :format="dateValueFormat"
        :picker="datePickerType"
        :value-format="dateValueFormat"
        @change="loadData"
      />
    </Space>

    <Descriptions bordered class="summary" size="small">
      <DescriptionsItem label="总额">
        {{ summary.total ?? '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="记录数">
        {{ rows.length }}
      </DescriptionsItem>
    </Descriptions>

    <Table
      :columns="columns"
      :data-source="rows"
      :loading="loading"
      :pagination="false"
      row-key="propsSourceId"
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
