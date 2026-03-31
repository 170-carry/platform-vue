<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

import { useSortable } from '@vben/hooks';

import type { LegacyEnumConfigItem } from '#/api/legacy/app-system';
import {
  getEnumConfigByGroup,
  updateConfigInfo,
  updateEnumConfigSort,
} from '#/api/legacy/app-system';
import { ENUM_CONFIG_DATA_TYPE_EXPRESSION } from '#/views/system/shared';

import {
  Button,
  Empty,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Tooltip,
  message,
} from 'antdv-next';

const props = defineProps<{
  group: string;
}>();

const loading = ref(false);
const sortLoading = ref(false);
const list = ref<LegacyEnumConfigItem[]>([]);
const dirty = ref(false);
const editOpen = ref(false);
const editLoading = ref(false);
const editValue = ref('');
const containerRef = ref<HTMLElement>();
const activeItem = ref<LegacyEnumConfigItem | null>(null);

let sortableInstance: any = null;

function isBooleanType(item?: LegacyEnumConfigItem) {
  return item?.dataType === 'bool';
}

function getDisplayValue(item?: LegacyEnumConfigItem) {
  if (!item) {
    return '-';
  }
  if (isBooleanType(item)) {
    if (item.val === 'true') {
      return '开';
    }
    if (item.val === 'false') {
      return '关';
    }
  }
  return item.val || '-';
}

async function copyText(text?: string) {
  const value = String(text || '');
  if (!value) {
    message.warning('暂无可复制内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success('复制成功');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.left = '-9999px';
    textarea.style.position = 'fixed';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    message.success('复制成功');
  }
}

async function initSortable() {
  if (!containerRef.value || sortableInstance) {
    return;
  }
  const { initializeSortable } = useSortable(containerRef.value, {
    animation: 150,
    ghostClass: 'enum-setting-item--dragging',
    handle: '.drag-handle',
    onEnd(event) {
      const oldIndex = event.oldIndex ?? -1;
      const newIndex = event.newIndex ?? -1;
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return;
      }
      const next = [...list.value];
      next.splice(newIndex, 0, next.splice(oldIndex, 1)[0]!);
      list.value = next;
      dirty.value = true;
    },
  });
  sortableInstance = await initializeSortable();
}

async function loadData() {
  if (!props.group) {
    list.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await getEnumConfigByGroup(props.group);
    list.value = result.result || [];
    dirty.value = false;
    await nextTick();
    await initSortable();
  } finally {
    loading.value = false;
  }
}

function openEdit(item: LegacyEnumConfigItem) {
  const expression = ENUM_CONFIG_DATA_TYPE_EXPRESSION[item.dataType || ''];
  if (!expression) {
    message.error('未找到相关定义数据类型，请联系管理员');
    return;
  }
  activeItem.value = item;
  editValue.value = String(item.val || '');
  editOpen.value = true;
}

async function handleUpdateValue() {
  const item = activeItem.value;
  if (!item) {
    return;
  }
  const expression = ENUM_CONFIG_DATA_TYPE_EXPRESSION[item.dataType || ''];
  if (!expression) {
    message.error('未找到相关定义数据类型，请联系管理员');
    return;
  }
  if (expression.rex && !expression.rex.test(editValue.value)) {
    message.warning(`数据类型错误: ${expression.msg}`);
    return;
  }

  editLoading.value = true;
  try {
    await updateConfigInfo({
      id: item.id,
      name: item.name,
      val: editValue.value,
    });
    message.success('保存成功');
    editOpen.value = false;
    await loadData();
  } finally {
    editLoading.value = false;
  }
}

async function handleSwitchChange(checked: boolean, item: LegacyEnumConfigItem) {
  const previous = item.val;
  item.val = checked ? 'true' : 'false';
  try {
    await updateConfigInfo({
      id: item.id,
      name: item.name,
      val: item.val,
    });
    message.success('保存成功');
  } catch (error) {
    item.val = previous;
    throw error;
  }
}

