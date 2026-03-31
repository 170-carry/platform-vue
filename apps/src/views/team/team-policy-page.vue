<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { regionConfigTable } from '#/api/legacy/system';
import {
  deleteTeamPolicy,
  teamPolicyAdd,
  teamPolicyHistoryReleases,
  teamPolicyReleases,
  type LegacyTeamPolicyItem,
} from '#/api/legacy/team';
import { listPayOpenCountry } from '#/api/legacy/pay';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Drawer,
  Empty,
  Input,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import TeamPolicyRewardEditor from './components/team-policy-reward-editor.vue';
import {
  TEAM_POLICY_META,
  clonePolicies,
  createEmptyTeamPolicyRow,
  getTeamPolicyRewardSummary,
  getTeamPolicyRewardTypeName,
  getTeamPolicyTotalSalary,
  type TeamPolicyType,
} from './policy-shared';

defineOptions({ name: 'TeamPolicyPage' });

const props = defineProps<{
  policyType: TeamPolicyType;
}>();

const accessStore = useAccessStore();
const meta = computed(() => TEAM_POLICY_META[props.policyType]);
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const regionLoading = ref(false);
const countryLoading = ref(false);
const historyLoading = ref(false);
const rewardOpen = ref(false);
const historyOpen = ref(false);
const addRowOpen = ref(false);
const isEditing = ref(false);
const isClickNewPolicyButton = ref(false);
const rewardEditAllowed = ref(false);
const addRowsNumber = ref('1');
const currentAddRowIndex = ref(-1);
const currentRewardIndex = ref(-1);
const data = ref<Record<string, any>>({});
const historyList = ref<LegacyTeamPolicyItem[]>([]);
const policies = ref<Array<Record<string, any>>>([]);
const regionOptions = ref<Array<Record<string, any>>>([]);
const countryList = ref<Array<Record<string, any>>>([]);
const currentRewardRow = ref<Record<string, any>>({});

const query = reactive({
  countryCode: '',
  policyType: props.policyType === 'SALARY_DIAMOND' ? 'SALARY_DIAMOND' : '',
  region: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? 'LIKEI',
  type: 'WEEK',
});

const formData = reactive(createFormData());

const columns = computed(() => [
  { key: 'level', title: isEditing.value ? '等级' : 'Lv', width: 90 },
  { key: 'onlineTime', title: isEditing.value ? '时间(Hour)' : '在线(Hour)', width: 120 },
  {
    key: 'effectiveDay',
    title: '有效天(当天满60分钟计有效)',
    width: 180,
  },
  { key: 'target', title: '目标', width: 120 },
  { key: 'memberSalary', title: meta.value.memberSalaryLabel, width: 140 },
  { key: 'ownSalary', title: meta.value.ownSalaryLabel, width: 140 },
  { key: 'totalSalary', title: meta.value.totalSalaryLabel, width: 140 },
  { key: 'propsRewards', title: '道具', width: 260 },
  { key: 'actions', title: '操作', width: isEditing.value ? 220 : 120, fixed: 'right' as const },
]);

function createFormData() {
  return {
    countryCode: '',
    id: '',
    policy: [] as Array<Record<string, any>>,
    policyType: props.policyType,
    region: '',
    release: false,
    sysOrigin: '',
    title: '',
  };
}

function resetFormData() {
  Object.assign(formData, createFormData());
}

function clearCurrentData() {
  data.value = {};
  policies.value = [];
  resetFormData();
}

function syncQueryToForm() {
  formData.countryCode = query.countryCode;
  formData.region = query.region;
  formData.sysOrigin = query.sysOrigin;
}

async function loadRegions(sysOrigin: string) {
  if (!sysOrigin) {
    regionOptions.value = [];
    return;
  }
  regionLoading.value = true;
  try {
    regionOptions.value = await regionConfigTable({ sysOrigin });
  } finally {
    regionLoading.value = false;
  }
}

