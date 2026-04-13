<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  getPairCpGiveGiftId,
  giftTable,
  listGiftBySysOrigin,
  pushPairCpGiveGiftId,
  switchDelStatus,
} from '#/api/legacy/gift';
import { getAccessImgUrl } from '#/api/legacy/oss';
import {
  addWeekStarGroup,
  delWeekStarGroup,
  getWeekStarGroupPage,
  regionConfigTable,
} from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';
import { copyText } from '#/views/operate/shared';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  TabPane,
  Tag,
  message,
} from 'antdv-next';

import {
  GIFT_CONFIG_TAB_OPTIONS,
} from './constants';
import GiftFormModal from './components/gift-form-modal.vue';

defineOptions({ name: 'OperateGiftConfig' });

const SORT_OPTIONS = [
  { label: '创建时间降序', value: 'CREATE_TIME_DESC' },
  { label: '金额降序', value: 'AMOUNT_DESC' },
  { label: '权重降序', value: 'SORT_DESC' },
];

const SHELF_OPTIONS = [
  { label: '下架', value: true },
  { label: '上架', value: false },
];

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const activeTab = ref('setting');

const settingLoading = ref(false);
const settingList = ref<Array<Record<string, any>>>([]);
const settingTotal = ref(0);
const regions = ref<Array<Record<string, any>>>([]);
const settingRangeDate = ref<[string, string] | null>(null);
const settingQuery = reactive({
  cursor: 1,
  del: false as boolean | undefined,
  endCreateDate: '',
  giftId: '',
  giftName: '',
  giftTab: '',
  limit: 20,
  region: '',
  sortType: 'CREATE_TIME_DESC',
  startCreateDate: '',
  sysOrigin: '',
  type: '',
  userId: '',
});

const giftFormOpen = ref(false);
const activeGiftRow = ref<Record<string, any> | null>(null);

const weekStarLoading = ref(false);
const weekStarList = ref<Array<Record<string, any>>>([]);
const weekStarTotal = ref(0);
const weekStarQuery = reactive({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
});
const weekStarOpen = ref(false);
const weekStarSaving = ref(false);
const weekStarForm = reactive({
  giftOne: '',
  giftThree: '',
  giftTwo: '',
  sysOrigin: '',
});
const weekStarGiftOptions = ref<Array<Record<string, any>>>([]);

function getWeekStarSelectOptions(currentValue: string) {
  return weekStarGiftOptions.value.map((item) => ({
    disabled:
      isWeekStarGiftDisabled(item.id) &&
      String(currentValue || '') !== String(item.id || ''),
    label: String(item.giftName || item.id || '-'),
    value: item.id as any,
  }));
}

const cpLoading = ref(false);
const cpSaving = ref(false);
const cpForm = reactive({
  giftId: '',
  sysOrigin: '',
});

const settingColumns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'giftCode', key: 'giftCode', title: 'Code', width: 160 },
  { dataIndex: 'giftPhoto', key: 'giftPhoto', title: '封面', width: 100 },
  { dataIndex: 'giftName', key: 'giftName', title: '名称', width: 160 },
  { dataIndex: 'giftCandy', key: 'giftCandy', title: '金币', width: 100 },
  { dataIndex: 'giftIntegral', key: 'giftIntegral', title: '积分', width: 100 },
  { dataIndex: 'regionNameStr', key: 'regionNameStr', title: '区域', width: 180 },
  { dataIndex: 'typeName', key: 'typeName', title: '类型', width: 120 },
  { dataIndex: 'sort', key: 'sort', title: '排序权重', width: 100 },
  { dataIndex: 'del', key: 'del', title: '上/下架', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '专属礼物归属人', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 180 },
];

