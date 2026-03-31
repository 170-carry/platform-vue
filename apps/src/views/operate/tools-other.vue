<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getCountryAlls } from '#/api/legacy/system';
import {
  alisMethod,
  checkUserSwapUser,
  clearRedisKey,
  executeUserCancelAndRestore,
  executeUserSwapUser,
  getAccessTokenByUserId,
  getUserToken,
  requestApiSing,
  updateUserRoomRegion,
} from '#/api/legacy/tools';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateToolsOther' });

const ORIGIN_PLATFORM_OPTIONS = [
  { label: 'iOS', value: 'iOS' },
  { label: 'Android', value: 'Android' },
  { label: 'H5', value: 'H5' },
];

const ALIAS_FILLS = [
  { name: '鲜花', probability: '0.2' },
  { name: '橘子', probability: '0.15' },
  { name: '苹果', probability: '0.15' },
  { name: '西瓜', probability: '0.1' },
  { name: '香蕉', probability: '0.08' },
  { name: '果汁', probability: '0.05' },
  { name: '手机', probability: '0.01' },
  { name: '电脑', probability: '0.001' },
];

const USER_SWAP_TIPS_MAP: Record<string, { desc: string; type: 'error' | 'warn' }> = {
  AUTH_OPENID_NOT_EQUALS: { desc: '注册来源OpenId不一致', type: 'warn' },
  ORIGIN_NOT_EQUALS: { desc: '用户来自不同系统', type: 'warn' },
  SOURCE_USER_AUTH_IS_NULL: { desc: '原始用户认证信息没找到', type: 'error' },
  SOURCE_USER_IS_NULL: { desc: '原始用户没有找到', type: 'error' },
  TARGET_USER_AUTH_IS_NULL: { desc: '目标用户认证信息没找到', type: 'error' },
  TARGET_USER_IS_NULL: { desc: '目标用户没有找到', type: 'error' },
};

const aliasChartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(aliasChartRef);

const countries = ref<Array<Record<string, any>>>([]);
const apiSignDialogOpen = ref(false);
const apiSignLoading = ref(false);
const apiSignResult = ref('');
const aliasDialogOpen = ref(false);
const aliasLoading = ref(false);
const userSwapCheckLoading = ref(false);
const userSwapExecuteLoading = ref(false);
const userSwapTips = ref('');
const userSwapResults = ref<Array<{ desc: string; type: 'error' | 'warn' }>>([]);
const userSwapBlocked = ref(true);
const tokenLoading = ref(false);
const tokenResult = ref<Record<string, any> | string>({});
const redisLoading = ref(false);
const roomRegionLoading = ref(false);
const cancelRestoreLoading = ref(false);

const apiSignForm = reactive({
  body: '',
  key: '',
  platform: 'iOS',
});

const apiSignAttributes = ref<Array<Record<string, string>>>([
  { key: '', value: '' },
]);

const aliasForm = reactive({
  bets: [{ name: '', probability: '' }],
  runSize: 10000,
});

const userSwapForm = reactive({
  sourceUserId: '',
  targetUserId: '',
});

const tokenForm = reactive({
  mode: 'TOKEN_PARSE',
  token: '',
  userId: '',
});

const redisForm = reactive({
  key: '',
});

const roomRegionForm = reactive({
  countryId: '',
  userId: '',
});

const cancelRestoreForm = reactive({
  countryId: '11',
  userId: '',
});

const canExecuteUserSwap = computed(() => !userSwapBlocked.value);

function prettyJson(value: any) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return String(value ?? '');
  }
}

function addApiAttribute() {
  apiSignAttributes.value.push({ key: '', value: '' });
}

function clearApiAttributes() {
  apiSignAttributes.value = [{ key: '', value: '' }];
}

function submitApiAttributes() {
  const result = apiSignAttributes.value.reduce<Record<string, string>>(
    (current, item) => {
      if (item.key) {
        current[item.key] = item.value || '';
      }
      return current;
    },
    {},
  );
  apiSignForm.body = JSON.stringify(result);
  apiSignDialogOpen.value = false;
}

