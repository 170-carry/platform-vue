<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccessStore } from '@vben/stores';
import { Page } from '@vben/common-ui';

import { listMemberOptions } from '#/api/legacy/approval';
import AccountInput from '#/components/account-input.vue';
import SysOriginSelect from '#/components/sys-origin-select.vue';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Checkbox,
  Col,
  DateRangePicker,
  Empty,
  Image,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  message,
} from 'antdv-next';

import {
  SYS_ORIGIN_OPTIONS,
  approvalPages,
  type ApprovalFilter,
  type ApprovalGalleryPage,
  type ApprovalHistoryPage,
  type ApprovalPage,
  type ApprovalRowAction,
  type ApprovalTableCell,
  type ApprovalTablePage,
} from './config';
import AccountHandleModal from './components/account-handle-modal.vue';
import EditUserDrawer from './components/edit-user-drawer.vue';
import FeedbackProcessModal from './components/feedback-process-modal.vue';

defineOptions({ name: 'ApprovalPage' });

const route = useRoute();
const router = useRouter();
const accessStore = useAccessStore();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const selectedKeys = ref<string[]>([]);
const memberOptions = ref<Array<{ id: number | string; nickname: string }>>([]);
const memberLoading = ref(false);
const activeFamilyTab = ref('');
const dateRange = ref<[string, string] | null>(null);

const editUserId = ref<number | string>('');
const accountUserId = ref<number | string>('');
const feedbackRecord = ref<any>(null);
const editDrawerOpen = ref(false);
const accountModalOpen = ref(false);
const feedbackModalOpen = ref(false);

const query = reactive<Record<string, any>>({});

const routePage = computed<ApprovalPage | null>(() => {
  return approvalPages[route.path] ?? null;
});

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : SYS_ORIGIN_OPTIONS;
});

const currentPage = computed<
  ApprovalGalleryPage | ApprovalHistoryPage | ApprovalTablePage | null
>(() => {
  const page = routePage.value;
  if (!page) {
    return null;
  }
  if (page.kind === 'family') {
    return page.tabs[activeFamilyTab.value]?.page ?? null;
  }
  return page;
});

const isFamilyPage = computed(() => routePage.value?.kind === 'family');
const isGalleryPage = computed(() => currentPage.value?.kind === 'gallery');
const isTablePage = computed(() => currentPage.value?.kind === 'table');
const isHistoryPage = computed(() => currentPage.value?.kind === 'history');
const familyTabs = computed(() =>
  routePage.value?.kind === 'family' ? routePage.value.tabs : {},
);
const galleryPage = computed(() =>
  currentPage.value?.kind === 'gallery' ? currentPage.value : null,
);
const tablePage = computed(() =>
  currentPage.value?.kind === 'table' ? currentPage.value : null,
);
const historyPage = computed(() =>
  currentPage.value?.kind === 'history' ? currentPage.value : null,
);
const memberFilterOptions = computed(() =>
  memberOptions.value.map((item) => ({
    label: item.nickname,
    value: item.id,
  })),
);

const pageTitle = computed(() => {
  if (!routePage.value) {
    return '审批页面';
  }
  return routePage.value.title;
});

const tableColumns = computed(() => {
  if (!tablePage.value) {
    return [];
  }
  const columns = tablePage.value.columns.map((column) => ({
    align: column.align ?? 'center',
    key: column.key,
    title: column.title,
    width: column.width,
  }));
  if (tablePage.value.rowActions) {
    columns.push({
      align: 'center',
      key: 'actions',
      title: '操作',
      width: 180,
    });
  }
  return columns;
});

const selectionEnabled = computed(() => {
  return currentPage.value?.selectable?.(query) ?? false;
});

const selectedRecords = computed(() => {
  const selected = new Set(selectedKeys.value);
  return list.value.filter((record, index) =>
    selected.has(String(getRowKey(record, index))),
  );
});

const bulkActions = computed(() => {
  return (
    currentPage.value?.actions?.filter((item) =>
      item.show ? item.show(query) : true,
    ) ?? []
  );
});

const hasMemberFilter = computed(() => {
  return (
    currentPage.value?.filters.some((item) => item.type === 'member') ?? false
  );
});

