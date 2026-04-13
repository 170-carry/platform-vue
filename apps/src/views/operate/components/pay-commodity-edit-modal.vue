<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addOrUpdatePayCommodity,
  listCountrytSupportAmountChannels,
} from '#/api/legacy/pay';

import {
  Collapse,
  CollapsePanel,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Select,
  message,
} from 'antdv-next';

import { WEB_PRODUCT_TYPE_OPTIONS } from '../pay-shared';

const props = withDefaults(
  defineProps<{
    mode: 'country' | 'region';
    open: boolean;
    row?: Record<string, any>;
  }>(),
  {
    row: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const associateLoading = ref(false);
const activeKeys = ref<Array<string>>([]);
const supportAmounts = ref<Array<Record<string, any>>>([]);
const computedAmount = ref('');
const amountUsdText = ref('');

const shelfOptions = [
  { label: '上架', value: true as any },
  { label: '下架', value: false as any },
];

const webProductTypeOptions = WEB_PRODUCT_TYPE_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

const form = reactive<Record<string, any>>({
  amountUsd: '',
  applicationId: '',
  awardContent: '',
  content: '',
  id: '',
  payCountryId: '',
  regionId: '',
  shelf: true,
  type: 'GOLD',
});

const isUpdate = computed(() => Boolean(form.id));
const modalTitle = computed(() => (isUpdate.value ? '修改商品' : '创建商品'));
const selectedApp = computed(() => props.row?.selectApp || {});
const selectedCountry = computed(() => props.row?.country || {});
const regionName = computed(() => props.row?.regionName || '');

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    const row = props.row || {};
    form.amountUsd = row.amountUsd ?? '';
    form.applicationId = row.applicationId ?? '';
    form.awardContent = row.awardContent ?? '';
    form.content = row.content ?? '';
    form.id = row.id ?? '';
    form.payCountryId = row.payCountryId ?? '';
    form.regionId = row.regionId ?? '';
    form.shelf = row.shelf ?? true;
    form.type = row.type ?? 'GOLD';
    void loadSupportAmountChannels();
  },
  { immediate: true },
);

function isPositiveNumberPointTwo(value: string) {
  return /^\d+(\.\d{1,2})?$/.test(value);
}

async function loadSupportAmountChannels() {
  if (props.mode !== 'country' || !form.payCountryId || !isPositiveNumberPointTwo(String(form.amountUsd || ''))) {
    supportAmounts.value = [];
    computedAmount.value = '';
    amountUsdText.value = '';
    return;
  }
  associateLoading.value = true;
  try {
    const result = await listCountrytSupportAmountChannels(
      form.payCountryId,
      form.amountUsd,
    );
    supportAmounts.value = result?.channels || [];
    activeKeys.value = supportAmounts.value.map(
      (item) => String(item.channel?.channelCode || ''),
    );
    computedAmount.value = result?.computedAmount || '';
    amountUsdText.value = result?.amountUsd || '';
  } finally {
    associateLoading.value = false;
  }
}

function handleAmountChange() {
  void loadSupportAmountChannels();
}

