<script lang="ts" setup>
import {
  computed,
  reactive,
  ref,
  watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  getThisMonthRechargeByUserId,
  pageQualityUsers,
  qualityUserRemarkSave,
  } from '#/api/legacy/statistics';
import AccountInput from '#/components/account-input.vue';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Modal,
  Pagination,
  Table,
  Tag,
  TextArea,
  message,
} from 'antdv-next';

import UserProfileLink from '../components/user-profile-link.vue';
import { getRechargeTypeDes } from '../shared';
import QualityUserMonthlyDetailsModal from './quality-user-monthly-details-modal.vue';

defineOptions({ name: 'OperateQualityUsersTotalTab' });

const accessStore = useAccessStore();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const remarkOpen = ref(false);
const remarkLoading = ref(false);
const monthlyOpen = ref(false);
const monthlyUserId = ref<number | string>('');
const rechargeOpen = ref(false);
const rechargeLoading = ref(false);
const rechargeData = ref<Record<string, any>>({});

const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const query = reactive<Record<string, any>>({
  cursor: 1,
  limit: 20,
  sysOrigin: '',
  userId: '',
});

const remarkForm = reactive({
  id: '',
  remark: '',
});

const columns: any[] = [
  { dataIndex: 'userProfile', key: 'userProfile', title: '用户', width: 260 },
  { dataIndex: 'total', key: 'total', title: '总额', width: 120 },
  { dataIndex: 'totalRecharges', key: 'totalRecharges', title: '充值明细', width: 420 },
  { dataIndex: 'remark', key: 'remark', title: '备注', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 180, fixed: 'right' as const },
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

watch(
  () => query.sysOrigin,
  (value) => {
    if (!value) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageQualityUsers({ ...query });
    list.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  void loadData(true);
}

function handlePageChange(page: number, pageSize: number) {
  query.cursor = page;
  query.limit = pageSize;
  void loadData();
}

function openRemark(record: Record<string, any>) {
  remarkForm.id = String(record.userProfile?.id || '');
  remarkForm.remark = record.remark || '';
  remarkOpen.value = true;
}

async function submitRemark() {
  if (!remarkForm.id) {
    return;
  }
  remarkLoading.value = true;
  try {
    await qualityUserRemarkSave({ ...remarkForm });
    message.success('保存成功');
    remarkOpen.value = false;
    await loadData(true);
  } finally {
    remarkLoading.value = false;
  }
}

function openMonthly(record: Record<string, any>) {
  monthlyUserId.value = record.userProfile?.id || '';
  monthlyOpen.value = true;
}

async function openRecharge(userId?: number | string) {
  if (!userId) {
    return;
  }
  rechargeOpen.value = true;
  rechargeLoading.value = true;
  try {
    rechargeData.value = await getThisMonthRechargeByUserId(userId);
  } finally {
    rechargeLoading.value = false;
  }
}
</script>

<template>
  <div>
    <div class="toolbar">
      <SysOriginSelect
        v-model:value="query.sysOrigin"
        style="width: 140px"
        @change="handleSearch"

        :options="sysOriginOptions"
      ></SysOriginSelect>
      <AccountInput
        v-model:value="query.userId"
        :sys-origin="query.sysOrigin"
        placeholder="用户ID"
        style="width: 300px"
      />
      <Button :loading="loading" type="primary" @click="handleSearch">
        搜索
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1180 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userProfile'">
          <UserProfileLink :profile="record.userProfile" />
        </template>
        <template v-else-if="column.key === 'totalRecharges'">
          <div class="tag-row">
            <Tag
              v-for="(item, index) in record.totalRecharges || []"
              :key="index"
              color="blue"
            >
              {{ getRechargeTypeDes(item.type) }}:{{ item.amount }}
            </Tag>
          </div>
        </template>
        <template v-else-if="column.key === 'actions'">
          <div class="action-row">
            <Button size="small" type="link" @click="openRemark(record)">
              备注
            </Button>
            <Button size="small" type="link" @click="openMonthly(record)">
              每月明细
            </Button>
            <Button
              size="small"
              type="link"
              @click="openRecharge(record.userProfile?.id)"
            >
              本月明细
            </Button>
          </div>
        </template>
      </template>
    </Table>

    <div v-if="total > 0" class="pager">
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
      :confirm-loading="remarkLoading"
      :open="remarkOpen"
      destroy-on-close
      title="备注信息"
      width="420px"
      @cancel="remarkOpen = false"
      @ok="submitRemark"
    >
      <TextArea
        v-model:value="remarkForm.remark"
        :maxlength="200"
        :rows="5"
        placeholder="备注信息，最多200个字"
        show-count
      />
    </Modal>

    <Modal
      :footer="null"
      :open="rechargeOpen"
      destroy-on-close
      :title="`本月充值明细${rechargeData.rechargeDate ? `(${rechargeData.rechargeDate})` : ''}`"
      width="460px"
      @cancel="rechargeOpen = false"
    >
      <div v-if="rechargeLoading" class="tips">加载中...</div>
      <div v-else-if="!rechargeData.rechargeDate" class="tips">
        没有充值记录, 快去提醒一下该充值了~
      </div>
      <div v-else>
        <div class="recharge-list">
          <div
            v-for="(item, index) in rechargeData.recharges || []"
            :key="index"
            class="recharge-item"
          >
            {{ getRechargeTypeDes(item.type) }}：{{ item.amount }}
          </div>
        </div>
        <div class="recharge-total">
          总额: {{ rechargeData.totalAmount || 0 }}
        </div>
      </div>
    </Modal>

    <QualityUserMonthlyDetailsModal
      :open="monthlyOpen"
      :user-id="monthlyUserId"
      @close="monthlyOpen = false"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-row {
  display: flex;
  gap: 4px;
}

.tips {
  color: #64748b;
  padding: 24px 0;
  text-align: center;
}

.recharge-list {
  display: grid;
  gap: 10px;
}

.recharge-item {
  background: #f8fafc;
  border-radius: 10px;
  padding: 10px 12px;
}

.recharge-total {
  font-weight: 600;
  margin-top: 16px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
