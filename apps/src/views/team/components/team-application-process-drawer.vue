<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { teamProcessTable } from '#/api/legacy/team';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Drawer,
  Empty,
  Select,
  SelectOption,
  Space,
  Tag,
} from 'antdv-next';

import {
  TEAM_APPLICATION_PROCESS_STATUS_OPTIONS,
  TEAM_REASON_OPTIONS,
} from '../shared';

const props = defineProps<{
  open: boolean;
  teamId: number | string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();
const loading = ref(false);
const notMore = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const reasonLabelMap = TEAM_REASON_OPTIONS.reduce<Record<string, string>>((result, item) => {
  result[item.value] = item.name;
  return result;
}, {});
const statusLabelMap = TEAM_APPLICATION_PROCESS_STATUS_OPTIONS.reduce<Record<string, string>>(
  (result, item) => {
    result[item.value] = item.name;
    return result;
  },
  {},
);

const query = reactive({
  associateId: '',
  lastId: '',
  reason: TEAM_REASON_OPTIONS[0]?.value ?? '',
  status: TEAM_APPLICATION_PROCESS_STATUS_OPTIONS[0]?.value ?? '',
});

watch(
  () => props.open,
  (open) => {
    if (open) {
      query.associateId = String(props.teamId || '');
      void loadData(true);
    }
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
  if (!query.associateId) {
    return;
  }
  if (reset) {
    query.lastId = '';
    list.value = [];
  }
  loading.value = true;
  try {
    const result = await teamProcessTable({ ...query });
    const current = result || [];
    notMore.value = current.length <= 0;
    list.value = [...list.value, ...current];
    if (list.value.length > 0) {
      query.lastId = String(list.value[list.value.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="申请团队成员列表"
    width="720px"
    @close="emit('close')"
  >
    <div class="drawer-toolbar">
      <Space wrap>
        <Select option-label-prop="label"
          v-model:value="query.status"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption
            v-for="item in TEAM_APPLICATION_PROCESS_STATUS_OPTIONS"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
        <Select option-label-prop="label"
          v-model:value="query.reason"
          style="width: 140px"
          @change="loadData(true)"
        >
          <SelectOption
            v-for="item in TEAM_REASON_OPTIONS"
            :key="item.value"
            :label="item.name"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          查询
        </Button>
      </Space>
    </div>

    <div class="drawer-list">
      <Empty v-if="!loading && list.length === 0" description="暂无申请记录" />
      <Card
        v-for="item in list"
        :key="item.id"
        class="drawer-card"
        size="small"
      >
        <Space wrap class="drawer-tags">
          <Tag>申请类型: {{ reasonLabelMap[item.reason] || item.reason || '-' }}</Tag>
          <Tag
            :color="item.status === 'WAIT' ? 'orange' : item.status === 'AGREE' ? 'green' : 'red'"
          >
            审核状态:
            {{ statusLabelMap[item.status] || item.status || '-' }}
          </Tag>
        </Space>

        <div class="drawer-meta">
          <div v-if="item.createUserOrigin === 1 && item.createSysUser">
            创建人: {{ item.createSysUser.nickname || '-' }} / {{ formatDate(item.createTime) }}
          </div>
          <div v-else-if="item.createUserProfile">
            创建人:
            <Button
              size="small"
              type="link"
              @click="openUserDetails(item.createUserProfile.id)"
            >
              {{ item.createUserProfile.userNickname || '-' }}
            </Button>
            / {{ formatDate(item.createTime) }}
          </div>
          <div v-if="item.updateUserOrigin === 1 && item.updateSysUser">
            修改人: {{ item.updateSysUser.nickname || '-' }} / {{ formatDate(item.updateTime) }}
          </div>
          <div v-else-if="item.updateUserProfile">
            修改人:
            <Button
              size="small"
              type="link"
              @click="openUserDetails(item.updateUserProfile.id)"
            >
              {{ item.updateUserProfile.userNickname || '-' }}
            </Button>
            / {{ formatDate(item.updateTime) }}
          </div>
        </div>
      </Card>
    </div>

    <div v-if="list.length > 0" class="load-more">
      <span v-if="notMore">已加载全部</span>
      <Button v-else :loading="loading" size="small" @click="loadData()">
        加载更多
      </Button>
    </div>
  </Drawer>
</template>

<style scoped>
.drawer-toolbar {
  margin-bottom: 16px;
}

.drawer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.drawer-card {
  border-radius: 12px;
}

.drawer-tags {
  margin-bottom: 12px;
}

.drawer-meta {
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
