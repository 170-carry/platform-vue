<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import {
  pageFamilyMember,
  removeFamilyMember,
} from '#/api/legacy/family';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Modal,
  Pagination,
  Space,
  Table,
  Tag,
  message,
} from 'antdv-next';

import { FAMILY_ROLE_OPTIONS, buildLabelMap } from '../shared';

const props = defineProps<{
  familyId: number | string;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const roleLabelMap = buildLabelMap(FAMILY_ROLE_OPTIONS);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  familyId: '',
  limit: 20,
  userId: '',
});

const columns = [
  { dataIndex: 'userBaseInfo', key: 'userBaseInfo', title: '成员', width: 320 },
  { dataIndex: 'memberRole', key: 'memberRole', title: '角色', width: 120 },
  { dataIndex: 'createTime', key: 'createTime', title: '加入家族时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

watch(
  () => ({ familyId: props.familyId, open: props.open }),
  ({ familyId, open }) => {
    if (!open || !familyId) {
      return;
    }
    query.cursor = 1;
    query.familyId = String(familyId);
    query.userId = '';
    void loadData(true);
  },
  { immediate: true },
);

function openUserDetails(userId?: number | string) {
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

async function loadData(reset = false) {
  if (!query.familyId) {
    return;
  }
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageFamilyMember({ ...query });
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

function getUserDisplay(record: Record<string, any>) {
  const profile = record.userBaseInfo || {};
  const nickname = profile.userNickname || profile.nickname || '-';
  const account = profile.actualAccount || profile.account;
  return account ? `${nickname} / ${account}` : nickname;
}

function getUserAccountMeta(record: Record<string, any>) {
  const profile = record.userBaseInfo || {};
  const accountStatus = profile.accountStatusName;
  const actualAccount = profile.actualAccount || profile.account;
  if (accountStatus && actualAccount) {
    return `${actualAccount} (${accountStatus})`;
  }
  return accountStatus || actualAccount || '-';
}

function handleRemove(record: Record<string, any>) {
  Modal.confirm({
    title: '确定移除该成员吗？',
    async onOk() {
      await removeFamilyMember(record.familyId || query.familyId, record.id);
      message.success('成功移除');
      await loadData(true);
    },
  });
}
</script>

<template>
  <Modal
    :footer="null"
    :open="open"
    destroy-on-close
    title="家族成员"
    width="1080px"
    @cancel="emit('close')"
  >
    <div class="toolbar">
      <Space wrap>
        <AccountInput
          v-model:value="query.userId"
          placeholder="用户ID"
          style="width: 260px"
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
      :scroll="{ x: 760 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'userBaseInfo'">
          <button
            class="member-user"
            type="button"
            @click="openUserDetails(record.userBaseInfo?.id)"
          >
            <img
              :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/56x56/e2e8f0/64748b&text=U'"
              alt=""
              class="member-user__avatar"
            >
            <span class="member-user__copy">
              <span class="member-user__name">{{ getUserDisplay(record) }}</span>
              <span class="member-user__meta">{{ getUserAccountMeta(record) }}</span>
            </span>
          </button>
        </template>
        <template v-else-if="column.key === 'memberRole'">
          <Tag color="blue">
            {{ roleLabelMap[record.memberRole] || record.memberRole || '-' }}
          </Tag>
        </template>
        <template v-else-if="column.key === 'createTime'">
          {{ formatDate(record.createTime) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button type="link" danger @click="handleRemove(record)">
            移除
          </Button>
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
  </Modal>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.member-user {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  gap: 12px;
  padding: 0;
  text-align: left;
}

.member-user__avatar {
  border-radius: 999px;
  height: 44px;
  object-fit: cover;
  width: 44px;
}

.member-user__copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.member-user__name {
  color: #0f172a;
  font-weight: 600;
}

.member-user__meta {
  color: #64748b;
  font-size: 12px;
}
</style>
