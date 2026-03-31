<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { savePet } from '#/api/legacy/pet';
import {
  PET_STAGE_DEFINITIONS,
  PET_UNLOCK_CONDITION_OPTIONS,
  UNIT_CONDITION_OPTIONS,
} from '#/views/pet/shared';

import {
  Button,
  Card,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  Space,
  Tabs,
  TabPane,
  Tag,
  message,
} from 'antdv-next';

import RewardConfigList from './reward-config-list.vue';
import RewardGroupSelectorDrawer from './reward-group-selector-drawer.vue';

const props = defineProps<{
  open: boolean;
  row: null | Record<string, any>;
  sysOriginOptions: Array<{ label: string; value: string }>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

interface StageState {
  coverUploading: boolean;
  form: Record<string, any>;
  key: string;
  label: string;
  sourceUploading: boolean;
  stage: string;
  validNotPass: boolean;
}

function createPetPoolForm() {
  return {
    id: '',
    level: undefined as number | undefined,
    petCode: '',
    petName: '',
    rewardGroupId: '',
    shelf: false,
    sync: true,
    sysOrigin: '',
  };
}

function createStageForm() {
  return {
    accelerateFeed: undefined as number | undefined,
    cover: '',
    feedingIntervalMinute: undefined as number | undefined,
    foodFeedingNum: undefined as number | undefined,
    freeFeedingNum: undefined as number | undefined,
    id: '',
    level: undefined as number | undefined,
    revenue: undefined as number | undefined,
    revenueIntervalMinute: undefined as number | undefined,
    revenueNum: undefined as number | undefined,
    sourceUrl: '',
    stage: '',
    upgradeFeedingNum: undefined as number | undefined,
  };
}

function createStageState(): StageState[] {
  return PET_STAGE_DEFINITIONS.map((item) => ({
    coverUploading: false,
    form: createStageForm(),
    key: item.key,
    label: item.label,
    sourceUploading: false,
    stage: item.stage,
    validNotPass: false,
  }));
}

function createUnlockCondition() {
  return {
    conditionType: '',
    quantity: undefined as number | undefined,
    unit: '',
  };
}

const submitLoading = ref(false);
const rewardSelectorOpen = ref(false);
const activeStageKey = ref(PET_STAGE_DEFINITIONS[0]?.key || 'one');
const petPoolForm = reactive(createPetPoolForm());
const petStages = ref<StageState[]>(createStageState());
const unlockConditions = ref<Array<Record<string, any>>>([]);
const selectedRewardGroup = ref<Record<string, any> | null>(null);

const isAdd = computed(() => !props.row?.petPool?.id);

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    resetForm();
    if (props.row?.petPool?.id) {
      assignEditRow(props.row);
    }
  },
  { immediate: true },
);

function resetForm() {
  Object.assign(petPoolForm, createPetPoolForm());
  petStages.value = createStageState();
  unlockConditions.value = [];
  selectedRewardGroup.value = null;
  rewardSelectorOpen.value = false;
  activeStageKey.value = PET_STAGE_DEFINITIONS[0]?.key || 'one';
}

function assignEditRow(row: Record<string, any>) {
  Object.assign(petPoolForm, {
    ...createPetPoolForm(),
    ...(row.petPool || {}),
  });
  petStages.value = createStageState().map((stage, index) => ({
    ...stage,
    form: {
      ...createStageForm(),
      ...(row.petStages?.[index] || {}),
    },
  }));
  unlockConditions.value = Array.isArray(row.petUnlockConditions)
    ? row.petUnlockConditions.map((item: Record<string, any>) => ({
        conditionType: item.conditionType || '',
        quantity: item.quantity,
        unit: item.unit || '',
      }))
    : [];
  selectedRewardGroup.value = row.rewards
    ? JSON.parse(JSON.stringify(row.rewards))
    : null;
}

function handleSysOriginChange() {
  selectedRewardGroup.value = null;
  petPoolForm.rewardGroupId = '';
}

function addUnlockCondition() {
  unlockConditions.value.push(createUnlockCondition());
}

