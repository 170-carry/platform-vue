<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import {
  addBanner,
  getCountryAlls,
  regionConfigTable,
  updateBanner,
} from '#/api/legacy/system';
import AccountInput from '#/components/account-input.vue';

import {
  AutoComplete,
  Button,
  DatePicker,
  Image,
  Input,
  Modal,
  Select,
  SelectOption,
  TextArea,
  message,
} from 'antdv-next';

import RoomSearchInput from './room-search-input.vue';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
  sysOrigin: string;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const DISPLAY_POSITION_OPTIONS = [
  { name: '房间内', value: 'ROOM' },
  { name: '发现页', value: 'EXPLORE_PAGE' },
  { name: '首页弹出层', value: 'HOME_ALERT' },
  { name: '钱包', value: 'WALLET' },
  { name: '游戏', value: 'GAME' },
];

const APP_PLATFORMS = [
  { label: 'iOS', value: 'iOS' },
  { label: 'Android', value: 'Android' },
];

const SHOWCASE_OPTIONS: Array<Record<string, any>> = [
  { label: '下架', value: false },
  { label: '上架', value: true },
];

const TYPE_OPTIONS = [
  { label: 'H5', value: 'H5' },
  { label: 'APP', value: 'APP' },
  { label: 'AD', value: 'AD' },
];

const CONTENT_OPTIONS = [
  { label: '礼物背包', value: 'GIFT_PACK_BUY' },
  { label: '进入房间', value: 'ENTER_ROOM' },
  { label: '个人中心', value: 'ENTER_PERSONAL_CENTER' },
  { label: '充值-站内', value: 'RECHARGE_IN_APP' },
  { label: '充值-H5(站外)', value: 'RECHARGE_H5' },
  { label: '道具商店', value: 'PROP_STORE' },
];

function createForm() {
  return {
    alertCover: '',
    content: '',
    countryCode: '',
    cover: '',
    depict: '',
    displayPosition: [] as string[],
    expiredTime: '',
    id: '',
    params: '',
    platform: '',
    regionList: [] as Array<number | string>,
    showcase: undefined as boolean | undefined,
    smallCover: '',
    sort: '',
    startTime: '',
    sysOrigin: '',
    type: '',
  };
}

const saving = ref(false);
const uploading = reactive<Record<string, boolean>>({
  alertCover: false,
  cover: false,
  smallCover: false,
});
const coverInputRef = ref<HTMLInputElement | null>(null);
const smallCoverInputRef = ref<HTMLInputElement | null>(null);
const alertCoverInputRef = ref<HTMLInputElement | null>(null);
const roomSearchValue = ref('');
const countryOptions = ref<Array<Record<string, any>>>([]);
const regionOptions = ref<Array<Record<string, any>>>([]);
const contentKeyword = ref('');
const selectCountryCodes = ref<string[]>([]);
const countriesLoading = ref(false);
const regionsLoading = ref(false);
const form = reactive<Record<string, any>>(createForm());

const regionSelectOptions = computed(() =>
  regionOptions.value.map((item) => ({
    label: String(item.regionName || item.id || '-'),
    value: item.id,
  })),
);

const countrySelectOptions = computed(() =>
  countryOptions.value.map((item) => ({
    label: String(item.aliasName || item.countryName || item.alphaTwo || '-'),
    value: item.alphaTwo,
  })),
);

const contentSuggestions = () => {
  const keyword = contentKeyword.value.trim().toLowerCase();
  const target = keyword
    ? CONTENT_OPTIONS.filter(
        (item) =>
          item.value.toLowerCase().includes(keyword) ||
          item.label.toLowerCase().includes(keyword),
      )
    : CONTENT_OPTIONS;
  return target.map((item) => ({
    label: `${item.label} / ${item.value}`,
    value: item.value,
  }));
};

watch(
  () => ({ open: props.open, row: props.row, sysOrigin: props.sysOrigin }),
  ({ open, row, sysOrigin }) => {
    if (!open) {
      return;
    }
    Object.assign(form, createForm(), { sysOrigin });
    roomSearchValue.value = '';
    selectCountryCodes.value = [];
    if (row) {
      Object.assign(form, row);
      form.displayPosition = row.displayPosition
        ? String(row.displayPosition)
            .split(',')
            .filter(Boolean)
        : [];
      form.regionList = row.regions
        ? String(row.regions)
            .split(',')
            .filter(Boolean)
        : [];
      selectCountryCodes.value = row.countryCode
        ? String(row.countryCode)
            .split(',')
            .filter(Boolean)
        : [];
      if (form.content === 'ENTER_ROOM' && form.params) {
        roomSearchValue.value = String(form.params);
      }
    }
    void Promise.all([
      loadCountries(),
      sysOrigin ? loadRegions(sysOrigin) : Promise.resolve(),
    ]);
  },
  { immediate: true },
);