async function loadCountries() {
  if (!meta.value.showCountryFilter) {
    return;
  }
  countryLoading.value = true;
  try {
    countryList.value = await listPayOpenCountry();
  } finally {
    countryLoading.value = false;
  }
}

async function loadData() {
  syncQueryToForm();
  if (!query.region) {
    clearCurrentData();
    return;
  }
  loading.value = true;
  try {
    const result = await teamPolicyReleases({ ...query });
    data.value = result || {};
    policies.value = clonePolicies(result?.policy);
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  if (!query.region) {
    message.warning('请选择区域');
    return;
  }
  historyLoading.value = true;
  try {
    historyList.value = await teamPolicyHistoryReleases({ ...query });
    historyOpen.value = true;
  } finally {
    historyLoading.value = false;
  }
}

function handleSearch() {
  resetFormData();
  isEditing.value = false;
  void loadData();
}

async function handleSysOriginChange(value: string) {
  query.sysOrigin = value;
  query.region = '';
  isEditing.value = false;
  clearCurrentData();
  await loadRegions(value);
}

function handleRegionChange() {
  isEditing.value = false;
  if (!query.region) {
    clearCurrentData();
    return;
  }
  void loadData();
}

function handleCountryChange(value?: string) {
  query.countryCode = value || '';
  if (!query.region) {
    clearCurrentData();
    return;
  }
  void loadData();
}

function openCreatePolicy() {
  resetFormData();
  policies.value = [];
  addRowsNumber.value = '1';
  currentAddRowIndex.value = -1;
  addRowOpen.value = true;
  isClickNewPolicyButton.value = true;
}

function openAddRow(index: number) {
  addRowsNumber.value = '1';
  currentAddRowIndex.value = index;
  addRowOpen.value = true;
  isClickNewPolicyButton.value = false;
}

function handleCancelAddRow() {
  addRowOpen.value = false;
  if (isClickNewPolicyButton.value) {
    isEditing.value = false;
  }
}

function handleAddRows() {
  const count = Math.max(1, Number(addRowsNumber.value || 1));
  isEditing.value = true;
  for (let index = 0; index < count; index += 1) {
    policies.value.splice(currentAddRowIndex.value + 1, 0, createEmptyTeamPolicyRow());
  }
  currentAddRowIndex.value = -1;
  addRowOpen.value = false;
}

function movePolicyUp(index: number) {
  if (index <= 0) {
    return;
  }
  policies.value.splice(
    index - 1,
    1,
    ...policies.value.splice(index, 1, policies.value[index - 1]!),
  );
}

function movePolicyDown(index: number) {
  if (index >= policies.value.length - 1) {
    return;
  }
  policies.value.splice(
    index,
    1,
    ...policies.value.splice(index + 1, 1, policies.value[index]!),
  );
}

function removePolicy(index: number) {
  policies.value.splice(index, 1);
}

function openRewardEditor(
  row: Record<string, any>,
  allowEdit: boolean,
  index: number,
) {
  rewardEditAllowed.value = allowEdit;
  currentRewardIndex.value = index;
  currentRewardRow.value = row || {};
  rewardOpen.value = true;
}

function handleRewardSuccess(rewards: Array<Record<string, any>>) {
  if (currentRewardIndex.value < 0) {
    rewardOpen.value = false;
    return;
  }
  policies.value[currentRewardIndex.value]!.propsRewards = rewards;
  rewardOpen.value = false;
}

function handleEditHistory(item: LegacyTeamPolicyItem) {
  policies.value = clonePolicies(item.policy);
  formData.id = item.id ? String(item.id) : '';
  formData.region = item.region ? String(item.region) : '';
  formData.title = item.title || '';
  formData.release = Boolean(item.release);
  currentAddRowIndex.value = -1;
  historyOpen.value = false;
  isEditing.value = true;
}

async function handleDeleteHistory(id?: number | string) {
  if (!id) {
    return;
  }
  Modal.confirm({
    title: '确定删除选择的政策吗?',
    async onOk() {
      loading.value = true;
      try {
        await deleteTeamPolicy(id);
        historyList.value = historyList.value.filter((item) => item.id !== id);
        message.success('删除成功');
      } finally {
        loading.value = false;
      }
    },
  });
}

async function persistPolicy(release: boolean) {
  formData.countryCode = query.countryCode;
  formData.policy = clonePolicies(policies.value).map((item) => ({
    ...item,
    totalSalary: getTeamPolicyTotalSalary(item),
  }));
  formData.region = query.region;
  formData.release = release;
  formData.sysOrigin = query.sysOrigin;

  if (!formData.region) {
    message.warning('请选择区域');
    return;
  }
  if (!String(formData.title || '').trim()) {
    message.warning('请输入政策标题');
    return;
  }

  loading.value = true;
  try {
    await teamPolicyAdd({
      ...formData,
      title: String(formData.title || '').trim(),
    });
    message.success('保存成功');
  } finally {
    loading.value = false;
  }
}

function handleSave(release: boolean) {
  if (!release) {
    void persistPolicy(false);
    return;
  }
  Modal.confirm({
    title: '确定对外发布当前政策吗?',
    async onOk() {
      await persistPolicy(true);
    },
  });
}

function cancelEditing() {
  isEditing.value = false;
  void loadData();
}

function getCountryLabel(item: Record<string, any>) {
  return item?.country?.aliasName || item?.country?.enName || '-';
}

loadRegions(query.sysOrigin);
loadCountries();
</script>

<template>
  <Page :title="meta.pageTitle">
    <Card :bordered="false">
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSysOriginChange"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="区域">
          <Select option-label-prop="label"
            v-model:value="query.region"
            :loading="regionLoading"
            allow-clear
            placeholder="请选择区域"
            style="width: 180px"
            @change="handleRegionChange"
          >
            <SelectOption
              v-for="item in regionOptions"
              :key="item.id"
              :label="item.regionName"
              :value="item.id"
            >
              {{ item.regionName }}
            </SelectOption>
          </Select>
        </InlineFilterField>
        <InlineFilterField
          v-if="meta.showCountryFilter"
          label="国家"
        >
          <Select option-label-prop="label"
            v-model:value="query.countryCode"
            :loading="countryLoading"
            allow-clear
            placeholder="国家"
            style="width: 220px"
            @change="handleCountryChange"
          >
            <SelectOption
              v-for="item in countryList"
              :key="item.id"
              :label="getCountryLabel(item)"
              :value="item.country?.alphaTwo"
            >
              {{ getCountryLabel(item) }}
            </SelectOption>
          </Select>
        </InlineFilterField>
        <Space wrap>
          <Button
            type="primary"
            @click="handleSearch"
          >
            搜索
          </Button>
          <Button
            :disabled="!query.region"
            @click="loadHistory"
          >
            {{ meta.historyAction }}
          </Button>
          <Button
            :disabled="!query.region"
            type="primary"
            @click="openCreatePolicy"
          >
            创建{{ meta.actionTitle }}
          </Button>
        </Space>
      </InlineFilterToolbar>

      <div class="policy-content">
        <div
          v-if="!isEditing"
          class="policy-overview"
        >
          <div class="policy-head">
            <div>
              <div class="policy-head__label">标题</div>
              <div class="policy-head__value">{{ data.title || '-' }}</div>
            </div>
            <div>
              <div class="policy-head__label">政策类型</div>
              <Tag color="blue">
                {{ meta.policyTypeLabel }}
              </Tag>
            </div>
          </div>

          <Table
            :columns="columns"
            :data-source="policies"
            :loading="loading"
            :pagination="false"
            :row-key="(_record, index) => index ?? 0"
            bordered
            size="middle"
          >
            <template #bodyCell="{ column, index, record }">
              <template v-if="column.key === 'level'">
                {{ record.level || 0 }}
              </template>
              <template v-else-if="column.key === 'onlineTime'">
                {{ record.onlineTime || 0 }}
              </template>
              <template v-else-if="column.key === 'effectiveDay'">
                {{ record.effectiveDay || 0 }}
              </template>
              <template v-else-if="column.key === 'target'">
                {{ record.target || 0 }}
              </template>
              <template v-else-if="column.key === 'memberSalary'">
                {{ record.memberSalary || 0 }}
              </template>
              <template v-else-if="column.key === 'ownSalary'">
                {{ record.ownSalary || 0 }}
              </template>
              <template v-else-if="column.key === 'totalSalary'">
                {{ getTeamPolicyTotalSalary(record) }}
              </template>
              <template v-else-if="column.key === 'propsRewards'">
                <div
                  v-if="Array.isArray(record.propsRewards) && record.propsRewards.length > 0"
                  class="reward-summary"
                >
                  <Tag
                    v-for="(item, rewardIndex) in record.propsRewards"
                    :key="`${rewardIndex}-${item.detailType}-${item.content}`"
                  >
                    {{ getTeamPolicyRewardTypeName(item.detailType || item.type) }}
                  </Tag>
                  <div class="reward-summary__text">
                    {{ record.propsRewards.map(getTeamPolicyRewardSummary).join('；') }}
                  </div>
                </div>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button
                  :disabled="!(record.propsRewards && record.propsRewards.length > 0)"
                  size="small"
                  type="link"
                  @click="openRewardEditor(record, false, index)"
                >
                  道具明细
                </Button>
              </template>
            </template>
          </Table>
          <Empty
            v-if="policies.length === 0 && !loading"
            description="暂无政策数据"
          />
        </div>

        <div
          v-else
          class="policy-editor"
        >
          <div class="policy-title-box">
            <Tag color="red">标题</Tag>
            <Input
              v-model:value="formData.title"
              placeholder="请输入标题"
              style="max-width: 260px"
            />
          </div>

          <Table
            :columns="columns"
            :data-source="policies"
            :loading="loading"
            :pagination="false"
            :row-key="(_record, index) => index ?? 0"
            bordered
            size="middle"
          >
            <template #bodyCell="{ column, index, record }">
              <template v-if="column.key === 'level'">
                <Input
                  v-model:value="record.level"
                  placeholder="等级"
                />
              </template>
              <template v-else-if="column.key === 'onlineTime'">
                <Input
                  v-model:value="record.onlineTime"
                  placeholder="时间"
                />
              </template>
              <template v-else-if="column.key === 'effectiveDay'">
                <Input
                  v-model:value="record.effectiveDay"
                  placeholder="有效天"
                />
              </template>
              <template v-else-if="column.key === 'target'">
                <Input
                  v-model:value="record.target"
                  placeholder="目标"
                />
              </template>
              <template v-else-if="column.key === 'memberSalary'">
                <Input
                  v-model:value="record.memberSalary"
                  :placeholder="meta.memberSalaryLabel"
                />
              </template>
              <template v-else-if="column.key === 'ownSalary'">
                <Input
                  v-model:value="record.ownSalary"
                  :placeholder="meta.ownSalaryLabel"
                />
              </template>
              <template v-else-if="column.key === 'totalSalary'">
                {{ getTeamPolicyTotalSalary(record) }}
              </template>
              <template v-else-if="column.key === 'propsRewards'">
                <div
                  v-if="Array.isArray(record.propsRewards) && record.propsRewards.length > 0"
                  class="reward-summary"
                >
                  <Tag
                    v-for="(item, rewardIndex) in record.propsRewards"
                    :key="`${rewardIndex}-${item.detailType}-${item.content}`"
                  >
                    {{ getTeamPolicyRewardTypeName(item.detailType || item.type) }}
                  </Tag>
                  <div class="reward-summary__text">
                    {{ record.propsRewards.map(getTeamPolicyRewardSummary).join('；') }}
                  </div>
                </div>
                <Button
                  size="small"
                  type="link"
                  @click="openRewardEditor(record, true, index)"
                >
                  编辑道具
                </Button>
              </template>
              <template v-else-if="column.key === 'actions'">
                <Space wrap>
                  <Button
                    size="small"
                    type="link"
                    @click="movePolicyUp(index)"
                  >
                    上移
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    @click="movePolicyDown(index)"
                  >
                    下移
                  </Button>
                  <Button
                    v-if="policies.length > 1"
                    danger
                    size="small"
                    type="link"
                    @click="removePolicy(index)"
                  >
                    删除
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    @click="openAddRow(index)"
                  >
                    增加行
                  </Button>
                </Space>
              </template>
            </template>
          </Table>

          <div class="policy-editor__footer">
            <Space>
              <Button
                v-if="!formData.release"
                type="primary"
                @click="handleSave(false)"
              >
                保存
              </Button>
              <Button
                type="primary"
                @click="handleSave(true)"
              >
                保存并发布
              </Button>
              <Button @click="cancelEditing">
                返回
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </Card>

    <Modal
      v-model:open="addRowOpen"
      destroy-on-close
      title="新增空白行"
      @cancel="handleCancelAddRow"
      @ok="handleAddRows"
    >
      <Input
        v-model:value="addRowsNumber"
        placeholder="请输入新增行数"
      />
    </Modal>

    <Drawer
      :open="historyOpen"
      :title="meta.historyTitle"
      width="560"
      @close="historyOpen = false"
    >
      <div v-if="historyLoading" class="history-loading">
        加载中...
      </div>
      <div
        v-else-if="historyList.length > 0"
        class="history-list"
      >
        <div
          v-for="item in historyList"
          :key="item.id"
          class="history-card"
        >
          <div class="history-card__tags">
            <Tag
              v-if="item.historyRelease"
              color="green"
            >
              发布过: Yes
            </Tag>
            <Tag
              v-if="item.release"
              color="blue"
            >
              使用: Yes
            </Tag>
          </div>
          <div class="history-card__title">
            {{ item.title || '-' }}
          </div>
          <div class="history-card__meta">
            创建人: {{ item.createUserNickname || '-' }}
          </div>
          <div class="history-card__meta">
            创建时间: {{ formatDate(item.createTime) }}
          </div>
          <Space>
            <Button
              size="small"
              type="link"
              @click="handleEditHistory(item)"
            >
              修改
            </Button>
            <Button
              v-if="!item.historyRelease"
              danger
              size="small"
              type="link"
              @click="handleDeleteHistory(item.id)"
            >
              删除
            </Button>
          </Space>
        </div>
      </div>
      <Empty
        v-else
        description="暂无历史政策"
      />
    </Drawer>

    <TeamPolicyRewardEditor
      :allow-edit="rewardEditAllowed"
      :open="rewardOpen"
      :row="currentRewardRow"
      :sys-origin="query.sysOrigin"
      @close="rewardOpen = false"
      @success="handleRewardSuccess"
    />
  </Page>
</template>

<style scoped>
.policy-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.policy-head {
  align-items: center;
  background: linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  border-radius: 16px;
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 16px;
  padding: 16px;
}

.policy-head__label {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 6px;
}

.policy-head__value {
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
}

.policy-title-box {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.policy-editor__footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.reward-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reward-summary__text {
  color: #475569;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.history-card__tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.history-card__title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
}

.history-card__meta {
  color: #64748b;
  font-size: 13px;
  margin-top: 8px;
}

.history-loading {
  color: #64748b;
  padding: 24px 0;
  text-align: center;
}

@media (max-width: 768px) {
  .policy-head {
    grid-template-columns: minmax(0, 1fr);
  }

  .policy-title-box {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
