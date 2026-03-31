<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  deleteAndAddAdministratorAuth,
  getAdministratorAuthTable,
  getSysAdministratorAuthResourceByUserId,
} from '#/api/legacy/administrator';

import {
  Checkbox,
  CheckboxGroup,
  Modal,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  userId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const resourceList = ref<Array<Record<string, any>>>([]);
const selectedIds = ref<Array<number | string>>([]);

watch(
  () => ({ open: props.open, userId: props.userId }),
  async ({ open, userId }) => {
    if (!open || !userId) {
      return;
    }
    loading.value = true;
    try {
      const [resources, selected] = await Promise.all([
        getAdministratorAuthTable(),
        getSysAdministratorAuthResourceByUserId(userId),
      ]);
      resourceList.value = resources || [];
      selectedIds.value = selected || [];
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!props.userId) {
    return;
  }
  loading.value = true;
  try {
    await deleteAndAddAdministratorAuth({
      resourceList: [...selectedIds.value],
      userId: props.userId,
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
    title="权限设置"
    width="520px"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <CheckboxGroup v-model:value="selectedIds" class="auth-grid">
      <Checkbox
        v-for="item in resourceList"
        :key="item.id"
        :value="item.id"
      >
        {{ item.resourceName }}
      </Checkbox>
    </CheckboxGroup>
  </Modal>
</template>

<style scoped>
.auth-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
</style>
