<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  addOrUpdateSetHotRoom,
  addOrUpdateSetTopRoom,
} from '#/api/legacy/system';

import {
  Button,
  DatePicker,
  Input,
  Modal,
  Radio,
  RadioGroup,
  message,
} from 'antdv-next';

import RoomSearchInput from './room-search-input.vue';
import SystemRegionSelect from './system-region-select.vue';

const props = defineProps<{
  mode: 'hot' | 'top';
  open: boolean;
  row: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

function createForm() {
  return {
    expiredTime: '',
    foreverOnline: '',
    id: '',
    region: '',
    roomId: '',
    startTime: '',
    sysOrigin: '',
    weights: '',
  };
}

const saving = ref(false);
const searchDisabled = ref(false);
const permanent = ref(0);
const form = reactive<Record<string, any>>(createForm());

const isTopMode = computed(() => props.mode === 'top');
const isUpdate = computed(() =>
  isTopMode.value ? Boolean(props.row?.id) : Boolean(props.row?.roomId),
);
const title = computed(() => (isUpdate.value ? '修改' : '添加'));

watch(
  () => ({ open: props.open, row: props.row }),
  ({ open, row }) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm());
    if (!row) {
      permanent.value = 0;
      return;
    }
    Object.assign(form, row);
    if (isTopMode.value) {
      permanent.value = form.expiredTime ? 0 : 1;
    }
  },
  { immediate: true },
);

function closeModal() {
  if (saving.value) {
    return;
  }
  emit('close');
}

function loadSearchRoom() {
  searchDisabled.value = true;
}

function searchRoomSuccess(result: Record<string, any>) {
  searchDisabled.value = false;
  if (!result) {
    return;
  }
  form.id = result.id;
  form.roomId = result.id;
  form.sysOrigin = result.sysOrigin;
}

function searchRoomFail() {
  form.id = '';
  form.roomId = '';
  form.sysOrigin = '';
  searchDisabled.value = false;
}

function disabledPastDate(current: any) {
  return current && current.valueOf() < Date.now();
}

function validateForm() {
  if (isTopMode.value) {
    if (!isUpdate.value && !form.id) {
      message.warning('请选择房间');
      return false;
    }
    if (!form.region) {
      message.warning('请选择区域');
      return false;
    }
    if (form.foreverOnline === '') {
      message.warning('请选择永远展示');
      return false;
    }
    if (!String(form.weights || '').trim()) {
      message.warning('请填写权重');
      return false;
    }
  } else if (!isUpdate.value && !form.roomId) {
    message.warning('请选择房间');
    return false;
  }

  if (!form.startTime) {
    message.warning('请选择开始时间');
    return false;
  }
  if ((!isTopMode.value || permanent.value === 0) && !form.expiredTime) {
    message.warning('请选择过期时间');
    return false;
  }

  if (!isTopMode.value || permanent.value === 0) {
    const time = Number(form.expiredTime) - Number(form.startTime);
    const minTimeRange = 1000 * 60 * 10;
    if (time < minTimeRange) {
      message.warning('开始时间~过期时间间隔必须>=10分钟以上!!!');
      return false;
    }
  }
  return true;
}

async function submitForm() {
  if (!validateForm()) {
    return;
  }
  saving.value = true;
  try {
    if (isTopMode.value) {
      await addOrUpdateSetTopRoom({
        expiredTime: permanent.value === 1 ? null : form.expiredTime,
        foreverOnline: form.foreverOnline,
        id: form.id,
        region: form.region,
        startTime: form.startTime,
        sysOrigin: form.sysOrigin,
        weights: String(form.weights || '').trim(),
      });
    } else {
      await addOrUpdateSetHotRoom({
        expiredTime: form.expiredTime,
        roomId: form.roomId,
        startTime: form.startTime,
        sysOrigin: form.sysOrigin,
        weights: '0',
      });
    }
    message.success('保存成功');
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    width="640px"
    @cancel="closeModal"
  >
    <div class="form-grid">
      <div v-if="!isUpdate" class="field">
        <div class="label">房间ID</div>
        <RoomSearchInput
          @fail="searchRoomFail"
          @load="loadSearchRoom"
          @success="searchRoomSuccess"
        />
      </div>

      <div v-if="isTopMode" class="field">
        <div class="label">置顶区域</div>
        <SystemRegionSelect
          v-model:value="form.region"
          :sys-origin="form.sysOrigin"
          placeholder="请选择区域"
        />
      </div>

      <div v-if="isTopMode" class="field">
        <div class="label">是否永久</div>
        <RadioGroup v-model:value="permanent">
          <Radio :value="1">是</Radio>
          <Radio :value="0">否</Radio>
        </RadioGroup>
      </div>

      <div v-if="isTopMode" class="field">
        <div class="label">永远展示</div>
        <RadioGroup v-model:value="form.foreverOnline">
          <Radio :value="true">是</Radio>
          <Radio :value="false">否</Radio>
        </RadioGroup>
      </div>

      <div class="field">
        <div class="label">开始时间</div>
        <DatePicker
          v-model:value="form.startTime"
          :disabled-date="disabledPastDate"
          show-time
          style="width: 100%"
          value-format="x"
        />
      </div>

      <div v-if="!isTopMode || permanent === 0" class="field">
        <div class="label">过期时间</div>
        <DatePicker
          v-model:value="form.expiredTime"
          :disabled-date="disabledPastDate"
          show-time
          style="width: 100%"
          value-format="x"
        />
      </div>

      <div v-if="isTopMode" class="field">
        <div class="label">权重</div>
        <Input
          v-model:value="form.weights"
          placeholder="越大越靠前"
          type="number"
        />
      </div>
    </div>

    <template #footer>
      <div class="footer">
        <Button :disabled="saving" @click="closeModal">取消</Button>
        <Button
          :disabled="searchDisabled"
          :loading="saving"
          type="primary"
          @click="submitForm"
        >
          保存
        </Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