watch(
  () => form.sysOrigin,
  (value) => {
    if (!value) {
      regionOptions.value = [];
      return;
    }
    void loadRegions(value);
  },
  { immediate: true },
);

watch(
  () => form.content,
  (value) => {
    if (value !== 'ENTER_ROOM' && value !== 'ENTER_PERSONAL_CENTER') {
      form.params = '';
      roomSearchValue.value = '';
    }
  },
);

async function loadCountries() {
  countriesLoading.value = true;
  try {
    countryOptions.value = await getCountryAlls();
  } finally {
    countriesLoading.value = false;
  }
}

async function loadRegions(sysOrigin: string) {
  regionsLoading.value = true;
  try {
    regionOptions.value = await regionConfigTable({ sysOrigin });
  } finally {
    regionsLoading.value = false;
  }
}

function pickAsset(field: 'alertCover' | 'cover' | 'smallCover') {
  if (field === 'cover') {
    coverInputRef.value?.click();
    return;
  }
  if (field === 'smallCover') {
    smallCoverInputRef.value?.click();
    return;
  }
  alertCoverInputRef.value?.click();
}

async function uploadAsset(
  event: Event,
  field: 'alertCover' | 'cover' | 'smallCover',
) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    return;
  }
  uploading[field] = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form[field] = getAccessImgUrl(result.name);
  } finally {
    uploading[field] = false;
    (event.target as HTMLInputElement).value = '';
  }
}

function handleRoomSuccess(result: Record<string, any>) {
  if (!result) {
    return;
  }
  form.params = result.id;
  form.sysOrigin = result.sysOrigin || form.sysOrigin;
  roomSearchValue.value = String(result.roomAccount || result.id || '');
}

function handleRoomFail() {
  form.params = '';
  roomSearchValue.value = '';
}

function changeCountry() {
  form.countryCode = selectCountryCodes.value.join(',');
}

