<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  addBatchCountyAssociateChannel,
  addOrUpdateCountyChannelDetails,
  delBatchPayCountryChannel,
  listPayCountryChannel,
} from '#/api/legacy/pay';

import {
  Card,
  Collapse,
  CollapsePanel,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Switch,
  message,
} from 'antdv-next';

import PayChannelTransfer from './pay-channel-transfer.vue';

const props = withDefaults(
  defineProps<{
    open: boolean;
    row?: Record<string, any>;
  }>(),
  {
    row: () => ({}),
  },
);

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const activeKeys = ref<Array<string>>([]);
const channelCodes = ref<Array<number | string>>([]);

watch(
  () => [props.open, props.row?.id],
  ([open, id]) => {
    if (open && id) {
      void loadData();
    }
  },
  { immediate: true },
);

async function loadData() {
  if (!props.row?.id) {
    return;
  }
  loading.value = true;
  try {
    const result = await listPayCountryChannel(props.row.id);
    const current = result || [];
    current.forEach((item) => {
      (item.countryChannels || []).forEach((detail: Record<string, any>) => {
        detail.loading = false;
      });
    });
    list.value = current;
    channelCodes.value = current.map((item) => item.associated?.channelCode);
    activeKeys.value = current.map((item) => item.associated?.channelCode).filter(Boolean);
  } finally {
    loading.value = false;
  }
}

function validateField(item: Record<string, any>, field: string) {
  const value = String(item.countryChannelDetails?.[field] ?? '');
  if (
    ['factoryMinLimit', 'factoryMaxLimit', 'factoryDailyLimit'].includes(field)
  ) {
    return /^\d{1,8}(\.\d{0,2})?$/.test(value);
  }
  if (field === 'factoryCurrencyPoint') {
    const numberValue = Number(value);
    return numberValue >= 0 && numberValue <= 6;
  }
  return true;
}

async function saveDetail(item: Record<string, any>, field: string) {
  if (!validateField(item, field)) {
    message.warning(
      field === 'factoryCurrencyPoint'
        ? '货币小数点范围0 ~ 6'
        : '输入支持范围0 ~ 99999999最多2位小数',
    );
    return;
  }
  item.loading = true;
  try {
    const result = await addOrUpdateCountyChannelDetails(
      item.countryChannelDetails,
    );
    item.countryChannelDetails.id =
      result?.id || result?.body?.id || item.countryChannelDetails.id;
    message.success('保存成功');
    await loadData();
  } finally {
    item.loading = false;
  }
}

async function handleTransferChange(
  _value: Array<number | string>,
  direction: 'left' | 'right',
  moveKeys: Array<number | string>,
) {
  if (!props.row?.id || moveKeys.length === 0) {
    return;
  }
  if (direction === 'right') {
    await addBatchCountyAssociateChannel({
      channelCodes: moveKeys,
      payCountryId: props.row.id,
    });
  } else {
    await delBatchPayCountryChannel({
      channelCodes: moveKeys,
      payCountryId: props.row.id,
    });
  }
  message.success('操作成功');
  await loadData();
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="关联渠道"
    width="1200px"
    @cancel="emit('close')"
  >
    <div class="country-header">
      <div class="country-copy">
        <Image
          :preview="false"
          :src="row.country?.nationalFlag"
          class="flag"
        />
        <span>
          {{ row.country?.aliasName || '-' }} / 国家货币: {{ row.currency || '-' }}
          / 美元汇率: {{ row.usdExchangeRate || '-' }}
        </span>
      </div>
      <PayChannelTransfer
        :selected-channels="channelCodes"
        @change="handleTransferChange"
        @hide="() => {}"
      />
    </div>

    <Collapse v-model:activeKey="activeKeys" :bordered="false">
      <CollapsePanel
        v-for="item in list"
        :key="item.associated?.channelCode"
        :header="`${item.channel?.channelName || '-'} / ${item.associated?.channelCode || '-'}`"
      >
        <div
          v-for="detail in item.countryChannels || []"
          :key="detail.countryChannelDetails?.id || detail.payFactory?.factoryCode"
          class="detail-card"
        >
          <Card :bordered="false" size="small">
            <div class="detail-head">
              <Image
                :preview="false"
                :src="detail.payFactory?.factoryIcon"
                class="icon"
              />
              <strong>{{ detail.payFactory?.factoryName || '-' }}</strong>
            </div>

            <Form layout="vertical">
              <div class="grid">
                <FormItem label="最小额度">
                  <Input
                    v-model:value="detail.countryChannelDetails.factoryMinLimit"
                    @blur="saveDetail(detail, 'factoryMinLimit')"
                  />
                </FormItem>
                <FormItem label="最大额度">
                  <Input
                    v-model:value="detail.countryChannelDetails.factoryMaxLimit"
                    @blur="saveDetail(detail, 'factoryMaxLimit')"
                  />
                </FormItem>
                <FormItem label="每日限额">
                  <Input
                    v-model:value="detail.countryChannelDetails.factoryDailyLimit"
                    @blur="saveDetail(detail, 'factoryDailyLimit')"
                  />
                </FormItem>
                <FormItem label="第三方渠道CODE">
                  <Input
                    v-model:value="detail.countryChannelDetails.factoryChannel"
                    @blur="saveDetail(detail, 'factoryChannel')"
                  />
                </FormItem>
                <FormItem label="货币小数点">
                  <Input
                    v-model:value="detail.countryChannelDetails.factoryCurrencyPoint"
                    @blur="saveDetail(detail, 'factoryCurrencyPoint')"
                  />
                </FormItem>
                <FormItem label="是否启动">
                  <Switch
                    v-model:checked="detail.countryChannelDetails.shelf"
                    @change="saveDetail(detail, 'shelf')"
                  />
                </FormItem>
              </div>
            </Form>
          </Card>
        </div>
      </CollapsePanel>
    </Collapse>
  </Modal>
</template>

<style scoped>
.country-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.country-copy {
  align-items: center;
  display: flex;
  gap: 10px;
}

.flag {
  height: 20px;
  width: 32px;
}

.detail-card + .detail-card {
  margin-top: 12px;
}

.detail-head {
  align-items: center;
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}

.icon {
  border-radius: 999px;
  height: 32px;
  width: 32px;
}

.grid {
  column-gap: 12px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
