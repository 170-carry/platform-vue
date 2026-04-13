<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { listBadgePictureBySysOrigin } from '#/api/legacy/badge';
import {
  listNotFamilyBySysOriginType,
  sendPropsGiveUser,
  sendPropsTicketGiveUser,
} from '#/api/legacy/props';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
  Row,
  Select,
  message,
} from 'antdv-next';

import RewardIcon from './components/reward-icon.vue';
import {
  BADGE_TYPE_OPTIONS,
  PROPS_TICKET_TYPES,
  PROPS_TYPES,
} from './shared';

defineOptions({ name: 'PropsSendTool' });

const accessStore = useAccessStore();

const accessCodes = computed(() => accessStore.accessCodes || []);
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessCodes.value);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const propsTypeOptions = PROPS_TYPES.filter(
  (item) => item.value !== 'CUSTOMIZE' && item.value !== 'FRAGMENTS',
);
const propsSecondaryTypeOptions = propsTypeOptions.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const badgeTypeOptions = BADGE_TYPE_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const ticketTypeOptions = PROPS_TICKET_TYPES.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const vipOriginOptions = [
  { label: '系统赠送', value: 'SYSTEM_GIVE' as any },
  { label: '购买或朋友赠送', value: 'BUY_OR_GIVE' as any },
  { label: '活动奖励', value: 'ACTIVITY_AWARD' as any },
];

const propsFormLoading = ref(false);
const badgeFormLoading = ref(false);
const ticketFormLoading = ref(false);

const propsSourceLoading = ref(false);
const badgeSourceLoading = ref(false);
const ticketSourceLoading = ref(false);

const propsSourceOptions = ref<Array<Record<string, any>>>([]);
const badgeSourceOptions = ref<Array<Record<string, any>>>([]);
const ticketSourceOptions = ref<Array<Record<string, any>>>([]);

const propsSelectedResource = ref<Record<string, any> | null>(null);
const badgeSelectedResource = ref<Record<string, any> | null>(null);
const ticketSelectedResource = ref<Record<string, any> | null>(null);
const propsResourceOptions = computed(() =>
  propsSourceOptions.value.map((item) => ({
    label: `${item.id} / ${item.name}`,
    value: item.id as any,
  })),
);
const badgeResourceOptions = computed(() =>
  badgeSourceOptions.value.map((item) => ({
    label: `${item.badgeConfigId} / ${item.name}`,
    value: item.badgeConfigId as any,
  })),
);
const ticketResourceOptions = computed(() =>
  ticketSourceOptions.value.map((item) => ({
    label: `${item.id} / ${item.name}`,
    value: item.id as any,
  })),
);

const propsForm = reactive({
  content: '',
  exchangeDays: '',
  receiverAccounts: '',
  secondaryType: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? '',
  type: 'PROPS',
  vipOrigin: '',
});

const badgeForm = reactive({
  content: '',
  exchangeDays: '',
  receiverAccounts: '',
  secondaryType: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? '',
  type: 'BADGE',
});

const ticketForm = reactive({
  propDays: '',
  propId: '',
  receiverAccounts: '',
  secondaryType: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? '',
  type: 'PROPS',
  vipOrigin: '',
});

function hasPermission(code: string) {
  const codes = accessCodes.value;
  return codes.length === 0 || codes.includes(code);
}

const canSendProps = computed(() => hasPermission('send:props'));
const canSendBadge = computed(() => hasPermission('send:props:badge'));
const canSendTicket = computed(() => hasPermission('send:props:coupon'));