function removeUnlockCondition(index: number) {
  unlockConditions.value.splice(index, 1);
}

function triggerFileInput(id: string) {
  document.getElementById(id)?.click();
}

async function handleCoverFileChange(event: Event, stage: StageState) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  stage.coverUploading = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.svgaCover);
    stage.form.cover = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    stage.coverUploading = false;
  }
}

async function handleSourceFileChange(event: Event, stage: StageState) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  stage.sourceUploading = true;
  try {
    const result = await simpleUploadFile(file);
    stage.form.sourceUrl = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    stage.sourceUploading = false;
  }
}

function selectRewardGroup(record: Record<string, any>) {
  selectedRewardGroup.value = record;
  petPoolForm.rewardGroupId = String(record.id || '');
  rewardSelectorOpen.value = false;
}

function hasNumberValue(value: unknown) {
  return value === 0 || value === '0' || Boolean(value);
}

function validateBaseForm() {
  if (!petPoolForm.sysOrigin) {
    message.warning('请选择归属系统');
    return false;
  }
  if (!String(petPoolForm.petCode || '').trim()) {
    message.warning('请输入宠物Code');
    return false;
  }
  if (!String(petPoolForm.petName || '').trim()) {
    message.warning('请输入宠物名称');
    return false;
  }
  if (!hasNumberValue(petPoolForm.level)) {
    message.warning('请输入展示顺序');
    return false;
  }
  if (!petPoolForm.rewardGroupId) {
    message.warning('请选择养成奖励');
    return false;
  }
  return true;
}

function validateUnlockConditionForm() {
  for (const item of unlockConditions.value) {
    if (!item.conditionType || !item.unit || !hasNumberValue(item.quantity)) {
      message.warning('请完整填写解锁条件');
      return false;
    }
  }
  return true;
}

function validateStageForm() {
  for (const stage of petStages.value) {
    const { form, key, label } = stage;
    stage.validNotPass = false;
    if (key !== 'four' && !String(form.cover || '').trim()) {
      stage.validNotPass = true;
      activeStageKey.value = stage.key;
      message.warning(`请上传${label}封面图`);
      return false;
    }
    const requiredFields = [
      ['upgradeFeedingNum', '喂养次数'],
      ['foodFeedingNum', '喂养粮食'],
      ['revenue', '产生收益'],
      ['revenueNum', '收益数量'],
      ['revenueIntervalMinute', '收益间隔'],
      ['feedingIntervalMinute', '喂食间隔'],
      ['freeFeedingNum', '免费喂食次数'],
      ['accelerateFeed', '加速粮食数'],
    ] as const;
    for (const [field, text] of requiredFields) {
      if (!hasNumberValue(form[field])) {
        stage.validNotPass = true;
        activeStageKey.value = stage.key;
        message.warning(`请填写${label}${text}`);
        return false;
      }
    }
  }
  return true;
}

