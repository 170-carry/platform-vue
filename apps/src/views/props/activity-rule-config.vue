<script lang="ts" setup>
import {
  computed,
  reactive,
  ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  delPropsActivityRuleConfig,
  pagePropsActivityRuleConfig,
  savePropsActivityRuleConfig,
  } from '#/api/legacy/props';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Col,
  Input,
  Modal,
  Pagination,
  Row,
  Select,
  Space,
  message
} from 'antdv-next';

import RewardRow from './components/reward-row.vue';
import ActivityResourceGroupSelectDrawer from './components/activity-resource-group-select-drawer.vue';
import ActivityRuleDrawer from './components/activity-rule-drawer.vue';
import { PROP_ACTIVITY_TYPES } from './shared';

defineOptions({ name: 'PropsActivityRuleConfig' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const resourceDrawerOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);

const query = reactive({
  activityType: 'STAR',
  cursor: 1,
  id: '',
  limit: 20,
  resourceGroupId: '',
  ruleDescription: '',
  sysOrigin: sysOriginOptions.value[0]?.value ?? 'LIKEI',
});

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePropsActivityRuleConfig({ ...query });
    list.value = [...(result.records || [])].sort(
      (left, right) => Number(left.sort || 0) - Number(right.sort || 0),
    );
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function openCreate() {
  activeRow.value = null;
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = { ...record };
  formOpen.value = true;
}

function openResourceDrawer(record: Record<string, any>) {
  activeRow.value = { ...record };
  resourceDrawerOpen.value = true;
}

function formatJson(value: string) {
  if (!value) {
    return '{}';
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

async function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    async onOk() {
      await delPropsActivityRuleConfig(record.id);
      message.success('删除成功');
      await loadData();
    },
    title: '确认删除吗？',
  });
}

async function handleResourceSelect(row: Record<string, any>) {
  if (!activeRow.value) {
    return;
  }
  await savePropsActivityRuleConfig({
    ...activeRow.value,
    resourceGroupId: row.id,
  });
  message.success('资源组已关联');
  resourceDrawerOpen.value = false;
  await loadData();
}

loadData(true);
</script>

<template>
  <Page title="活动道具规则配置">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="系统">
          <SysOriginSelect
            v-model:value="query.sysOrigin"
            style="width: 140px"
            @change="loadData(true)"

            :options="sysOriginOptions"
          ></SysOriginSelect>
        </InlineFilterField>
        <InlineFilterField label="活动类型">
          <Select option-label-prop="label"
            v-model:value="query.activityType"
            allow-clear
            style="width: 180px"
            @change="loadData(true)"
          
            :options="PROP_ACTIVITY_TYPES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="ID">
          <Input v-model:value="query.id" allow-clear style="width: 160px" />
        </InlineFilterField>
        <InlineFilterField label="规则描述">
          <Input
            v-model:value="query.ruleDescription"
            allow-clear
            style="width: 200px"
          />
        </InlineFilterField>
        <InlineFilterField label="资源组ID" :label-width="88">
          <Input
            v-model:value="query.resourceGroupId"
            allow-clear
            style="width: 180px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button @click="openCreate">新增</Button>
      </InlineFilterToolbar>

      <Row :gutter="[16, 16]">
        <Col
          v-for="item in list"
          :key="item.id"
          :lg="8"
          :md="12"
          :sm="24"
          :xs="24"
        >
          <Card :title="item.activityTypeName || item.activityType">
            <template #extra>
              <Space size="small">
                <Button size="small" type="link" @click="openEdit(item)">
                  编辑规则
                </Button>
                <Button
                  size="small"
                  type="link"
                  @click="openResourceDrawer(item)"
                >
                  关联资源
                </Button>
                <Button danger size="small" type="link" @click="handleDelete(item)">
                  删除
                </Button>
              </Space>
            </template>

            <div class="rule-meta">
              <div>ID：{{ item.id }}</div>
              <div>排序：{{ item.sort }}</div>
              <div class="rule-meta__full">描述：{{ item.ruleDescription || '-' }}</div>
              <div class="rule-meta__full">资源组：{{ item.resourceGroupId || '-' }}</div>
            </div>

            <div class="rule-section">
              <div class="rule-section__title">规则</div>
              <pre class="rule-json">{{ formatJson(item.jsonData) }}</pre>
            </div>

            <div class="rule-section">
              <div class="rule-section__title">
                资源信息（{{ item.resourceGroupId || '-' }}）
              </div>
              <RewardRow :list="item.activityRewards" />
            </div>
          </Card>
        </Col>
      </Row>

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

    <ActivityRuleDrawer
      :open="formOpen"
      :record="activeRow"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData()"
    />

    <ActivityResourceGroupSelectDrawer
      :open="resourceDrawerOpen"
      :sys-origin="activeRow?.sysOrigin || query.sysOrigin"
      @close="resourceDrawerOpen = false"
      @select="handleResourceSelect"
    />
  </Page>
</template>

<style scoped>
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.rule-json {
  background: rgb(248 250 252);
  border: 1px solid rgb(226 232 240);
  border-radius: 12px;
  font-size: 12px;
  margin: 0;
  max-height: 180px;
  overflow: auto;
  padding: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.rule-meta {
  color: rgb(71 85 105);
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.rule-meta__full {
  word-break: break-all;
}

.rule-section {
  margin-top: 12px;
}

.rule-section__title {
  color: rgb(15 23 42);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.toolbar {
  margin-bottom: 16px;
}
</style>
