<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  closeUserDynamicTop,
  deleteUserDynamic,
  setUserDynamicTop,
  userDynamicTable,
  } from '#/api/legacy/dynamic';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Checkbox,
  Col,
  DateRangePicker,
  Empty,
  Image,
  InputNumber,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  message
} from 'antdv-next';

import AccountHandleModal from '#/views/approval/components/account-handle-modal.vue';

defineOptions({ name: 'DynamicUserDynamicList' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const selectedKeys = ref<string[]>([]);
const topModalOpen = ref(false);
const topSaving = ref(false);
const accountHandleOpen = ref(false);
const activeUserId = ref('');
const topForm = reactive({
  dynamicId: '',
  sysOrigin: '',
  weights: undefined as number | undefined,
});

const query = reactive({
  cursor: 1,
  endTime: '',
  limit: 30,
  startTime: '',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  top: '',
  userId: '',
});

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

const allChecked = computed(
  () => list.value.length > 0 && selectedKeys.value.length === list.value.length,
);
const indeterminate = computed(
  () =>
    selectedKeys.value.length > 0 &&
    selectedKeys.value.length < list.value.length,
);

function getPictures(record: Record<string, any>) {
  return (Array.isArray(record.pictures) ? record.pictures : [])
    .map((item: any) => item?.resourceUrl || item?.url || '')
    .filter(Boolean);
}

function getUserAvatar(record: Record<string, any>) {
  return record.userBaseInfo?.userAvatar || record.userAvatar || '';
}

function getUserName(record: Record<string, any>) {
  return record.userBaseInfo?.userNickname || record.userNickname || '-';
}

function getUserAccount(record: Record<string, any>) {
  return record.userBaseInfo?.actualAccount || record.actualAccount || '-';
}

function getRowKey(record: Record<string, any>) {
  return String(record.id || '');
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await userDynamicTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
    selectedKeys.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function toggleAll(checked: boolean) {
  selectedKeys.value = checked ? list.value.map((item) => getRowKey(item)) : [];
}

function toggleRecord(record: Record<string, any>) {
  const key = getRowKey(record);
  const index = selectedKeys.value.findIndex((item) => item === key);
  if (index >= 0) {
    selectedKeys.value.splice(index, 1);
    return;
  }
  selectedKeys.value.push(key);
}

function openUserDetails(record: Record<string, any>) {
  const userId = record.userId || record.userBaseInfo?.id;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function openAccountHandle(record: Record<string, any>) {
  activeUserId.value = String(record.userId || record.userBaseInfo?.id || '');
  accountHandleOpen.value = true;
}

function openTopEdit(record: Record<string, any>) {
  topForm.dynamicId = String(record.id || '');
  topForm.sysOrigin = query.sysOrigin;
  topForm.weights = Number(record.weights || 0);
  topModalOpen.value = true;
}

async function handleCloseTop(record: Record<string, any>) {
  await closeUserDynamicTop(record.id);
  message.success('操作成功');
  await loadData(true);
}

async function handleSubmitTop() {
  if (!topForm.dynamicId) {
    return;
  }
  if (topForm.weights === undefined || topForm.weights === null) {
    message.warning('请输入权重');
    return;
  }
  topSaving.value = true;
  try {
    await setUserDynamicTop({
      dynamicId: topForm.dynamicId,
      sysOrigin: topForm.sysOrigin,
      weights: topForm.weights,
    });
    message.success('保存成功');
    topModalOpen.value = false;
    await loadData(true);
  } finally {
    topSaving.value = false;
  }
}

function handleDeleteSelected() {
  if (selectedKeys.value.length === 0) {
    message.warning('请勾选审批项');
    return;
  }
  Modal.confirm({
    title: '确认删除选中记录吗？',
    async onOk() {
      await deleteUserDynamic(selectedKeys.value);
      message.success('删除成功');
      await loadData();
    },
  });
}

loadData(true);
</script>

<template>
  <Page title="用户动态">
    <div class="page-grid">
      <Card>
        <div class="toolbar">
          <Space wrap>
            <SysOriginSelect
              v-model:value="query.sysOrigin"
              style="width: 140px"
              @change="handleSearch"

              :options="sysOriginOptions"
            ></SysOriginSelect>
            <Select
              v-model:value="query.top"
              option-label-prop="label"
              style="width: 140px"
              @change="handleSearch"
            
              :options="[{ label: '全部', value: '' as any }, { label: '已置顶', value: '1' as any }, { label: '未置顶', value: '0' as any }]"
            />
            <DateRangePicker
              v-model:value="rangeDate"
              show-time
              style="width: 360px"
              value-format="x"
            />
            <AccountInput
              v-model:value="query.userId"
              :sys-origin="query.sysOrigin"
              placeholder="用户ID"
              style="width: 220px"
            />
            <Button :loading="loading" type="primary" @click="handleSearch">
              搜索
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <div class="selection-bar">
          <Checkbox
            :checked="allChecked"
            :indeterminate="indeterminate"
            @change="(event) => toggleAll(!!event.target.checked)"
          >
            全选
          </Checkbox>
          <span class="selection-text">
            已勾选 <strong>{{ selectedKeys.length }}</strong>
          </span>
          <Button danger @click="handleDeleteSelected">删除</Button>
        </div>

        <Spin :spinning="loading">
          <Empty v-if="list.length === 0" description="暂无动态" />
          <Row v-else :gutter="[16, 16]">
            <Col
              v-for="record in list"
              :key="getRowKey(record)"
              :lg="8"
              :md="12"
              :sm="24"
              :xs="24"
            >
              <Card class="dynamic-card">
                <div class="card-header">
                  <Checkbox
                    :checked="selectedKeys.includes(getRowKey(record))"
                    @change="() => toggleRecord(record)"
                  >
                    选中
                  </Checkbox>
                  <Tag v-if="record.top === true" color="magenta">
                    置顶权重：{{ record.weights || 0 }}
                  </Tag>
                </div>

                <div class="content-block">
                  <div class="content-label">动态内容</div>
                  <div class="content-text">{{ record.content || '-' }}</div>
                </div>

                <div v-if="getPictures(record).length > 0" class="picture-row">
                  <div
                    v-for="item in getPictures(record)"
                    :key="item"
                    class="picture-item"
                  >
                    <Image :src="item" class="picture-image" />
                  </div>
                </div>

                <div class="user-row">
                  <img
                    :src="getUserAvatar(record) || 'https://dummyimage.com/48x48/e2e8f0/64748b&text=U'"
                    alt=""
                    class="user-avatar"
                  >
                  <div class="user-meta">
                    <Button class="user-link" type="link" @click="openUserDetails(record)">
                      {{ getUserName(record) }}
                    </Button>
                    <div class="meta-line">{{ getUserAccount(record) }}</div>
                    <div class="meta-line">
                      性别：{{ record.userSexName || '-' }} / 年龄：{{ record.userBaseInfo?.age || '-' }}
                    </div>
                    <div class="meta-line">创建时间：{{ formatDate(record.createTime) }}</div>
                  </div>
                </div>

                <div class="card-actions">
                  <Button size="small" type="link" @click="openAccountHandle(record)">
                    账号处理
                  </Button>
                  <Button size="small" type="link" @click="openTopEdit(record)">
                    置顶
                  </Button>
                  <Button
                    v-if="record.top === true"
                    size="small"
                    type="link"
                    @click="handleCloseTop(record)"
                  >
                    取消置顶
                  </Button>
                </div>
              </Card>
            </Col>
          </Row>
        </Spin>

        <div class="pagination">
          <Pagination
            :current="query.cursor"
            :page-size="query.limit"
            :total="total"
            show-size-changer
            @change="handlePageChange"
            @showSizeChange="handlePageChange"
          />
        </div>
      </Card>
    </div>

    <Modal
      :confirm-loading="topSaving"
      :open="topModalOpen"
      destroy-on-close
      title="编辑置顶动态"
      @cancel="topModalOpen = false"
      @ok="handleSubmitTop"
    >
      <div class="top-form">
        <div class="top-row">
          <span>平台</span>
          <Tag>{{ query.sysOrigin }}</Tag>
        </div>
        <div class="top-row top-input">
          <span>权重</span>
          <InputNumber
            v-model:value="topForm.weights"
            :min="0"
            placeholder="数字越大越排在前面"
            style="width: 100%"
          />
        </div>
      </div>
    </Modal>

    <AccountHandleModal
      :open="accountHandleOpen"
      :user-id="activeUserId"
      @close="accountHandleOpen = false"
      @success="loadData()"
    />
  </Page>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: 16px;
}

.toolbar {
  min-height: 40px;
}

.selection-bar {
  align-items: center;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.selection-text {
  color: #64748b;
}

.dynamic-card {
  height: 100%;
}

.card-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.content-block {
  margin-bottom: 14px;
}

.content-label {
  color: #2563eb;
  font-weight: 600;
  margin-bottom: 6px;
}

.content-text {
  color: #334155;
  line-height: 1.7;
  min-height: 48px;
  overflow-wrap: anywhere;
}

.picture-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  overflow-x: auto;
}

.picture-item {
  flex: 0 0 auto;
}

.picture-image {
  border-radius: 12px;
  height: 220px;
  object-fit: cover;
  width: 180px;
}

.user-row {
  align-items: flex-start;
  display: flex;
  gap: 12px;
}

.user-avatar {
  border-radius: 999px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.user-meta {
  min-width: 0;
}

.user-link {
  padding-left: 0;
}

.meta-line {
  color: #64748b;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.top-form {
  display: grid;
  gap: 12px;
}

.top-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.top-input {
  align-items: stretch;
  flex-direction: column;
}
</style>
