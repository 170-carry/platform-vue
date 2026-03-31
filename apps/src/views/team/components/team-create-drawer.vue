<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { createTeam } from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';

import {
  Button,
  Checkbox,
  Drawer,
  Form,
  FormItem,
  Input,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  TextArea,
  message,
} from 'antdv-next';

import {
  TEAM_CONTACT_TYPE_OPTIONS,
} from '../shared';

const props = defineProps<{
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

function createForm() {
  return {
    account: '',
    bdUserId: '',
    contact: {
      contact: '',
      remarks: '',
      type: '',
    },
    ownUserId: '',
    region: '',
    remarks: '',
    setting: {
      maxMember: '1000',
    },
    sysOrigin: '',
  };
}

const saving = ref(false);
const bindBd = ref<'no' | 'yes'>('no');
const formSettingDefault = ref(false);
const formContactAdd = ref(false);
const form = reactive(createForm());

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm(), {
      sysOrigin: props.sysOrigin || '',
    });
    bindBd.value = 'no';
    formSettingDefault.value = false;
    formContactAdd.value = false;
  },
  { immediate: true },
);

watch(
  () => props.sysOrigin,
  (value) => {
    form.sysOrigin = value || '';
    form.region = '';
  },
  { immediate: true },
);

async function handleSubmit() {
  if (bindBd.value === 'no' && !form.region) {
    message.warning('请选择区域');
    return;
  }
  if (!form.ownUserId) {
    message.warning('请输入代理ID');
    return;
  }
  if (bindBd.value === 'yes' && !form.bdUserId) {
    message.warning('请输入BD ID');
    return;
  }
  if (formSettingDefault.value && !String(form.setting.maxMember || '').trim()) {
    message.warning('请输入成员数量');
    return;
  }
  if (formContactAdd.value) {
    if (!form.contact.type) {
      message.warning('请选择联系方式类型');
      return;
    }
    if (!form.contact.contact.trim()) {
      message.warning('请输入联系方式');
      return;
    }
  }
  saving.value = true;
  try {
    const payload = JSON.parse(JSON.stringify(form));
    payload.sysOrigin = props.sysOrigin;
    if (!formSettingDefault.value) {
      payload.setting = null;
    }
    if (!formContactAdd.value) {
      payload.contact = null;
    }
    if (bindBd.value === 'no') {
      payload.bdUserId = '';
    }
    await createTeam(payload);
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="创建代理"
    width="680px"
    @close="emit('close')"
  >
    <Form layout="vertical">
      <FormItem v-if="bindBd === 'no'" label="区域">
        <Select option-label-prop="label" v-model:value="form.region" placeholder="区域">
          <slot name="regions" />
        </Select>
      </FormItem>
      <FormItem label="代理">
        <AccountInput
          v-model:value="form.ownUserId"
          :sys-origin="props.sysOrigin"
          placeholder="请输入代理ID"
        />
      </FormItem>
      <FormItem label="绑定BD">
        <RadioGroup v-model:value="bindBd">
          <Radio value="yes">是</Radio>
          <Radio value="no">否</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem v-if="bindBd === 'yes'" label="BD">
        <AccountInput
          v-model:value="form.bdUserId"
          default-select-type="LONG"
          :sys-origin="props.sysOrigin"
          placeholder="请输入BD ID"
        />
      </FormItem>
      <FormItem label="备注">
        <TextArea
          v-model:value="form.remarks"
          :maxlength="100"
          :rows="4"
          placeholder="请输入备注"
          show-count
        />
      </FormItem>
      <FormItem>
        <div class="form-flags">
          <Checkbox v-model:checked="formSettingDefault">设置</Checkbox>
          <Checkbox v-model:checked="formContactAdd">联系方式</Checkbox>
        </div>
      </FormItem>

      <div v-if="formSettingDefault" class="section-card">
        <div class="section-title">设置信息</div>
        <FormItem label="成员数量">
          <Input
            v-model:value="form.setting.maxMember"
            :maxlength="100"
            placeholder="最大成员数量"
            show-count
          />
        </FormItem>
      </div>

      <div v-if="formContactAdd" class="section-card">
        <div class="section-title">联系方式</div>
        <FormItem label="类型">
          <Select option-label-prop="label" v-model:value="form.contact.type" placeholder="选择类型">
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
            v-model:value="form.contact.contact"
            :maxlength="100"
            placeholder="请输入联系方式"
            show-count
          />
        </FormItem>
        <FormItem label="备注">
          <TextArea
            v-model:value="form.contact.remarks"
            :maxlength="100"
            :rows="4"
            placeholder="请输入备注"
            show-count
          />
        </FormItem>
      </div>
    </Form>

    <template #footer>
      <div class="drawer-footer">
        <Button @click="emit('close')">取消</Button>
        <Button :loading="saving" type="primary" @click="handleSubmit">
          保存
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.form-flags {
  display: flex;
  gap: 16px;
}

.section-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 16px;
  padding: 16px;
}

.section-title {
  color: #1e3a8a;
  font-weight: 600;
  margin-bottom: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