async function handleSubmit() {
  if (!validateBaseForm() || !validateUnlockConditionForm() || !validateStageForm()) {
    return;
  }
  submitLoading.value = true;
  try {
    await savePet({
      petPool: {
        ...petPoolForm,
        petCode: String(petPoolForm.petCode || '').trim(),
        petName: String(petPoolForm.petName || '').trim(),
      },
      petStages: petStages.value.map((item, index) => {
        const form: Record<string, any> = {
          ...item.form,
          level: index + 1,
          stage: item.stage,
        };
        if (index === petStages.value.length - 1) {
          const prev = petStages.value[petStages.value.length - 2];
          form.cover = prev?.form.cover || form.cover;
          form.sourceUrl = prev?.form.sourceUrl || form.sourceUrl;
        }
        return form;
      }),
      petUnlockConditions: unlockConditions.value.map((item) => ({
        ...item,
      })),
    });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    submitLoading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="宠物信息编辑"
    width="980"
    @close="emit('close')"
  >
    <div class="drawer-body">
      <Card :bordered="false" title="宠物资料">
        <Form layout="vertical">
          <FormItem label="归属系统">
            <SysOriginSelect
              v-model:value="petPoolForm.sysOrigin"
              :disabled="!isAdd"
              placeholder="归属系统"
              @change="handleSysOriginChange"

              :options="sysOriginOptions"
            ></SysOriginSelect>
          </FormItem>
          <FormItem label="宠物Code">
            <Input
              v-model:value="petPoolForm.petCode"
              :disabled="!isAdd"
              placeholder="宠物Code"
            />
          </FormItem>
          <FormItem label="宠物名称">
            <Input v-model:value="petPoolForm.petName" placeholder="宠物名称" />
          </FormItem>
          <FormItem label="展示顺序">
            <InputNumber
              v-model:value="petPoolForm.level"
              :max="99999"
              :min="1"
              style="width: 100%"
            />
          </FormItem>
          <FormItem label="上/下架">
            <RadioGroup v-model:value="petPoolForm.shelf">
              <Radio :value="true">上架</Radio>
              <Radio :value="false">下架</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem label="养成奖励">
            <div class="reward-group-field">
              <Space wrap>
                <Button
                  :disabled="!petPoolForm.sysOrigin"
                  @click="rewardSelectorOpen = true"
                >
                  选择
                </Button>
                <Tag v-if="petPoolForm.rewardGroupId" color="processing">
                  资源组 ID {{ petPoolForm.rewardGroupId }}
                </Tag>
              </Space>
              <div v-if="selectedRewardGroup" class="reward-preview">
                <RewardConfigList
                  :list="selectedRewardGroup.rewardConfigList || []"
                />
              </div>
            </div>
          </FormItem>
        </Form>
      </Card>

      <Card :bordered="false" title="阶段信息">
        <Tabs v-model:activeKey="activeStageKey">
          <TabPane
            v-for="item in petStages"
            :key="item.key"
            :tab="item.label"
          >
            <template #tab>
              <span :class="{ 'tab-error': item.validNotPass }">
                {{ item.label }}
              </span>
            </template>

            <Form layout="vertical">
              <div class="stage-grid">
                <FormItem label="喂养次数">
                  <InputNumber
                    v-model:value="item.form.upgradeFeedingNum"
                    :max="99999"
                    :min="0"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="喂养粮食">
                  <InputNumber
                    v-model:value="item.form.foodFeedingNum"
                    :max="999999"
                    :min="0"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="产生收益">
                  <InputNumber
                    v-model:value="item.form.revenue"
                    :max="999999"
                    :min="0"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="收益数量">
                  <InputNumber
                    v-model:value="item.form.revenueNum"
                    :max="2"
                    :min="1"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="收益间隔(M)">
                  <InputNumber
                    v-model:value="item.form.revenueIntervalMinute"
                    :max="99999"
                    :min="1"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="喂食间隔(M)">
                  <InputNumber
                    v-model:value="item.form.feedingIntervalMinute"
                    :max="99999"
                    :min="1"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="免费喂食次数">
                  <InputNumber
                    v-model:value="item.form.freeFeedingNum"
                    :max="4"
                    :min="0"
                    style="width: 100%"
                  />
                </FormItem>
                <FormItem label="加速粮食数">
                  <InputNumber
                    v-model:value="item.form.accelerateFeed"
                    :max="1000000"
                    :min="0"
                    style="width: 100%"
                  />
                </FormItem>
              </div>

              <div v-if="item.key !== 'four'" class="upload-grid">
                <FormItem label="封面图">
                  <div class="upload-field">
                    <input
                      :id="`pet-cover-${item.key}`"
                      accept="image/*"
                      class="hidden-input"
                      type="file"
                      @change="(event) => handleCoverFileChange(event, item)"
                    >
                    <div class="upload-preview">
                      <img
                        v-if="item.form.cover"
                        :src="item.form.cover"
                        alt=""
                        class="upload-preview__image"
                      >
                      <div v-else class="upload-preview__empty">未上传封面</div>
                    </div>
                    <Space>
                      <Button
                        :loading="item.coverUploading"
                        @click="triggerFileInput(`pet-cover-${item.key}`)"
                      >
                        {{ item.form.cover ? '重新上传' : '上传封面' }}
                      </Button>
                      <Button
                        v-if="item.form.cover"
                        danger
                        @click="item.form.cover = ''"
                      >
                        移除
                      </Button>
                    </Space>
                  </div>
                </FormItem>

                <FormItem label="资源图">
                  <div class="upload-field">
                    <input
                      :id="`pet-source-${item.key}`"
                      accept=".svga,.pag"
                      class="hidden-input"
                      type="file"
                      @change="(event) => handleSourceFileChange(event, item)"
                    >
                    <div class="upload-source">
                      {{ item.form.sourceUrl || '未上传资源' }}
                    </div>
                    <Space>
                      <Button
                        :loading="item.sourceUploading"
                        @click="triggerFileInput(`pet-source-${item.key}`)"
                      >
                        {{ item.form.sourceUrl ? '重新上传' : '点击上传' }}
                      </Button>
                      <Button
                        v-if="item.form.sourceUrl"
                        danger
                        @click="item.form.sourceUrl = ''"
                      >
                        移除
                      </Button>
                    </Space>
                  </div>
                </FormItem>
              </div>
            </Form>
          </TabPane>
        </Tabs>
      </Card>

      <Card :bordered="false" title="解锁条件">
        <div v-if="unlockConditions.length === 0" class="conditions-empty">
          <Button type="primary" @click="addUnlockCondition">添加条件</Button>
        </div>
        <div v-else class="conditions-list">
          <div
            v-for="(item, index) in unlockConditions"
            :key="`condition-${index}`"
            class="condition-row"
          >
            <Select option-label-prop="label"
              v-model:value="item.conditionType"
              placeholder="类型"
              style="width: 220px"
            >
              <SelectOption
                v-for="option in PET_UNLOCK_CONDITION_OPTIONS"
                :key="option.value"
                :label="option.name"
                :value="option.value"
              >
                {{ option.name }}
              </SelectOption>
            </Select>
            <Select option-label-prop="label"
              v-model:value="item.unit"
              placeholder="条件"
              style="width: 140px"
            >
              <SelectOption
                v-for="option in UNIT_CONDITION_OPTIONS"
                :key="option.value"
                :label="option.name"
                :value="option.value"
              >
                {{ option.name }}
              </SelectOption>
            </Select>
            <InputNumber
              v-model:value="item.quantity"
              :max="999999"
              :min="1"
              style="width: 180px"
            />
            <Space>
              <Button v-if="index === unlockConditions.length - 1" @click="addUnlockCondition">
                新增
              </Button>
              <Button danger @click="removeUnlockCondition(index)">删除</Button>
            </Space>
          </div>
        </div>
      </Card>
    </div>

    <div class="drawer-footer">
      <Button @click="emit('close')">取消</Button>
      <Button :loading="submitLoading" type="primary" @click="handleSubmit">
        保存
      </Button>
    </div>

    <RewardGroupSelectorDrawer
      :open="rewardSelectorOpen"
      :sys-origin="petPoolForm.sysOrigin"
      @close="rewardSelectorOpen = false"
      @select="selectRewardGroup"
    />
  </Drawer>
</template>

<style scoped>
.drawer-body {
  display: grid;
  gap: 16px;
  padding-bottom: 80px;
}

.reward-group-field,
.reward-preview {
  display: grid;
  gap: 12px;
}

.tab-error {
  color: #dc2626;
}

.stage-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.upload-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.upload-field {
  display: grid;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.upload-preview,
.upload-source {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 16px;
  display: flex;
  justify-content: center;
  min-height: 120px;
  overflow: hidden;
  padding: 12px;
}

.upload-preview__image {
  border-radius: 12px;
  height: 120px;
  object-fit: cover;
  width: 100%;
}

.upload-preview__empty,
.upload-source {
  color: #64748b;
}

.conditions-empty {
  display: flex;
  justify-content: center;
}

.conditions-list {
  display: grid;
  gap: 12px;
}

.condition-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.drawer-footer {
  background: #fff;
  border-top: 1px solid #e2e8f0;
  bottom: 0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  left: 0;
  padding: 16px 24px;
  position: absolute;
  right: 0;
}
</style>
