<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRoute,
  useRouter } from 'vue-router';

import dayjs from 'dayjs';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { getClsGoldRunningWater } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  AutoComplete,
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Tag,
  message
} from 'antdv-next';

import UserProfileLink from './components/user-profile-link.vue';
import {
  CANDY_PURCHASING_TYPE_OPTIONS,
  CURRENCY_ORIGIN_OPTIONS,
} from './constants';

defineOptions({ name: 'OperateGoldRunningWater' });

const props = withDefaults(
  defineProps<{
    queryBackOperation?: boolean;
  }>(),
  {
    queryBackOperation: false,
  },
);

const router = useRouter();
const route = useRoute();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notMore = ref(false);
const originKeyword = ref('');
const sysOrigins = ref<string[]>([]);
const rangeDate = ref<[string, string] | null>(null);

const query = reactive<Record<string, any>>({
  context: '',
  endTime: '',
  id: '',
  limit: 20,
  origin: '',
  startTime: '',
  sysOrigin: '',
  trackId: '',
  type: undefined,
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 240 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'quantity', key: 'quantity', title: '糖果数', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
  { dataIndex: 'originName', key: 'originName', title: '来源', width: 320 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const originOptions = computed(() => {
  const keyword = originKeyword.value.trim().toLowerCase();
  const result = keyword
    ? CURRENCY_ORIGIN_OPTIONS.filter(
        (item) =>
          item.value.toLowerCase().includes(keyword) ||
          item.name.toLowerCase().includes(keyword),
      )
    : CURRENCY_ORIGIN_OPTIONS;
  return result.map((item) => ({
    label: `${item.name} / ${item.value}`,
    value: item.value,
  }));
});

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

watch(
  sysOriginOptions,
  (options) => {
    if (sysOrigins.value.length === 0 && options.length > 0) {
      const querySysOrigin = String(route.query.sysOrigin || '').trim();
      if (querySysOrigin) {
        sysOrigins.value = querySysOrigin.split(',').filter(Boolean);
        return;
      }
      sysOrigins.value = [String(options[0]?.value || '')];
    }
  },
  { immediate: true },
);

function normalizeOriginValue() {
  if (!query.origin) {
    return;
  }
  const hit = CURRENCY_ORIGIN_OPTIONS.find(
    (item) =>
      item.value.toLowerCase().includes(String(query.origin).toLowerCase()) ||
      item.name.toLowerCase().includes(String(query.origin).toLowerCase()),
  );
  if (hit) {
    query.origin = hit.value;
  }
}

function getEffectiveSysOrigin() {
  if (sysOrigins.value.length > 0) {
    return sysOrigins.value.join(',');
  }
  return sysOriginOptions.value.map((item) => String(item.value)).join(',');
}

function createDefaultRange() {
  const end = dayjs().endOf('day');
  const start = dayjs().subtract(1, 'day');
  return [String(start.valueOf()), String(end.valueOf())] as [string, string];
}

async function loadData(reset = false) {
  if (loading.value || loadMoreLoading.value) {
    return;
  }
  if (!query.startTime || !query.endTime) {
    message.warning('请选择时间范围');
    return;
  }

  const startYear = new Date(Number(query.startTime)).getFullYear();
  const endYear = new Date(Number(query.endTime)).getFullYear();
  if (startYear !== endYear) {
    message.warning('不允许跨年查询');
    return;
  }

  if (reset) {
    list.value = [];
    notMore.value = false;
    query.context = '';
  }

  normalizeOriginValue();
  query.sysOrigin = getEffectiveSysOrigin();
  if (props.queryBackOperation) {
    query.queryBackOperationUser = true;
  }

  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }

  try {
    const result = await getClsGoldRunningWater({ ...query });
    const waters = result?.waters || [];
    list.value = reset ? waters : [...list.value, ...waters];
    query.context = result?.context || '';
    notMore.value = Boolean(result?.listOver);
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openUserDetails(record: Record<string, any>) {
  const profile = record.userProfile;
  const userId = profile?.id || profile?.userId;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

if (!rangeDate.value) {
  rangeDate.value = createDefaultRange();
}

if (route.query.userId) {
  query.userId = String(route.query.userId);
}

if (route.query.origin) {
  query.origin = String(route.query.origin);
  originKeyword.value = String(route.query.origin);
}

void loadData(true);
</script>

<template>
  <Page v-if="!queryBackOperation" title="金币收支记录">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="sysOrigins"
          mode="multiple"
          style="width: 260px"
          placeholder="系统"
          :options="sysOriginOptions"
        />
        <Select
          option-label-prop="label"
          v-model:value="query.type"
          allow-clear
          placeholder="类型"
          style="width: 120px"
        
          :options="CANDY_PURCHASING_TYPE_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <AutoComplete
          v-model:value="query.origin"
          :options="originOptions"
          allow-clear
          placeholder="请输入或选择内容"
          style="width: 260px"
          @search="originKeyword = $event"
        />
        <AccountInput
          v-model:value="query.userId"
          :sys-origin="sysOrigins.length === 1 ? sysOrigins[0] : ''"
          placeholder="用户ID"
          style="width: 240px"
        />
        <Input v-model:value="query.trackId" placeholder="跟踪ID" style="width: 160px" />
        <Input v-model:value="query.id" placeholder="记录ID" style="width: 140px" />
        <DatePicker.RangePicker
          v-model:value="rangeDate"
          show-time
          style="width: 360px"
          value-format="x"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <div class="notice">注意: 可查看数据为最近1年内的数据</div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1280 }"
        @rowClick="openUserDetails"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            {{ record.runningWater?.sysOrigin || record.sysOrigin || '-' }}
          </template>
          <template v-else-if="column.key === 'userProfile'">
            <UserProfileLink
              :profile="record.userProfile"
              :tag-name="record.backOperationName"
            />
          </template>
          <template v-else-if="column.key === 'type'">
            {{ Number(record.runningWater?.type ?? record.type) === 0 ? '收入' : '支出' }}
          </template>
          <template v-else-if="column.key === 'quantity'">
            <span
              :class="Number(record.runningWater?.type ?? record.type) === 0 ? 'income' : 'expense'"
            >
              {{ Number(record.runningWater?.type ?? record.type) === 0 ? '+' : '-' }}
              {{ record.runningWater?.quantity ?? record.quantity ?? 0 }}
            </span>
          </template>
          <template v-else-if="column.key === 'balance'">
            {{ record.runningWater?.balance ?? record.balance ?? '-' }}
          </template>
          <template v-else-if="column.key === 'originName'">
            <Space direction="vertical" size="small">
              <span>
                {{ record.runningWater?.originName || record.originName || '-' }}
                <span v-if="record.runningWater?.remark || record.remark">
                  ({{ record.runningWater?.remark || record.remark }})
                </span>
              </span>
              <Tag color="default">
                标签: {{ record.runningWater?.origin || record.origin || '-' }}
              </Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.runningWater?.createTime || record.createTime) }}
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <Button
          v-if="!notMore"
          :loading="loadMoreLoading"
          size="small"
          @click="loadData(false)"
        >
          加载更多
        </Button>
        <span v-else>已加载全部</span>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.notice {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  color: #ad6800;
  margin-bottom: 16px;
  padding: 10px 12px;
}

.income {
  color: #cf1322;
}

.expense {
  color: #262626;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