async function submitApiSign() {
  if (!apiSignForm.platform || !apiSignForm.body || !apiSignForm.key) {
    message.warning('签名平台、数据内容、签名KEY不能为空');
    return;
  }
  apiSignLoading.value = true;
  try {
    apiSignResult.value = (await requestApiSing({ ...apiSignForm })) || '';
  } finally {
    apiSignLoading.value = false;
  }
}

function addAliasAttribute() {
  aliasForm.bets.push({ name: '', probability: '' });
}

function fillAliasAttributes() {
  aliasForm.bets = ALIAS_FILLS.map((item) => ({ ...item }));
}

function clearAliasAttributes() {
  aliasForm.bets = [{ name: '', probability: '' }];
}

async function submitAlias() {
  const bets = aliasForm.bets.filter(
    (item) => item.name && item.probability !== '',
  );
  if (bets.length === 0) {
    message.warning('请至少设置一个奖品概率');
    return;
  }
  aliasLoading.value = true;
  try {
    const result = (await alisMethod({
      bets,
      runSize: aliasForm.runSize,
    })) || [];
    renderEcharts({
      tooltip: {},
      xAxis: {
        data: result.map((item) => `${item.name}/${Number(item.probability || 0) * 100}%`),
        type: 'category',
      },
      yAxis: { type: 'value' },
      series: [
        {
          data: result.map((item) => item.lottery),
          type: 'bar',
        },
      ],
    });
    aliasDialogOpen.value = false;
  } finally {
    aliasLoading.value = false;
  }
}

async function checkSwapCondition() {
  if (!userSwapForm.sourceUserId || !userSwapForm.targetUserId) {
    message.warning('原始ID和目标ID不能为空');
    return;
  }
  userSwapCheckLoading.value = true;
  try {
    const result = await checkUserSwapUser({ ...userSwapForm });
    const list = result?.key || [];
    userSwapResults.value = list
      .map((item: string) => USER_SWAP_TIPS_MAP[item])
      .filter(Boolean);
    userSwapTips.value = result?.value || '';
    userSwapBlocked.value = userSwapResults.value.some(
      (item) => item.type === 'error',
    );
  } finally {
    userSwapCheckLoading.value = false;
  }
}

async function executeSwap() {
  if (!canExecuteUserSwap.value) {
    return;
  }
  userSwapExecuteLoading.value = true;
  try {
    await executeUserSwapUser({ ...userSwapForm });
    message.success('执行成功');
    userSwapBlocked.value = true;
    userSwapResults.value = [];
    userSwapTips.value = '';
  } finally {
    userSwapExecuteLoading.value = false;
  }
}

async function submitTokenForm() {
  tokenLoading.value = true;
  try {
    tokenResult.value =
      tokenForm.mode === 'TOKEN_PARSE'
        ? (await getAccessTokenByUserId(tokenForm.token))
        : (await getUserToken(tokenForm.userId));
  } finally {
    tokenLoading.value = false;
  }
}

async function submitRedis() {
  if (!redisForm.key) {
    message.warning('请输入Key信息');
    return;
  }
  redisLoading.value = true;
  try {
    await clearRedisKey(redisForm.key);
    message.success('操作成功');
  } finally {
    redisLoading.value = false;
  }
}

async function submitRoomRegion() {
  if (!roomRegionForm.userId || !roomRegionForm.countryId) {
    message.warning('用户ID和国家不能为空');
    return;
  }
  roomRegionLoading.value = true;
  try {
    await updateUserRoomRegion({ ...roomRegionForm });
    message.success('操作成功');
  } finally {
    roomRegionLoading.value = false;
  }
}

async function submitCancelRestore() {
  if (!cancelRestoreForm.userId) {
    message.warning('请输入用户长ID');
    return;
  }
  cancelRestoreLoading.value = true;
  try {
    await executeUserCancelAndRestore({ ...cancelRestoreForm });
    message.success('操作成功');
  } finally {
    cancelRestoreLoading.value = false;
  }
}

