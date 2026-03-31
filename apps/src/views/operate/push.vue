<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';
import type { Dayjs } from 'dayjs';

import {
  deletePushTask,
  newPush,
  pushLogTable,
  pushTaskPage,
  savePushTask,
} from '#/api/legacy/message';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DatePicker,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  TabPane,
  Table,
  Tabs,
  Tag,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperatePush' });

const { RangePicker } = DatePicker;

const APP_PLATFORM_OPTIONS = [
  { name: 'iOS', value: 'iOS' },
  { name: 'Android', value: 'Android' },
];

const DEVICE_TYPE_OPTIONS = [{ name: '谷歌', value: 'GOOGLE' }];
const PUSH_STATUS_OPTIONS = [
  { name: '成功', value: 0 },
  { name: '失败', value: 1 },
];
const SHELF_STATUS_OPTIONS = [
  { name: '下架', value: false },
  { name: '上架', value: true },
];
const LANGUAGE_OPTIONS = [
  { name: '阿拉伯语', value: 'ar' },
  { name: '土耳其语', value: 'tr' },
  { name: '其他语言', value: 'en' },
];

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const activeTab = ref('new');
const sending = ref(false);
const logLoading = ref(false);
const logTotal = ref(0);
const logList = ref<Array<Record<string, any>>>([]);
const taskLoading = ref(false);
const taskTotal = ref(0);
const taskList = ref<Array<Record<string, any>>>([]);
const taskModalOpen = ref(false);
const taskSaving = ref(false);
const logRange = ref<[Dayjs, Dayjs] | null>(null);
const fixedUidCount = ref(0);

const newPushForm = reactive({
  businessScene: 'OFFICIAL_MESSAGE_NOTICE',
  content: '',
  deviceType: '',
  fixedUserIds: '',
  language: '',
  platform: '',
  sysOrigin: '',
  title: '',
});

const logQuery = reactive({
  cursor: 1,
  deviceType: '',
  endTime: '',
  limit: 20,
  platform: '',
  pushStatus: undefined as any,
  startTime: '',
  sysOrigin: '',
});

const taskQuery = reactive({
  cursor: 1,
  limit: 20,
  shelfStatus: undefined as any,
  sysOrigin: '',
});

const taskForm = reactive(createTaskForm());

const logColumns = [
  { dataIndex: 'sendUserName', key: 'sendUserName', title: '发送者', width: 120 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 120 },
  { dataIndex: 'platform', key: 'platform', title: '平台', width: 100 },
  { dataIndex: 'deviceType', key: 'deviceType', title: '推送平台', width: 100 },
  { dataIndex: 'businessScene', key: 'businessScene', title: '业务场景', width: 160 },
  { dataIndex: 'title', key: 'title', title: '标题', width: 220 },
  { dataIndex: 'content', key: 'content', title: '文案', width: 320 },
  { dataIndex: 'pushStatus', key: 'pushStatus', title: '状态', width: 100 },
  { dataIndex: 'successQuantity', key: 'successQuantity', title: '成功人数', width: 100 },
  { dataIndex: 'failQuantity', key: 'failQuantity', title: '失败人数', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
];

const taskColumns = [
  { dataIndex: 'remarks', key: 'remarks', title: '备注', width: 180 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'language', key: 'language', title: '语言', width: 100 },
  { dataIndex: 'title', key: 'title', title: '标题', width: 180 },
  { dataIndex: 'content', key: 'content', title: '内容', width: 280 },
  { dataIndex: 'executeTime', key: 'executeTime', title: '执行时间', width: 200 },
  { dataIndex: 'shelfStatus', key: 'shelfStatus', title: '状态', width: 100 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 150 },
];

function createTaskForm() {
  return {
    businessScene: 'OFFICIAL_MESSAGE_NOTICE',
    content: '',
    days: '',
    deviceType: '',
    fixedUserIds: '',
    hours: '',
    id: '',
    language: '',
    minutes: '',
    platform: '',
    remarks: '',
    shelfStatus: undefined as any,
    sysOrigin: '',
    title: '',
  };
}

watch(
  sysOriginOptions,
  (options) => {
    const first = String(options[0]?.value || '');
    if (!newPushForm.sysOrigin) {
      newPushForm.sysOrigin = first;
    }
    if (!logQuery.sysOrigin) {
      logQuery.sysOrigin = first;
    }
    if (!taskQuery.sysOrigin) {
      taskQuery.sysOrigin = first;
    }
  },
  { immediate: true },
);

watch(logRange, (value) => {
  if (!value?.length) {
    logQuery.startTime = '';
    logQuery.endTime = '';
    return;
  }
  logQuery.startTime = String(value[0].valueOf());
  logQuery.endTime = String(value[1].valueOf());
});

function normalizeFixedIds(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => /^\d+$/.test(item))
    .slice(0, 100);
}

