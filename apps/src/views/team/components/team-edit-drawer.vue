<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { regionConfigTable } from '#/api/legacy/system';
import { updateTeamProfile } from '#/api/legacy/team';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  Switch,
  message,
} from 'antdv-next';

import TeamCountrySelect from './team-country-select.vue';

const props = defineProps<{
  open: boolean;
  profile: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [Record<string, any>, Record<string, any> | null];
}>();

function createForm() {
  return {
    country: {
      countryCode: '',
      countryId: '',
      countryName: '',
    },
    id: '',
    region: '',
    setting: {
      hostSalaryToAgent: false,
      maxMember: '1000',
    },
    sysOrigin: '',
    withdrawalEnabled: false,
  };
}

const saving = ref(false);
const initialRegion = ref('');
const regionOptions = ref<Array<Record<string, any>>>([]);
const selectedRegion = ref<Record<string, any> | null>(null);
const form = reactive(createForm());

watch(
  () => props.open,
  async (open) => {
    if (!open || !props.profile) {
      return;
    }
    Object.assign(form, createForm(), JSON.parse(JSON.stringify(props.profile)));
    form.country = props.profile.country
      ? { ...createForm().country, ...props.profile.country }
      : createForm().country;
    form.setting = props.profile.setting
      ? { ...createForm().setting, ...props.profile.setting }
      : createForm().setting;
    initialRegion.value = String(form.region || '');
    selectedRegion.value = null;
    await loadRegions(String(props.profile.sysOrigin || ''));
  },
  { immediate: true },
);

async function loadRegions(sysOrigin: string) {
  if (!sysOrigin) {
    regionOptions.value = [];
    return;
  }
  regionOptions.value = await regionConfigTable({ sysOrigin });
}

function handleCountryChange(_value: number | string, row: Record<string, any> | null) {
  form.country.countryId = row?.id || '';
  form.country.countryCode = row?.alphaTwo || row?.alphaThree || '';
  form.country.countryName = row?.aliasName || row?.countryName || '';
}

async function submitPayload() {
  const payload = JSON.parse(JSON.stringify(form));
  await updateTeamProfile(payload);
  message.success('保存成功');
  emit('success', payload, selectedRegion.value);
  emit('close');
}

async function handleSubmit() {
  if (!form.region) {
    message.warning('请选择区域');
    return;
  }
  if (!form.country.countryId) {
    message.warning('请选择国家');
    return;
  }
  if (!String(form.setting.maxMember || '').trim()) {
    message.warning('请输入成员数量');
    return;
  }
  if (String(form.id || '') && String(initialRegion.value) !== String(form.region || '')) {
    Modal.confirm({
      title: '变更代理团队区域将清空该代理名下所有主播目标,你确定继续吗?',
      async onOk() {
        saving.value = true;
        try {
          await submitPayload();
        } finally {
          saving.value = false;
        }
      },
    });
    return;
  }
  saving.value = true;
  try {
    await submitPayload();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="团队资料"
    width="680px"
    @close="emit('close')"
  >
    <div
      v-if="String(form.id || '') && String(initialRegion) !== String(form.region || '')"
      class="warning-banner"
    >
      变更代理团队区域将清空该代理名下所有主播目标，请谨慎操作
    </div>

    <Form layout="vertical">
      <FormItem label="区域">
        <Select option-label-prop="label"
          v-model:value="form.region"
          placeholder="区域"
          @change="(value: string) => selectedRegion = regionOptions.find((item) => String(item.id) === String(value)) || null"
        >
          <SelectOption
            v-for="item in regionOptions"
            :key="item.id"
            :label="item.regionName"
            :value="item.id"
          >
            {{ item.regionName }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="国家">
        <TeamCountrySelect
          v-model:value="form.country.countryId"
          @change="handleCountryChange"
        />
      </FormItem>
      <FormItem label="成员数量">
        <Input
          v-model:value="form.setting.maxMember"
          :maxlength="100"
          placeholder="最大成员数量"
          show-count
        />
      </FormItem>
      <FormItem label="代理接收主播工资">
        <Switch v-model:checked="form.setting.hostSalaryToAgent" />
      </FormItem>
      <FormItem label="允许提现">
        <Switch v-model:checked="form.withdrawalEnabled" />
      </FormItem>
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
.warning-banner {
  background: #fff7ed;
  border: 1px solid #fdba74;
  border-radius: 12px;
  color: #9a3412;
  margin-bottom: 16px;
  padding: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
