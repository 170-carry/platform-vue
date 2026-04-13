<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addOrUpdatePropsStore,
  listSysOriginTypeList,
} from '#/api/legacy/props';

import {
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  Switch,
  message,
} from 'antdv-next';

import RewardIcon from './reward-icon.vue';
import {
  NOBLE_VIP_OPTIONS,
  PROPS_CURRENCY_TYPES,
  PROPS_STORE_TYPES,
  PROPS_VALID_DAYS,
} from '../shared';

const props = defineProps<{
  open: boolean;
  record: null | Record<string, any>;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const optionsLoading = ref(false);

const sourceOptionsMap = reactive<
  Record<string, { list: Array<Record<string, any>>; loaded: boolean; loading: boolean }>
>({});

const mainSource = ref<Record<string, any> | null>(null);
const rideSource = ref<Record<string, any> | null>(null);
const avatarSource = ref<Record<string, any> | null>(null);
const dataCardSource = ref<Record<string, any> | null>(null);
const chatBubbleSource = ref<Record<string, any> | null>(null);

const form = reactive<Record<string, any>>({
  currencyTypes: '',
  discount: 0,
  id: '',
  label: '',
  propsAbility: {
    adminNumber: '',
    avatarFrameId: '',
    carId: '',
    chatBubbleId: '',
    dataCardId: '',
    loginRewardsAmount: '',
    roomMaxMember: '',
    vipLevel: '',
    vipType: '',
  },
  propsType: '',
  shelfStatus: false,
  sort: 0,
  sourceId: '',
  sysOrigin: '',
  tmpCurrencyTypes: [] as Array<string>,
  tmpValidDays: [] as Array<number | string>,
  validDays: '',
});

const title = computed(() => (form.id ? '修改商品' : '新增商品'));
const isNobleVip = computed(() => form.propsType === 'NOBLE_VIP');
const propsStoreTypeOptions = PROPS_STORE_TYPES.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const currencyTypeOptions = computed(() =>
  PROPS_CURRENCY_TYPES.map((item) => ({
    disabled: isNobleVip.value && item.value !== 'GOLD',
    label: item.name,
    value: item.value as any,
  })),
);
const validDayOptions = PROPS_VALID_DAYS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const nobleVipOptions = NOBLE_VIP_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));

function resetSourceOptionsMap() {
  Object.keys(sourceOptionsMap).forEach((key) => {
    delete sourceOptionsMap[key];
  });
}

function createTypeStore(type: string) {
  if (!sourceOptionsMap[type]) {
    sourceOptionsMap[type] = { list: [], loaded: false, loading: false };
  }
  return sourceOptionsMap[type];
}

async function loadSourceOptions(type: string) {
  if (!type || !form.sysOrigin) {
    return;
  }
  const store = createTypeStore(type);
  if (store.loaded || store.loading) {
    return;
  }
  store.loading = true;
  optionsLoading.value = true;
  try {
    store.list = await listSysOriginTypeList(form.sysOrigin, type);
    store.loaded = true;
  } finally {
    store.loading = false;
    optionsLoading.value = false;
  }
}

function resetSelections() {
  mainSource.value = null;
  rideSource.value = null;
  avatarSource.value = null;
  dataCardSource.value = null;
  chatBubbleSource.value = null;
}

async function ensureSelections() {
  await loadSourceOptions(form.propsType);
  if (isNobleVip.value) {
    await Promise.all([
      loadSourceOptions('RIDE'),
      loadSourceOptions('AVATAR_FRAME'),
      loadSourceOptions('DATA_CARD'),
      loadSourceOptions('CHAT_BUBBLE'),
    ]);
  }
}

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    resetSourceOptionsMap();
    resetSelections();
    const record = props.record || {};
    const commodity = record.commodity || record;
    const propsAbility = record.propsAbility || {};
    const nobleVipAbility = propsAbility.nobleVipAbility || {};
    form.currencyTypes = commodity.currencyTypes || '';
    form.discount = commodity.discount || 0;
    form.id = commodity.id || '';
    form.label = commodity.label || '';
    form.propsType = commodity.propsType || '';
    form.shelfStatus = Boolean(commodity.shelfStatus);
    form.sort = commodity.sort ?? 0;
    form.sourceId = commodity.sourceId || '';
    form.sysOrigin = commodity.sysOrigin || props.sysOriginOptions[0]?.value || 'LIKEI';
    form.tmpCurrencyTypes = commodity.currencyTypes
      ? String(commodity.currencyTypes)
          .split(',')
          .filter(Boolean)
      : [];
    form.tmpValidDays = commodity.validDays
      ? String(commodity.validDays)
          .split(',')
          .filter(Boolean)
      : [];
    form.validDays = commodity.validDays || '';
    form.propsAbility = {
      adminNumber: nobleVipAbility.adminNumber ?? '',
      avatarFrameId: nobleVipAbility.avatarFrameId ?? '',
      carId: nobleVipAbility.carId ?? '',
      chatBubbleId: nobleVipAbility.chatBubbleId ?? '',
      dataCardId: nobleVipAbility.dataCardId ?? '',
      loginRewardsAmount: nobleVipAbility.loginRewardsAmount ?? '',
      roomMaxMember: nobleVipAbility.roomMaxMember ?? '',
      vipLevel: nobleVipAbility.vipLevel ?? '',
      vipType: nobleVipAbility.vipType ?? '',
    };

    await ensureSelections();

    mainSource.value = record.propsSource || null;
    rideSource.value = propsAbility.car || null;
    avatarSource.value = propsAbility.avatarFrame || null;
    dataCardSource.value = propsAbility.dataCard || null;
    chatBubbleSource.value = propsAbility.chatBubble || null;
  },
  { immediate: true },
);