const allChecked = computed(() => {
  if (list.value.length === 0) {
    return false;
  }
  return selectedKeys.value.length === list.value.length;
});

const indeterminate = computed(() => {
  return (
    selectedKeys.value.length > 0 && selectedKeys.value.length < list.value.length
  );
});

watch(
  routePage,
  (page) => {
    if (page?.kind === 'family') {
      const firstKey = Object.keys(page.tabs)[0] || '';
      if (!page.tabs[activeFamilyTab.value]) {
        activeFamilyTab.value = firstKey;
      }
      return;
    }
    activeFamilyTab.value = '';
  },
  { immediate: true },
);

watch(
  currentPage,
  async (page) => {
    if (!page) {
      return;
    }
    applyQueryDefaults(page.defaultQuery);
    selectedKeys.value = [];
    if (hasMemberFilter.value) {
      await loadMembers();
    }
    await loadData();
  },
  { immediate: true },
);

function cloneQuery<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function applyQueryDefaults(defaultQuery: Record<string, any>) {
  Object.keys(query).forEach((key) => {
    delete query[key];
  });
  Object.assign(query, cloneQuery(defaultQuery));

  if ('sysOrigin' in query && !query.sysOrigin && sysOriginOptions.value.length > 0) {
    query.sysOrigin = sysOriginOptions.value[0]?.value ?? '';
  }

  const dateFilter = currentPage.value?.filters.find(
    (item) => item.type === 'dateRange',
  );
  if (dateFilter?.startField && dateFilter?.endField) {
    const start = query[dateFilter.startField];
    const end = query[dateFilter.endField];
    dateRange.value = start && end ? [String(start), String(end)] : null;
  } else {
    dateRange.value = null;
  }
}

async function loadMembers() {
  if (!hasMemberFilter.value) {
    memberOptions.value = [];
    return;
  }
  memberLoading.value = true;
  try {
    memberOptions.value = await listMemberOptions();
  } finally {
    memberLoading.value = false;
  }
}

