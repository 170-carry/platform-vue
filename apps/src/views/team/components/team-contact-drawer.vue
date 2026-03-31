<script lang="ts" setup>
import { ref, watch } from 'vue';

import { addTeamContact, delTeamContact } from '#/api/legacy/team';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  TextArea,
  message,
} from 'antdv-next';

import { TEAM_CONTACT_TYPE_OPTIONS } from '../shared';

const props = defineProps<{
  open: boolean;
  profile: null | Record<string, any>;
}>();

const emit = defineEmits<{
  addContact: [Record<string, any>];
  close: [];
  revemoContact: [number];
}>();

function createContactForm() {
  return {
    contact: '',
    remarks: '',
    teamId: '',
    type: '',
  };
}

const addOpen = ref(false);
const saving = ref(false);
const contacts = ref<Array<Record<string, any>>>([]);
const form = ref(createContactForm());

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    contacts.value = Array.isArray(props.profile?.contacts)
      ? [...(props.profile?.contacts || [])]
      : [];
    form.value = {
      ...createContactForm(),
      teamId: String(props.profile?.id || ''),
    };
  },
  { immediate: true },
);

async function handleSubmit() {
  if (!form.value.type) {
    message.warning('请选择类型');
    return;
  }
  if (!form.value.contact.trim()) {
    message.warning('请输入联系方式');
    return;
  }
  saving.value = true;
  try {
    const result = await addTeamContact({ ...form.value });
    if (result) {
      contacts.value.push(result);
      emit('addContact', result);
    }
    form.value = {
      ...createContactForm(),
      teamId: String(props.profile?.id || ''),
    };
    addOpen.value = false;
    message.success('保存成功');
  } finally {
    saving.value = false;
  }
}

function getTypeLabel(value?: string) {
  return (
    TEAM_CONTACT_TYPE_OPTIONS.find((item) => item.value === value)?.name || value || '-'
  );
}

function handleDelete(record: Record<string, any>, index: number) {
  contacts.value.splice(index, 1);
  emit('revemoContact', index);
  void delTeamContact({
    contactId: record.contactId,
    teamId: props.profile?.id,
  });
}
</script>

<template>
  <Drawer
    :open="open"
    title="联系方式"
    width="680px"
    @close="emit('close')"
  >
    <div class="contact-list">
      <Empty v-if="contacts.length === 0" description="暂无联系方式" />
      <div
        v-for="(item, index) in contacts"
        :key="item.contactId || index"
        class="contact-item"
      >
        <div class="contact-meta">
          <span>{{ item.createBackUserName || '-' }}</span>
          <span>{{ formatDate(item.createTime) }}</span>
        </div>
        <div>类型: {{ getTypeLabel(item.type) }}</div>
        <div>联系: {{ item.contact || '-' }}</div>
        <div v-if="item.remarks">备注: {{ item.remarks }}</div>
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
      title="联系方式"
      @cancel="addOpen = false"
      @ok="handleSubmit"
    >
      <Form layout="vertical">
        <FormItem label="类型">
          <Select option-label-prop="label" v-model:value="form.type" placeholder="选择类型">
            <SelectOption
              v-for="item in TEAM_CONTACT_TYPE_OPTIONS"
              :key="item.value"
              :label="item.name"
              :value="item.value"
            >
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="联系">
          <Input
            v-model:value="form.contact"
            :maxlength="100"
            placeholder="请输入联系方式"
            show-count
          />
        </FormItem>
        <FormItem label="备注">
          <TextArea
            v-model:value="form.remarks"
            :maxlength="100"
            :rows="5"
            placeholder="请输入备注"
            show-count
          />
        </FormItem>
      </Form>
    </Modal>
  </Drawer>
</template>

<style scoped>
.contact-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.contact-meta {
  color: #64748b;
  display: flex;
  justify-content: space-between;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
