<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  addBadge,
  badgeTable,
  deleteBadge,
  giveBadge,
  giveBadgeTable,
  listUserNotAchieveBadge,
  retrieveBadge,
  updateBadge,
} from '#/api/legacy/badge';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Image,
  Input,
  Modal,
  Pagination,
  Select,
  Space,
  Table,
  Tabs,
  TabPane,
  message,
} from 'antdv-next';

import { BADGE_GROUP_OPTIONS } from './constants';
import BadgeSourceEditModal from './components/badge-source-edit-modal.vue';

defineOptions({ name: 'OperateBadgeConfig' });

function createBadgeForm() {
  return {
    badgeKey: '',
    badgeLevel: '',
    badgeName: '',
    id: '',
    milestone: '',
    type: '',
  };
}

const badgeTypeOptions = BADGE_GROUP_OPTIONS.flatMap((group) =>
  group.options.map((item) => ({
    label: `${group.label} - ${item.label}`,
    value: item.value,
  })),
);

const activeTab = ref('rule');

const ruleLoading = ref(false);
const ruleList = ref<Array<Record<string, any>>>([]);
const ruleTotal = ref(0);
const ruleQuery = reactive({
  badgeKey: '',
  badgeName: '',
  cursor: 1,
  id: '',
  limit: 20,
  type: '',
});

const badgeFormOpen = ref(false);
const badgeFormSaving = ref(false);
const badgeForm = reactive(createBadgeForm());
const sourceEditOpen = ref(false);
const activeRuleRow = ref<Record<string, any> | null>(null);

const giveLoading = ref(false);
const giveList = ref<Array<Record<string, any>>>([]);
const giveTotal = ref(0);
const giveQuery = reactive({
  cursor: 1,
  limit: 20,
  userId: '',
});

const revokeLoading = ref(false);
const revokeList = ref<Array<Record<string, any>>>([]);
const revokeQuery = reactive({
  userId: '',
});

