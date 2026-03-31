<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { useClipboard } from '@vueuse/core';
import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  addRegionAssistConfig,
  addRegionConfig,
  deleteRegionAssistConfig,
  regionAssistConfigTable,
  regionConfigTable,
  resetRegionWithdrawal,
  updateRegionAssistConfig,
  updateRegionConfig,
} from '#/api/legacy/system';
import {
  BANK_CARD_TYPES,
  formatDate,
  getAllowedSysOrigins,
  REGION_ASSIST_TYPES,
} from '#/views/system/shared';

import {
  Button,
  Card,
  Checkbox,
  Col,
  Drawer,
  Form,
  FormItem,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectOption,
  Space,
  Table,
  TabPane,
  Tabs,
  TextArea,
  Tooltip,
  message,
} from 'antdv-next';

defineOptions({ name: 'SystemRegionConfig' });

interface RegionMetadataField {
  describe: string;
  key: string;
  label: string;
  type: 'checkbox' | 'radio';
  value: boolean | string;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createRegionMetadata(): RegionMetadataField[] {
  return [
    {
      describe: '开启钱包后当前区域用户都可以使用钱包功能(显示钱包模块)',
      key: 'walletVisible',
      label: '开启钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '在区域钱包关闭情况下,代理角色能使用钱包',
      key: 'agentWalletVisible',
      label: '代理钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '将主播工资结算到代理钱包中, 否则将结算到主播自己的钱包',
      key: 'hostSalaryToAgent',
      label: '主播工资结算代理钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '允许使用钱包“兑换金币”功能(显示兑换金币按钮)',
      key: 'openExchangeGold',
      label: '允许钱包兑换金币',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '允许使用钱包“转账”功能(显示转账按钮)',
      key: 'openTransfer',
      label: '允许钱包转账',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '勾选后用户可以发起钱包提现',
      key: 'openWithdraw',
      label: '允许钱包提现',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '开启后用户可以使用钻石兑换金币',
      key: 'openDiamondExchangeGold',
      label: '开启钻石兑换金币',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '开启之后该区域下的代理将可以删除自己名下主播',
      key: 'openTeamDelHost',
      label: '开启代理删除主播权限',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '开启之后该区域下的主播将可以发起与代理解约申请',
      key: 'openHostApplyQuitTeam',
      label: '开启主播申请解约权限',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '勾选后用户可以看到银行卡菜单',
      key: 'openBankCardMenu',
      label: '显示银行卡菜单',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '勾选后用户可以看到 KYC 菜单',
      key: 'openKycMenu',
      label: '显示KYC菜单',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '请慎重选择，一旦开启日结模式后将停止使用月结工资，且无法恢复',
      key: 'openDailyAutoSalary',
      label: '支付工资模式',
      type: 'radio',
      value: 'false',
    },
  ];
}

function createDiamondMetadata(): RegionMetadataField[] {
  return [
    {
      describe: '开启钱包后当前区域用户都可以使用钱包功能(显示钱包模块)',
      key: 'walletVisible',
      label: '开启钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '在区域钱包关闭情况下,代理角色能使用钱包',
      key: 'agentWalletVisible',
      label: '代理钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '将主播工资结算到代理钱包中, 否则将结算到主播自己的钱包',
      key: 'hostSalaryToAgent',
      label: '主播工资结算代理钱包',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '允许使用钱包“兑换金币”功能(显示兑换金币按钮)',
      key: 'openExchangeGold',
      label: '允许钱包兑换金币',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '允许使用钱包“转账”功能(显示转账按钮)',
      key: 'openTransfer',
      label: '允许钱包转账',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '勾选后用户可以发起钱包提现',
      key: 'openWithdraw',
      label: '允许钱包提现',
      type: 'checkbox',
      value: false,
    },
    {
      describe: '请慎重选择，一旦开启日结模式后将停止使用月结工资，且无法恢复',
      key: 'openDailyAutoSalary',
      label: '支付工资模式',
      type: 'radio',
      value: 'false',
    },
  ];
}

function createRegionForm() {
  return {
    countryCodes: '',
    diamondMetadata: {},
    diamondMetadatas: createDiamondMetadata(),
    id: '',
    langeCodes: '',
    metadata: {},
    metadatas: createRegionMetadata(),
    regionCode: '',
    regionName: '',
    remarks: '',
    sysOrigin: '',
    withdrawalWaysList: [] as string[],
  };
}

function createAssistForm() {
  return {
    data: '',
    id: '',
    imgUrl: '',
    regionId: '',
    sysOrigin: '',
    type: '',
  };
}

const { copy } = useClipboard();
const accessStore = useAccessStore();

const activeTab = ref('region');
const loadingRegion = ref(false);
const loadingAssist = ref(false);
const savingRegion = ref(false);
const savingAssist = ref(false);
const regionDrawerOpen = ref(false);
const assistDrawerOpen = ref(false);

const regionList = ref<Array<Record<string, any>>>([]);
const assistList = ref<Array<Record<string, any>>>([]);
const regionOptions = ref<Array<Record<string, any>>>([]);

const regionQuery = reactive({
  sysOrigin: '',
});

const assistQuery = reactive({
  regionId: '',
  sysOrigin: '',
  type: '',
});

const regionForm = reactive(createRegionForm());
const assistForm = reactive(createAssistForm());
const assistExtra = reactive({
  end: '',
  start: '',
  text: '',
  value: '',
});
const regionDrawerTitle = ref('添加');
const assistDrawerTitle = ref('添加');

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const regionColumns = [
  { dataIndex: 'regionCode', key: 'regionCode', title: '区域编码', width: 140 },
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 140 },
  { dataIndex: 'countryCodes', key: 'countryCodes', title: '国家', width: 220 },
  { dataIndex: 'langeCodes', key: 'langeCodes', title: '语言', width: 180 },
  { dataIndex: 'remarks', key: 'remarks', title: '备注' },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

const assistColumns = [
  { dataIndex: 'regionName', key: 'regionName', title: '区域', width: 160 },
  { dataIndex: 'typeName', key: 'typeName', title: '业务类型', width: 280 },
  { dataIndex: 'data', key: 'data', title: '值' },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 140 },
];