function validateForm() {
  if (props.mode === 'country' && !form.payCountryId) {
    message.warning('缺少支付国家');
    return false;
  }
  if (props.mode === 'region' && !form.regionId) {
    message.warning('缺少区域');
    return false;
  }
  if (!String(form.applicationId || '').trim()) {
    message.warning('缺少应用信息');
    return false;
  }
  if (!String(form.type || '').trim()) {
    message.warning('请选择商品类型');
    return false;
  }
  if (!String(form.content || '').trim()) {
    message.warning('请输入金币数');
    return false;
  }
  if (!String(form.awardContent || '').trim()) {
    message.warning('请输入奖励数');
    return false;
  }
  if (!isPositiveNumberPointTwo(String(form.amountUsd || ''))) {
    message.warning('请输入正确的正数/小数最多两位小数点');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  loading.value = true;
  try {
    await addOrUpdatePayCommodity({
      amountUsd: form.amountUsd,
      applicationId: form.applicationId,
      awardContent: form.awardContent,
      content: form.content,
      id: form.id,
      payCountryId: form.payCountryId,
      regionId: form.regionId,
      shelf: form.shelf,
      type: form.type,
    });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="loading"
    :open="open"
    destroy-on-close
    :title="modalTitle"
    width="960px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <div class="title-row">
      <span class="app-code">{{ selectedApp.appCode || '-' }}</span>
      <span>{{ selectedApp.appName || '-' }}</span>
    </div>

    <Form layout="vertical">
      <FormItem v-if="mode === 'country'" label="售卖国家">
        <div class="inline-meta">
          <Image
            v-if="selectedCountry.icon"
            :preview="false"
            :src="selectedCountry.icon"
            class="flag"
          />
          <span>{{ selectedCountry.countryName || '-' }}</span>
        </div>
      </FormItem>

      <FormItem v-if="mode === 'region'" label="区域">
        <div>{{ regionName || '-' }}</div>
      </FormItem>

      <FormItem label="状态">
        <Select
          v-model:value="form.shelf"
          :options="shelfOptions"
          option-label-prop="label"
        />
      </FormItem>

      <FormItem v-if="!isUpdate" label="商品类型">
        <Select
          v-model:value="form.type"
          :options="webProductTypeOptions"
          option-label-prop="label"
        />
      </FormItem>

      <FormItem label="金币数">
        <Input v-model:value="form.content" placeholder="请输入金币数量" />
      </FormItem>

      <FormItem label="奖励数">
        <Input v-model:value="form.awardContent" placeholder="请输入奖励金币数量" />
      </FormItem>

      <FormItem label="售卖价格">
        <Input
          v-model:value="form.amountUsd"
          addon-after="USD"
          placeholder="请输入商品价格"
          @change="handleAmountChange"
        />
      </FormItem>

      <FormItem v-if="mode === 'country'" label="支付渠道">
        <div v-if="associateLoading" class="support-empty">渠道限额计算中...</div>
        <div v-else-if="supportAmounts.length === 0" class="support-empty">
          暂无可展示渠道
        </div>
        <Collapse v-else v-model:activeKey="activeKeys">
          <CollapsePanel
            v-for="item in supportAmounts"
            :key="String(item.channel?.channelCode || '')"
            :header="item.channel?.channelName || item.channel?.channelCode || '-'"
          >
            <div
              v-for="detail in item.countryChannels || []"
              :key="detail.countryChannelDetails?.id || detail.payFactory?.factoryCode"
              class="support-item"
            >
              <div class="support-head">
                <Image
                  :preview="false"
                  :src="detail.payFactory?.factoryIcon"
                  class="icon"
                />
                <strong>{{ detail.payFactory?.factoryName || '-' }}</strong>
              </div>
              <div class="support-grid">
                <div>
                  售卖价格: <strong>{{ computedAmount || '-' }}</strong>
                  {{ selectedCountry.currency || '-' }}
                </div>
                <div>
                  售卖价格: <strong>{{ amountUsdText || '-' }}</strong> USD
                </div>
                <div>
                  最小限额: <strong>{{ detail.countryChannelDetails?.computedMinLimit || '-' }}</strong>
                  {{ selectedCountry.currency || '-' }}
                </div>
                <div>
                  最大限额: <strong>{{ detail.countryChannelDetails?.computedMaxLimit || '-' }}</strong>
                  {{ selectedCountry.currency || '-' }}
                </div>
                <div>
                  每日限额: <strong>{{ detail.countryChannelDetails?.computedDailyLimit || '-' }}</strong>
                  {{ selectedCountry.currency || '-' }}
                </div>
                <div>
                  厂商渠道CODE: <strong>{{ detail.countryChannelDetails?.factoryChannel || '-' }}</strong>
                </div>
              </div>
            </div>
          </CollapsePanel>
        </Collapse>
      </FormItem>
    </Form>
  </Modal>
</template>

<style scoped>
.title-row {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.app-code {
  background: var(--ant-color-primary-bg);
  border-radius: 999px;
  color: var(--ant-color-primary);
  padding: 4px 10px;
}

.inline-meta {
  align-items: center;
  display: flex;
  gap: 10px;
}

.flag,
.icon {
  border-radius: 8px;
  height: 36px;
  width: 36px;
}

.support-empty {
  color: rgb(100 116 139);
}

.support-item {
  border: 1px solid rgb(226 232 240);
  border-radius: 12px;
  margin-top: 12px;
  padding: 12px;
}

.support-head {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.support-grid {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