function normalizeAccounts(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resetPropsSelection() {
  propsSelectedResource.value = null;
  propsForm.content = '';
}

function resetBadgeSelection() {
  badgeSelectedResource.value = null;
  badgeForm.content = '';
}

function resetTicketSelection() {
  ticketSelectedResource.value = null;
  ticketForm.propId = '';
}

function handlePropsResourceChange(value: number | string) {
  propsSelectedResource.value =
    propsSourceOptions.value.find((item) => String(item.id) === String(value)) || null;
}

function handleBadgeResourceChange(value: number | string) {
  badgeSelectedResource.value =
    badgeSourceOptions.value.find(
      (item) => String(item.badgeConfigId) === String(value),
    ) || null;
}

function handleTicketResourceChange(value: number | string) {
  ticketSelectedResource.value =
    ticketSourceOptions.value.find((item) => String(item.id) === String(value)) || null;
}

async function loadPropsSources() {
  if (!propsForm.sysOrigin || !propsForm.secondaryType) {
    return;
  }
  resetPropsSelection();
  propsSourceLoading.value = true;
  try {
    propsSourceOptions.value = await listNotFamilyBySysOriginType(
      propsForm.sysOrigin,
      propsForm.secondaryType,
    );
  } finally {
    propsSourceLoading.value = false;
  }
}

async function loadBadgeSources() {
  if (!badgeForm.sysOrigin || !badgeForm.secondaryType) {
    return;
  }
  resetBadgeSelection();
  badgeSourceLoading.value = true;
  try {
    badgeSourceOptions.value = await listBadgePictureBySysOrigin(
      badgeForm.sysOrigin,
      badgeForm.secondaryType,
    );
  } finally {
    badgeSourceLoading.value = false;
  }
}

async function loadTicketSources() {
  if (!ticketForm.sysOrigin || !ticketForm.secondaryType) {
    return;
  }
  resetTicketSelection();
  ticketSourceLoading.value = true;
  try {
    ticketSourceOptions.value = await listNotFamilyBySysOriginType(
      ticketForm.sysOrigin,
      ticketForm.secondaryType,
    );
  } finally {
    ticketSourceLoading.value = false;
  }
}

async function handleSendProps() {
  if (normalizeAccounts(propsForm.receiverAccounts).length === 0) {
    message.warning('请输入接收人短账号');
    return;
  }
  if (!propsForm.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!propsForm.secondaryType) {
    message.warning('请选择类型');
    return;
  }
  if (!propsForm.content) {
    message.warning('请选择资源');
    return;
  }
  if (propsForm.exchangeDays === '' || Number.isNaN(Number(propsForm.exchangeDays))) {
    message.warning('请输入有效天数');
    return;
  }
  if (propsForm.secondaryType === 'NOBLE_VIP' && !propsForm.vipOrigin) {
    message.warning('请选择贵族来源');
    return;
  }
  propsFormLoading.value = true;
  try {
    const invalidAccounts = await sendPropsGiveUser({
      ...propsForm,
      exchangeDays: Number(propsForm.exchangeDays),
      receiverAccounts: propsForm.receiverAccounts.trim(),
      vipOrigin: propsForm.secondaryType === 'NOBLE_VIP' ? propsForm.vipOrigin : null,
    });
    if (invalidAccounts) {
      message.error(
        `无效短账号: ${invalidAccounts}，请处理后再将当前批次所有短账号重新发送。`,
      );
      return;
    }
    message.success('发送成功');
    propsForm.receiverAccounts = '';
    propsForm.exchangeDays = '';
    propsForm.secondaryType = '';
    propsForm.vipOrigin = '';
    propsSourceOptions.value = [];
    resetPropsSelection();
  } finally {
    propsFormLoading.value = false;
  }
}

async function handleSendBadge() {
  if (normalizeAccounts(badgeForm.receiverAccounts).length === 0) {
    message.warning('请输入接收人短账号');
    return;
  }
  if (!badgeForm.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!badgeForm.secondaryType) {
    message.warning('请选择类型');
    return;
  }
  if (!badgeForm.content) {
    message.warning('请选择资源');
    return;
  }
  if (badgeForm.exchangeDays === '' || Number.isNaN(Number(badgeForm.exchangeDays))) {
    message.warning('请输入有效天数');
    return;
  }
  badgeFormLoading.value = true;
  try {
    const invalidAccounts = await sendPropsGiveUser({
      ...badgeForm,
      exchangeDays: Number(badgeForm.exchangeDays),
      receiverAccounts: badgeForm.receiverAccounts.trim(),
    });
    if (invalidAccounts) {
      message.error(
        `无效短账号: ${invalidAccounts}，请处理后再将当前批次所有短账号重新发送。`,
      );
      return;
    }
    message.success('发送成功');
    badgeForm.receiverAccounts = '';
    badgeForm.exchangeDays = '';
    badgeForm.secondaryType = '';
    badgeSourceOptions.value = [];
    resetBadgeSelection();
  } finally {
    badgeFormLoading.value = false;
  }
}

async function handleSendTicket() {
  const accounts = normalizeAccounts(ticketForm.receiverAccounts);
  if (accounts.length === 0) {
    message.warning('请输入接收人短账号');
    return;
  }
  if (!ticketForm.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!ticketForm.secondaryType) {
    message.warning('请选择类型');
    return;
  }
  if (!ticketForm.propId) {
    message.warning('请选择资源');
    return;
  }
  if (ticketForm.propDays === '' || Number.isNaN(Number(ticketForm.propDays))) {
    message.warning('请输入道具天数');
    return;
  }
  if (ticketForm.secondaryType === 'NOBLE_VIP' && !ticketForm.vipOrigin) {
    message.warning('请选择贵族来源');
    return;
  }
  ticketFormLoading.value = true;
  try {
    const invalidAccounts = await sendPropsTicketGiveUser({
      ...ticketForm,
      propDays: Number(ticketForm.propDays),
      userIds: accounts,
      vipOrigin: ticketForm.secondaryType === 'NOBLE_VIP' ? ticketForm.vipOrigin : null,
    });
    if (invalidAccounts) {
      message.error(
        `无效短账号: ${invalidAccounts}，请处理后再将当前批次所有短账号重新发送。`,
      );
      return;
    }
    message.success('发送成功');
    ticketForm.receiverAccounts = '';
    ticketForm.propDays = '';
    ticketForm.secondaryType = '';
    ticketForm.vipOrigin = '';
    ticketSourceOptions.value = [];
    resetTicketSelection();
  } finally {
    ticketFormLoading.value = false;
  }
}
</script>

<template>
  <Page title="道具赠送">
    <Row :gutter="[16, 16]">
      <Col v-if="canSendProps" :span="24">
        <Card>
          <Alert message="赠送道具" type="info" show-icon />
          <Form class="send-form" layout="vertical">
            <FormItem label="接收人">
              <Input
                v-model:value="propsForm.receiverAccounts"
                placeholder="请输入用户短账号，多个短账号用英文逗号分隔，一批最多 15 个"
              />
            </FormItem>
            <FormItem label="选择系统">
              <SysOriginSelect
                v-model:value="propsForm.sysOrigin"
                @change="loadPropsSources"
                :options="sysOriginOptions"
              />
            </FormItem>
            <FormItem label="选择类型">
              <Select
                option-label-prop="label"
                v-model:value="propsForm.secondaryType"
                placeholder="请选择类型"
                @change="loadPropsSources"
                :options="propsSecondaryTypeOptions"
              />
            </FormItem>
            <FormItem label="选择资源">
              <Select option-label-prop="label"
                v-model:value="propsForm.content"
                :loading="propsSourceLoading"
                :options="propsResourceOptions"
                option-filter-prop="label"
                placeholder="请选择资源"
                show-search
                @change="handlePropsResourceChange"
              />
              <div v-if="propsSelectedResource" class="resource-preview">
                <RewardIcon :item="propsSelectedResource" :size="64" />
                <div class="resource-preview__meta">
                  <div>{{ propsSelectedResource.name }}</div>
                  <div class="resource-preview__id">
                    ID: {{ propsSelectedResource.id }}
                  </div>
                </div>
              </div>
            </FormItem>
            <FormItem
              v-if="propsForm.secondaryType === 'NOBLE_VIP'"
              label="贵族来源"
            >
              <Select
                option-label-prop="label"
                v-model:value="propsForm.vipOrigin"
                :options="vipOriginOptions"
              />
            </FormItem>
            <FormItem label="有效天数">
              <Input
                v-model:value="propsForm.exchangeDays"
                placeholder="输入正数为赠送，负数为回收"
              />
            </FormItem>
            <Button :loading="propsFormLoading" type="primary" @click="handleSendProps">
              发送
            </Button>
          </Form>
        </Card>
      </Col>

      <Col v-if="canSendBadge" :span="24">
        <Card>
          <Alert message="赠送徽章" type="info" show-icon />
          <Form class="send-form" layout="vertical">
            <FormItem label="接收人">
              <Input
                v-model:value="badgeForm.receiverAccounts"
                placeholder="请输入用户短账号，多个短账号用英文逗号分隔，一批最多 15 个"
              />
            </FormItem>
            <FormItem label="选择系统">
              <SysOriginSelect
                v-model:value="badgeForm.sysOrigin"
                @change="loadBadgeSources"
                :options="sysOriginOptions"
              />
            </FormItem>
            <FormItem label="选择类型">
              <Select
                option-label-prop="label"
                v-model:value="badgeForm.secondaryType"
                placeholder="请选择类型"
                @change="loadBadgeSources"
                :options="badgeTypeOptions"
              />
            </FormItem>
            <FormItem label="选择资源">
              <Select
                option-label-prop="label"
                v-model:value="badgeForm.content"
                :loading="badgeSourceLoading"
                :options="badgeResourceOptions"
                option-filter-prop="label"
                placeholder="请选择资源"
                show-search
                @change="handleBadgeResourceChange"
              />
              <div v-if="badgeSelectedResource" class="resource-preview">
                <RewardIcon :item="badgeSelectedResource" :size="64" />
                <div class="resource-preview__meta">
                  <div>{{ badgeSelectedResource.name }}</div>
                  <div class="resource-preview__id">
                    ID: {{ badgeSelectedResource.badgeConfigId }}
                  </div>
                </div>
              </div>
            </FormItem>
            <FormItem label="有效天数">
              <Input
                v-model:value="badgeForm.exchangeDays"
                placeholder="输入正数为赠送，负数为回收"
              />
            </FormItem>
            <Button :loading="badgeFormLoading" type="primary" @click="handleSendBadge">
              发送
            </Button>
          </Form>
        </Card>
      </Col>

      <Col v-if="canSendTicket" :span="24">
        <Card>
          <Alert message="赠送道具券" type="info" show-icon />
          <Form class="send-form" layout="vertical">
            <FormItem label="接收人">
              <Input
                v-model:value="ticketForm.receiverAccounts"
                placeholder="请输入用户短账号，多个短账号用英文逗号分隔，一批最多 15 个"
              />
            </FormItem>
            <FormItem label="选择系统">
              <SysOriginSelect
                v-model:value="ticketForm.sysOrigin"
                @change="loadTicketSources"
                :options="sysOriginOptions"
              />
            </FormItem>
            <FormItem label="选择类型">
              <Select option-label-prop="label"
                v-model:value="ticketForm.secondaryType"
                placeholder="请选择类型"
                @change="loadTicketSources"
                :options="ticketTypeOptions"
              />
            </FormItem>
            <FormItem label="选择资源">
              <Select option-label-prop="label"
                v-model:value="ticketForm.propId"
                :loading="ticketSourceLoading"
                :options="ticketResourceOptions"
                option-filter-prop="label"
                placeholder="请选择资源"
                show-search
                @change="handleTicketResourceChange"
              />
              <div v-if="ticketSelectedResource" class="resource-preview">
                <RewardIcon :item="ticketSelectedResource" :size="64" />
                <div class="resource-preview__meta">
                  <div>{{ ticketSelectedResource.name }}</div>
                  <div class="resource-preview__id">
                    ID: {{ ticketSelectedResource.id }}
                  </div>
                </div>
              </div>
            </FormItem>
            <FormItem
              v-if="ticketForm.secondaryType === 'NOBLE_VIP'"
              label="贵族来源"
            >
              <Select
                option-label-prop="label"
                v-model:value="ticketForm.vipOrigin"
                :options="vipOriginOptions"
              />
            </FormItem>
            <FormItem label="有效天数">
              <Input
                v-model:value="ticketForm.propDays"
                placeholder="输入正数为赠送，负数为回收"
              />
            </FormItem>
            <Button :loading="ticketFormLoading" type="primary" @click="handleSendTicket">
              发送
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  </Page>
</template>

<style scoped>
.send-form {
  margin-top: 16px;
}

.resource-preview {
  align-items: center;
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 16px;
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 12px;
}

.resource-preview__meta {
  color: rgb(15 23 42);
  display: grid;
  gap: 4px;
}

.resource-preview__id {
  color: rgb(100 116 139);
  font-size: 12px;
}
</style>