const specialAssistTypes = new Set([
  'WITHDRAW_PROPORTION_TIPS',
  'COIN_SELLER_WITHDRAW_PROPORTION_TIPS',
  'WITHDRAW_PROPORTION_DIAMOND_TIPS',
  'WITHDRAW_PROPORTION_DIAMOND_USD_TIPS',
]);

watch(
  sysOriginOptions,
  (options) => {
    if (!regionQuery.sysOrigin) {
      regionQuery.sysOrigin = options[0]?.value ?? 'LIKEI';
    }
    if (!assistQuery.sysOrigin) {
      assistQuery.sysOrigin = options[0]?.value ?? 'LIKEI';
    }
  },
  { immediate: true },
);

watch(
  () => assistQuery.sysOrigin,
  () => {
    assistQuery.regionId = '';
    loadRegionOptions();
  },
  { immediate: true },
);

function assignRegionForm(target: ReturnType<typeof createRegionForm>) {
  Object.assign(regionForm, cloneValue(target));
}

function assignAssistForm(target: ReturnType<typeof createAssistForm>) {
  Object.assign(assistForm, cloneValue(target));
}

function getRegionSubmitPayload() {
  const metadata = Object.fromEntries(
    regionForm.metadatas.map((item) => [
      item.key,
      item.type === 'checkbox' ? String(Boolean(item.value)) : String(item.value),
    ]),
  );
  const diamondMetadata = Object.fromEntries(
    regionForm.diamondMetadatas.map((item) => [
      item.key,
      item.type === 'checkbox' ? String(Boolean(item.value)) : String(item.value),
    ]),
  );
  return {
    countryCodes: regionForm.countryCodes?.trim(),
    diamondMetadata,
    id: regionForm.id,
    langeCodes: regionForm.langeCodes?.trim(),
    metadata,
    regionCode: regionForm.regionCode?.trim(),
    regionName: regionForm.regionName?.trim(),
    remarks: regionForm.remarks?.trim(),
    sysOrigin: regionQuery.sysOrigin,
    withdrawalWaysList: [...(regionForm.withdrawalWaysList || [])],
  };
}