function updateFixedCount(value: string) {
  fixedUidCount.value = normalizeFixedIds(value).length;
}

async function handleSendPush() {
  if (!newPushForm.title.trim() || !newPushForm.content.trim()) {
    message.warning('请填写标题和内容');
    return;
  }
  if (!newPushForm.sysOrigin || !newPushForm.deviceType) {
    message.warning('请选择系统和推送平台');
    return;
  }
  const fixedUserIds = normalizeFixedIds(newPushForm.fixedUserIds);
  sending.value = true;
  try {
    await newPush({
      ...newPushForm,
      fixedUserIds: fixedUserIds.join(','),
    });
    message.success('发送成功');
    Object.assign(newPushForm, {
      businessScene: 'OFFICIAL_MESSAGE_NOTICE',
      content: '',
      deviceType: '',
      fixedUserIds: '',
      language: '',
      platform: '',
      sysOrigin: newPushForm.sysOrigin,
      title: '',
    });
    fixedUidCount.value = 0;
  } finally {
    sending.value = false;
  }
}

async function loadLogs(reset = false) {
  if (reset) {
    logQuery.cursor = 1;
  }
  logLoading.value = true;
  try {
    const result = await pushLogTable({ ...logQuery });
    logList.value = result.records || [];
    logTotal.value = result.total || 0;
  } finally {
    logLoading.value = false;
  }
}

async function loadTasks(reset = false) {
  if (reset) {
    taskQuery.cursor = 1;
  }
  taskLoading.value = true;
  try {
    const result = await pushTaskPage({ ...taskQuery });
    taskList.value = result.records || [];
    taskTotal.value = result.total || 0;
  } finally {
    taskLoading.value = false;
  }
}

function handleLogPageChange(page: number, pageSize: number) {
  logQuery.cursor = page;
  logQuery.limit = pageSize;
  void loadLogs();
}

function handleTaskPageChange(page: number, pageSize: number) {
  taskQuery.cursor = page;
  taskQuery.limit = pageSize;
  void loadTasks();
}

function openTaskModal(record?: Record<string, any>) {
  Object.assign(taskForm, createTaskForm(), record || {}, {
    businessScene: record?.businessScene || 'OFFICIAL_MESSAGE_NOTICE',
    sysOrigin: record?.sysOrigin || taskQuery.sysOrigin,
  });
  taskModalOpen.value = true;
  updateFixedCount(taskForm.fixedUserIds);
}

async function submitTask() {
  if (!taskForm.title.trim() || !taskForm.content.trim()) {
    message.warning('请填写标题和内容');
    return;
  }
  if (!taskForm.sysOrigin || !taskForm.deviceType || !taskForm.platform) {
    message.warning('请补全系统、平台和推送平台');
    return;
  }
  if (!String(taskForm.hours).trim() || !String(taskForm.minutes).trim()) {
    message.warning('请填写执行时间');
    return;
  }
  taskSaving.value = true;
  try {
    await savePushTask({
      ...taskForm,
      fixedUserIds: normalizeFixedIds(taskForm.fixedUserIds).join(','),
    });
    message.success('保存成功');
    taskModalOpen.value = false;
    await loadTasks(true);
  } finally {
    taskSaving.value = false;
  }
}

function handleDeleteTask(id: number | string) {
  Modal.confirm({
    title: '确定删除任务吗？',
    async onOk() {
      await deletePushTask(id);
      message.success('删除成功');
      await loadTasks(true);
    },
  });
}

