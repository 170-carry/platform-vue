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
  deleteFamily,
  pageFamilyList,
  } from '#/api/legacy/family';
import AccountInput from '#/components/account-input.vue';
import { formatDate,
  getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  DateRangePicker,
  Image,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import FamilyMembersModal from './components/family-members-modal.vue';
import { FAMILY_LEVEL_OPTIONS, buildLabelMap } from './shared';

defineOptions({ name: 'FamilyList' });

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const levelLabelMap = buildLabelMap(FAMILY_LEVEL_OPTIONS);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const rangeDate = ref<[string, string] | null>(null);
const memberOpen = ref(false);
const activeFamilyId = ref<number | string>('');

const query = reactive({
  cursor: 1,
  endTime: '',
  familyAccount: '',
  limit: 20,
  startTime: '',
  sysOrigin: '',
  userId: '',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '来源系统', width: 110 },
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '族长', width: 260 },
  { dataIndex: 'familyAccount', key: 'familyAccount', title: '家族账号', width: 120 },
  { dataIndex: 'familyAvatar', key: 'familyAvatar', title: '家族头像', width: 120 },
  { dataIndex: 'familyName', key: 'familyName', title: '家族名称', width: 180 },
  { dataIndex: 'memberCount', key: 'memberCount', title: '成员数', width: 100 },
  { dataIndex: 'levelKey', key: 'levelKey', title: '家族等级', width: 130 },
  { dataIndex: 'familyExp', key: 'familyExp', title: '总贡献值', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 150, fixed: 'right' as const },
];

watch(
  sysOriginOptions,
  (options) => {
    if (!query.sysOrigin && options.length > 0) {
      query.sysOrigin = String(options[0]?.value || '');
    }
  },
  { immediate: true },
);

watch(
  rangeDate,
  (value) => {
    query.startTime = value?.[0] || '';
    query.endTime = value?.[1] || '';
  },
  { immediate: true },
);

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

function getOwnerDisplay(record: Record<string, any>) {
  const profile = record.userBaseInfo || {};
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account;
  return account ? `${nickname} / ${account}` : nickname;
}

async function loadData(reset = false) {
  if (!query.sysOrigin) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageFamilyList({ ...query });
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

function openMembers(record: Record<string, any>) {
  activeFamilyId.value = record.id || '';
  memberOpen.value = true;
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '【删除后不可复原】!! 确定删除该家族吗？',
    async onOk() {
      await deleteFamily(record.id);
      message.success('成功删除');
      await loadData(true);
    },
  });
}

watch(
  () => query.sysOrigin,
  (value, oldValue) => {
    if (!value || value === oldValue) {
      return;
    }
    void loadData(true);
  },
  { immediate: true },
);
</script>

<template>
  <Page title="家族列表">
    <div class="page-grid">
      <Card>
        <div class="toolbar">
          <Space wrap>
            <SysOriginSelect
              v-model:value="query.sysOrigin"
              style="width: 140px"

              :options="sysOriginOptions"
            ></SysOriginSelect>
            <AccountInput
              v-model:value="query.userId"
              :sys-origin="query.sysOrigin"
              placeholder="用户ID"
              style="width: 280px"
            />
            <Input
              v-model:value="query.familyAccount"
              allow-clear
              placeholder="家族账号"
              style="width: 200px"
              @press-enter="handleSearch"
            />
            <DateRangePicker
              v-model:value="rangeDate"
              show-time
              style="width: 360px"
              value-format="x"
            />
            <Button :loading="loading" type="primary" @click="handleSearch">
              搜索
            </Button>
          </Space>
        </div>

        <Table
          :columns="columns"
          :data-source="list"
          :loading="loading"
          :pagination="false"
          row-key="id"
          :scroll="{ x: 1460 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'userBaseInfo'">
              <button
                class="owner-link"
                type="button"
                @click="openUserDetails(record.userBaseInfo?.id)"
              >
                <img
                  :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
                  alt=""
                  class="owner-link__avatar"
                >
                <span class="owner-link__copy">
                  <span class="owner-link__name">{{ getOwnerDisplay(record) }}</span>
                  <span class="owner-link__meta">ID {{ record.userBaseInfo?.id || '-' }}</span>
                </span>
              </button>
            </template>
            <template v-else-if="column.key === 'familyAvatar'">
              <Image
                :preview="false"
                :src="record.familyAvatar || 'https://dummyimage.com/72x72/e2e8f0/64748b&text=F'"
                class="family-avatar"
              />
            </template>
            <template v-else-if="column.key === 'levelKey'">
              <Tag color="blue">
                {{ levelLabelMap[record.levelKey] || record.levelKey || '-' }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'createTime'">
              {{ formatDate(record.createTime) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Space>
                <Button type="link" @click="openMembers(record)">成员列表</Button>
                <Button type="link" danger @click="handleDelete(record)">
                  解散家族
                </Button>
              </Space>
            </template>
          </template>
        </Table>

        <div class="pagination">
          <Pagination
            :current="query.cursor"
            :page-size="query.limit"
            :total="total"
            show-size-changer
            @change="handlePageChange"
          />
        </div>
      </Card>
    </div>

    <FamilyMembersModal
      :family-id="activeFamilyId"
      :open="memberOpen"
      @close="memberOpen = false"
    />
  </Page>
</template>

<style scoped>
.page-grid {
  display: grid;
  gap: 16px;
}

.toolbar {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.owner-link {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  gap: 12px;
  padding: 0;
  text-align: left;
}

.owner-link__avatar {
  border-radius: 999px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.owner-link__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.owner-link__name {
  color: #0f172a;
  font-weight: 600;
}

.owner-link__meta {
  color: #64748b;
  font-size: 12px;
}

.family-avatar {
  border-radius: 12px;
  height: 56px;
  object-fit: cover;
  width: 56px;
}
</style>
