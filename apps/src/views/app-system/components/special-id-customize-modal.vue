<script lang="ts" setup>
import { reactive, watch } from 'vue';

import { Button, Form, FormItem, Input, Modal, Space } from 'antdv-next';

const props = defineProps<{
  customizeField?: Record<string, any> | null;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [Record<string, string>];
}>();

const state = reactive({
  attributes: [{ key: '', value: '' }],
});

function syncAttributes() {
  const source = props.customizeField || {};
  const attributes = Object.entries(source).map(([key, value]) => ({
    key,
    value: String(value ?? ''),
  }));
  state.attributes = attributes.length > 0 ? attributes : [{ key: '', value: '' }];
}

watch(
  () => [props.open, props.customizeField],
  ([open]) => {
    if (!open) {
      return;
    }
    syncAttributes();
  },
  { immediate: true },
);

function addAttribute() {
  state.attributes.push({ key: '', value: '' });
}

function cleanAttributes() {
  state.attributes = [{ key: '', value: '' }];
}

function recommendAttributes() {
  state.attributes.push(
    { key: 'fontColor', value: '' },
    { key: 'level', value: '' },
  );
}

function handleSubmit() {
  const result: Record<string, string> = {};
  state.attributes.forEach((item) => {
    if (!item.key || !item.value) {
      return;
    }
    result[item.key] = item.value;
  });
  emit('submit', result);
}
</script>

<template>
  <Modal
    :open="open"
    destroy-on-close
    ok-text="确定"
    title="自定义属性"
    width="720"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <div
        v-for="(item, index) in state.attributes"
        :key="index"
        class="attribute-row"
      >
        <FormItem label="键">
          <Input v-model:value="item.key" placeholder="请输入键" />
        </FormItem>
        <FormItem label="值">
          <Input v-model:value="item.value" placeholder="请输入值" />
        </FormItem>
      </div>
    </Form>

    <template #footer>
      <Space>
        <Button @click="cleanAttributes">清空属性</Button>
        <Button @click="addAttribute">新增属性</Button>
        <Button @click="recommendAttributes">推荐属性</Button>
        <Button type="primary" @click="handleSubmit">确定</Button>
      </Space>
    </template>
  </Modal>
</template>

<style scoped>
.attribute-row {
  column-gap: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
</style>
