<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Button, Drawer, Table, Tag } from 'antdv-next';

import { formatDate } from '#/views/system/shared';

import UserProfileLink from './user-profile-link.vue';
import AutoSalaryPolicyDetailsDrawer from './auto-salary-policy-details-drawer.vue';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeRow = ref<Record<string, any> | null>(null);
const policyOpen = ref(false);

watch(
  () => props.open,
  (value) => {
    if (!value) {
      activeRow.value = null;
      policyOpen.value = false;
    }
  },
);

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'teamRegionName', key: 'teamRegionName', title: '区域', width: 120 },
  { dataIndex: 'policyLevel', key: 'policyLevel', title: '政策等级', width: 140 },
  { dataIndex: 'target', key: 'target', title: '用户目标', width: 120 },
  { dataIndex: 'salary', key: 'salary', title: '工资', width: 120 },
  { dataIndex: 'receiveUser', key: 'receiveUser', title: '应收工资用户', width: 260 },
  { dataIndex: 'actualReceiveUser', key: 'actualReceiveUser', title: '实际接收工资用户', width: 260 },
  { dataIndex: 'hostSalaryToAgent', key: 'hostSalaryToAgent', title: '团长代收', width: 120 },
  { dataIndex: 'recycled', key: 'recycled', title: '已收回', width: 120 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

function getList() {
  return Array.isArray(props.row?.salaryDetails) ? props.row.salaryDetails : [];
}

function openPolicy(record: Record<string, any>) {
  activeRow.value = record;
  policyOpen.value = true;
}
</script>

<template>
  <Drawer
    :height="'92vh'"
    :open="open"
    placement="bottom"
    :title="`自动发送工资详情(${row?.dateNumber || '-'})`"
    @close="emit('close')"
  >
    <Table
      :columns="columns"
      :data-source="getList()"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1680 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'receiveUser'">
          <UserProfileLink
            :profile="record.anchor ? record.teamMemberProfile : record.teamOwnProfile"
          />
        </template>
        <template v-else-if="column.key === 'actualReceiveUser'">
          <UserProfileLink
            :profile="
              record.hostSalaryToAgent
                ? record.teamOwnProfile
                : record.anchor
                  ? record.teamMemberProfile
                  : record.teamOwnProfile
            "
          />
        </template>
        <template v-else-if="column.key === 'hostSalaryToAgent'">
          <Tag v-if="record.hostSalaryToAgent" color="blue">代收</Tag>
          <span v-else>否</span>
        </template>
        <template v-else-if="column.key === 'recycled'">
          <Tag v-if="record.recycled" color="error">已收回</Tag>
          <span v-else>否</span>
        </template>
        <template v-else-if="column.key === 'time'">
          <div>{{ formatDate(record.createTime) }}</div>
          <div class="sub-time">{{ formatDate(record.updateTime) }}</div>
        </template>
        <template v-else-if="column.key === 'actions'">
          <Button size="small" type="link" @click="openPolicy(record)">
            查看
          </Button>
        </template>
      </template>
    </Table>

    <AutoSalaryPolicyDetailsDrawer
      :open="policyOpen"
      :row="activeRow || {}"
      @close="policyOpen = false"
    />
  </Drawer>
</template>

<style scoped>
.sub-time {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}
</style>