function fillRegionForm(row?: Record<string, any>) {
  const nextForm = createRegionForm();
  if (!row) {
    assignRegionForm(nextForm);
    return;
  }
  nextForm.id = row.id || '';
  nextForm.regionCode = row.regionCode || '';
  nextForm.regionName = row.regionName || '';
  nextForm.countryCodes = row.countryCodes || '';
  nextForm.langeCodes = row.langeCodes || '';
  nextForm.remarks = row.remarks || '';
  nextForm.withdrawalWaysList = Array.isArray(row.withdrawalWaysList)
    ? [...row.withdrawalWaysList]
    : String(row.withdrawalWays || '')
        .split(',')
        .filter(Boolean);

  const metadata = row.metadata || {};
  nextForm.metadatas = createRegionMetadata().map((item) => ({
    ...item,
    value:
      item.type === 'checkbox'
        ? metadata[item.key] === 'true'
        : (metadata[item.key] ?? item.value),
  }));

  const diamondMetadata = row.diamondMetadata || {};
  nextForm.diamondMetadatas = createDiamondMetadata().map((item) => ({
    ...item,
    value:
      item.type === 'checkbox'
        ? diamondMetadata[item.key] === 'true'
        : (diamondMetadata[item.key] ?? item.value),
  }));

  assignRegionForm(nextForm);
}

function getAssistDesc(row: Record<string, any>) {
  if (
    row.type === 'WITHDRAW_PROPORTION_TIPS' ||
    row.type === 'COIN_SELLER_WITHDRAW_PROPORTION_TIPS'
  ) {
    const data = JSON.parse(row.data || '{}');
    return `(1$ : ${data.value}) 范围:${data.start}~${data.end} 提示:${data.text}`;
  }
  if (
    row.type === 'WITHDRAW_PROPORTION_DIAMOND_TIPS' ||
    row.type === 'WITHDRAW_PROPORTION_DIAMOND_USD_TIPS'
  ) {
    const data = JSON.parse(row.data || '{}');
    return `(1钻石 : ${data.value}) 范围:${data.start}~${data.end} 提示:${data.text}`;
  }
  return row.data || '-';
}

function fillAssistForm(row?: Record<string, any>) {
  const nextForm = createAssistForm();
  Object.assign(assistExtra, {
    end: '',
    start: '',
    text: '',
    value: '',
  });
  if (!row) {
    assignAssistForm(nextForm);
    return;
  }
  nextForm.id = row.id || '';
  nextForm.regionId = row.regionId || '';
  nextForm.type = row.type || '';
  nextForm.data = row.data || '';
  nextForm.imgUrl = row.imgUrl || '';
  if (specialAssistTypes.has(nextForm.type) && nextForm.data) {
    Object.assign(assistExtra, JSON.parse(nextForm.data));
  }
  assignAssistForm(nextForm);
}

async function loadRegionList() {
  loadingRegion.value = true;
  try {
    regionList.value = await regionConfigTable({ ...regionQuery });
  } finally {
    loadingRegion.value = false;
  }
}

async function loadRegionOptions() {
  if (!assistQuery.sysOrigin) {
    regionOptions.value = [];
    return;
  }
  regionOptions.value = await regionConfigTable({
    sysOrigin: assistQuery.sysOrigin,
  });
}

async function loadAssistList() {
  loadingAssist.value = true;
  try {
    assistList.value = await regionAssistConfigTable({ ...assistQuery });
  } finally {
    loadingAssist.value = false;
  }
}

async function handleSaveRegion() {
  if (!regionForm.regionCode?.trim()) {
    message.warning('请输入区域编码');
    return;
  }
  if (!regionForm.regionName?.trim()) {
    message.warning('请输入区域名称');
    return;
  }

  savingRegion.value = true;
  try {
    const payload = getRegionSubmitPayload();
    if (regionForm.id) {
      await updateRegionConfig(payload);
    } else {
      await addRegionConfig(payload);
    }
    message.success('保存成功');
    regionDrawerOpen.value = false;
    await loadRegionList();
    await loadRegionOptions();
  } finally {
    savingRegion.value = false;
  }
}

async function handleSaveAssist() {
  if (!assistForm.regionId) {
    message.warning('请选择区域');
    return;
  }
  if (!assistForm.type) {
    message.warning('请选择业务类型');
    return;
  }

  const payload = {
    ...assistForm,
    data: assistForm.data,
    sysOrigin: assistQuery.sysOrigin,
  };

  if (specialAssistTypes.has(assistForm.type)) {
    payload.data = JSON.stringify({ ...assistExtra });
  }

  if (!payload.data && !specialAssistTypes.has(assistForm.type)) {
    message.warning('请填写值');
    return;
  }

  savingAssist.value = true;
  try {
    if (assistForm.id) {
      await updateRegionAssistConfig(payload);
    } else {
      await addRegionAssistConfig(payload);
    }
    message.success('保存成功');
    assistDrawerOpen.value = false;
    await loadAssistList();
  } finally {
    savingAssist.value = false;
  }
}

