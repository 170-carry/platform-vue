<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  getTemplateById,
  updateTemplate,
} from '#/api/legacy/system';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  Space,
  Spin,
  TextArea,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateActivityTemplateEditorModal' });

const props = defineProps<{
  open: boolean;
  templateId: number | string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const saving = ref(false);
const template = ref<Record<string, any> | null>(null);
const jsonText = ref('');

const title = computed(() => {
  if (!props.templateId) {
    return '编辑模版';
  }
  return `编辑模版 #${props.templateId}`;
});

watch(
  () => (props.open ? props.templateId : ''),
  async (templateId) => {
    if (!templateId) {
      return;
    }
    loading.value = true;
    try {
      const result = await getTemplateById(templateId);
      template.value = result || {};
      jsonText.value = JSON.stringify(template.value?.indexTree || [], null, 2);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

async function handleSave() {
  if (!template.value) {
    return;
  }
  let indexTree: any[] = [];
  try {
    const parsed = JSON.parse(jsonText.value || '[]');
    if (!Array.isArray(parsed)) {
      message.warning('indexTree 必须是数组');
      return;
    }
    indexTree = parsed;
  } catch {
    message.warning('JSON 格式不正确');
    return;
  }

  saving.value = true;
  try {
    await updateTemplate({
      ...template.value,
      indexTree,
    });
    template.value = {
      ...template.value,
      indexTree,
    };
    message.success('保存成功');
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    destroy-on-close
    width="1080"
    @close="emit('close')"
  >
    <Spin :spinning="loading">
      <div v-if="template" class="editor">
        <Descriptions bordered size="small">
          <DescriptionsItem label="模版ID">
            {{ template.id || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="模版名称">
            {{ template.name || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="修改时间">
            {{ template.updateTime || '-' }}
          </DescriptionsItem>
        </Descriptions>

        <div class="tips">
          <div>原项目这里编辑的是模版 `indexTree` 结构。</div>
          <div>当前保持同一份 JSON 结构读写，不改动后台字段定义。</div>
        </div>

        <TextArea
          v-model:value="jsonText"
          :auto-size="{ minRows: 24, maxRows: 36 }"
          class="json-editor"
          spellcheck="false"
        />
      </div>
      <Empty v-else description="未获取到模版数据" />
    </Spin>

    <template #footer>
      <Space>
        <Button @click="emit('close')">关闭</Button>
        <Button
          :disabled="!template"
          :loading="saving"
          type="primary"
          @click="handleSave"
        >
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.editor {
  display: grid;
  gap: 16px;
}

.tips {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #475569;
  line-height: 1.7;
  padding: 12px 14px;
}

.json-editor {
  font-family:
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    monospace;
}
</style>
