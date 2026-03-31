<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addBdLead,
  updateBdLead,
} from '#/api/legacy/team';
import AccountInput from '#/components/account-input.vue';
import { regionConfigTable } from '#/api/legacy/system';

import {
  Form,
  FormItem,
  Modal,
  Select,
  SelectOption,
  Input,
  message,
} from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const saving = ref(false);
const regionLoading = ref(false);
const regionOptions = ref<Array<Record<string, any>>>([]);

const form = reactive({
  contact: '',
  id: '',
  regionId: '',
  sysOrigin: '',
  userId: '',
});

const isUpdate = computed(() => Boolean(props.row?.id));
const title = computed(() => (isUpdate.value ? '修改BD Leader' : '添加BD Leader'));

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    form.id = String(props.row?.id || '');
    form.userId = String(props.row?.userId || props.row?.userProfile?.id || '');
    form.sysOrigin = props.sysOrigin || props.row?.sysOrigin || 'LIKEI';
    form.contact = props.row?.contact || '';
    form.regionId = String(props.row?.regionId || '');
    await loadRegions(form.sysOrigin);
  },
  { immediate: true },
);

async function loadRegions(sysOrigin: string) {
  if (!sysOrigin) {
    regionOptions.value = [];
    return;
  }
  regionLoading.value = true;
  try {
    const result = await regionConfigTable({ sysOrigin });
    regionOptions.value = result || [];
  } finally {
    regionLoading.value = false;
  }
}

async function handleSubmit() {
  if (!isUpdate.value && !String(form.userId || '').trim()) {
    message.warning('请输入BD Leader 用户ID');
    return;
  }
  if (!form.regionId) {
    message.warning('请选择区域');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      contact: form.contact.trim(),
      id: form.id || undefined,
      regionId: form.regionId,
      sysOrigin: form.sysOrigin,
      userId: form.userId,
    };
    if (isUpdate.value) {
      await updateBdLead(payload);
    } else {
      await addBdLead(payload);
    }
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :confirm-loading="saving"
    :open="open"
    destroy-on-close
    :title="title"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem v-if="!isUpdate" label="Leader">
        <AccountInput
          v-model:value="form.userId"
          :sys-origin="form.sysOrigin"
          placeholder="BD Leader 用户ID"
        />
      </FormItem>
      <FormItem label="区域">
        <Select option-label-prop="label"
          v-model:value="form.regionId"
          :loading="regionLoading"
          placeholder="请选择区域"
        >
          <SelectOption
            v-for="item in regionOptions"
            :key="item.id"
            :label="item.regionName"
            :value="String(item.id)"
          >
            {{ item.regionName }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="联系方式">
        <Input v-model:value="form.contact" placeholder="联系方式" />
      </FormItem>
    </Form>
  </Modal>
</template>
