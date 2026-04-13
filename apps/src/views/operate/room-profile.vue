<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { approveData } from '#/api/legacy/approval';
import { OSS_FILE_BUCKETS, getAccessImgUrl, simpleUploadFile } from '#/api/legacy/oss';
import {
  changeRole,
  pofileTable,
  removeOrPullBlackRoomUser,
  updateProfile,
} from '#/api/legacy/room';
import AccountInput from '#/components/account-input.vue';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  TextArea,
  message,
} from 'antdv-next';

import RoomDetailsDrawer from '#/views/app-system/components/room-details-drawer.vue';

import {
  ROOM_EVENT_OPTIONS,
  ROOM_ROLE_OPTIONS,
  ROOM_USER_EVENT_OPTIONS,
} from './constants';
import { copyText } from './shared';
import RoomMemberDrawer from './components/room-member-drawer.vue';
import RoomOperationLogDrawer from './components/room-operation-log-drawer.vue';
import RoomSearchInput from './components/room-search-input.vue';
import RoomVisitorLogDrawer from './components/room-visitor-log-drawer.vue';

defineOptions({ name: 'OperateRoomProfile' });

function createEditForm() {
  return {
    event: 'AVAILABLE',
    id: '',
    maxAdmin: 0,
    roomCover: '',
    roomDesc: '',
    roomName: '',
  };
}

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const searchLoading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const listNotData = ref(false);
const loadMoreLoading = ref(false);

const editOpen = ref(false);
const uploadLoading = ref(false);
const editSaving = ref(false);
const editRow = ref<Record<string, any> | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

const roomDetailsOpen = ref(false);
const roomMemberOpen = ref(false);
const visitorOpen = ref(false);
const operationLogOpen = ref(false);
const activeRoomId = ref<number | string>('');

const memberActionOpen = ref(false);
const memberActionSaving = ref(false);
const roleActionOpen = ref(false);
const roleActionSaving = ref(false);

const approvalOpen = ref(false);
const approvalLoading = ref(false);
const approvalState = ref<'NOT_PASS' | 'PASS'>('PASS');
const approvalType = ref('');
const approvalTitle = ref('');
const approvalContent = ref('');
const approvalRoomId = ref<number | string>('');
const approvalUserId = ref<number | string>('');

const query = reactive({
  del: '0',
  event: '',
  lastId: '',
  limit: 20,
  roomAccount: '',
  roomId: '',
  sysOrigin: '',
  userId: '',
});

const editForm = reactive(createEditForm());

const memberActionForm = reactive({
  event: 'SYS_PULL_BLACK_ROOM_USER',
  roomAccount: '',
  sysOrigin: '',
  userAccount: '',
});

const roleActionForm = reactive({
  roles: 'MEMBER',
  roomAccount: '',
  sysOrigin: '',
  userAccount: '',
});