function updateSelectedSource(type: string, id: string | number) {
  const item = sourceOptionsMap[type]?.list.find(
    (option) => String(option.id) === String(id),
  );
  if (type === form.propsType) {
    mainSource.value = item || null;
    form.sourceId = id;
    return;
  }
  if (type === 'RIDE') {
    rideSource.value = item || null;
    form.propsAbility.carId = id;
    return;
  }
  if (type === 'AVATAR_FRAME') {
    avatarSource.value = item || null;
    form.propsAbility.avatarFrameId = id;
    return;
  }
  if (type === 'DATA_CARD') {
    dataCardSource.value = item || null;
    form.propsAbility.dataCardId = id;
    return;
  }
  if (type === 'CHAT_BUBBLE') {
    chatBubbleSource.value = item || null;
    form.propsAbility.chatBubbleId = id;
  }
}

function getSourceSelectOptions(type: string) {
  return (sourceOptionsMap[type]?.list || []).map((item) => ({
    label: `${item.id} / ${item.name}`,
    value: item.id as any,
  }));
}

function validateForm() {
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return false;
  }
  if (!form.propsType) {
    message.warning('请选择道具类型');
    return false;
  }
  if (!form.sourceId) {
    message.warning('请选择道具资源');
    return false;
  }
  if (form.tmpCurrencyTypes.length === 0) {
    message.warning('请选择付费类型');
    return false;
  }
  if (form.tmpValidDays.length === 0) {
    message.warning('请选择有效天数');
    return false;
  }
  if (form.sort === '' || Number.isNaN(Number(form.sort))) {
    message.warning('请输入序号');
    return false;
  }
  if (form.discount === '' || Number.isNaN(Number(form.discount))) {
    message.warning('请输入折扣率');
    return false;
  }
  if (isNobleVip.value) {
    const ability = form.propsAbility;
    if (
      !ability.vipType ||
      ability.loginRewardsAmount === '' ||
      ability.vipLevel === '' ||
      ability.adminNumber === '' ||
      ability.roomMaxMember === '' ||
      !ability.avatarFrameId ||
      !ability.carId ||
      !ability.chatBubbleId ||
      !ability.dataCardId
    ) {
      message.warning('请完整填写贵族能力信息');
      return false;
    }
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    await addOrUpdatePropsStore({
      ...form,
      currencyTypes: form.tmpCurrencyTypes.join(','),
      discount: Number(form.discount) >= 0 && Number(form.discount) <= 1 ? Number(form.discount) : 1,
      sort: Number(form.sort),
      validDays: form.tmpValidDays.join(','),
    });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    destroy-on-close
    :title="title"
    width="960"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <div class="form-grid">
        <FormItem label="归属系统">
          <SysOriginSelect v-model:value="form.sysOrigin" disabled
            :options="sysOriginOptions"
          ></SysOriginSelect>
        </FormItem>
        <FormItem label="道具类型">
          <Select
            option-label-prop="label"
            v-model:value="form.propsType"
            :options="propsStoreTypeOptions"
            disabled
          />
        </FormItem>
      </div>

      <FormItem label="道具资源">
        <Select option-label-prop="label"
          v-model:value="form.sourceId"
          :loading="sourceOptionsMap[form.propsType]?.loading"
          :options="getSourceSelectOptions(form.propsType)"
          option-filter-prop="label"
          show-search
          @change="(value: string) => updateSelectedSource(form.propsType, value)"
        />
        <div v-if="mainSource" class="source-preview">
          <RewardIcon :item="mainSource" :size="56" />
          <div class="source-preview__meta">
            <div>{{ mainSource.name || '-' }}</div>
            <div class="source-preview__id">ID: {{ mainSource.id || '-' }}</div>
          </div>
        </div>
      </FormItem>

      <div class="form-grid">
        <FormItem label="付费类型">
          <Select
            option-label-prop="label"
            v-model:value="form.tmpCurrencyTypes"
            :options="currencyTypeOptions"
            mode="multiple"
          />
        </FormItem>
        <FormItem label="有效天数">
          <Select
            option-label-prop="label"
            v-model:value="form.tmpValidDays"
            :options="validDayOptions"
            mode="multiple"
          />
        </FormItem>
      </div>

      <div class="form-grid">
        <FormItem label="标签">
          <Input v-model:value="form.label" placeholder="请输入标签" />
        </FormItem>
        <FormItem label="折扣率">
          <Input v-model:value="form.discount" />
        </FormItem>
      </div>

      <div class="form-grid">
        <FormItem label="序号">
          <Input v-model:value="form.sort" placeholder="序号越大越靠前" />
        </FormItem>
        <FormItem label="上架状态">
          <Switch
            v-model:checked="form.shelfStatus"
            checked-children="上架"
            un-checked-children="下架"
          />
        </FormItem>
      </div>

      <template v-if="isNobleVip">
        <div class="section-title">贵族能力</div>

        <div class="form-grid">
          <FormItem label="VIP类型">
            <Select
              option-label-prop="label"
              v-model:value="form.propsAbility.vipType"
              :options="nobleVipOptions"
            />
          </FormItem>
          <FormItem label="VIP等级">
            <Input v-model:value="form.propsAbility.vipLevel" />
          </FormItem>
        </div>

        <div class="form-grid">
          <FormItem label="登录奖励">
            <Input v-model:value="form.propsAbility.loginRewardsAmount" />
          </FormItem>
          <FormItem label="管理员数">
            <Input v-model:value="form.propsAbility.adminNumber" />
          </FormItem>
        </div>

        <FormItem label="房间成员数">
          <Input v-model:value="form.propsAbility.roomMaxMember" />
        </FormItem>

        <div class="ability-grid">
          <div class="ability-item">
            <div class="ability-item__label">车辆</div>
            <Select option-label-prop="label"
              v-model:value="form.propsAbility.carId"
              :loading="sourceOptionsMap.RIDE?.loading"
              :options="getSourceSelectOptions('RIDE')"
              option-filter-prop="label"
              show-search
              @change="(value: string) => updateSelectedSource('RIDE', value)"
            />
            <div v-if="rideSource" class="source-preview">
              <RewardIcon :item="rideSource" :size="48" />
              <div class="source-preview__meta">
                <div>{{ rideSource.name }}</div>
              </div>
            </div>
          </div>

          <div class="ability-item">
            <div class="ability-item__label">头像框</div>
            <Select option-label-prop="label"
              v-model:value="form.propsAbility.avatarFrameId"
              :loading="sourceOptionsMap.AVATAR_FRAME?.loading"
              :options="getSourceSelectOptions('AVATAR_FRAME')"
              option-filter-prop="label"
              show-search
              @change="(value: string) => updateSelectedSource('AVATAR_FRAME', value)"
            />
            <div v-if="avatarSource" class="source-preview">
              <RewardIcon :item="avatarSource" :size="48" />
              <div class="source-preview__meta">
                <div>{{ avatarSource.name }}</div>
              </div>
            </div>
          </div>

          <div class="ability-item">
            <div class="ability-item__label">资料卡</div>
            <Select option-label-prop="label"
              v-model:value="form.propsAbility.dataCardId"
              :loading="sourceOptionsMap.DATA_CARD?.loading"
              :options="getSourceSelectOptions('DATA_CARD')"
              option-filter-prop="label"
              show-search
              @change="(value: string) => updateSelectedSource('DATA_CARD', value)"
            />
            <div v-if="dataCardSource" class="source-preview">
              <RewardIcon :item="dataCardSource" :size="48" />
              <div class="source-preview__meta">
                <div>{{ dataCardSource.name }}</div>
              </div>
            </div>
          </div>

          <div class="ability-item">
            <div class="ability-item__label">聊天气泡</div>
            <Select option-label-prop="label"
              v-model:value="form.propsAbility.chatBubbleId"
              :loading="sourceOptionsMap.CHAT_BUBBLE?.loading"
              :options="getSourceSelectOptions('CHAT_BUBBLE')"
              option-filter-prop="label"
              show-search
              @change="(value: string) => updateSelectedSource('CHAT_BUBBLE', value)"
            />
            <div v-if="chatBubbleSource" class="source-preview">
              <RewardIcon :item="chatBubbleSource" :size="48" />
              <div class="source-preview__meta">
                <div>{{ chatBubbleSource.name }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Form>
  </Modal>
</template>

<style scoped>
.ability-grid,
.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.ability-item {
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  padding: 12px;
}

.ability-item__label {
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.section-title {
  color: rgb(15 23 42);
  font-size: 16px;
  font-weight: 600;
  margin: 8px 0 16px;
}

.source-preview {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.source-preview__id {
  color: rgb(100 116 139);
  font-size: 12px;
}
</style>
