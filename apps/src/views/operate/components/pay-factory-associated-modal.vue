<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  addPayFactoryAssociatedChannels,
  delPayFactoryAssociatedChannels,
  listFactoryAssociatedChannels,
} from '#/api/legacy/pay';

import {
  Image,
  Modal,
  Table,
  message,
} from 'antdv-next';

import { PAY_CHANNEL_GROUP_NAME_MAP } from '../pay-shared';

import PayChannelTransfer from './pay-channel-transfer.vue';

const props = defineProps<{
  factoryCode: string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const channelCodes = ref<Array<number | string>>([]);

const columns: any[] = [
  { dataIndex: 'channelCode', key: 'channelCode', title: '渠道Code', width: 160 },
  { dataIndex: 'channelName', key: 'channelName', title: '渠道名称', width: 180 },
  { dataIndex: 'channelType', key: 'channelType', title: '渠道类型', width: 160 },
  { dataIndex: 'channelIcon', key: 'channelIcon', title: '渠道Icon', width: 120 },
];

watch(
  () => props.open,
  (open) => {
    const factoryCode = props.factoryCode || '';
    if (open && factoryCode) {
      void loadData(factoryCode);
    }
  },
  { immediate: true },
);

async function loadData(factoryCode: string) {
  loading.value = true;
  try {
    list.value = (await listFactoryAssociatedChannels(factoryCode)) || [];
    channelCodes.value = list.value.map((item) => item.channelCode);
  } finally {
    loading.value = false;
  }
}

async function handleTransferChange(
  _value: Array<number | string>,
  direction: 'left' | 'right',
  moveKeys: Array<number | string>,
) {
  if (!props.factoryCode || moveKeys.length === 0) {
    return;
  }
  if (direction === 'right') {
    await addPayFactoryAssociatedChannels(
      moveKeys.map((channelCode) => ({
        channelCode,
        factoryChannel: '',
        factoryCode: props.factoryCode,
      })),
    );
  } else {
    await delPayFactoryAssociatedChannels({
      channelCodes: moveKeys,
      factoryCode: props.factoryCode,
    });
  }
  message.success('操作成功');
  await loadData(props.factoryCode);
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="关联渠道"
    width="960px"
    @cancel="emit('close')"
  >
    <div class="toolbar">
      <PayChannelTransfer
        :selected-channels="channelCodes"
        @change="handleTransferChange"
        @hide="() => {}"
      />
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'channelName'">
          {{ record.payChannel?.channelName || '-' }}
        </template>
        <template v-else-if="column.key === 'channelType'">
          {{ PAY_CHANNEL_GROUP_NAME_MAP[record.payChannel?.channelType] || record.payChannel?.channelType || '-' }}
        </template>
        <template v-else-if="column.key === 'channelIcon'">
          <Image
            :preview="false"
            :src="record.payChannel?.channelIcon"
            class="icon"
          />
        </template>
      </template>
    </Table>
  </Modal>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.icon {
  border-radius: 8px;
  height: 42px;
  width: 42px;
}
</style>
