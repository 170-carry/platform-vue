<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import type { LegacyEnumConfigItem } from '#/api/legacy/app-system';
import {
  addConfigInfo,
  delConfig,
  getConfigInfo,
  updateConfigInfo,
} from '#/api/legacy/app-system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import {
  ENUM_CONFIG_DATA_TYPE_EXPRESSION,
  ENUM_CONFIG_DATA_TYPES,
  ENUM_CONFIG_GROUP_NAMES,
  ENUM_CONFIG_OPERATES,
  buildEnumGroupLabelMap,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import {
  Button,
  Card,
  Cascader,
  Input,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  Tooltip,
  message,
} from 'antdv-next';

defineOptions({ name: 'AppSystemEnumConfigManager' });

const accessStore = useAccessStore();

const loading = ref(false);
const submitLoading = ref(false);
const total = ref(0);
const list = ref<LegacyEnumConfigItem[]>([]);
const formOpen = ref(false);
const formTitle = ref('添加');

const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);
const enumGroupLabelMap = buildEnumGroupLabelMap();
const cascaderFieldNames = {
  children: 'children',
  label: 'name',
  value: 'value',
};

const query = reactive<Record<string, any>>({
  cursor: 1,
  description: '',
  groupList: [],
  inoperable: undefined,
  limit: 20,
  name: '',
  returnApp: undefined,
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
  val: '',
});