async function handleSortSave() {
  if (list.value.length === 0) {
    return;
  }
  const size = list.value.length;
  const payload = list.value.map((item, index) => ({
    id: item.id,
    sort: size - index,
  }));

  sortLoading.value = true;
  try {
    await updateEnumConfigSort(payload);
    message.success('排序已保存');
    dirty.value = false;
    await loadData();
  } finally {
    sortLoading.value = false;
  }
}

watch(
  () => props.group,
  () => {
    loadData();
  },
  { immediate: true },
);

watch(
  () => list.value.length,
  () => {
    nextTick(initSortable);
  },
);

onMounted(() => {
  nextTick(initSortable);
});

onUnmounted(() => {
  sortableInstance?.destroy?.();
  sortableInstance = null;
});
</script>

<template>
  <div class="panel-root">
    <div class="panel-tools">
      <Button
        v-if="dirty"
        :loading="sortLoading"
        danger
        type="primary"
        @click="handleSortSave"
      >
        保存排序
      </Button>
    </div>

    <Spin :spinning="loading">
      <div v-if="list.length > 0" ref="containerRef" class="setting-list">
        <div
          v-for="item in list"
          :key="item.id"
          class="setting-item"
        >
          <div class="drag-handle" title="拖拽排序">
            ⋮⋮
          </div>

          <div class="setting-copy">
            <div class="setting-title-row">
              <Tooltip v-if="item.description">
                <template #title>
                  <div class="tooltip-pre">{{ item.description }}</div>
                </template>
                <span class="setting-title">{{ item.title }}</span>
              </Tooltip>
              <span v-else class="setting-title">{{ item.title }}</span>
              <Button size="small" type="link" @click="copyText(item.name)">
                复制键
              </Button>
            </div>
            <div class="setting-desc">
              {{ item.description || item.name || '-' }}
            </div>
          </div>

          <div class="setting-value">
            {{ getDisplayValue(item) }}
          </div>

          <div class="setting-action">
            <Switch
              v-if="isBooleanType(item)"
              :checked="item.val === 'true'"
              :disabled="item.inoperable"
              checked-children="开"
              un-checked-children="关"
              @change="(checked: boolean) => handleSwitchChange(checked, item)"
            />
            <Button
              v-else
              :disabled="item.inoperable"
              type="link"
              @click="openEdit(item)"
            >
              编辑
            </Button>
          </div>
        </div>
      </div>

      <Empty v-else description="暂无数据" />
    </Spin>

    <Modal
      :confirm-loading="editLoading"
      :open="editOpen"
      destroy-on-close
      ok-text="保存"
      title="编辑参数"
      @cancel="editOpen = false"
      @ok="handleUpdateValue"
    >
      <Space direction="vertical" style="width: 100%">
        <div class="edit-tip">
          {{
            ENUM_CONFIG_DATA_TYPE_EXPRESSION[activeItem?.dataType || '']?.msg ||
            '请输入参数值'
          }}
        </div>
        <Input
          v-model:value="editValue"
          placeholder="请输入参数值"
        />
      </Space>
    </Modal>
  </div>
</template>

<style scoped>
.panel-root {
  margin-top: 16px;
}

.panel-tools {
  margin-bottom: 16px;
}

.setting-list {
  display: grid;
  gap: 12px;
}

.setting-item {
  align-items: center;
  background: linear-gradient(180deg, #fff, #f8fafc);
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  display: grid;
  gap: 16px;
  grid-template-columns: 32px minmax(220px, 1.8fr) minmax(160px, 1fr) 140px;
  padding: 18px 20px;
}

.drag-handle {
  color: #94a3b8;
  cursor: move;
  font-size: 18px;
  line-height: 1;
  text-align: center;
  user-select: none;
}

.setting-copy {
  min-width: 0;
}

.setting-title-row {
  align-items: center;
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.setting-title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}

.setting-desc {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.setting-value {
  color: #1e293b;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.setting-action {
  align-items: center;
  display: flex;
  justify-content: flex-end;
}

.tooltip-pre {
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-word;
}

.edit-tip {
  color: #64748b;
  font-size: 13px;
}

:deep(.enum-setting-item--dragging) {
  background: #eff6ff;
  border-color: #93c5fd;
}

@media (max-width: 960px) {
  .setting-item {
    grid-template-columns: 24px 1fr;
  }

  .setting-value,
  .setting-action {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>
