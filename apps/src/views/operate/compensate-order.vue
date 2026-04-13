<script lang="ts" setup>
import { computed, reactive } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  compensateCandy,
  orderPurchaseHistoryCompensate,
} from '#/api/legacy/operate';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateCompensateOrder' });

const PAY_PLATFORM_OPTIONS = [
  { disabled: false, label: 'Apple', value: 'APPLE' },
  { disabled: false, label: 'Google', value: 'GOOGLE' },
  { disabled: true, label: 'Stripe', value: 'STRIPE' },
  { disabled: true, label: 'PayerMax', value: 'PAY_MAX' },
];
const payPlatformOptions = PAY_PLATFORM_OPTIONS.map((item) => ({
  disabled: item.disabled,
  label: item.label,
  value: item.value as any,
}));

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = reactive({
  candy: false,
  order: false,
});

const orderForm = reactive<Record<string, any>>({
  orderId: '',
  platform: '',
  productCode: '',
  sysOrigin: sysOriginOptions.value[0]?.value || '',
  userId: '',
  vipExpireTime: '',
});

const candyForm = reactive<Record<string, any>>({
  candy: '',
  userId: '',
});

function resetOrderForm() {
  orderForm.orderId = '';
  orderForm.platform = '';
  orderForm.productCode = '';
  orderForm.sysOrigin = sysOriginOptions.value[0]?.value || '';
  orderForm.userId = '';
  orderForm.vipExpireTime = '';
}

function resetCandyForm() {
  candyForm.candy = '';
  candyForm.userId = '';
}

function validateOrderForm() {
  if (!String(orderForm.userId || '').trim()) {
    message.warning('请输入用户ID');
    return false;
  }
  if (!String(orderForm.orderId || '').trim()) {
    message.warning('请输入订单id');
    return false;
  }
  if (!String(orderForm.sysOrigin || '').trim()) {
    message.warning('请选择平台');
    return false;
  }
  if (!String(orderForm.platform || '').trim()) {
    message.warning('请选择支付方式');
    return false;
  }
  if (!String(orderForm.productCode || '').trim()) {
    message.warning('请输入产品CODE');
    return false;
  }
  return true;
}

function validateCandyForm() {
  if (!String(candyForm.userId || '').trim()) {
    message.warning('请输入用户ID');
    return false;
  }
  if (!String(candyForm.candy || '').trim()) {
    message.warning('请输入糖果数量');
    return false;
  }
  return true;
}

function submitOrderForm() {
  if (!validateOrderForm()) {
    return;
  }
  Modal.confirm({
    content: '是否确认提交?',
    onOk: async () => {
      loading.order = true;
      try {
        await orderPurchaseHistoryCompensate({ ...orderForm });
        message.success('提交成功');
        resetOrderForm();
      } finally {
        loading.order = false;
      }
    },
    title: '提示',
  });
}

function submitCandyForm() {
  if (!validateCandyForm()) {
    return;
  }
  Modal.confirm({
    content: '是否确认提交?',
    onOk: async () => {
      loading.candy = true;
      try {
        await compensateCandy({ ...candyForm });
        message.success('提交成功');
        resetCandyForm();
      } finally {
        loading.candy = false;
      }
    },
    title: '提示',
  });
}
</script>

<template>
  <Page title="订单补偿">
    <div class="stack">
      <Card>
        <Alert
          message="补偿订单"
          show-icon
          type="info"
        />
        <Form class="form" layout="vertical">
          <FormItem label="用户ID">
            <Input v-model:value="orderForm.userId" />
          </FormItem>
          <FormItem label="订单id">
            <Input v-model:value="orderForm.orderId" />
          </FormItem>
          <FormItem label="平台">
            <SysOriginSelect v-model:value="orderForm.sysOrigin" placeholder="请选择平台"
              :options="sysOriginOptions"
            ></SysOriginSelect>
          </FormItem>
          <FormItem label="支付方式">
            <Select
              option-label-prop="label"
              v-model:value="orderForm.platform"
              :options="payPlatformOptions"
              placeholder="请选择支付方式"
            />
          </FormItem>
          <FormItem label="产品CODE">
            <Input v-model:value="orderForm.productCode" />
          </FormItem>
          <FormItem label="过期时间">
            <DatePicker
              v-model:value="orderForm.vipExpireTime"
              style="width: 100%"
              value-format="x"
            />
          </FormItem>
          <FormItem>
            <Button :loading="loading.order" type="primary" @click="submitOrderForm">
              提交
            </Button>
          </FormItem>
        </Form>
      </Card>

      <Card>
        <Alert
          message="补偿糖果"
          show-icon
          type="info"
        />
        <Form class="form" layout="vertical">
          <FormItem label="用户ID">
            <Input v-model:value="candyForm.userId" />
          </FormItem>
          <FormItem label="糖果">
            <Input v-model:value="candyForm.candy" />
          </FormItem>
          <FormItem>
            <Button :loading="loading.candy" type="primary" @click="submitCandyForm">
              提交
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.stack {
  display: grid;
  gap: 16px;
}

.form {
  margin-top: 20px;
  max-width: 560px;
}
</style>
