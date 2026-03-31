<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import type { LegacyVersionItem } from '#/api/legacy/app-system';
import {
  addServerBuildVersion,
  delAppVersion,
  getAppVersionTable,
  getServerBuildVersion,
  } from '#/api/legacy/app-system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  PLATFORM_ORIGINS,
  formatDate,
  getAllowedSysOrigins,
  } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  message
} from 'antdv-next';

import AppUpdateContentModal from './components/app-update-content-modal.vue';
import AppVersionEditModal from './components/app-version-edit-modal.vue';

defineOptions({ name: 'AppSystemVersionManager' });

const accessStore = useAccessStore();

const loading = ref(false);
const total = ref(0);
const list = ref<LegacyVersionItem[]>([]);
const buildVersion = ref<number | string>(0);
const buildVersionInput = ref('0');
const buildVersionLoading = ref(false);
const buildVersionEditing = ref(false);
const editOpen = ref(false);
const updateContentOpen = ref(false);
const activeRow = ref<LegacyVersionItem | null>(null);
const selectedVersionId = ref('');

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const query = reactive({
  channel: '',
  cursor: 1,
  limit: 20,
  platform: 'iOS',
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'platform', key: 'platform', title: '平台', width: 140 },
  { dataIndex: 'version', key: 'version', title: '版本', width: 120 },
  { dataIndex: 'buildVersion', key: 'buildVersion', title: '编译版本', width: 120 },
  { dataIndex: 'forceUpdate', key: 'forceUpdate', title: '强更', width: 100 },
  { dataIndex: 'review', key: 'review', title: '审核中', width: 100 },
  { dataIndex: 'appType', key: 'appType', title: 'app类型', width: 120 },
  { dataIndex: 'patch', key: 'patch', title: '补丁', width: 100 },
  { dataIndex: 'updateDescribe', key: 'updateDescribe', title: '版本描述', width: 180 },
  { dataIndex: 'apkSize', key: 'apkSize', title: '安装包大小', width: 140 },
  { dataIndex: 'downloadUrl', key: 'downloadUrl', title: '下载链接', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 260 },
];

const tableScroll = computed(() => ({ x: 1660 }));
const selectedPlatform = computed(
  () => PLATFORM_ORIGINS.find((item) => item.value === query.platform) || null,
);

function syncChannel(platform = query.platform) {
  const current = PLATFORM_ORIGINS.find((item) => item.value === platform);
  query.channel = current?.channels?.[0]?.value ?? '';
}

syncChannel();

function getAppTypeText(value?: string) {
  return value === 'CHAT' ? '语聊' : '朝拜';
}

function getBooleanText(value?: boolean) {
  return value === true ? '是' : '否';
}

function formatUpdateDescribe(value?: string) {
  return String(value || '').replaceAll('\\n', '\n');
}