async function submitForm() {
  if (!form.cover) {
    message.warning('请上传封面');
    return;
  }
  if (form.showcase === undefined) {
    message.warning('请选择状态');
    return;
  }
  if (!form.type) {
    message.warning('请选择类型');
    return;
  }
  if (!form.sysOrigin) {
    message.warning('请选择系统');
    return;
  }
  if (!form.expiredTime) {
    message.warning('请选择过期时间');
    return;
  }
  if (form.content === 'ENTER_ROOM' && !form.params) {
    message.warning('请选择房间');
    return;
  }
  if (form.content === 'ENTER_PERSONAL_CENTER' && !String(form.params || '').trim()) {
    message.warning('请选择用户');
    return;
  }
  saving.value = true;
  try {
    const payload = {
      ...form,
      countryCode: selectCountryCodes.value.join(','),
      displayPosition: (form.displayPosition || []).join(','),
    };
    if (form.id) {
      await updateBanner(payload);
    } else {
      await addBanner(payload);
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
    :title="`${form.id ? '修改' : '新增'}(${sysOrigin})`"
    width="760px"
    @cancel="emit('close')"
    @ok="submitForm"
  >
    <div class="form-grid">
      <div class="field field--full">
        <div class="label">封面</div>
        <input
          ref="coverInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="uploadAsset($event, 'cover')"
        >
        <input
          ref="smallCoverInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="uploadAsset($event, 'smallCover')"
        >
        <input
          ref="alertCoverInputRef"
          accept="image/*"
          class="hidden-input"
          type="file"
          @change="uploadAsset($event, 'alertCover')"
        >
        <div class="upload-grid">
          <div class="upload-item">
            <Image v-if="form.cover" :preview="false" :src="form.cover" class="banner" />
            <Button :loading="uploading.cover" @click="pickAsset('cover')">
              banner封面
            </Button>
          </div>
          <div class="upload-item">
            <Image
              v-if="form.smallCover"
              :preview="false"
              :src="form.smallCover"
              class="banner banner--small"
            />
            <Button :loading="uploading.smallCover" @click="pickAsset('smallCover')">
              banner小图
            </Button>
          </div>
          <div class="upload-item">
            <Image
              v-if="form.alertCover"
              :preview="false"
              :src="form.alertCover"
              class="banner banner--small"
            />
            <Button :loading="uploading.alertCover" @click="pickAsset('alertCover')">
              首页弹出banner
            </Button>
          </div>
        </div>
      </div>

      <div class="field">
        <div class="label">状态</div>
        <Select
          v-model:value="form.showcase"
          :options="SHOWCASE_OPTIONS"
          allow-clear
          option-label-prop="label"
          placeholder="请选择状态"
        />
      </div>

      <div class="field">
        <div class="label">平台</div>
        <Select
          v-model:value="form.platform"
          :options="APP_PLATFORMS"
          allow-clear
          option-label-prop="label"
          placeholder="请选择平台"
        />
      </div>

      <div class="field">
        <div class="label">类型</div>
        <Select
          v-model:value="form.type"
          :options="TYPE_OPTIONS"
          allow-clear
          option-label-prop="label"
          placeholder="请选择类型"
        />
      </div>

      <div class="field">
        <div class="label">系统</div>
        <SysOriginSelect
          v-model:value="form.sysOrigin"
          :options="sysOriginOptions"
          placeholder="请选择系统"
        />
      </div>

      <div class="field field--full">
        <div class="label">内容</div>
        <AutoComplete
          v-model:value="form.content"
          :options="contentSuggestions()"
          allow-clear
          placeholder="请输入内容"
          @search="contentKeyword = $event"
        />
      </div>

      <div
        v-if="form.content && form.content !== 'ENTER_ROOM' && form.content !== 'ENTER_PERSONAL_CENTER'"
        class="field field--full"
      >
        <div class="label">参数</div>
        <Input v-model:value="form.params" />
      </div>

      <div v-if="form.content === 'ENTER_ROOM'" class="field field--full">
        <div class="label">房间</div>
        <RoomSearchInput
          :room-id="roomSearchValue"
          :sys-origin="form.sysOrigin"
          @fail="handleRoomFail"
          @success="handleRoomSuccess"
        />
      </div>

      <div v-if="form.content === 'ENTER_PERSONAL_CENTER'" class="field field--full">
        <div class="label">用户</div>
        <AccountInput
          v-model:value="form.params"
          :sys-origin="form.sysOrigin"
          placeholder="用户ID"
        />
      </div>

      <div class="field field--full">
        <div class="label">展示位</div>
        <Select option-label-prop="label" v-model:value="form.displayPosition" mode="multiple">
          <SelectOption
            v-for="item in DISPLAY_POSITION_OPTIONS"
            :key="item.value"
            :value="item.value"
           :label="`${item.name}`">
            {{ item.name }}
          </SelectOption>
        </Select>
      </div>

      <div class="field">
        <div class="label">开始时间</div>
        <DatePicker
          v-model:value="form.startTime"
          show-time
          style="width: 100%"
          value-format="x"
        />
      </div>

      <div class="field">
        <div class="label">过期时间</div>
        <DatePicker
          v-model:value="form.expiredTime"
          show-time
          style="width: 100%"
          value-format="x"
        />
      </div>

      <div class="field">
        <div class="label">排序</div>
        <Input v-model:value="form.sort" placeholder="降序排列(数字越大越靠前)" />
      </div>

      <div class="field">
        <div class="label">区域</div>
        <Select option-label-prop="label"
          v-model:value="form.regionList"
          :options="regionSelectOptions"
          :loading="regionsLoading"
          allow-clear
          mode="multiple"
          placeholder="请选择区域"
        />
      </div>

      <div class="field field--full">
        <div class="label">国家</div>
        <Select option-label-prop="label"
          v-model:value="selectCountryCodes"
          :options="countrySelectOptions"
          :loading="countriesLoading"
          allow-clear
          mode="multiple"
          placeholder="请选择国家"
          @change="changeCountry"
        />
      </div>

      <div class="field field--full">
        <div class="label">描述</div>
        <TextArea
          v-model:value="form.depict"
          :maxlength="200"
          :rows="5"
          show-count
        />
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 8px;
}

.field--full {
  grid-column: 1 / -1;
}

.label {
  color: #0f172a;
  font-weight: 600;
}

.hidden-input {
  display: none;
}

.upload-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.upload-item {
  align-items: center;
  display: grid;
  gap: 8px;
}

.banner {
  border-radius: 12px;
  height: 120px;
  object-fit: cover;
  width: 100%;
}

.banner--small {
  height: 100px;
}
</style>
