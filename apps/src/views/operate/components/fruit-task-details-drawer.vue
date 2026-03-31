<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { getByGroupId } from '#/api/legacy/props';
import {
  addGameFruitTaskConfig,
  deleteGameFruitTaskConfig,
  getGameFruitImages,
  getGameFruitTaskConfig,
} from '#/api/legacy/game-fruit-task';
import { formatDate } from '#/views/system/shared';
import ActivityResourceGroupSelectDrawer from '#/views/props/components/activity-resource-group-select-drawer.vue';
import SourceGroupDrawer from '#/views/props/components/source-group-drawer.vue';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

defineOptions({ name: 'FruitTaskDetailsDrawer' });

const props = defineProps<{
  bountyInfo: null | Record<string, any>;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const images = ref<Array<Record<string, any>>>([]);
const editOpen = ref(false);
const saving = ref(false);
const selectGroupOpen = ref(false);
const groupEditOpen = ref(false);
const activeGroupRecord = ref<null | Record<string, any>>(null);
const activeRow = ref<null | Record<string, any>>(null);

const query = reactive({
  bountyId: '',
  cursor: 1,
  limit: 20,
});

const form = reactive({
  gameAwardId: [] as Array<number | string>,
  id: '',
  quantity: '',
  quantityDays: '',
  resourceGroupId: '',
  sort: '',
  sysOrigin: '',
  taskType: '',
});

const TASK_TYPE_OPTIONS = [
  { label: '周争霸赛', value: 'WEEK_COMPETITION' },
  { label: '盈利轮数', value: 'NUMBER_OF_PROFIT_ROUNDS' },
  { label: '日任务全完成', value: 'TASK_COMPLETE_DAY' },
  { label: '周任务全完成', value: 'TASK_COMPLETE_WEEK' },
  { label: '盈利金币数', value: 'NUMBER_OF_PROFIT_COINS' },
  { label: '游戏连赢轮数', value: 'NUMBER_OF_WINNING_ROUNDS' },
  { label: '一周玩游戏天数', value: 'NUMBER_OF_DAYS_WEEK' },
  {
    label: '游戏中中奖某奖项需达到的次数',
    value: 'WINNING_ONE_OF_THE_PRIZES_ONE',
  },
  {
    label: '游戏中中奖披萨或蔬菜需达到的次数',
    value: 'WINNING_ONE_OF_THE_PRIZES_TWO',
  },
];

const columns = [
  { dataIndex: 'taskType', key: 'taskType', title: '挑战的任务', width: 220 },
  { dataIndex: 'quantity', key: 'quantity', title: '数量', width: 120 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  {
    dataIndex: 'resourceGroupId',
    key: 'resourceGroupId',
    title: '资源组',
    width: 140,
  },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 240 },
];

function getTaskTypeLabel(value?: string) {
  return TASK_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '-';
}

function normalizeAwardIds(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

watch(
  () => [props.open, props.bountyInfo?.id, props.bountyInfo?.sysOrigin],
  async ([open, bountyId, sysOrigin]) => {
    if (!open || !bountyId) {
      return;
    }
    query.bountyId = String(bountyId);
    form.sysOrigin = String(sysOrigin || '');
    await Promise.all([loadData(true), loadImages()]);
  },
  { immediate: true },
);

async function loadImages() {
  if (!props.bountyInfo?.sysOrigin) {
    return;
  }
  images.value = (await getGameFruitImages(props.bountyInfo.sysOrigin)) || [];
}

async function loadData(reset = false) {
  if (!query.bountyId) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getGameFruitTaskConfig({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.gameAwardId = [];
  form.id = '';
  form.quantity = '';
  form.quantityDays = '';
  form.resourceGroupId = '';
  form.sort = '';
  form.sysOrigin = String(props.bountyInfo?.sysOrigin || '');
  form.taskType = '';
}

function openCreate() {
  resetForm();
  editOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  form.id = String(record.id || '');
  form.quantity = String(record.quantity ?? '');
  form.quantityDays = String(record.quantityDays ?? '');
  form.resourceGroupId = String(record.resourceGroupId ?? '');
  form.sort = String(record.sort ?? '');
  form.sysOrigin = String(record.sysOrigin || props.bountyInfo?.sysOrigin || '');
  form.taskType = String(record.taskType || '');
  form.gameAwardId = normalizeAwardIds(record.gameAwardId);
  editOpen.value = true;
}

async function handleSave() {
  if (!form.taskType) {
    message.warning('请选择挑战任务');
    return;
  }
  if (!form.sort) {
    message.warning('请输入排序');
    return;
  }
  if (!form.quantity) {
    message.warning(
      form.taskType === 'WEEK_COMPETITION' ? '请输入排行榜前几' : '请输入数值',
    );
    return;
  }
  if (
    form.taskType === 'WEEK_COMPETITION' &&
    !String(form.quantityDays || '').trim()
  ) {
    message.warning('请输入一周内完成天数');
    return;
  }
  saving.value = true;
  try {
    await addGameFruitTaskConfig({
      bountyId: query.bountyId,
      gameAwardId: form.gameAwardId,
      id: form.id || undefined,
      quantity: Number(form.quantity || 0),
      quantityDays:
        form.taskType === 'WEEK_COMPETITION'
          ? Number(form.quantityDays || 0)
          : undefined,
      resourceGroupId: form.resourceGroupId || undefined,
      sort: Number(form.sort || 0),
      sysOrigin: props.bountyInfo?.sysOrigin,
      taskType: form.taskType,
    });
    message.success('保存成功');
    editOpen.value = false;
    await loadData(!form.id);
    emit('success');
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteGameFruitTaskConfig(record.id);
      message.success('删除成功');
      await loadData();
      emit('success');
    },
  });
}

function openGroupSelect(record: Record<string, any>) {
  activeRow.value = { ...record };
  selectGroupOpen.value = true;
}

async function handleSelectGroup(record: Record<string, any>) {
  if (!activeRow.value) {
    return;
  }
  await addGameFruitTaskConfig({
    ...activeRow.value,
    bountyId: query.bountyId,
    gameAwardId: normalizeAwardIds(activeRow.value.gameAwardId),
    quantity: Number(activeRow.value.quantity || 0),
    quantityDays: activeRow.value.quantityDays
      ? Number(activeRow.value.quantityDays)
      : undefined,
    resourceGroupId: record.id,
    sort: Number(activeRow.value.sort || 0),
    sysOrigin: props.bountyInfo?.sysOrigin,
  });
  message.success('资源组已更新');
  selectGroupOpen.value = false;
  await loadData();
  emit('success');
}

async function openEditGroup(record: Record<string, any>) {
  if (!record.resourceGroupId) {
    openGroupSelect(record);
    return;
  }
  activeGroupRecord.value = await getByGroupId(record.resourceGroupId);
  groupEditOpen.value = true;
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}
</script>

<template>
  <Drawer
    :open="open"
    :title="`摩天轮任务奖励配置列表(${bountyInfo?.name || '-'})`"
    destroy-on-close
    width="1200"
    @close="emit('close')"
  >
    <div class="toolbar">
      <Button type="primary" @click="openCreate">添加</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 980 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'taskType'">
          <Tag>{{ getTaskTypeLabel(record.taskType) }}</Tag>
        </template>
        <template v-else-if="column.key === 'resourceGroupId'">
          {{ record.resourceGroupId || '-' }}
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Space wrap>
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
            </Button>
            <Button size="small" type="link" @click="openGroupSelect(record)">
              选择资源组
            </Button>
            <Button size="small" type="link" @click="openEditGroup(record)">
              资源组配置
            </Button>
            <Button danger size="small" type="link" @click="handleDelete(record)">
              删除
            </Button>
          </Space>
        </template>
      </template>
    </Table>

    <div class="pager">
      <Pagination
        :current="query.cursor"
        :page-size="query.limit"
        :total="total"
        show-size-changer
        @change="handlePageChange"
        @showSizeChange="handlePageChange"
      />
    </div>

    <Modal
      :confirm-loading="saving"
      :open="editOpen"
      :title="form.id ? '编辑任务配置' : '新增任务配置'"
      width="640"
      @cancel="editOpen = false"
      @ok="handleSave"
    >
      <Form layout="vertical">
        <FormItem label="系统">
          <Input :value="form.sysOrigin" disabled />
        </FormItem>
        <FormItem label="挑战的任务">
          <Select option-label-prop="label" v-model:value="form.taskType" allow-clear placeholder="任务类型">
            <SelectOption
              v-for="item in TASK_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.label}`">
              {{ item.label }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="排序">
          <Input v-model:value="form.sort" placeholder="排序" />
        </FormItem>
        <FormItem
          :label="form.taskType === 'WEEK_COMPETITION' ? '排行榜前几' : '数值'"
        >
          <Input v-model:value="form.quantity" placeholder="请输入" />
        </FormItem>
        <FormItem
          v-if="form.taskType === 'WEEK_COMPETITION'"
          label="一周内完成天数"
        >
          <Input v-model:value="form.quantityDays" placeholder="请输入完成天数" />
        </FormItem>
        <FormItem
          v-if="['WINNING_ONE_OF_THE_PRIZES_ONE', 'WINNING_ONE_OF_THE_PRIZES_TWO'].includes(form.taskType)"
          label="奖项"
        >
          <Select option-label-prop="label"
            v-model:value="form.gameAwardId"
            mode="multiple"
            placeholder="请选择奖项"
          >
            <SelectOption
              v-for="item in images"
              :key="item.id"
              :value="String(item.id)"
             :label="`${item.id}`">
              {{ item.id }}
            </SelectOption>
          </Select>
          <div v-if="form.gameAwardId.length > 0" class="award-preview">
            <div
              v-for="item in images.filter((option) => form.gameAwardId.includes(String(option.id)))"
              :key="item.id"
              class="award-item"
            >
              <Image :src="item.img" :width="52" />
              <div>{{ item.id }}</div>
            </div>
          </div>
        </FormItem>
        <FormItem label="资源组ID">
          <Input v-model:value="form.resourceGroupId" disabled placeholder="可通过列表操作选择资源组" />
        </FormItem>
      </Form>
    </Modal>

    <ActivityResourceGroupSelectDrawer
      :open="selectGroupOpen"
      :sys-origin="String(bountyInfo?.sysOrigin || '')"
      @close="selectGroupOpen = false"
      @select="handleSelectGroup"
    />

    <SourceGroupDrawer
      :open="groupEditOpen"
      :record="activeGroupRecord"
      :sys-origin="String(bountyInfo?.sysOrigin || '')"
      @close="groupEditOpen = false"
      @success="
        async () => {
          groupEditOpen = false;
          await loadData();
        }
      "
    />
  </Drawer>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.award-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.award-item {
  align-items: center;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 6px;
}
</style>
