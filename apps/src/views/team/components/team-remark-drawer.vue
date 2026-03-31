<script lang="ts" setup>
import { ref, watch } from 'vue';

import { addTeamRemarks, delTeamRemarks } from '#/api/legacy/team';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Drawer,
  Empty,
  Modal,
  TextArea,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  profile: null | Record<string, any>;
}>();

const emit = defineEmits<{
  addRemarks: [Record<string, any>];
  close: [];
  revemoRemarks: [number];
}>();

const addOpen = ref(false);
const saving = ref(false);
const remarks = ref<Array<Record<string, any>>>([]);
const remarkText = ref('');

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    remarks.value = Array.isArray(props.profile?.remarks)
      ? [...(props.profile?.remarks || [])]
      : [];
    remarkText.value = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!remarkText.value.trim()) {
    message.warning('请输入备注');
    return;
  }
  saving.value = true;
  try {
    const result = await addTeamRemarks({
      remarks: remarkText.value.trim(),
      teamId: props.profile?.id,
    });
    if (result) {
      remarks.value.push(result);
      emit('addRemarks', result);
    }
    remarkText.value = '';
    addOpen.value = false;
    message.success('保存成功');
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>, index: number) {
  remarks.value.splice(index, 1);
  emit('revemoRemarks', index);
  void delTeamRemarks({
    remarkId: record.remarkId,
    teamId: props.profile?.id,
  });
}
</script>

<template>
  <Drawer
    :open="open"
    title="备注"
    width="640px"
    @close="emit('close')"
  >
    <div class="remark-list">
      <Empty v-if="remarks.length === 0" description="暂无备注" />
      <div
        v-for="(item, index) in remarks"
        :key="item.remarkId || index"
        class="remark-item"
      >
        <div class="remark-meta">
          <span>{{ item.createBackUserName || '-' }}</span>
          <span>{{ formatDate(item.createTime) }}</span>
        </div>
        <div class="remark-text">{{ item.remark || '-' }}</div>
        <Button danger size="small" type="link" @click="handleDelete(item, index)">
          删除
        </Button>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <Button @click="emit('close')">关闭</Button>
        <Button type="primary" @click="addOpen = true">新增</Button>
      </div>
    </template>

    <Modal
      :confirm-loading="saving"
      :open="addOpen"
      destroy-on-close
      title="备注"
      @cancel="addOpen = false"
      @ok="handleSubmit"
    >
      <TextArea
        v-model:value="remarkText"
        :maxlength="100"
        :rows="5"
        placeholder="请输入备注"
        show-count
      />
    </Modal>
  </Drawer>
</template>

<style scoped>
.remark-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remark-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.remark-meta {
  color: #64748b;
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.remark-text {
  color: #0f172a;
  line-height: 1.7;
  margin-bottom: 8px;
  white-space: pre-wrap;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
