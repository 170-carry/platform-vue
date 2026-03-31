<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import type { LegacyRole } from '#/api/legacy/system';
import { delRole, pageRoleTable } from '#/api/legacy/system';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

import RoleAuthorizeDrawer from './components/role-authorize-drawer.vue';
import RoleEditDrawer from './components/role-edit-drawer.vue';

defineOptions({ name: 'SystemRoleManager' });

const loading = ref(false);
const total = ref(0);
const list = ref<LegacyRole[]>([]);
const editOpen = ref(false);
const authorizeOpen = ref(false);
const activeRow = ref<LegacyRole | null>(null);

const query = reactive({
  cursor: 1,
  limit: 20,
  roleName: '',
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 120 },
  { dataIndex: 'roleName', key: 'roleName', title: '角色', width: 220 },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'updateTime', key: 'updateTime', title: '修改时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 220 },
];

const tableScroll = computed(() => ({ x: 1080 }));

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageRoleTable({ ...query });
    list.value = result.records || [];
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

function openCreate() {
  activeRow.value = null;
  editOpen.value = true;
}

function openUpdate(row: any) {
  activeRow.value = { ...row };
  editOpen.value = true;
}

function openAuthorize(row: any) {
  activeRow.value = { ...row };
  authorizeOpen.value = true;
}

function handleDelete(row: any) {
  Modal.confirm({
    async onOk() {
      await delRole(row.id);
      message.success('删除成功');
      await loadData();
    },
    title: '此操作将永久删除，是否继续？',
  });
}

loadData(true);
</script>

<template>
  <Page title="角色管理">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="角色名称" :label-width="84">
          <Input
            v-model:value="query.roleName"
            allow-clear
            placeholder="角色名称"
            style="width: 220px"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
        <Button @click="openCreate">添加</Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="tableScroll"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'updateTime'">
            {{ formatDate(record.updateTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openAuthorize(record)">
                菜单授权
              </Button>
              <Button size="small" type="link" @click="openUpdate(record)">
                修改
              </Button>
              <Button size="small" type="link" danger @click="handleDelete(record)">
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

    <RoleEditDrawer
      :open="editOpen"
      :update-data="activeRow"
      @close="editOpen = false"
      @success="loadData()"
    />
    <RoleAuthorizeDrawer
      :menu-ids="activeRow?.menuIds || []"
      :open="authorizeOpen"
      :role-id="activeRow?.id || ''"
      :role-name="activeRow?.roleName || ''"
      @close="authorizeOpen = false"
      @success="loadData()"
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
</style>
