<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  addPayOpenCountyBatch,
  delPayOpenCountyBatch,
  listPayOpenCountry,
} from '#/api/legacy/pay';
import { getCountryAlls } from '#/api/legacy/system';

import { Modal, Transfer, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const countries = ref<Array<Record<string, any>>>([]);
const targetKeys = ref<Array<number | string>>([]);

const dataSource = computed(() =>
  countries.value.map((item) => ({
    id: item.id,
    key: item.id,
    title: item.aliasName || item.countryName || `国家${item.id}`,
  })),
);

watch(
  () => props.open,
  (value) => {
    if (value) {
      void loadData();
    }
  },
);

async function loadData() {
  loading.value = true;
  try {
    const [countryList, openCountryList] = await Promise.all([
      getCountryAlls(),
      listPayOpenCountry(),
    ]);
    countries.value = countryList || [];
    targetKeys.value = (openCountryList || []).map((item) => item.countryId);
  } finally {
    loading.value = false;
  }
}

async function handleChange(
  nextTargetKeys: Array<number | string>,
  direction: 'left' | 'right',
  moveKeys: Array<number | string>,
) {
  if (moveKeys.length === 0) {
    return;
  }
  loading.value = true;
  try {
    if (direction === 'right') {
      await addPayOpenCountyBatch(
        moveKeys.map((countryId) => ({
          countryId,
          currency: '',
          shelf: false,
          usdExchangeRate: 0,
        })),
      );
    } else {
      await delPayOpenCountyBatch(moveKeys);
    }
    targetKeys.value = nextTargetKeys;
    message.success('操作成功');
    emit('success');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="国家选择"
    width="760px"
    @cancel="emit('close')"
  >
    <Transfer
      v-model:target-keys="targetKeys"
      :data-source="dataSource"
      :disabled="loading"
      :list-style="{ height: '480px', width: '300px' }"
      :operations="['开通', '删除']"
      :render="(item: any) => item.title"
      show-search
      @change="handleChange"
    />
  </Modal>
</template>