const form = reactive<Record<string, any>>({
  dataType: 'int',
  description: '',
  groupList: [],
  groupName: '',
  id: '',
  inoperable: false,
  name: '',
  returnApp: true,
  sort: '0',
  sysOrigin: '',
  title: '',
  val: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'title', key: 'title', title: '标题', width: 160 },
  { dataIndex: 'val', key: 'val', title: '值', width: 180 },
  { dataIndex: 'groupName', key: 'groupName', title: '分组', width: 180 },
  { dataIndex: 'dataType', key: 'dataType', title: '数据类型', width: 110 },
  { dataIndex: 'sort', key: 'sort', title: '序号', width: 80 },
  { dataIndex: 'inoperable', key: 'inoperable', title: '状态', width: 100 },
  { dataIndex: 'returnApp', key: 'returnApp', title: '返回APP', width: 100 },
  { dataIndex: 'description', key: 'description', title: '描述', width: 120 },
  { dataIndex: 'name', key: 'name', title: '键', width: 140 },
  { dataIndex: 'createTime', key: 'createTime', title: '操作时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 120 },
];

function createFormState() {
  return {
    dataType: 'int',
    description: '',
    groupList: [],
    groupName: '',
    id: '',
    inoperable: false,
    name: '',
    returnApp: true,
    sort: '0',
    sysOrigin: '',
    title: '',
    val: '',
  };
}

function resetForm() {
  Object.assign(form, createFormState());
}

function normalizeRecords(records: LegacyEnumConfigItem[] = []) {
  return records.map((item) => ({
    ...item,
    groupList: item.groupName ? item.groupName.split(',') : [],
  }));
}

function getGroupNames(groupList?: string[]) {
  return groupList?.map((item) => enumGroupLabelMap[item] || item).join('/') || '-';
}

function getStatusText(record: LegacyEnumConfigItem) {
  return record.inoperable ? '不可操作' : '可操作';
}

function getReturnAppText(record: LegacyEnumConfigItem) {
  return record.returnApp ? '是' : '否';
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
    const result = await getConfigInfo({
      ...query,
      groupName: query.groupList.join(','),
    });
    list.value = normalizeRecords(result.records || []);
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  loadData();
}

function handleCreate() {
  resetForm();
  formTitle.value = '添加';
  formOpen.value = true;
}

function handleUpdate(record: LegacyEnumConfigItem) {
  resetForm();
  form.id = record.id ?? '';
  form.name = record.name ?? '';
  form.val = record.val ?? '';
  form.groupName = record.groupName ?? '';
  form.groupList = [...(record.groupList || [])];
  form.title = record.title ?? '';
  form.description = record.description ?? '';
  form.dataType = record.dataType ?? 'int';
  form.sort = record.sort ?? '0';
  form.inoperable = record.inoperable ?? false;
  form.returnApp = record.returnApp ?? true;
  form.sysOrigin = record.sysOrigin ?? '';
  formTitle.value = '编辑';
  formOpen.value = true;
}

function handleDataTypeChange() {
  form.val = '';
}

function validateForm() {
  if (!form.id && !String(form.name || '').trim()) {
    message.warning('请输入键');
    return false;
  }
  if (!form.dataType) {
    message.warning('请选择数据类型');
    return false;
  }
  if (!String(form.val || '').trim()) {
    message.warning('请输入值');
    return false;
  }
  const expression = ENUM_CONFIG_DATA_TYPE_EXPRESSION[form.dataType];
  if (expression?.rex && !expression.rex.test(String(form.val || '').trim())) {
    message.warning(expression.msg);
    return false;
  }
  if (!String(form.title || '').trim()) {
    message.warning('请输入标题');
    return false;
  }
  if (!Array.isArray(form.groupList) || form.groupList.length === 0) {
    message.warning('请选择分组');
    return false;
  }
  if (!String(form.description || '').trim()) {
    message.warning('请输入描述');
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (!validateForm()) {
    return;
  }
  submitLoading.value = true;
  try {
    const payload = {
      dataType: form.dataType,
      description: String(form.description || '').trim(),
      groupList: [...form.groupList],
      groupName: form.groupList.join(','),
      id: form.id,
      inoperable: Boolean(form.inoperable),
      name: String(form.name || '').trim(),
      returnApp: Boolean(form.returnApp),
      sort: form.sort,
      sysOrigin: query.sysOrigin,
      title: String(form.title || '').trim(),
      val: String(form.val || '').trim(),
    };
    if (!form.id) {
      await addConfigInfo(payload);
    } else {
      await updateConfigInfo(payload);
    }
    message.success('保存成功');
    formOpen.value = false;
    resetForm();
    await loadData();
  } finally {
    submitLoading.value = false;
  }
}

function handleDelete(record: LegacyEnumConfigItem) {
  Modal.confirm({
    title: '您确定要删除该参数配置吗？',
    async onOk() {
      await delConfig(record.id as number | string);
      message.success('删除成功');
      await loadData();
    },
  });
}

loadData(true);
</script>

<template>
  <Page title="参数配置管理">
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

        <InlineFilterField label="分组">
          <Cascader
            v-model:value="query.groupList"
            allow-clear
            :field-names="cascaderFieldNames"
            :options="ENUM_CONFIG_GROUP_NAMES"
            placeholder="分组"
            style="width: 240px"
            @change="loadData(true)"
          />
        </InlineFilterField>

        <InlineFilterField label="状态">
          <Select
            v-model:value="query.inoperable"
            allow-clear
            option-label-prop="label"
            placeholder="状态"
            style="width: 140px"
            @change="loadData(true)"
          
            :options="ENUM_CONFIG_OPERATES.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
          />
        </InlineFilterField>

        <InlineFilterField label="返回APP" :label-width="84">
          <Select
            v-model:value="query.returnApp"
            allow-clear
            option-label-prop="label"
            placeholder="返回APP"
            style="width: 140px"
            @change="loadData(true)"
          
            :options="[{ label: '是', value: true as any }, { label: '否', value: false as any }]"
          />
        </InlineFilterField>

        <InlineFilterField label="键">
          <Input
            v-model:value="query.name"
            allow-clear
            placeholder="键"
            style="width: 200px"
          />
        </InlineFilterField>
        <InlineFilterField label="值">
          <Input
            v-model:value="query.val"
            allow-clear
            placeholder="值"
            style="width: 200px"
          />
        </InlineFilterField>
        <InlineFilterField label="描述">
          <Input
            v-model:value="query.description"
            allow-clear
            placeholder="描述"
            style="width: 200px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button @click="handleCreate">新增</Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1580 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'groupName'">
            {{ getGroupNames(record.groupList) }}
          </template>
          <template v-else-if="column.key === 'inoperable'">
            <Tag :color="record.inoperable ? 'error' : 'success'">
              {{ getStatusText(record) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'returnApp'">
            {{ getReturnAppText(record) }}
          </template>
          <template v-else-if="column.key === 'description'">
            <Tooltip>
              <template #title>
                <div class="tooltip-pre">{{ record.description || '-' }}</div>
              </template>
              <span class="link-text">查看</span>
            </Tooltip>
          </template>
          <template v-else-if="column.key === 'name'">
            <Space size="small">
              <span>{{ record.name || '-' }}</span>
              <Button size="small" type="link" @click="copyText(record.name)">
                复制
              </Button>
            </Space>
          </template>
          <template v-else-if="column.key === 'createTime'">
            <div>{{ formatDate(record.createTime) }}</div>
            <div class="sub-time">{{ formatDate(record.updateTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="handleUpdate(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleDelete(record)">
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
    </Card>

    <Modal
      :confirm-loading="submitLoading"
      :open="formOpen"
      destroy-on-close
      ok-text="保存"
      :title="formTitle"
      width="620"
      @cancel="formOpen = false"
      @ok="handleSubmit"
    >
      <div class="form-grid">
        <div v-if="!form.id" class="form-item">
          <label class="form-label">键</label>
          <Input v-model:value="form.name" placeholder="请输入键" />
        </div>

        <div class="form-item">
          <label class="form-label">数据类型</label>
          <Select option-label-prop="label"
            v-model:value="form.dataType"
            placeholder="请选择数据类型"
            @change="handleDataTypeChange"
          >
            <SelectOption
              v-for="item in ENUM_CONFIG_DATA_TYPES"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">值</label>
          <Input v-model:value="form.val" placeholder="请输入值" />
        </div>

        <div class="form-item">
          <label class="form-label">标题</label>
          <Input v-model:value="form.title" placeholder="请输入标题" />
        </div>

        <div class="form-item">
          <label class="form-label">描述</label>
          <Input v-model:value="form.description" placeholder="请输入描述" />
        </div>

        <div class="form-item">
          <label class="form-label">分组</label>
          <Cascader
            v-model:value="form.groupList"
            :field-names="cascaderFieldNames"
            :options="ENUM_CONFIG_GROUP_NAMES"
            placeholder="请选择分组"
          />
        </div>

        <div class="form-item">
          <label class="form-label">操作状态</label>
          <Select option-label-prop="label" v-model:value="form.inoperable" placeholder="请选择操作状态">
            <SelectOption
              v-for="item in ENUM_CONFIG_OPERATES"
              :key="String(item.value)"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </div>

        <div class="form-item">
          <label class="form-label">返回APP</label>
          <Select option-label-prop="label" v-model:value="form.returnApp" placeholder="请选择是否返回APP">
            <SelectOption :value="true" label="是">是</SelectOption>
            <SelectOption :value="false" label="否">否</SelectOption>
          </Select>
        </div>
      </div>
    </Modal>
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

.tooltip-pre {
  max-width: 360px;
  white-space: pre-wrap;
  word-break: break-word;
}

.link-text {
  color: rgb(37 99 235);
  cursor: pointer;
}

.sub-time {
  color: #64748b;
  font-size: 12px;
}

.form-grid {
  display: grid;
  gap: 16px;
}

.form-item {
  display: grid;
  gap: 8px;
}

.form-label {
  color: #334155;
  font-size: 14px;
}
</style>