const ruleColumns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'badgeName', key: 'badgeName', title: '徽章名称', width: 160 },
  { dataIndex: 'typeName', key: 'typeName', title: '类型', width: 160 },
  { dataIndex: 'badgeKey', key: 'badgeKey', title: '徽章Key', width: 160 },
  { dataIndex: 'badgeLevel', key: 'badgeLevel', title: '等级', width: 100 },
  { dataIndex: 'milestone', key: 'milestone', title: '里程碑', width: 100 },
  { dataIndex: 'badgePictures', key: 'badgePictures', title: '资源信息', width: 260 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

const giveColumns = [
  { dataIndex: 'id', key: 'id', title: '徽章规则ID', width: 120 },
  { dataIndex: 'selectUrl', key: 'selectUrl', title: '徽章图标', width: 100 },
  { dataIndex: 'badgeName', key: 'badgeName', title: '徽章名称', width: 160 },
  { dataIndex: 'typeName', key: 'typeName', title: '徽章类型', width: 160 },
  { dataIndex: 'badgeKey', key: 'badgeKey', title: '徽章Key', width: 160 },
  { dataIndex: 'badgeLevel', key: 'badgeLevel', title: '等级', width: 100 },
  { dataIndex: 'milestone', key: 'milestone', title: '可领取里程碑', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

const revokeColumns = [
  { dataIndex: 'badgeConfigId', key: 'badgeConfigId', title: '徽章ID', width: 120 },
  { dataIndex: 'selectUrl', key: 'selectUrl', title: '徽章图标', width: 100 },
  { dataIndex: 'badgeName', key: 'badgeName', title: '徽章名称', width: 160 },
  { dataIndex: 'typeName', key: 'typeName', title: '徽章类型', width: 160 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

async function loadRules(reset = false) {
  if (reset) {
    ruleQuery.cursor = 1;
  }
  ruleLoading.value = true;
  try {
    const result = await badgeTable({ ...ruleQuery });
    ruleList.value = result.records || [];
    ruleTotal.value = result.total || 0;
  } finally {
    ruleLoading.value = false;
  }
}

async function loadGive(reset = false) {
  if (!giveQuery.userId) {
    message.warning('请输入用户ID');
    return;
  }
  if (reset) {
    giveQuery.cursor = 1;
  }
  giveLoading.value = true;
  try {
    const result = await giveBadgeTable({ ...giveQuery });
    giveList.value = result.records || [];
    giveTotal.value = result.total || 0;
  } finally {
    giveLoading.value = false;
  }
}

async function loadRevoke() {
  if (!revokeQuery.userId) {
    message.warning('请输入用户ID');
    return;
  }
  revokeLoading.value = true;
  try {
    revokeList.value = (await listUserNotAchieveBadge(revokeQuery.userId)) || [];
  } finally {
    revokeLoading.value = false;
  }
}

function handleRulePageChange(page: number, pageSize: number) {
  ruleQuery.cursor = page;
  ruleQuery.limit = pageSize;
  void loadRules();
}

function handleGivePageChange(page: number, pageSize: number) {
  giveQuery.cursor = page;
  giveQuery.limit = pageSize;
  void loadGive();
}

function openBadgeCreate() {
  Object.assign(badgeForm, createBadgeForm());
  badgeFormOpen.value = true;
}

function openBadgeEdit(row: Record<string, any>) {
  Object.assign(badgeForm, {
    badgeKey: row.badgeKey || '',
    badgeLevel: row.badgeLevel || '',
    badgeName: row.badgeName || '',
    id: row.id || '',
    milestone: row.milestone || '',
    type: row.type || '',
  });
  badgeFormOpen.value = true;
}

async function handleBadgeSubmit() {
  if (!badgeForm.type) {
    message.warning('请选择类型');
    return;
  }
  if (!badgeForm.badgeName.trim()) {
    message.warning('请输入徽章名称');
    return;
  }
  if (!badgeForm.badgeKey.trim()) {
    message.warning('请输入徽章Key');
    return;
  }
  if (!badgeForm.badgeLevel) {
    message.warning('请输入等级');
    return;
  }
  if (!badgeForm.milestone) {
    message.warning('请输入里程碑');
    return;
  }
  badgeFormSaving.value = true;
  try {
    if (badgeForm.id) {
      await updateBadge({ ...badgeForm });
    } else {
      await addBadge({ ...badgeForm });
    }
    message.success('保存成功');
    badgeFormOpen.value = false;
    await loadRules(true);
  } finally {
    badgeFormSaving.value = false;
  }
}

async function handleRuleDelete(row: Record<string, any>) {
  await deleteBadge(row.id);
  message.success('删除成功');
  await loadRules(true);
}

async function handleGive(row: Record<string, any>) {
  if (!giveQuery.userId) {
    return;
  }
  await giveBadge(row.id, giveQuery.userId);
  message.success('赠送成功');
  await loadGive(false);
}

async function handleRetrieve(badgeId: number | string, userId: number | string) {
  await retrieveBadge(badgeId, userId);
  message.success('收回成功');
}

watch(
  () => activeTab.value,
  (value) => {
    if (value === 'rule' && ruleList.value.length === 0) {
      void loadRules(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="徽章配置管理">
    <Card>
      <Tabs v-model:activeKey="activeTab">
        <TabPane key="rule" tab="徽章配置" />
        <TabPane key="give" tab="赠送 or 收回" />
        <TabPane key="revoke" tab="收回" />
      </Tabs>

      <div v-if="activeTab === 'rule'">
        <Space class="toolbar" wrap>
          <Select option-label-prop="label"
            v-model:value="ruleQuery.type"
            allow-clear
            placeholder="类型"
            style="width: 220px"
            @change="loadRules(true)"
          
            :options="badgeTypeOptions.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
          <Input
            v-model:value="ruleQuery.id"
            allow-clear
            placeholder="ID"
            style="width: 180px"
          />
          <Input
            v-model:value="ruleQuery.badgeName"
            allow-clear
            placeholder="徽章名称"
            style="width: 180px"
          />
          <Input
            v-model:value="ruleQuery.badgeKey"
            allow-clear
            placeholder="徽章Key"
            style="width: 180px"
          />
          <Button :loading="ruleLoading" type="primary" @click="loadRules(true)">
            搜索
          </Button>
          <Button type="primary" @click="openBadgeCreate">
            新增
          </Button>
        </Space>

        <Table
          :columns="ruleColumns"
          :data-source="ruleList"
          :loading="ruleLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1560 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'badgePictures'">
              <div class="picture-row">
                <div
                  v-for="item in record.badgePictures || []"
                  :key="`${item.sysOrigin}-${item.selectUrl}`"
                  class="picture-item"
                >
                  <Image :src="item.selectUrl" class="badge-image" />
                  <div>{{ item.sysOrigin }}</div>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space wrap>
                <Button size="small" type="link" @click="openBadgeEdit(record)">
                  编辑规则
                </Button>
                <Button
                  size="small"
                  type="link"
                  @click="activeRuleRow = record; sourceEditOpen = true"
                >
                  编辑资源
                </Button>
                <Button danger size="small" type="link" @click="handleRuleDelete(record)">
                  删除
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="ruleQuery.cursor"
            :page-size="ruleQuery.limit"
            :total="ruleTotal"
            show-size-changer
            @change="handleRulePageChange"
            @showSizeChange="handleRulePageChange"
          />
        </div>
      </div>

      <div v-else-if="activeTab === 'give'">
        <Space class="toolbar" wrap>
          <AccountInput
            v-model:value="giveQuery.userId"
            placeholder="用户ID"
            style="width: 360px"
          />
          <Button :loading="giveLoading" type="primary" @click="loadGive(true)">
            搜索
          </Button>
        </Space>

        <Table
          :columns="giveColumns"
          :data-source="giveList"
          :loading="giveLoading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1320 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'selectUrl'">
              <Image :src="record.selectUrl" class="badge-image" />
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                size="small"
                type="link"
                @click="record.presented
                  ? handleRetrieve(record.id, giveQuery.userId)
                  : handleGive(record)"
              >
                {{ record.presented ? '收回' : '赠送' }}
              </Button>
            </template>
          </template>
        </Table>

        <div class="pager">
          <Pagination
            :current="giveQuery.cursor"
            :page-size="giveQuery.limit"
            :total="giveTotal"
            show-size-changer
            @change="handleGivePageChange"
            @showSizeChange="handleGivePageChange"
          />
        </div>
      </div>

      <div v-else>
        <Space class="toolbar" wrap>
          <AccountInput
            v-model:value="revokeQuery.userId"
            placeholder="用户ID"
            style="width: 360px"
          />
          <Button :loading="revokeLoading" type="primary" @click="loadRevoke">
            搜索
          </Button>
        </Space>

        <Table
          :columns="revokeColumns"
          :data-source="revokeList"
          :loading="revokeLoading"
          :pagination="false"
          row-key="badgeConfigId"
          :scroll="{ x: 920 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'selectUrl'">
              <Image :src="record.selectUrl" class="badge-image" />
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                size="small"
                type="link"
                @click="handleRetrieve(record.badgeConfigId, revokeQuery.userId)"
              >
                收回
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </Card>

    <Modal
      :confirm-loading="badgeFormSaving"
      :open="badgeFormOpen"
      destroy-on-close
      :title="badgeForm.id ? '编辑徽章规则' : '新增徽章规则'"
      @cancel="badgeFormOpen = false"
      @ok="handleBadgeSubmit"
    >
      <Space direction="vertical" style="width: 100%">
        <Select
          v-model:value="badgeForm.type"
          :options="badgeTypeOptions"
          option-label-prop="label"
          placeholder="类型"
        />
        <Input v-model:value="badgeForm.badgeName" placeholder="徽章名称" />
        <Input v-model:value="badgeForm.badgeKey" placeholder="徽章Key" />
        <Input v-model:value="badgeForm.badgeLevel" placeholder="等级" />
        <Input v-model:value="badgeForm.milestone" placeholder="里程碑进度" />
      </Space>
    </Modal>

    <BadgeSourceEditModal
      :open="sourceEditOpen"
      :row="activeRuleRow"
      @close="sourceEditOpen = false"
      @success="loadRules(false)"
    />
  </Page>
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

.badge-image {
  border-radius: 12px;
  height: 48px;
  object-fit: cover;
  width: 48px;
}

.picture-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.picture-item {
  align-items: center;
  display: grid;
  gap: 6px;
  justify-items: center;
}
</style>
