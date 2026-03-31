<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { listPayChannel } from '#/api/legacy/pay';

import { Button, Popover, Transfer } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    selectedChannels?: Array<number | string>;
  }>(),
  {
    selectedChannels: () => [],
  },
);

const emit = defineEmits<{
  change: [
    Array<number | string>,
    'left' | 'right',
    Array<number | string>,
  ];
  hide: [boolean];
}>();

const open = ref(false);
const loading = ref(false);
const changed = ref(false);
const targetKeys = ref<Array<number | string>>([]);
const channels = ref<Array<Record<string, any>>>([]);

const dataSource = computed(() =>
  channels.value.map((item) => ({
    channelCode: item.channelCode,
    key: item.channelCode,
    title: `${item.channelName} / ${item.channelCode}`,
  })),
);

watch(
  () => props.selectedChannels,
  (value) => {
    targetKeys.value = [...(value || [])];
  },
  { immediate: true, deep: true },
);

async function loadChannels() {
  loading.value = true;
  try {
    channels.value = (await listPayChannel()) || [];
  } finally {
    loading.value = false;
  }
}

function handleVisibleChange(value: boolean) {
  open.value = value;
  if (value) {
    changed.value = false;
    if (channels.value.length === 0) {
      void loadChannels();
    }
    return;
  }
  emit('hide', changed.value);
}

function handleChange(
  nextTargetKeys: Array<number | string>,
  direction: 'left' | 'right',
  moveKeys: Array<number | string>,
) {
  targetKeys.value = nextTargetKeys;
  changed.value = true;
  emit('change', nextTargetKeys, direction, moveKeys);
}
</script>

<template>
  <Popover
    :open="open"
    placement="bottomRight"
    title="添加渠道"
    trigger="click"
    @update:open="handleVisibleChange"
  >
    <template #content>
      <Transfer
        v-model:target-keys="targetKeys"
        :data-source="dataSource"
        :disabled="loading"
        :list-style="{ height: '420px', width: '280px' }"
        :operations="['开通', '删除']"
        :render="(item: any) => item.title"
        show-search
        @change="handleChange"
      />
    </template>
    <Button type="link">添加渠道</Button>
  </Popover>
</template>