async function copyText(text?: string) {
  const value = String(text || '');
  if (!value) {
    message.warning('暂无可复制内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success('复制成功');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.left = '-9999px';
    textarea.style.position = 'fixed';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    message.success('复制成功');
  }
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await getAppVersionTable({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

async function loadBuildVersion() {
  buildVersionLoading.value = true;
  try {
    const result = await getServerBuildVersion({
      channel: query.channel,
      platform: query.platform,
      sysOrigin: query.sysOrigin,
    });
    buildVersion.value = result || 0;
    buildVersionInput.value = String(result || 0);
  } finally {
    buildVersionLoading.value = false;
  }
}

function handleSearch() {
  buildVersionEditing.value = false;
  loadData(true);
  loadBuildVersion();
}

function handlePlatformChange(value: string) {
  query.platform = value;
  syncChannel(value);
  handleSearch();
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function openCreate() {
  activeRow.value = null;
  editOpen.value = true;
}

function openEdit(record: LegacyVersionItem) {
  activeRow.value = { ...record };
  editOpen.value = true;
}

function openUpdateContent(record: LegacyVersionItem) {
  selectedVersionId.value = String(record.id || '');
  updateContentOpen.value = true;
}

function handleDelete(record: LegacyVersionItem) {
  Modal.confirm({
    title: '是否确认删除',
    async onOk() {
      await delAppVersion(record.id as number | string);
      message.success('删除成功');
      await loadData();
    },
  });
}

function submitServerBuildVersion(params: Record<string, any>) {
  buildVersionEditing.value = false;
  Modal.confirm({
    title: '服务器将拦截小于当前buildVersion请求，10分钟内生效是否继续？',
    async onOk() {
      await addServerBuildVersion(params);
      buildVersion.value = params.buildVersion;
      buildVersionInput.value = String(params.buildVersion);
      message.success('设置成功');
    },
  });
}

function handleBuildVersionConfirm() {
  const nextValue = Number(buildVersionInput.value);
  if (!Number.isFinite(nextValue) || nextValue < 0) {
    buildVersionInput.value = String(buildVersion.value || 0);
    buildVersionEditing.value = false;
    message.warning('请输入有效的编译版本号');
    return;
  }
  submitServerBuildVersion({
    buildVersion: nextValue,
    channel: query.channel,
    platform: query.platform,
    sysOrigin: query.sysOrigin,
  });
}

function handleRowBuildVersion(record: LegacyVersionItem) {
  submitServerBuildVersion({
    buildVersion: record.buildVersion,
    channel: record.channel,
    platform: record.platform,
    sysOrigin: record.sysOrigin || query.sysOrigin,
  });
}

loadData(true);
loadBuildVersion();
</script>

<template>
  <Page title="版本管理">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="handleSearch"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>

        <InlineFilterField label="平台">
          <Select
            v-model:value="query.platform"
            option-label-prop="label"
            style="width: 140px"
            @change="handlePlatformChange"
          
            :options="PLATFORM_ORIGINS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>

        <InlineFilterField
          v-if="selectedPlatform?.channels?.length"
          label="渠道"
          :label-width="56"
        >
          <Select
            v-model:value="query.channel"
            option-label-prop="label"
            style="width: 180px"
            @change="handleSearch"
          
            :options="selectedPlatform.channels.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>

        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button @click="openCreate">添加</Button>

        <Input
          v-if="buildVersionEditing"
          v-model:value="buildVersionInput"
          class="build-version-input"
          type="number"
          @blur="handleBuildVersionConfirm"
          @pressEnter="handleBuildVersionConfirm"
        />
        <Button
          v-else
          :loading="buildVersionLoading"
          type="default"
          @click="buildVersionEditing = true"
        >
          BuildVersion:{{ buildVersion }}
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'platform'">
            {{ record.platform || '-' }}
            <span v-if="record.channel">/{{ record.channel }}</span>
          </template>

          <template v-else-if="column.key === 'forceUpdate' || column.key === 'review' || column.key === 'patch'">
            <Tag :color="record[column.key] === true ? 'blue' : 'default'">
              {{ getBooleanText(record[column.key]) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'appType'">
            <Tag color="processing">
              {{ getAppTypeText(record.appType) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'updateDescribe'">
            <Space size="small">
              <Tooltip>
                <template #title>
                  <div class="tooltip-pre">
                    {{ formatUpdateDescribe(record.updateDescribe) || '-' }}
                  </div>
                </template>
                <span class="link-text">查看</span>
              </Tooltip>
              <Button size="small" type="link" @click="copyText(record.updateDescribe)">
                复制
              </Button>
            </Space>
          </template>

          <template v-else-if="column.key === 'downloadUrl'">
            <Button size="small" type="link" @click="copyText(record.downloadUrl)">
              点击复制
            </Button>
          </template>

          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <Space wrap size="small">
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
              <Button size="small" type="link" @click="handleRowBuildVersion(record)">
                服务强更
              </Button>
              <Button size="small" type="link" @click="openUpdateContent(record)">
                更新描述
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
    </Card>

    <AppVersionEditModal
      :open="editOpen"
      :sys-origin="query.sysOrigin"
      :update-data="activeRow"
      @close="editOpen = false"
      @success="handleSearch"
    />

    <AppUpdateContentModal
      :open="updateContentOpen"
      :version-id="selectedVersionId"
      @close="updateContentOpen = false"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.build-version-input {
  width: 160px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.link-text {
  color: rgb(37 99 235);
  cursor: pointer;
}

.tooltip-pre {
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