const weekStarColumns = [
  { dataIndex: 'id', key: 'id', title: '编号', width: 120 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '归属系统', width: 120 },
  { dataIndex: 'displayNumber', key: 'displayNumber', title: '展示次数', width: 120 },
  { dataIndex: 'sysGiftConfigs', key: 'sysGiftConfigs', title: '礼物信息', width: 360 },
  { dataIndex: 'type', key: 'type', title: '状态', width: 120 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

watch(settingRangeDate, (value) => {
  settingQuery.startCreateDate = value?.[0] || '';
  settingQuery.endCreateDate = value?.[1] || '';
});

watch(
  sysOriginOptions,
  (options) => {
    const first = String(options[0]?.value || '');
    if (!settingQuery.sysOrigin && first) {
      settingQuery.sysOrigin = first;
      cpForm.sysOrigin = first;
      weekStarQuery.sysOrigin = first;
      void loadSetting(true);
      void loadRegions(first);
      void loadCp();
      void loadWeekStar(true);
    }
  },
  { immediate: true },
);

async function loadRegions(sysOrigin: string) {
  if (!sysOrigin) {
    regions.value = [];
    return;
  }
  regions.value = (await regionConfigTable({ sysOrigin })) || [];
}

async function loadSetting(reset = false) {
  if (!settingQuery.sysOrigin) {
    return;
  }
  if (reset) {
    settingQuery.cursor = 1;
  }
  settingLoading.value = true;
  try {
    const result = await giftTable({ ...settingQuery });
    settingList.value = result.records || [];
    settingTotal.value = result.total || 0;
  } finally {
    settingLoading.value = false;
  }
}

async function loadWeekStar(reset = false) {
  if (!weekStarQuery.sysOrigin) {
    return;
  }
  if (reset) {
    weekStarQuery.cursor = 1;
  }
  weekStarLoading.value = true;
  try {
    const result = await getWeekStarGroupPage({ ...weekStarQuery });
    weekStarList.value = result.records || [];
    weekStarTotal.value = result.total || 0;
  } finally {
    weekStarLoading.value = false;
  }
}

async function loadCp() {
  if (!cpForm.sysOrigin) {
    return;
  }
  cpLoading.value = true;
  try {
    cpForm.giftId = String((await getPairCpGiveGiftId(cpForm.sysOrigin)) || '');
  } finally {
    cpLoading.value = false;
  }
}

function handleSettingPageChange(page: number, pageSize: number) {
  settingQuery.cursor = page;
  settingQuery.limit = pageSize;
  void loadSetting();
}

function handleWeekStarPageChange(page: number, pageSize: number) {
  weekStarQuery.cursor = page;
  weekStarQuery.limit = pageSize;
  void loadWeekStar();
}

async function handleCopy(url?: string) {
  if (!url) {
    return;
  }
  await copyText(getAccessImgUrl(url));
  message.success('复制成功');
}

async function handleSwitch(record: Record<string, any>) {
  await switchDelStatus(record.id, record.del);
  message.success('操作成功');
  await loadSetting(false);
}

function openGiftCreate() {
  activeGiftRow.value = null;
  giftFormOpen.value = true;
}

function openGiftEdit(row: Record<string, any>) {
  activeGiftRow.value = row;
  giftFormOpen.value = true;
}

async function openWeekStarModal() {
  weekStarForm.sysOrigin = weekStarQuery.sysOrigin;
  weekStarForm.giftOne = '';
  weekStarForm.giftTwo = '';
  weekStarForm.giftThree = '';
  weekStarGiftOptions.value = await listGiftBySysOrigin(weekStarForm.sysOrigin);
  weekStarOpen.value = true;
}

function isWeekStarGiftDisabled(value: number | string) {
  return (
    String(weekStarForm.giftOne) === String(value) ||
    String(weekStarForm.giftTwo) === String(value) ||
    String(weekStarForm.giftThree) === String(value)
  );
}

async function handleWeekStarSubmit() {
  if (
    !weekStarForm.sysOrigin ||
    !weekStarForm.giftOne ||
    !weekStarForm.giftTwo ||
    !weekStarForm.giftThree
  ) {
    message.warning('请完整选择三组礼物');
    return;
  }
  weekStarSaving.value = true;
  try {
    await addWeekStarGroup({
      giftIds: [weekStarForm.giftOne, weekStarForm.giftTwo, weekStarForm.giftThree],
      sysOrigin: weekStarForm.sysOrigin,
    });
    message.success('保存成功');
    weekStarOpen.value = false;
    await loadWeekStar(true);
  } finally {
    weekStarSaving.value = false;
  }
}

async function handleWeekStarDelete(row: Record<string, any>) {
  await delWeekStarGroup(row.id);
  message.success('删除成功');
  await loadWeekStar(true);
}

async function handleCpSave() {
  if (!cpForm.sysOrigin || !cpForm.giftId) {
    message.warning('请输入礼物ID');
    return;
  }
  cpSaving.value = true;
  try {
    await pushPairCpGiveGiftId(cpForm.giftId, cpForm.sysOrigin);
    message.success('保存成功');
    await loadCp();
  } finally {
    cpSaving.value = false;
  }
}
</script>

<template>
  <Page title="礼物管理">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="setting" tab="礼物配置" />
        <TabPane key="weekStar" tab="周星礼物配置" />
        <TabPane key="cp" tab="CP组合赠送礼物" />
      </Tabs>

      <div v-if="activeTab === 'setting'">
        <Space class="toolbar" wrap>
          <SysOriginSelect
            v-model:value="settingQuery.sysOrigin"
            style="width: 160px"
            @change="loadRegions(settingQuery.sysOrigin); loadSetting(true)"
            :options="sysOriginOptions"
          />
          <Select option-label-prop="label" v-model:value="settingQuery.giftTab" allow-clear style="width: 160px"
            :options="GIFT_CONFIG_TAB_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
          <Select
            option-label-prop="label"
            v-model:value="settingQuery.sortType"
            allow-clear
            style="width: 160px"
            @change="loadSetting(true)"
          
            :options="SORT_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <Select option-label-prop="label" v-model:value="settingQuery.del" allow-clear style="width: 140px"
            :options="SHELF_OPTIONS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <Input
            v-model:value="settingQuery.giftId"
            placeholder="礼物ID"
            style="width: 160px"
          />
          <Input
            v-model:value="settingQuery.giftName"
            placeholder="礼物名称"
            style="width: 180px"
          />
          <AccountInput
            v-model:value="settingQuery.userId"
            :sys-origin="settingQuery.sysOrigin"
            placeholder="专属礼物归属人"
            style="width: 240px"
          />
          <DatePicker.RangePicker
            v-model:value="settingRangeDate"
            show-time
            style="width: 360px"
            value-format="x"
          />
          <Button :loading="settingLoading" type="primary" @click="loadSetting(true)">
            搜索
          </Button>
          <Button type="primary" @click="openGiftCreate">
            新增礼物
          </Button>
        </Space>

        <Table
          :columns="settingColumns"
          :data-source="settingList"
          :loading="settingLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1680 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'giftPhoto'">
              <div class="week-star-gift">
                <Image :src="getAccessImgUrl(record.giftPhoto)" class="gift-image" />
                <Button size="small" type="link" @click="handleCopy(record.giftPhoto)">
                  复制
                </Button>
              </div>
            </template>
            <template v-else-if="column.key === 'del'">
              <Switch
                :checked="!record.del"
                @change="record.del = !$event; handleSwitch(record)"
              />
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'userBaseInfo'">
              {{ record.userBaseInfo?.actualAccount || record.userBaseInfo?.id || '-' }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button size="small" type="link" @click="openGiftEdit(record)">
                编辑
              </Button>
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="settingQuery.cursor"
            :page-size="settingQuery.limit"
            :total="settingTotal"
            show-size-changer
            @change="handleSettingPageChange"
            @showSizeChange="handleSettingPageChange"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'weekStar'">
        <Space class="toolbar" wrap>
          <SysOriginSelect
            v-model:value="weekStarQuery.sysOrigin"
            style="width: 160px"
            @change="loadWeekStar(true)"
            :options="sysOriginOptions"
          />
          <Button type="primary" @click="openWeekStarModal">
            新增
          </Button>
          <Tag color="warning">注意：周星正常运行切换最少需要配置 3 组礼物</Tag>
        </Space>

        <Table
          :columns="weekStarColumns"
          :data-source="weekStarList"
          :loading="weekStarLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 920 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sysGiftConfigs'">
              <div class="week-star-gifts">
                <div
                  v-for="item in record.sysGiftConfigs || []"
                  :key="item.id"
                  class="week-star-gift"
                >
                  <Image :src="getAccessImgUrl(item.giftPhoto)" class="gift-image" />
                  <div>{{ item.giftCandy || 0 }}</div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              {{
                record.type === 'THIS_WEEK'
                  ? '当前'
                  : record.type === 'LAST_WEEK'
                    ? '上周'
                    : record.type === 'NEXT_WEEK'
                      ? '下周'
                      : '-'
              }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                danger
                size="small"
                type="link"
                :disabled="record.type !== 'NONE' || weekStarList.length <= 3"
                @click="handleWeekStarDelete(record)"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="weekStarQuery.cursor"
            :page-size="weekStarQuery.limit"
            :total="weekStarTotal"
            show-size-changer
            @change="handleWeekStarPageChange"
            @showSizeChange="handleWeekStarPageChange"
          />
        </div>
      </div>

      <div v-else class="cp-panel">
        <Space class="toolbar" wrap>
          <SysOriginSelect
            v-model:value="cpForm.sysOrigin"
            style="width: 160px"
            @change="loadCp"
            :options="sysOriginOptions"
          />
          <Input
            v-model:value="cpForm.giftId"
            placeholder="礼物ID"
            style="width: 180px"
          />
          <Button :loading="cpSaving || cpLoading" type="primary" @click="handleCpSave">
            保存
          </Button>
        </Space>
      </div>
    </Card>

    <GiftFormModal
      :open="giftFormOpen"
      :row="activeGiftRow"
      :sys-origin="settingQuery.sysOrigin"
      @close="giftFormOpen = false"
      @success="loadSetting(true)"
    />

    <Modal
      :confirm-loading="weekStarSaving"
      :open="weekStarOpen"
      destroy-on-close
      title="添加周星礼物组"
      @cancel="weekStarOpen = false"
      @ok="handleWeekStarSubmit"
    >
      <Space direction="vertical" style="width: 100%">
        <SysOriginSelect
          v-model:value="weekStarForm.sysOrigin"
          disabled
          :options="sysOriginOptions"
        />
        <Select
          v-model:value="weekStarForm.giftOne"
          :options="getWeekStarSelectOptions(String(weekStarForm.giftOne || ''))"
          option-label-prop="label"
          placeholder="礼物1"
        />
        <Select
          v-model:value="weekStarForm.giftTwo"
          :options="getWeekStarSelectOptions(String(weekStarForm.giftTwo || ''))"
          option-label-prop="label"
          placeholder="礼物2"
        />
        <Select
          v-model:value="weekStarForm.giftThree"
          :options="getWeekStarSelectOptions(String(weekStarForm.giftThree || ''))"
          option-label-prop="label"
          placeholder="礼物3"
        />
      </Space>
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

.gift-image {
  border-radius: 12px;
  height: 52px;
  object-fit: cover;
  width: 52px;
}

.week-star-gifts {
  display: flex;
  gap: 12px;
}

.week-star-gift {
  align-items: center;
  display: grid;
  gap: 6px;
  justify-items: center;
}

.cp-panel {
  min-height: 120px;
}
</style>