function openRegionCreate() {
  regionDrawerTitle.value = '添加';
  fillRegionForm();
  regionDrawerOpen.value = true;
}

function openRegionUpdate(row: Record<string, any>) {
  regionDrawerTitle.value = '修改';
  fillRegionForm(row);
  regionDrawerOpen.value = true;
}

function copyRegionId(row: Record<string, any>) {
  copy(String(row.id || '')).then(() => {
    message.success('已复制');
  });
}

function handleResetWithdrawal(row: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await resetRegionWithdrawal(row.id);
      message.success('已重置');
      await loadRegionList();
    },
    title: '是否确定重置，该区域的团队用户将可重新发起？',
  });
}

function openAssistCreate() {
  assistDrawerTitle.value = '添加';
  fillAssistForm();
  assistDrawerOpen.value = true;
}

function openAssistUpdate(row: Record<string, any>) {
  assistDrawerTitle.value = '修改';
  fillAssistForm(row);
  assistDrawerOpen.value = true;
}

function handleDeleteAssist(row: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await deleteRegionAssistConfig(row.id);
      message.success('删除成功');
      await loadAssistList();
    },
    title: '确认删除吗？',
  });
}

loadRegionList();
loadAssistList();
</script>

<template>
  <Page title="区域配置">
    <Tabs v-model:activeKey="activeTab">
      <TabPane key="region" tab="区域列表">
        <Card>
          <InlineFilterToolbar class="toolbar">
            <InlineFilterField label="系统">
              <SysOriginSelect
                v-model:value="regionQuery.sysOrigin"
                style="width: 140px"
                @change="loadRegionList"

                :options="sysOriginOptions"
              ></SysOriginSelect>
            </InlineFilterField>
            <Button type="primary" @click="loadRegionList">搜索</Button>
            <Button @click="openRegionCreate">新增</Button>
            <a
              class="download-link"
              href="https://img.sugartimeapp.com/web/country-code-and-language-code-data.xlsx"
              rel="noreferrer"
              target="_blank"
            >
              国家与语言 Code 文档
            </a>
          </InlineFilterToolbar>

          <Table
            :columns="regionColumns"
            :data-source="regionList"
            :loading="loadingRegion"
            :pagination="false"
            :row-key="(record: Record<string, any>) => record.id"
            :scroll="{ x: 1180 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'createTime'">
                {{ formatDate(record.createTime) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space>
                  <Button size="small" type="link" @click="openRegionUpdate(record)">
                    修改
                  </Button>
                  <Button size="small" type="link" @click="copyRegionId(record)">
                    复制ID
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    @click="handleResetWithdrawal(record)"
                  >
                    重置提现
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>

      <TabPane key="assist" tab="辅助配置">
        <Card>
          <InlineFilterToolbar class="toolbar">
            <InlineFilterField label="系统">
              <SysOriginSelect
                v-model:value="assistQuery.sysOrigin"
                style="width: 140px"
                @change="loadAssistList"

                :options="sysOriginOptions"
              ></SysOriginSelect>
            </InlineFilterField>
            <InlineFilterField label="区域">
              <Select
                v-model:value="assistQuery.regionId"
                allow-clear
                option-label-prop="children"
                placeholder="请选择区域"
                style="width: 180px"
              >
                <SelectOption
                  v-for="item in regionOptions"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.regionName }}
                </SelectOption>
              </Select>
            </InlineFilterField>
            <InlineFilterField label="业务类型" :label-width="84">
              <Select
                v-model:value="assistQuery.type"
                allow-clear
                option-label-prop="children"
                placeholder="业务类型"
                style="width: 280px"
              >
                <SelectOption
                  v-for="item in REGION_ASSIST_TYPES"
                  :key="item.value"
                  :value="item.value"
                >
                  {{ item.name }}
                </SelectOption>
              </Select>
            </InlineFilterField>
            <Button type="primary" @click="loadAssistList">搜索</Button>
            <Button @click="openAssistCreate">新增</Button>
          </InlineFilterToolbar>

          <Table
            :columns="assistColumns"
            :data-source="assistList"
            :loading="loadingAssist"
            :pagination="false"
            :row-key="(record: Record<string, any>) => record.id"
            :scroll="{ x: 1200 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'data'">
                {{ getAssistDesc(record) }}
              </template>
              <template v-else-if="column.key === 'createTime'">
                {{ formatDate(record.createTime) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space>
                  <Button size="small" type="link" @click="openAssistUpdate(record)">
                    修改
                  </Button>
                  <Button size="small" type="link" danger @click="handleDeleteAssist(record)">
                    删除
                  </Button>
                </Space>
              </template>
            </template>
          </Table>
        </Card>
      </TabPane>
    </Tabs>

    <Drawer
      :open="regionDrawerOpen"
      :title="`${regionDrawerTitle}（${regionQuery.sysOrigin}）`"
      destroy-on-close
      width="620"
      @close="regionDrawerOpen = false"
    >
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
        <FormItem label="区域编码">
          <Input
            v-model:value="regionForm.regionCode"
            :disabled="savingRegion || Boolean(regionForm.id)"
            placeholder="区域编码(慎重填写,不可修改)"
          />
        </FormItem>
        <FormItem label="区域名称">
          <Input
            v-model:value="regionForm.regionName"
            :disabled="savingRegion"
            placeholder="请输入区域名称"
          />
        </FormItem>
        <FormItem label="国家">
          <Input
            v-model:value="regionForm.countryCodes"
            :disabled="savingRegion"
            placeholder="如: CN,IN 多个使用英文逗号分隔"
          />
        </FormItem>
        <FormItem label="语言">
          <Input
            v-model:value="regionForm.langeCodes"
            :disabled="savingRegion"
            placeholder="如: ar,en 多个使用英文逗号分隔"
          />
        </FormItem>
        <FormItem label="备注">
          <TextArea
            v-model:value="regionForm.remarks"
            :disabled="savingRegion"
            :rows="4"
            placeholder="请输入备注"
          />
        </FormItem>
        <FormItem label="提现方式">
          <Select option-label-prop="children"
            v-model:value="regionForm.withdrawalWaysList"
            :disabled="savingRegion"
            mode="multiple"
            placeholder="请选择"
          >
            <SelectOption
              v-for="item in BANK_CARD_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="美金$钱包设置">
          <div class="metadata-group">
            <div
              v-for="item in regionForm.metadatas"
              :key="item.key"
              class="metadata-item"
            >
              <template v-if="item.type === 'radio'">
                <div class="metadata-label">
                  <span>{{ item.label }}</span>
                  <Tooltip :title="item.describe">
                    <span class="metadata-help">?</span>
                  </Tooltip>
                </div>
                <RadioGroup v-model:value="item.value">
                  <Radio :disabled="item.value === 'true'" value="false">
                    月结模式
                  </Radio>
                  <Radio value="true">日结模式</Radio>
                </RadioGroup>
              </template>
              <template v-else>
                <Checkbox v-model:checked="item.value as boolean">
                  {{ item.label }}
                </Checkbox>
                <Tooltip :title="item.describe">
                  <span class="metadata-help">?</span>
                </Tooltip>
              </template>
            </div>
          </div>
        </FormItem>
        <FormItem label="钻石钱包设置">
          <div class="metadata-group">
            <div
              v-for="item in regionForm.diamondMetadatas"
              :key="item.key"
              class="metadata-item"
            >
              <template v-if="item.type === 'radio'">
                <div class="metadata-label">
                  <span>{{ item.label }}</span>
                  <Tooltip :title="item.describe">
                    <span class="metadata-help">?</span>
                  </Tooltip>
                </div>
                <RadioGroup v-model:value="item.value">
                  <Radio :disabled="item.value === 'true'" value="false">
                    月结模式
                  </Radio>
                  <Radio value="true">日结模式</Radio>
                </RadioGroup>
              </template>
              <template v-else>
                <Checkbox v-model:checked="item.value as boolean">
                  {{ item.label }}
                </Checkbox>
                <Tooltip :title="item.describe">
                  <span class="metadata-help">?</span>
                </Tooltip>
              </template>
            </div>
          </div>
        </FormItem>
      </Form>

      <template #footer>
        <Space>
          <Button @click="regionDrawerOpen = false">取消</Button>
          <Button :loading="savingRegion" type="primary" @click="handleSaveRegion">
            保存
          </Button>
        </Space>
      </template>
    </Drawer>

    <Drawer
      :open="assistDrawerOpen"
      :title="`${assistDrawerTitle}（${assistQuery.sysOrigin}）`"
      destroy-on-close
      width="580"
      @close="assistDrawerOpen = false"
    >
      <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" layout="horizontal">
        <FormItem label="业务类型">
          <Select option-label-prop="children"
            v-model:value="assistForm.type"
            :disabled="savingAssist || Boolean(assistForm.id)"
            placeholder="请选择业务类型"
          >
            <SelectOption
              v-for="item in REGION_ASSIST_TYPES"
              :key="item.value"
              :value="item.value"
            >
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="区域">
          <Select option-label-prop="children"
            v-model:value="assistForm.regionId"
            :disabled="savingAssist || Boolean(assistForm.id)"
            placeholder="请选择区域"
          >
            <SelectOption
              v-for="item in regionOptions"
              :key="item.id"
              :value="item.id"
            >
              {{ item.regionName }}
            </SelectOption>
          </Select>
        </FormItem>
        <template v-if="assistForm.type === 'DIAMOND_EXCHANGE_GOLD'">
          <FormItem label="值">
            <Input
              v-model:value="assistForm.data"
              :disabled="savingAssist"
              placeholder="钻石兑换金币比例(%)"
            />
          </FormItem>
        </template>
        <template v-else-if="assistForm.type === 'MIN_EXCHANGE_DIAMOND'">
          <FormItem label="值">
            <Input
              v-model:value="assistForm.data"
              :disabled="savingAssist"
              placeholder="钻石起兑最小数量"
            />
          </FormItem>
        </template>
        <template v-else-if="specialAssistTypes.has(assistForm.type)">
          <Row :gutter="12">
            <Col :span="12">
              <FormItem :label="assistForm.type.includes('USD') || assistForm.type.includes('DIAMOND') ? '开始值' : '>=美元'">
                <Input v-model:value="assistExtra.start" :disabled="savingAssist" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem :label="assistForm.type.includes('USD') || assistForm.type.includes('DIAMOND') ? '结束值' : '<=美元'">
                <Input v-model:value="assistExtra.end" :disabled="savingAssist" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="比例值">
                <Input v-model:value="assistExtra.value" :disabled="savingAssist" />
              </FormItem>
            </Col>
            <Col :span="12">
              <FormItem label="提示文案">
                <Input v-model:value="assistExtra.text" :disabled="savingAssist" />
              </FormItem>
            </Col>
          </Row>
        </template>
        <template
          v-else-if="
            [
              'ROOM_CONTRIBUTION_ACTIVITY_RATIO',
              'GIFT_TO_OWN_GOLD_RATIO',
              'GIFT_TO_OTHER_GOLD_RATIO',
              'HOST_TERMINATION_FEE',
              'WITHDRAWAL_COMMISSION_RATIO',
              'GIFT_TO_OTHER_DIAMOND_RATIO',
              'GIFT_TO_OTHER_DIAMOND_RATIO_AGENCY',
              'GIFT_TARGET_RATIO',
              'GIFT_TO_OTHER_GOLD_RATIO_NORMAL',
              'GIFT_TO_OWN_GOLD_RATIO_NORMAL',
              'RESIDUE_TARGET_EXCHANGE_PROPORTION',
            ].includes(assistForm.type)
          "
        >
          <FormItem label="值">
            <Input
              v-model:value="assistForm.data"
              :disabled="savingAssist"
              placeholder="请输入内容"
            />
          </FormItem>
          <FormItem
            v-if="assistForm.type === 'ROOM_CONTRIBUTION_ACTIVITY_RATIO'"
            label="图片"
          >
            <Input
              v-model:value="assistForm.imgUrl"
              :disabled="savingAssist"
              placeholder="请输入图片地址"
            />
          </FormItem>
        </template>
      </Form>

      <template #footer>
        <Space>
          <Button @click="assistDrawerOpen = false">取消</Button>
          <Button :loading="savingAssist" type="primary" @click="handleSaveAssist">
            保存
          </Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.download-link {
  color: var(--color-primary);
}

.metadata-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-item {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  padding: 12px 14px;
}

.metadata-help {
  align-items: center;
  border: 1px solid #d4d4d8;
  border-radius: 999px;
  display: inline-flex;
  height: 18px;
  justify-content: center;
  margin-left: 8px;
  width: 18px;
}

.metadata-label {
  align-items: center;
  display: flex;
  margin-bottom: 8px;
}
</style>
