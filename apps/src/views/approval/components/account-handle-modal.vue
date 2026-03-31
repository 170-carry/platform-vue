<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  getUserAccountStatus,
  handleUserAccount,
  translateUserLangContent,
} from '#/api/legacy/approval';

import {
  Button,
  Form,
  FormItem,
  Input,
  Modal,
  Select,
  SelectOption,
  Space,
  TextArea,
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

const accessStore = useAccessStore();
const loading = ref(false);
const translating = ref(false);
const currentStatus = ref('');

const groupedActions = [
  {
    label: '执行处罚',
    options: [
      { label: '警告', value: 'WARNING' },
      { label: '冻结', value: 'FREEZE' },
      { label: '封禁', value: 'ARCHIVE' },
      { label: '封禁1天', value: 'ARCHIVE1DAY' },
      { label: '封禁+设备', value: 'ARCHIVE_DEVICE' },
    ],
  },
  {
    label: '解除处罚',
    options: [
      { label: '账号解封', value: 'UNTIE_ACOOUNT' },
      { label: '设备解封', value: 'UNTIE_DEVICE' },
      { label: '设备+账号解封', value: 'UNTIE_DEVICE_AND_ACCOUNT' },
    ],
  },
];

const actionOptions = computed(() => {
  const codes = accessStore.accessCodes || [];
  const items = groupedActions.flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      group: group.label,
    })),
  );
  const filtered = items.filter((item) =>
    codes.length > 0 ? codes.includes(`user:account:${item.value}`) : true,
  );
  return filtered.length > 0 ? filtered : items;
});

const form = reactive({
  accountStatusEnum: '',
  days: 3,
  description: '',
  descriptionTranslate: '',
});

watch(
  () => [props.open, props.userId],
  async ([open, userId]) => {
    if (!open || !userId) {
      return;
    }
    loading.value = true;
    form.accountStatusEnum = '';
    form.days = 3;
    form.description = '';
    form.descriptionTranslate = '';
    try {
      const status = await getUserAccountStatus(String(userId));
      currentStatus.value = status?.value || status?.name || '-';
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

watch(
  () => form.accountStatusEnum,
  (value) => {
    form.descriptionTranslate = '';
    if (value === 'WARNING') {
      form.description =
        '由于您被其他用户多次合理举报，且经平台审查属实。现对您发出警告，请下次务必注意言行，避免账号被冻结或者封禁。';
    } else {
      form.description = '';
    }
    form.days = value === 'ARCHIVE1DAY' ? 1 : 3;
  },
);

async function handleTranslate() {
  if (!form.description || !props.userId) {
    return;
  }
  translating.value = true;
  try {
    const result = await translateUserLangContent({
      content: form.description,
      targetUserId: props.userId,
    });
    form.descriptionTranslate = String(result || '');
  } finally {
    translating.value = false;
  }
}

async function handleSubmit() {
  if (!form.accountStatusEnum) {
    message.warning('请选择处理状态');
    return;
  }
  if (!form.description.trim()) {
    message.warning('请输入备注');
    return;
  }

  loading.value = true;
  try {
    await handleUserAccount({
      accountStatusEnum:
        form.accountStatusEnum === 'ARCHIVE1DAY'
          ? 'ARCHIVE'
          : form.accountStatusEnum,
      beApprovalUserId: props.userId,
      days: form.days,
      description: form.description.trim(),
      descriptionTranslate: form.descriptionTranslate.trim(),
    });
    message.success('处理成功');
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
    ok-text="提交"
    title="账号处理"
    @cancel="emit('close')"
    @ok="handleSubmit"
  >
    <Form layout="vertical">
      <FormItem label="当前状态">
        <Input :value="currentStatus" disabled />
      </FormItem>
      <FormItem label="处理状态">
        <Select option-label-prop="children" v-model:value="form.accountStatusEnum" :disabled="loading">
          <SelectOption
            v-for="item in actionOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.group }} / {{ item.label }}
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem
        v-if="form.accountStatusEnum === 'FREEZE' || form.accountStatusEnum === 'ARCHIVE' || form.accountStatusEnum === 'ARCHIVE1DAY'"
        label="天数"
      >
        <Select option-label-prop="children" v-model:value="form.days">
          <SelectOption v-for="day in [1,2,3,4,5,6,7,8,9,10,15,30]" :key="day" :value="day">
            {{ day }}天
          </SelectOption>
        </Select>
      </FormItem>
      <FormItem label="备注">
        <TextArea v-model:value="form.description" :rows="4" />
      </FormItem>
      <FormItem v-if="form.accountStatusEnum === 'WARNING'">
        <Space>
          <Button :loading="translating" @click="handleTranslate">
            点击翻译
          </Button>
        </Space>
      </FormItem>
      <FormItem v-if="form.descriptionTranslate" label="译文">
        <TextArea v-model:value="form.descriptionTranslate" :rows="3" />
      </FormItem>
    </Form>
  </Modal>
</template>