watch(
  () => activeTab.value,
  (tab) => {
    if (tab === 'log' && logList.value.length === 0) {
      void loadLogs(true);
    }
    if (tab === 'task' && taskList.value.length === 0) {
      void loadTasks(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="消息推送">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="new" tab="新建Push" />
        <TabPane key="log" tab="Push日志" />
        <TabPane key="task" tab="推送任务" />
      </Tabs>

      <div v-if="activeTab === 'new'" class="panel">
        <Form layout="vertical">
          <FormItem label="Push标题">
            <Input v-model:value="newPushForm.title" :maxlength="200" placeholder="最多输入200字" />
          </FormItem>
          <FormItem label="Push内容">
            <Input
              v-model:value="newPushForm.content"
              :maxlength="1000"
              placeholder="最多输入500字"
            />
          </FormItem>
          <div class="grid-two">
            <FormItem label="系统">
              <SysOriginSelect
                v-model:value="newPushForm.sysOrigin"
                :options="sysOriginOptions"
              />
            </FormItem>
            <FormItem label="客户端">
              <Select option-label-prop="label" v-model:value="newPushForm.platform" allow-clear>
                <SelectOption
                  v-for="item in APP_PLATFORM_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                 :label="`${item.name}`">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
            <FormItem label="推送平台">
              <Select option-label-prop="label" v-model:value="newPushForm.deviceType" allow-clear>
                <SelectOption
                  v-for="item in DEVICE_TYPE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                 :label="`${item.name}`">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
            <FormItem label="语言">
              <Select option-label-prop="label" v-model:value="newPushForm.language" allow-clear>
                <SelectOption
                  v-for="item in LANGUAGE_OPTIONS"
                  :key="item.value"
                  :value="item.value"
                 :label="`${item.name}`">
                  {{ item.name }}
                </SelectOption>
              </Select>
            </FormItem>
          </div>
          <FormItem label="业务场景">
            <Select option-label-prop="label" v-model:value="newPushForm.businessScene">
              <SelectOption value="OFFICIAL_MESSAGE_NOTICE" label="官方通知">官方通知</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="定投UID">
            <Input
              v-model:value="newPushForm.fixedUserIds"
              placeholder="请输入定投用户ID多个以逗号分隔 123,321"
              @blur="newPushForm.fixedUserIds = normalizeFixedIds(newPushForm.fixedUserIds).join(',')"
              @update:value="updateFixedCount"
            />
            <div class="helper">{{ fixedUidCount }}/100 定投会忽略语言过滤条件</div>
          </FormItem>
          <Button :loading="sending" type="primary" @click="handleSendPush">
            发送
          </Button>
        </Form>
      </div>

      <div v-else-if="activeTab === 'log'" class="panel">
        <div class="toolbar">
          <SysOriginSelect
            v-model:value="logQuery.sysOrigin"
            style="width: 140px"
            :options="sysOriginOptions"
          />
          <Select
            option-label-prop="label"
            v-model:value="logQuery.platform"
            allow-clear
            placeholder="客户端"
            style="width: 120px"
          
            :options="APP_PLATFORM_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
          <Select
            option-label-prop="label"
            v-model:value="logQuery.deviceType"
            allow-clear
            placeholder="推送平台"
            style="width: 120px"
          >
            <SelectOption
              v-for="item in DEVICE_TYPE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
          <Select
            option-label-prop="label"
            v-model:value="logQuery.pushStatus"
            allow-clear
            placeholder="状态"
            style="width: 120px"
          >
            <SelectOption
              v-for="item in PUSH_STATUS_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
          <RangePicker
            v-model:value="logRange"
            show-time
            style="width: 360px"
          />
          <Button :loading="logLoading" type="primary" @click="loadLogs(true)">
            搜索
          </Button>
        </div>

        <Table
          :columns="logColumns"
          :data-source="logList"
          :loading="logLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1600 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'pushStatus'">
              <Tag :color="record.pushStatus === 0 ? 'success' : 'error'">
                {{ record.pushStatus === 0 ? '成功' : '失败' }}
              </Tag>
            </template>
          </template>
        </Table>

        <div v-if="logTotal > 0" class="pagination">
          <Pagination
            :current="logQuery.cursor"
            :page-size="logQuery.limit"
            :total="logTotal"
            show-size-changer
            @change="handleLogPageChange"
            @showSizeChange="handleLogPageChange"
          />
        </div>
      </div>

      <div v-else class="panel">
        <div class="toolbar">
          <SysOriginSelect
            v-model:value="taskQuery.sysOrigin"
            style="width: 140px"
            :options="sysOriginOptions"
          />
          <Select
            option-label-prop="label"
            v-model:value="taskQuery.shelfStatus"
            allow-clear
            placeholder="状态"
            style="width: 120px"
          >
            <SelectOption
              v-for="item in SHELF_STATUS_OPTIONS"
              :key="String(item.value)"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
          <Button :loading="taskLoading" type="primary" @click="loadTasks(true)">
            搜索
          </Button>
          <Button type="primary" @click="openTaskModal()">
            新增任务
          </Button>
        </div>

        <Table
          :columns="taskColumns"
          :data-source="taskList"
          :loading="taskLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1500 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'shelfStatus'">
              <Tag :color="record.shelfStatus ? 'success' : 'default'">
                {{ record.shelfStatus ? '上架' : '下架' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button size="small" type="link" @click="openTaskModal(record)">
                  编辑
                </Button>
                <Button danger size="small" type="link" @click="handleDeleteTask(record.id)">
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <div v-if="taskTotal > 0" class="pagination">
          <Pagination
            :current="taskQuery.cursor"
            :page-size="taskQuery.limit"
            :total="taskTotal"
            show-size-changer
            @change="handleTaskPageChange"
            @showSizeChange="handleTaskPageChange"
          />
        </div>
      </div>
    </Card>

    <Modal
      :confirm-loading="taskSaving"
      :open="taskModalOpen"
      destroy-on-close
      :title="taskForm.id ? '编辑任务' : '新增任务'"
      width="720px"
      @cancel="taskModalOpen = false"
      @ok="submitTask"
    >
      <Form layout="vertical">
        <FormItem label="系统">
          <SysOriginSelect
            v-model:value="taskForm.sysOrigin"
            :options="sysOriginOptions"
          />
        </FormItem>
        <div class="grid-two">
          <FormItem label="客户端">
            <Select option-label-prop="label" v-model:value="taskForm.platform">
              <SelectOption
                v-for="item in APP_PLATFORM_OPTIONS"
                :key="item.value"
                :value="item.value"
               :label="`${item.name}`">
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="推送平台">
            <Select option-label-prop="label" v-model:value="taskForm.deviceType">
              <SelectOption
                v-for="item in DEVICE_TYPE_OPTIONS"
                :key="item.value"
                :value="item.value"
               :label="`${item.name}`">
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="语言">
            <Select option-label-prop="label" v-model:value="taskForm.language" allow-clear>
              <SelectOption
                v-for="item in LANGUAGE_OPTIONS"
                :key="item.value"
                :value="item.value"
               :label="`${item.name}`">
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
          <FormItem label="业务场景">
            <Select option-label-prop="label" v-model:value="taskForm.businessScene">
              <SelectOption value="OFFICIAL_MESSAGE_NOTICE" label="官方通知">官方通知</SelectOption>
            </Select>
          </FormItem>
          <FormItem label="状态">
            <Select option-label-prop="label" v-model:value="taskForm.shelfStatus">
              <SelectOption
                v-for="item in SHELF_STATUS_OPTIONS"
                :key="String(item.value)"
                :value="item.value"
               :label="`${item.name}`">
                {{ item.name }}
              </SelectOption>
            </Select>
          </FormItem>
        </div>
        <FormItem label="标题">
          <Input v-model:value="taskForm.title" />
        </FormItem>
        <FormItem label="内容">
          <Input v-model:value="taskForm.content" />
        </FormItem>
        <FormItem label="定投UID">
          <Input
            v-model:value="taskForm.fixedUserIds"
            placeholder="请输入定投用户ID多个以逗号分隔 123,321"
            @blur="taskForm.fixedUserIds = normalizeFixedIds(taskForm.fixedUserIds).join(',')"
            @update:value="updateFixedCount"
          />
          <div class="helper">{{ fixedUidCount }}/100 定投会忽略语言过滤条件</div>
        </FormItem>
        <div class="grid-three">
          <FormItem label="几号(可空)">
            <Input v-model:value="taskForm.days" />
          </FormItem>
          <FormItem label="几时">
            <Input v-model:value="taskForm.hours" />
          </FormItem>
          <FormItem label="几分">
            <Input v-model:value="taskForm.minutes" />
          </FormItem>
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.panel,
.toolbar {
  margin-top: 16px;
}

.grid-two {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-three {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.helper {
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