function filterCountry(input: string, option?: Record<string, any>) {
  const label = String(option?.label || '').toLowerCase();
  const value = String(option?.value || '').toLowerCase();
  const keyword = input.toLowerCase();
  return label.includes(keyword) || value.includes(keyword);
}

async function loadCountries() {
  countries.value = (await getCountryAlls()) || [];
}

void loadCountries();
</script>

<template>
  <Page title="小工具">
    <div class="stack">
      <Card title="用户账户调换">
        <Form layout="vertical">
          <div class="grid two">
            <FormItem label="原始ID">
              <Input v-model:value="userSwapForm.sourceUserId" placeholder="请输入原始用户长ID" />
            </FormItem>
            <FormItem label="目标ID">
              <Input v-model:value="userSwapForm.targetUserId" placeholder="请输入目标用户长ID" />
            </FormItem>
          </div>
          <FormItem>
            <Button :loading="userSwapCheckLoading" type="primary" @click="checkSwapCondition">
              验证转换条件
            </Button>
          </FormItem>
        </Form>

        <div v-if="userSwapResults.length > 0" class="tips-box">
          <div
            v-for="(item, index) in userSwapResults"
            :key="index"
            :class="['tips-item', item.type]"
          >
            {{ item.desc }} {{ userSwapTips }}
          </div>
          <Button
            v-if="canExecuteUserSwap"
            :loading="userSwapExecuteLoading"
            type="primary"
            @click="executeSwap"
          >
            提交执行
          </Button>
        </div>
      </Card>

      <Card title="API参数签名">
        <Form layout="vertical">
          <div class="grid three">
            <FormItem label="签名平台">
              <Select option-label-prop="label" v-model:value="apiSignForm.platform">
                <SelectOption
                  v-for="item in ORIGIN_PLATFORM_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                 :label="`${item.label}`">
                  {{ item.label }}
                </SelectOption>
              </Select>
            </FormItem>
            <FormItem label="签名KEY">
              <Input v-model:value="apiSignForm.key" />
            </FormItem>
            <FormItem label="操作">
              <div class="inline-actions">
                <Button type="default" @click="apiSignDialogOpen = true">设置属性</Button>
                <Button :loading="apiSignLoading" type="primary" @click="submitApiSign">
                  提交
                </Button>
              </div>
            </FormItem>
          </div>
          <FormItem label="数据内容">
            <TextArea v-model:value="apiSignForm.body" :rows="4" />
          </FormItem>
        </Form>
        <pre v-if="apiSignResult" class="result-pre">{{ apiSignResult }}</pre>
      </Card>

      <Card title="Alias Method分析">
        <div class="inline-actions">
          <Button type="default" @click="aliasDialogOpen = true">设置属性</Button>
          <Button
            :disabled="aliasForm.bets.length === 0"
            :loading="aliasLoading"
            type="primary"
            @click="submitAlias"
          >
            重新运行
          </Button>
        </div>
        <EchartsUI ref="aliasChartRef" style="height: 320px; margin-top: 16px" />
      </Card>

      <Card title="用户令牌解析">
        <Form layout="vertical">
          <FormItem label="模式">
            <RadioGroup v-model:value="tokenForm.mode">
              <Radio value="TOKEN_PARSE">令牌解析</Radio>
              <Radio value="GET_TOKEN">获取令牌</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem v-if="tokenForm.mode === 'TOKEN_PARSE'" label="令牌">
            <Input v-model:value="tokenForm.token" placeholder="请输入用户令牌" />
          </FormItem>
          <FormItem v-else label="用户ID">
            <Input v-model:value="tokenForm.userId" placeholder="请输入用户ID" />
          </FormItem>
          <FormItem>
            <Button :loading="tokenLoading" type="primary" @click="submitTokenForm">
              确定
            </Button>
          </FormItem>
        </Form>
        <pre class="result-pre">{{ prettyJson(tokenResult) }}</pre>
      </Card>

      <Card title="Redis操作">
        <Form layout="vertical">
          <FormItem label="Key">
            <Input v-model:value="redisForm.key" placeholder="请输入Key信息" />
          </FormItem>
          <FormItem>
            <Button :loading="redisLoading" type="primary" @click="submitRedis">
              确定
            </Button>
          </FormItem>
        </Form>
      </Card>

      <Card title="用户房间区域变动">
        <Form layout="vertical">
          <div class="grid two">
            <FormItem label="用户长ID">
              <Input v-model:value="roomRegionForm.userId" placeholder="请输入原始用户长ID" />
            </FormItem>
            <FormItem label="国家">
              <Select option-label-prop="label"
                v-model:value="roomRegionForm.countryId"
                show-search
                :filter-option="filterCountry"
                placeholder="请选择国家"
              >
                <SelectOption
                  v-for="item in countries"
                  :key="item.id"
                  :label="`${item.aliasName || '-'} / ${item.alphaTwo || '-'}`"
                  :value="item.id"
                >
                  {{ item.aliasName || '-' }} / {{ item.alphaTwo || '-' }}
                </SelectOption>
              </Select>
            </FormItem>
          </div>
          <FormItem>
            <Button :loading="roomRegionLoading" type="primary" @click="submitRoomRegion">
              确定
            </Button>
          </FormItem>
        </Form>
      </Card>

      <Card title="注销用户恢复">
        <Form layout="vertical">
          <FormItem label="用户长ID">
            <Input v-model:value="cancelRestoreForm.userId" placeholder="请输入原始用户长ID" />
          </FormItem>
          <FormItem>
            <Button :loading="cancelRestoreLoading" type="primary" @click="submitCancelRestore">
              确定
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>

    <Modal
      :confirm-loading="apiSignLoading"
      :open="apiSignDialogOpen"
      title="API内容属性"
      @cancel="apiSignDialogOpen = false"
      @ok="submitApiAttributes"
    >
      <div class="stack-sm">
        <div
          v-for="(item, index) in apiSignAttributes"
          :key="index"
          class="grid two"
        >
          <Input v-model:value="item.key" placeholder="键" />
          <Input v-model:value="item.value" placeholder="值" />
        </div>
        <div class="inline-actions">
          <Button @click="clearApiAttributes">清空属性</Button>
          <Button @click="addApiAttribute">新增属性</Button>
        </div>
      </div>
    </Modal>

    <Modal
      :confirm-loading="aliasLoading"
      :open="aliasDialogOpen"
      title="设置概率"
      width="760px"
      @cancel="aliasDialogOpen = false"
      @ok="submitAlias"
    >
      <div class="stack-sm">
        <div class="tips-plain">
          <div>平均概率: 1.0 / 奖品数量 = {{ aliasForm.bets.length > 0 ? 1 / aliasForm.bets.length : 0 }}</div>
          <div>概率填充: 概率大于等于平均概率进入 large，否则进入 small。</div>
        </div>
        <Form layout="vertical">
          <FormItem label="运行次数">
            <Input v-model:value="aliasForm.runSize" />
          </FormItem>
        </Form>
        <div
          v-for="(item, index) in aliasForm.bets"
          :key="index"
          class="grid two"
        >
          <Input v-model:value="item.name" placeholder="商品" />
          <Input v-model:value="item.probability" placeholder="概率" />
        </div>
        <div class="inline-actions">
          <Button @click="clearAliasAttributes">清空属性</Button>
          <Button @click="addAliasAttribute">新增属性</Button>
          <Button @click="fillAliasAttributes">快速填充</Button>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 16px;
}

.stack-sm {
  display: grid;
  gap: 12px;
}

.grid {
  display: grid;
  gap: 12px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tips-box {
  background: rgb(248 250 252);
  border-radius: 12px;
  margin-top: 12px;
  padding: 12px;
}

.tips-item {
  margin-bottom: 8px;
}

.tips-item.error {
  color: rgb(185 28 28);
}

.tips-item.warn {
  color: rgb(180 83 9);
}

.tips-plain {
  color: rgb(71 85 105);
  line-height: 1.8;
}

.result-pre {
  background: rgb(248 250 252);
  border-radius: 12px;
  margin: 0;
  overflow: auto;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 960px) {
  .grid.two,
  .grid.three {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