const columns = [
  { dataIndex: 'room', key: 'room', title: '封面 / 房间信息', width: 320 },
  { dataIndex: 'base', key: 'base', title: '房间信息', width: 180 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 260 },
];
const roomEventSelectOptions = ROOM_EVENT_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const roomUserEventSelectOptions = ROOM_USER_EVENT_OPTIONS.map((item) => ({
  label: item.name,
  value: item.value as any,
}));
const roomRoleActionOptions = [
  ...ROOM_ROLE_OPTIONS.map((item) => ({
    disabled: item.value === 'HOMEOWNER',
    label: item.name,
    value: item.value as any,
  })),
  { label: '游客', value: 'TOURIST' as any },
];
const approvalStateOptions = [
  { label: '通过', value: 'PASS' as any },
  { label: '不通过', value: 'NOT_PASS' as any },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
      void loadData(true);
    }
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    list.value = [];
    query.lastId = '';
    listNotData.value = false;
  }
  loading.value = true;
  try {
    const result = (await pofileTable({ ...query })) || [];
    list.value = reset ? result : [...list.value, ...result];
    listNotData.value = result.length <= 0;
    if (list.value.length > 0) {
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSysOriginChange() {
  query.roomId = '';
  query.roomAccount = '';
  searchLoading.value = false;
  void loadData(true);
}

function loadSearchRoom() {
  searchLoading.value = true;
}

function searchRoomSuccess(result: Record<string, any>) {
  searchLoading.value = false;
  query.roomId = String(result?.id || '');
  query.roomAccount = '';
}

function searchRoomFail() {
  query.roomId = '';
  query.roomAccount = '';
  searchLoading.value = false;
}

function openRoomDetails(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  roomDetailsOpen.value = true;
}

function openRoomMembers(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  roomMemberOpen.value = true;
}

function openVisitors(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  visitorOpen.value = true;
}

function openOperationLogs(roomId?: number | string) {
  if (!roomId) {
    return;
  }
  activeRoomId.value = roomId;
  operationLogOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  Object.assign(editForm, createEditForm(), {
    event: record.event || 'AVAILABLE',
    id: record.id || '',
    maxAdmin: Number(record.setting?.maxAdmin || 0),
    roomCover: record.roomCover || '',
    roomDesc: record.roomDesc || '',
    roomName: record.roomName || '',
  });
  editRow.value = record;
  editOpen.value = true;
}

function openUpload() {
  fileInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    editForm.roomCover = getAccessImgUrl(result.name);
  } finally {
    uploadLoading.value = false;
  }
}

async function handleSaveEdit() {
  if (!editForm.id) {
    return;
  }
  if (!String(editForm.roomName || '').trim()) {
    message.warning('请输入房间名称');
    return;
  }
  editSaving.value = true;
  try {
    await updateProfile({ ...editForm });
    if (editRow.value) {
      editRow.value.roomCover = editForm.roomCover;
      editRow.value.roomDesc = editForm.roomDesc;
      editRow.value.roomName = editForm.roomName;
      editRow.value.event = editForm.event;
      editRow.value.setting = {
        ...(editRow.value.setting || {}),
        maxAdmin: editForm.maxAdmin,
      };
    }
    message.success('保存成功');
    editOpen.value = false;
  } finally {
    editSaving.value = false;
  }
}

function openApproval(record: Record<string, any>, type: string) {
  approvalType.value = type;
  approvalRoomId.value = record.id;
  approvalUserId.value = record.userId;
  approvalState.value = 'PASS';
  if (type === 'ROOM_NICKNAME') {
    approvalTitle.value = '房间昵称审批';
    approvalContent.value = record.roomName || '';
  } else if (type === 'ROOM_AVATAR') {
    approvalTitle.value = '房间头像审批';
    approvalContent.value = record.roomCover || '';
  } else {
    approvalTitle.value = '房间公告审批';
    approvalContent.value = record.roomDesc || '';
  }
  approvalOpen.value = true;
}

async function handleApproval() {
  if (!approvalType.value || !approvalRoomId.value || !approvalUserId.value) {
    return;
  }
  approvalLoading.value = true;
  try {
    await approveData({
      approvalStatus: approvalState.value,
      approvalType: approvalType.value,
      waitApprovalUser: [
        {
          content: approvalContent.value,
          contentId: approvalRoomId.value,
          userId: approvalUserId.value,
        },
      ],
    });
    message.success('审批成功');
    approvalOpen.value = false;
    await loadData(true);
  } finally {
    approvalLoading.value = false;
  }
}

function openMemberAction() {
  memberActionForm.event = 'SYS_PULL_BLACK_ROOM_USER';
  memberActionForm.roomAccount = '';
  memberActionForm.sysOrigin = query.sysOrigin;
  memberActionForm.userAccount = '';
  memberActionOpen.value = true;
}

async function handleMemberAction() {
  if (!memberActionForm.roomAccount || !memberActionForm.userAccount) {
    message.warning('请输入房间账号和用户账号');
    return;
  }
  memberActionSaving.value = true;
  try {
    await removeOrPullBlackRoomUser({ ...memberActionForm, sysOrigin: query.sysOrigin });
    message.success('操作成功');
    memberActionOpen.value = false;
    await loadData(true);
  } finally {
    memberActionSaving.value = false;
  }
}

function openRoleAction() {
  roleActionForm.roles = 'MEMBER';
  roleActionForm.roomAccount = '';
  roleActionForm.sysOrigin = query.sysOrigin;
  roleActionForm.userAccount = '';
  roleActionOpen.value = true;
}

async function handleRoleAction() {
  if (!roleActionForm.roomAccount || !roleActionForm.userAccount) {
    message.warning('请输入房间账号和用户账号');
    return;
  }
  roleActionSaving.value = true;
  try {
    await changeRole({ ...roleActionForm, sysOrigin: query.sysOrigin });
    message.success('操作成功');
    roleActionOpen.value = false;
    await loadData(true);
  } finally {
    roleActionSaving.value = false;
  }
}

async function handleCopy(value: number | string) {
  if (!value) {
    return;
  }
  try {
    await copyText(String(value));
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Page title="房间资料管理">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSysOriginChange"

            :options="sysOriginOptions"
          ></SysOriginSelect>
          <Select option-label-prop="label"
            v-model:value="query.del"
            style="width: 120px"
            @change="loadData(true)"
          
            :options="[{ label: '未注销', value: '0' as any }, { label: '已注销', value: '1' as any }]"
          />
          <Select option-label-prop="label"
            v-model:value="query.event"
            allow-clear
            placeholder="房间状态"
            style="width: 140px"
          
            :options="ROOM_EVENT_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
          <div class="room-search-field">
            <RoomSearchInput
              :key="query.sysOrigin"
              :sys-origin="query.sysOrigin"
              placeholder="房间ID"
              @fail="searchRoomFail"
              @load="loadSearchRoom"
              @success="searchRoomSuccess"
            />
          </div>
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 280px"
          />
          <Button :loading="searchLoading || loading" type="primary" @click="loadData(true)">
            搜索
          </Button>
          <Button @click="openMemberAction">移除/拉黑成员</Button>
          <Button @click="openRoleAction">权限变更</Button>
        </Space>
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
          <template v-if="column.key === 'room'">
            <div class="room-cell">
              <Image
                :src="record.roomCover || 'https://dummyimage.com/72x72/e2e8f0/64748b&text=R'"
                class="room-cover"
              />
              <div class="room-copy">
                <Button size="small" type="link" @click="openRoomDetails(record.id)">
                  {{ record.roomName || '-' }}
                </Button>
                <div>账号：{{ record.roomAccount || '-' }}</div>
                <div class="room-desc">{{ record.roomDesc || '-' }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'base'">
            <div>状态：
              <Tag>{{ ROOM_EVENT_OPTIONS.find((item) => item.value === record.event)?.name || record.event || '-' }}</Tag>
            </div>
            <div>ID：{{ record.id || '-' }}</div>
            <div>管理员上限：{{ record.setting?.maxAdmin ?? '-' }}</div>
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建：{{ formatDate(record.createTime) }}</div>
            <div>修改：{{ formatDate(record.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button size="small" type="link" @click="handleCopy(record.id)">复制ID</Button>
              <Button size="small" type="link" @click="openEdit(record)">编辑资料</Button>
              <Button size="small" type="link" @click="openRoomMembers(record.id)">成员列表</Button>
              <Button size="small" type="link" @click="openVisitors(record.id)">访客记录</Button>
              <Button size="small" type="link" @click="openOperationLogs(record.id)">操作日志</Button>
              <Button size="small" type="link" @click="openApproval(record, 'ROOM_NICKNAME')">
                审批昵称
              </Button>
              <Button size="small" type="link" @click="openApproval(record, 'ROOM_AVATAR')">
                审批头像
              </Button>
              <Button size="small" type="link" @click="openApproval(record, 'ROOM_NOTICE')">
                审批公告
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div class="load-more">
        <span v-if="listNotData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadMoreLoading = true; loadData()"
        >
          点击加载更多
        </Button>
      </div>
    </Card>

    <RoomDetailsDrawer
      :open="roomDetailsOpen"
      :room-id="activeRoomId"
      @close="roomDetailsOpen = false"
    />
    <RoomMemberDrawer
      :open="roomMemberOpen"
      :room-id="activeRoomId"
      :sys-origin="query.sysOrigin"
      @close="roomMemberOpen = false"
    />
    <RoomVisitorLogDrawer
      :open="visitorOpen"
      :room-id="activeRoomId"
      :sys-origin="query.sysOrigin"
      @close="visitorOpen = false"
    />
    <RoomOperationLogDrawer
      :open="operationLogOpen"
      :room-id="activeRoomId"
      @close="operationLogOpen = false"
    />

    <Modal
      :confirm-loading="editSaving"
      :open="editOpen"
      destroy-on-close
      title="编辑房间资料"
      width="520"
      @cancel="editOpen = false"
      @ok="handleSaveEdit"
    >
      <Form layout="vertical">
        <FormItem label="封面">
          <div class="upload-row">
            <Image
              :src="editForm.roomCover || 'https://dummyimage.com/88x88/e2e8f0/64748b&text=R'"
              class="upload-preview"
            />
            <div>
              <Button :loading="uploadLoading" @click="openUpload">上传封面</Button>
              <input ref="fileInputRef" accept="image/*" hidden type="file" @change="handleUpload">
            </div>
          </div>
        </FormItem>
        <FormItem label="名称">
          <Input v-model:value="editForm.roomName" :maxlength="24" />
        </FormItem>
        <FormItem label="公告">
          <TextArea
            v-model:value="editForm.roomDesc"
            :maxlength="160"
            :rows="4"
          />
        </FormItem>
        <FormItem label="状态">
          <Select
            option-label-prop="label"
            v-model:value="editForm.event"
            :options="roomEventSelectOptions"
          />
        </FormItem>
        <FormItem label="管理员数量">
          <InputNumber
            v-model:value="editForm.maxAdmin"
            :min="0"
            :precision="0"
            style="width: 100%"
          />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      :confirm-loading="memberActionSaving"
      :open="memberActionOpen"
      destroy-on-close
      title="移除 / 拉黑成员"
      @cancel="memberActionOpen = false"
      @ok="handleMemberAction"
    >
      <Form layout="vertical">
        <FormItem label="平台">
          <Input :value="query.sysOrigin" disabled />
        </FormItem>
        <FormItem label="房间账号">
          <Input v-model:value="memberActionForm.roomAccount" />
        </FormItem>
        <FormItem label="用户账号">
          <Input v-model:value="memberActionForm.userAccount" />
        </FormItem>
        <FormItem label="事件">
          <Select
            option-label-prop="label"
            v-model:value="memberActionForm.event"
            :options="roomUserEventSelectOptions"
          />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      :confirm-loading="roleActionSaving"
      :open="roleActionOpen"
      destroy-on-close
      title="房间内权限变更"
      @cancel="roleActionOpen = false"
      @ok="handleRoleAction"
    >
      <Form layout="vertical">
        <FormItem label="平台">
          <Input :value="query.sysOrigin" disabled />
        </FormItem>
        <FormItem label="房间账号">
          <Input v-model:value="roleActionForm.roomAccount" />
        </FormItem>
        <FormItem label="用户账号">
          <Input v-model:value="roleActionForm.userAccount" />
        </FormItem>
        <FormItem label="权限">
          <Select
            option-label-prop="label"
            v-model:value="roleActionForm.roles"
            :options="roomRoleActionOptions"
          />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      :confirm-loading="approvalLoading"
      :open="approvalOpen"
      destroy-on-close
      :title="approvalTitle"
      ok-text="提交"
      @cancel="approvalOpen = false"
      @ok="handleApproval"
    >
      <Form layout="vertical">
        <FormItem label="审批状态">
          <Select
            option-label-prop="label"
            v-model:value="approvalState"
            :options="approvalStateOptions"
          />
        </FormItem>
        <FormItem label="审批内容">
          <div v-if="approvalType === 'ROOM_AVATAR'" class="approval-preview">
            <Image :src="approvalContent" class="approval-image" />
          </div>
          <TextArea v-else :rows="4" :value="approvalContent" disabled />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.room-search-field {
  width: 360px;
}

.room-cell {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.room-cover {
  border-radius: 16px;
  flex-shrink: 0;
  height: 72px;
  object-fit: cover;
  width: 72px;
}

.room-copy {
  min-width: 0;
}

.room-desc {
  color: #64748b;
  margin-top: 4px;
  word-break: break-word;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 16px;
}

.upload-preview {
  border-radius: 16px;
  height: 88px;
  object-fit: cover;
  width: 88px;
}

.approval-preview {
  display: flex;
  justify-content: center;
}

.approval-image {
  border-radius: 16px;
  max-height: 240px;
  max-width: 240px;
  object-fit: cover;
}
</style>