async function loadData() {
  if (!currentPage.value) {
    return;
  }
  if ('sysOrigin' in query && currentPage.value.filters.some((item) => item.type === 'sysOrigin') && sysOriginOptions.value.length === 0) {
    list.value = [];
    total.value = 0;
    return;
  }

  loading.value = true;
  try {
    const result = await currentPage.value.fetch(cloneQuery(query));
    list.value = result.records || [];
    total.value = result.total || 0;
    selectedKeys.value = [];
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.cursor = 1;
  loadData();
}

function handleDateChange(_: unknown, value: [string, string]) {
  dateRange.value = value ? [...value] : null;
  const dateFilter = currentPage.value?.filters.find(
    (item) => item.type === 'dateRange',
  );
  if (!dateFilter?.startField || !dateFilter?.endField) {
    return;
  }
  query[dateFilter.startField] = value?.[0] ?? '';
  query[dateFilter.endField] = value?.[1] ?? '';
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function getRowKey(record: any, index?: number) {
  return (
    currentPage.value?.rowKey?.(record, index ?? 0) ??
    record.id ??
    record.dynamicId ??
    record.userId ??
    `${route.path}-${index ?? 0}`
  );
}

function toggleRecord(record: any, index: number) {
  if (!selectionEnabled.value) {
    return;
  }
  const key = String(getRowKey(record, index));
  if (selectedKeys.value.includes(key)) {
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key);
    return;
  }
  selectedKeys.value = [...selectedKeys.value, key];
}

function handleToggleAll(checked: boolean) {
  if (!selectionEnabled.value) {
    return;
  }
  selectedKeys.value = checked
    ? list.value.map((record, index) => String(getRowKey(record, index)))
    : [];
}

function getGalleryCard(record: any) {
  if (!galleryPage.value) {
    return null;
  }
  return galleryPage.value.buildCard(record, query);
}

function getTableCells(columnKey: string, record: any) {
  if (!tablePage.value) {
    return [];
  }
  const column = tablePage.value.columns.find((item) => item.key === columnKey);
  if (!column) {
    return [];
  }
  const cell = column.render(record);
  return Array.isArray(cell) ? cell : [cell];
}

function getExpandedSections(record: any) {
  if (!tablePage.value?.expandable) {
    return [];
  }
  return tablePage.value.expandable(record);
}

function getTimelineItem(record: any) {
  if (!historyPage.value) {
    return null;
  }
  return historyPage.value.buildTimeline(record);
}

function getRowActions(record: any) {
  return currentPage.value?.rowActions?.(record) ?? [];
}

function openRowAction(action: ApprovalRowAction, record?: any) {
  const value = action.value;
  switch (action.type) {
    case 'account': {
      if (!value) {
        return;
      }
      accountUserId.value = value;
      accountModalOpen.value = true;
      return;
    }
    case 'details': {
      if (!value) {
        return;
      }
      router.push(`/common/user/deatils/${value}`);
      return;
    }
    case 'edit': {
      if (!value) {
        return;
      }
      editUserId.value = value;
      editDrawerOpen.value = true;
      return;
    }
    case 'feedback': {
      feedbackRecord.value = record ?? null;
      feedbackModalOpen.value = true;
      return;
    }
  }
}

function getTableRowSelection() {
  if (!selectionEnabled.value || !isTablePage.value) {
    return undefined;
  }
  return {
    onChange: (keys: Array<number | string>) => {
      selectedKeys.value = keys.map((item) => String(item));
    },
    selectedRowKeys: selectedKeys.value,
  };
}

async function handleBulkAction(action: {
  execute: (records: any[], query: Record<string, any>) => Promise<void>;
  label: string;
}) {
  if (selectedRecords.value.length === 0) {
    message.warning('请勾选审批项');
    return;
  }

  Modal.confirm({
    async onOk() {
      loading.value = true;
      try {
        await action.execute(selectedRecords.value, cloneQuery(query));
        message.success('处理成功');
        await loadData();
      } finally {
        loading.value = false;
      }
    },
    title: '确认审核选中记录吗？',
  });
}

function renderCellText(cell: ApprovalTableCell) {
  return cell.text || '-';
}

function closeAllModalsAndReload() {
  editDrawerOpen.value = false;
  accountModalOpen.value = false;
  feedbackModalOpen.value = false;
  loadData();
}

function getFilterLabelWidth(filter: ApprovalFilter) {
  if (filter.label.length >= 6) {
    return 104;
  }
  if (filter.label.length >= 4) {
    return 88;
  }
  return 72;
}

function getFilterControlWidth(filter: ApprovalFilter) {
  switch (filter.type) {
    case 'input': {
      return isAccountFilter(filter) ? 240 : 200;
    }
    case 'dateRange': {
      return 360;
    }
    case 'member': {
      return 220;
    }
    case 'sysOrigin': {
      return 160;
    }
    default: {
      return 200;
    }
  }
}

function isAccountFilter(filter: ApprovalFilter) {
  const source = `${filter.field || ''} ${filter.label} ${filter.placeholder}`.toLowerCase();
  return /(userid|ownuserid|反馈用户id|归属人id|发送用户id|接收用户id|被拉黑用户id|操作用户id)/.test(
    source,
  );
}
</script>

<template>
  <Page :title="pageTitle">
    <div v-if="isFamilyPage" class="family-tabs">
      <Space wrap>
        <Button
          v-for="(tab, key) in familyTabs"
          :key="key"
          :type="activeFamilyTab === key ? 'primary' : 'default'"
          @click="activeFamilyTab = key"
        >
          {{ tab.label }}
        </Button>
      </Space>
    </div>

    <Card :bordered="false">
      <InlineFilterToolbar>
        <template v-for="filter in currentPage?.filters || []" :key="`${filter.type}-${filter.field || filter.label}`">
          <InlineFilterField
            :control-width="getFilterControlWidth(filter)"
            :label="filter.label"
            :label-width="getFilterLabelWidth(filter)"
          >
            <SysOriginSelect
              v-if="filter.type === 'sysOrigin'"
              v-model:value="query[filter.field || 'sysOrigin']"
              :options="sysOriginOptions"
              :placeholder="filter.placeholder"
              @change="handleSearch"
            />

            <DateRangePicker
              v-else-if="filter.type === 'dateRange'"
              v-model:value="dateRange"
              show-time
              value-format="x"
              @change="handleDateChange"
            />

            <Select
              v-else-if="filter.type === 'member'"
              v-model:value="query[filter.field || 'updateUserId']"
              allow-clear
              :loading="memberLoading"
              :options="memberFilterOptions"
              option-filter-prop="label"
              :placeholder="filter.placeholder"
              show-search
              @change="handleSearch"
            />

            <Select
              v-else-if="filter.type === 'select'"
              v-model:value="query[filter.field || '']"
              :allow-clear="filter.clearable"
              :options="filter.options || []"
              option-filter-prop="label"
              :placeholder="filter.placeholder"
              @change="handleSearch"
            />

            <AccountInput
              v-else-if="isAccountFilter(filter)"
              v-model:value="query[filter.field || '']"
              :sys-origin="query.sysOrigin || ''"
              :placeholder="filter.placeholder"
            />

            <Input
              v-else
              v-model:value="query[filter.field || '']"
              :placeholder="filter.placeholder"
              @press-enter="handleSearch"
            />
          </InlineFilterField>
        </template>

        <Button type="primary" @click="handleSearch">
          搜索
        </Button>
      </InlineFilterToolbar>

      <div v-if="selectionEnabled && isGalleryPage" class="selection-bar">
        <Checkbox
          :checked="allChecked"
          :indeterminate="indeterminate"
          @change="(event) => handleToggleAll(!!event.target.checked)"
        >
          全选
        </Checkbox>
      </div>

      <Spin :spinning="loading">
        <template v-if="isGalleryPage">
          <Row v-if="list.length > 0" :gutter="[16, 16]">
            <Col
              v-for="(record, index) in list"
              :key="getRowKey(record, index)"
              :lg="8"
              :sm="12"
              :xl="6"
              :xs="24"
            >
              <Card :bordered="false" class="approval-card">
                <template v-if="getGalleryCard(record)">
                  <div v-if="getGalleryCard(record)?.leadText" class="card-lead">
                    {{ getGalleryCard(record)?.leadText }}
                  </div>

                  <div
                    v-if="(getGalleryCard(record)?.galleryImages || []).length > 0"
                    class="card-gallery"
                  >
                    <div
                      v-for="item in getGalleryCard(record)?.galleryImages || []"
                      :key="item"
                      class="card-gallery-item"
                    >
                      <Image :src="item" class="gallery-image" />
                    </div>
                    <div v-if="getGalleryCard(record)?.overlay" class="gallery-overlay">
                      {{ getGalleryCard(record)?.overlay }}
                    </div>
                  </div>

                  <div
                    v-if="(getGalleryCard(record)?.details || []).length > 0"
                    class="card-details"
                  >
                    <Tag
                      v-for="detail in getGalleryCard(record)?.details || []"
                      :key="detail.label"
                    >
                      {{ detail.label }}：{{ detail.value }}
                    </Tag>
                  </div>

                  <div class="card-body">
                    <Checkbox
                      v-if="selectionEnabled"
                      :checked="selectedKeys.includes(String(getRowKey(record, index)))"
                      @change="() => toggleRecord(record, index)"
                    >
                      选中
                    </Checkbox>

                    <div class="card-title">
                      <Button
                        v-if="getGalleryCard(record)?.titleUserId"
                        type="link"
                        @click="
                          openRowAction({
                            label: '用户详情',
                            type: 'details',
                            value: getGalleryCard(record)?.titleUserId,
                          })
                        "
                      >
                        {{ getGalleryCard(record)?.title }}
                      </Button>
                      <span v-else>{{ getGalleryCard(record)?.title }}</span>
                    </div>

                    <div
                      v-for="line in getGalleryCard(record)?.lines || []"
                      :key="line"
                      class="card-line"
                    >
                      {{ line }}
                    </div>

                    <Tag v-if="getGalleryCard(record)?.extraTag" color="error">
                      {{ getGalleryCard(record)?.extraTag }}
                    </Tag>

                    <Space
                      v-if="(getGalleryCard(record)?.actions || []).length > 0"
                      wrap
                      class="card-actions"
                    >
                      <Button
                        v-for="action in getGalleryCard(record)?.actions || []"
                        :key="`${action.type}-${action.value}`"
                        size="small"
                        type="link"
                        @click="openRowAction(action)"
                      >
                        {{ action.label }}
                      </Button>
                    </Space>
                  </div>
                </template>
              </Card>
            </Col>
          </Row>
          <Empty v-else description="暂无数据" />
        </template>

        <template v-else-if="isTablePage">
          <Table
            :columns="tableColumns"
            :data-source="list"
            :pagination="false"
            :row-key="getRowKey"
            :row-selection="getTableRowSelection()"
            bordered
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <Space wrap>
                  <Button
                    v-for="action in getRowActions(record)"
                    :key="`${action.type}-${action.value}`"
                    size="small"
                    type="link"
                    @click="openRowAction(action, record)"
                  >
                    {{ action.label }}
                  </Button>
                </Space>
              </template>

              <template v-else>
                <div
                  v-for="(cell, idx) in getTableCells(String(column.key), record)"
                  :key="idx"
                  class="table-cell"
                >
                  <template v-if="cell.type === 'link' || cell.type === 'user-profile'">
                    <Button
                      v-if="cell.userId"
                      type="link"
                      @click="openRowAction({ label: '用户详情', type: 'details', value: cell.userId })"
                    >
                      {{ renderCellText(cell) }}
                    </Button>
                    <span v-else>{{ renderCellText(cell) }}</span>
                  </template>

                  <template v-else-if="cell.type === 'tag'">
                    <Tag :color="cell.color">
                      {{ renderCellText(cell) }}
                    </Tag>
                  </template>

                  <template v-else-if="cell.type === 'origin'">
                    <Tag>{{ renderCellText(cell) }}</Tag>
                  </template>

                  <template v-else-if="cell.type === 'images'">
                    <div class="table-image-list">
                      <Image
                        v-for="item in cell.images || []"
                        :key="item"
                        :src="item"
                        class="table-image"
                      />
                    </div>
                    <div v-if="cell.text">{{ cell.text }}</div>
                  </template>

                  <template v-else>
                    {{ renderCellText(cell) }}
                  </template>
                </div>
              </template>
            </template>

            <template #expandedRowRender="{ record }">
              <div v-if="getExpandedSections(record).length" class="expanded-content">
                <div
                  v-for="section in getExpandedSections(record)"
                  :key="section.label"
                  class="expanded-section"
                >
                  <div class="expanded-label">{{ section.label }}</div>
                  <div v-if="section.type === 'images'" class="expanded-media">
                    <Image
                      v-for="item in section.value as string[]"
                      :key="item"
                      :src="item"
                      class="expanded-image"
                    />
                    <span v-if="!(section.value as string[]).length">-</span>
                  </div>
                  <div v-else-if="section.type === 'videos'" class="expanded-media">
                    <video
                      v-for="item in section.value as string[]"
                      :key="item"
                      class="expanded-video"
                      controls
                      :src="item"
                    />
                    <span v-if="!(section.value as string[]).length">-</span>
                  </div>
                  <div v-else>
                    {{ section.value }}
                  </div>
                </div>
              </div>
            </template>
          </Table>
        </template>

        <template v-else-if="isHistoryPage">
          <div v-if="list.length" class="history-list">
            <Card
              v-for="(record, index) in list"
              :key="getRowKey(record, index)"
              :bordered="false"
              class="history-card"
            >
              <template v-if="getTimelineItem(record)">
                <div class="history-header">
                  <div>
                    <div class="history-title">
                      {{ getTimelineItem(record)?.title }}
                    </div>
                    <div class="history-time">
                      {{ getTimelineItem(record)?.time }}
                    </div>
                  </div>
                  <Tag v-if="getTimelineItem(record)?.tag">
                    {{ getTimelineItem(record)?.tag }}
                  </Tag>
                </div>

                <div
                  v-if="getTimelineItem(record)?.contentType === 'images'"
                  class="expanded-media"
                >
                  <Image
                    v-for="media in (getTimelineItem(record)?.content as string[])"
                    :key="media"
                    :src="media"
                    class="expanded-image"
                  />
                </div>
                <div
                  v-else-if="getTimelineItem(record)?.contentType === 'videos'"
                  class="expanded-media"
                >
                  <video
                    v-for="media in (getTimelineItem(record)?.content as string[])"
                    :key="media"
                    class="expanded-video"
                    controls
                    :src="media"
                  />
                </div>
                <div v-else class="history-content">
                  {{ getTimelineItem(record)?.content }}
                </div>

                <div
                  v-if="(getTimelineItem(record)?.extras || []).length > 0"
                  class="history-extras"
                >
                  <div
                    v-for="extra in getTimelineItem(record)?.extras || []"
                    :key="extra"
                  >
                    {{ extra }}
                  </div>
                </div>
              </template>
            </Card>
          </div>
          <Empty v-else description="暂无数据" />
        </template>
      </Spin>

      <div v-if="bulkActions.length && selectionEnabled" class="bulk-bar">
        <div class="bulk-count">
          已勾选了: <span>{{ selectedRecords.length }}</span>
        </div>
        <Space wrap>
          <Button
            v-for="action in bulkActions"
            :key="action.label"
            :danger="action.type === 'danger'"
            :type="action.type === 'primary' ? 'primary' : 'default'"
            @click="handleBulkAction(action)"
          >
            {{ action.label }}
          </Button>
        </Space>
      </div>

      <div class="pagination-wrap">
        <Pagination
          v-if="total > 0"
          :current="Number(query.cursor || 1)"
          :page-size="Number(query.limit || 20)"
          :show-size-changer="true"
          :total="total"
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <EditUserDrawer
      :open="editDrawerOpen"
      :user-id="editUserId"
      @close="editDrawerOpen = false"
      @success="closeAllModalsAndReload"
    />
    <AccountHandleModal
      :open="accountModalOpen"
      :user-id="accountUserId"
      @close="accountModalOpen = false"
      @success="closeAllModalsAndReload"
    />
    <FeedbackProcessModal
      :open="feedbackModalOpen"
      :record="feedbackRecord"
      @close="feedbackModalOpen = false"
      @success="closeAllModalsAndReload"
    />
  </Page>
</template>

<style scoped>
.family-tabs {
  margin-bottom: 16px;
}

.selection-bar {
  margin-bottom: 16px;
}

.approval-card {
  height: 100%;
}

.card-lead {
  color: rgb(71 85 105);
  line-height: 1.7;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.card-gallery {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  position: relative;
}

.card-gallery-item {
  overflow: hidden;
}

.gallery-image {
  border-radius: 12px;
  height: 240px;
  object-fit: cover;
  width: 100%;
}

.gallery-overlay {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 8px;
  bottom: 12px;
  color: #fff;
  left: 12px;
  padding: 6px 10px;
  position: absolute;
  right: 12px;
}

.card-details {
  margin-bottom: 12px;
}

.card-body {
  display: grid;
  gap: 8px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
}

.card-line {
  color: rgb(71 85 105);
}

.card-actions {
  margin-top: 4px;
}

.table-cell + .table-cell {
  margin-top: 6px;
}

.table-image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.table-image {
  border-radius: 8px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.expanded-content {
  display: grid;
  gap: 12px;
}

.expanded-section {
  display: grid;
  gap: 6px;
}

.expanded-label {
  color: rgb(100 116 139);
  font-size: 12px;
}

.expanded-media {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.expanded-image {
  border-radius: 10px;
  height: 88px;
  object-fit: cover;
  width: 88px;
}

.expanded-video {
  border-radius: 10px;
  height: 150px;
  width: 100px;
}

.history-list {
  display: grid;
  gap: 16px;
}

.history-card {
  border-left: 4px solid rgb(22 119 255);
}

.history-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
}

.history-time {
  color: rgb(100 116 139);
  margin-top: 4px;
}

.history-content {
  line-height: 1.75;
}

.history-extras {
  color: rgb(71 85 105);
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.bulk-bar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-top: 20px;
}

.bulk-count {
  color: rgb(100 116 139);
}

.bulk-count span {
  color: rgb(22 119 255);
  font-weight: 600;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .filter-item,
  .filter-date {
    min-width: 100%;
  }

  .gallery-image {
    height: 200px;
  }

  .bulk-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
