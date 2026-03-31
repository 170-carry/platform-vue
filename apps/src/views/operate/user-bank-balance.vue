<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  confirmImport,
  deductMoney,
  exprotBank,
  pageBank,
  sendMoney,
  transferMoney,
  } from '#/api/legacy/operate';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Space,
  Table,
  message,
} from 'antdv-next';

import UserBankCreateModal from './components/user-bank-create-modal.vue';
import UserBankRunningWaterModal from './components/user-bank-running-water-modal.vue';
import UserProfileLink from './components/user-profile-link.vue';

defineOptions({ name: 'OperateUserBankBalance' });

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const loadMoreLoading = ref(false);
const exportLoading = ref(false);
const notData = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const createOpen = ref(false);
const runningWaterOpen = ref(false);
const importOpen = ref(false);
const importLoading = ref(false);
const actionModalOpen = ref(false);
const transferOpen = ref(false);
const actionType = ref<'deduct' | 'send'>('send');
const activeRow = ref<Record<string, any> | null>(null);
const importInput = ref<HTMLInputElement | null>(null);

const query = reactive({
  lastId: '',
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const actionForm = reactive({
  quantity: '',
  remark: '',
  sysOrigin: '',
  userId: '',
});

const transferForm = reactive({
  acceptUserId: '',
  quantity: '',
  remark: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'index', key: 'index', title: 'No', width: 70 },
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 90 },
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 300 },
  { dataIndex: 'earnPoints', key: 'earnPoints', title: '获得总额', width: 120 },
  { dataIndex: 'consumptionPoints', key: 'consumptionPoints', title: '消费总额', width: 120 },
  { dataIndex: 'balance', key: 'balance', title: '余额', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 260, fixed: 'right' as const },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
    notData.value = false;
  }
  if (reset) {
    loading.value = true;
  } else {
    loadMoreLoading.value = true;
  }
  try {
    const result = await pageBank({ ...query });
    const current = result || [];
    notData.value = current.length <= 0;
    if (!notData.value) {
      list.value = [...list.value, ...current];
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function openAction(record: Record<string, any>, type: 'deduct' | 'send') {
  activeRow.value = record;
  actionType.value = type;
  actionForm.userId = String(record.id || '');
  actionForm.sysOrigin = String(record.sysOrigin || '');
  actionForm.quantity = '';
  actionForm.remark = '';
  actionModalOpen.value = true;
}

function openTransfer(record: Record<string, any>) {
  activeRow.value = record;
  transferForm.userId = String(record.id || '');
  transferForm.sysOrigin = String(record.sysOrigin || '');
  transferForm.acceptUserId = '';
  transferForm.quantity = '';
  transferForm.remark = '';
  transferOpen.value = true;
}

function openRunningWater(record: Record<string, any>) {
  activeRow.value = record;
  runningWaterOpen.value = true;
}

async function submitAction() {
  if (!actionForm.userId || !String(actionForm.quantity).trim()) {
    message.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    if (actionType.value === 'send') {
      await sendMoney({ ...actionForm });
    } else {
      await deductMoney({ ...actionForm });
    }
    message.success('操作成功');
    actionModalOpen.value = false;
    await loadData(true);
  } finally {
    loading.value = false;
  }
}

async function submitTransfer() {
  if (
    !transferForm.userId ||
    !transferForm.acceptUserId ||
    !String(transferForm.quantity).trim()
  ) {
    message.warning('请填写完整信息');
    return;
  }
  loading.value = true;
  try {
    await transferMoney({ ...transferForm });
    message.success('操作成功');
    transferOpen.value = false;
    await loadData(true);
  } finally {
    loading.value = false;
  }
}

async function handleExport() {
  if (exportLoading.value) {
    return;
  }
  exportLoading.value = true;
  try {
    await exprotBank({ sysOrigin: query.sysOrigin });
  } finally {
    exportLoading.value = false;
  }
}

function openImport() {
  importOpen.value = true;
}

function chooseImportFile() {
  importInput.value?.click();
}

async function handleImportChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  const form = new FormData();
  form.append('file', file);
  importLoading.value = true;
  try {
    await confirmImport(form);
    message.success('导入成功');
    importOpen.value = false;
    await loadData(true);
  } finally {
    importLoading.value = false;
    target.value = '';
  }
}

watch(
  () => query.sysOrigin,
  (value) => {
    if (value) {
      void loadData(true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Page title="用户银行账户">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <SysOriginSelect v-model:value="query.sysOrigin" style="width: 140px"
            :options="sysOriginOptions"
          ></SysOriginSelect>
          <AccountInput
            v-model:value="query.userId"
            :sys-origin="query.sysOrigin"
            placeholder="用户ID"
            style="width: 260px"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="createOpen = true">添加</Button>
          <Button :loading="exportLoading" @click="handleExport">导出</Button>
          <Button @click="openImport">导入</Button>
        </Space>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'userProfile'">
            <UserProfileLink :profile="record.userProfile" />
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small" wrap>
              <Button size="small" type="link" @click="openAction(record, 'send')">
                发送
              </Button>
              <Button size="small" type="link" @click="openAction(record, 'deduct')">
                扣除
              </Button>
              <Button size="small" type="link" @click="openTransfer(record)">
                转账
              </Button>
              <Button size="small" type="link" @click="openRunningWater(record)">
                流水
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <div v-if="list.length > 0" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadData()"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <UserBankCreateModal
      :open="createOpen"
      :sys-origin="query.sysOrigin"
      @close="createOpen = false"
      @success="
        () => {
          createOpen = false;
          void loadData(true);
        }
      "
    />

    <UserBankRunningWaterModal
      :open="runningWaterOpen"
      :row="activeRow || {}"
      @close="runningWaterOpen = false"
    />

    <Modal
      :confirm-loading="loading"
      :open="actionModalOpen"
      :title="actionType === 'send' ? '发送' : '扣除'"
      @cancel="actionModalOpen = false"
    >
      <div class="modal-grid">
        <div class="field">
          <div class="label">金额</div>
          <Input
            v-model:value="actionForm.quantity"
            :placeholder="`请输入${actionType === 'send' ? '发送' : '扣除'}金额`"
          />
        </div>
        <div class="field">
          <div class="label">对内备注</div>
          <Input
            v-model:value="actionForm.remark"
            placeholder="请输入对内备注"
          />
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <Button @click="actionModalOpen = false">取消</Button>
          <Button :loading="loading" type="primary" @click="submitAction">
            提交
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      :confirm-loading="loading"
      :open="transferOpen"
      title="转账"
      @cancel="transferOpen = false"
    >
      <div class="modal-grid">
        <div class="field">
          <div class="label">收款人</div>
          <AccountInput
            v-model:value="transferForm.acceptUserId"
            :sys-origin="transferForm.sysOrigin"
            placeholder="用户账号"
          />
        </div>
        <div class="field">
          <div class="label">金额</div>
          <Input
            v-model:value="transferForm.quantity"
            placeholder="请输入转账金额"
          />
        </div>
        <div class="field">
          <div class="label">对内备注</div>
          <Input
            v-model:value="transferForm.remark"
            placeholder="请输入对内备注"
          />
        </div>
      </div>

      <template #footer>
        <div class="footer">
          <Button @click="transferOpen = false">取消</Button>
          <Button :loading="loading" type="primary" @click="submitTransfer">
            提交
          </Button>
        </div>
      </template>
    </Modal>

    <Modal
      :footer="null"
      :open="importOpen"
      title="导入数据"
      @cancel="!importLoading && (importOpen = false)"
    >
      <div class="import-box">
        <div>请选择导入文件：</div>
        <a
          href="https://dev.file.momooline.com/files/Import%20Template.xlsx"
          rel="noreferrer"
          target="_blank"
        >
          模板下载
        </a>
        <input
          ref="importInput"
          accept=".xls,.xlsx"
          class="hidden-input"
          type="file"
          @change="handleImportChange"
        >
        <Button :loading="importLoading" block @click="chooseImportFile">
          选择文件并导入
        </Button>
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.load-more {
  padding: 20px 0 0;
  text-align: center;
}

.modal-grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  color: #334155;
  font-weight: 600;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.import-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hidden-input {
  display: none;
}
</style>
