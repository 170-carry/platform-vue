<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  addSysImAccount,
  delSysImAccountPassword,
  pageSysImAccount,
  resetSysImAccountPassword,
} from '#/api/legacy/im-account';
import AccountInput from '#/components/account-input.vue';
import { formatDate } from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateImAccountManager' });

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);

const query = reactive({
  cursor: 1,
  limit: 20,
  userId: '',
});

const form = reactive({
  password: '88888888',
  userId: '',
});

const columns = [
  { dataIndex: 'avatar', key: 'avatar', title: '头像', width: 100 },
  { dataIndex: 'nickname', key: 'nickname', title: '昵称', width: 200 },
  { dataIndex: 'account', key: 'account', title: 'IM用户名', width: 180 },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 160 },
];

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageSysImAccount({ ...query });
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

function openCreate() {
  form.userId = '';
  form.password = '88888888';
  modalOpen.value = true;
}

async function submitForm() {
  if (!String(form.userId || '').trim()) {
    message.warning('请输入用户ID');
    return;
  }
  if (!String(form.password || '').trim()) {
    message.warning('请输入登录密码');
    return;
  }
  saving.value = true;
  try {
    await addSysImAccount({
      password: String(form.password || '').trim(),
      userId: String(form.userId || '').trim(),
    });
    message.success('保存成功');
    modalOpen.value = false;
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: `是否确认删除 "${record.userBaseInfo?.userNickname || '-'}" ?`,
    async onOk() {
      await delSysImAccountPassword({
        userId: record.userBaseInfo?.id,
      });
      message.success('删除成功');
      await loadData(true);
    },
  });
}

function handleResetPassword(record: Record<string, any>) {
  Modal.confirm({
    title: `是否确认重置 "${record.userBaseInfo?.userNickname || '-'}" 登录密码?`,
    async onOk() {
      await resetSysImAccountPassword({
        userId: record.userBaseInfo?.id,
      });
      message.success('重置成功');
    },
  });
}

function openUserDetails(record: Record<string, any>) {
  const userId = record.userBaseInfo?.id;
  if (!userId) {
    return;
  }
  router.push(`/common/user/deatils/${userId}`);
}

void loadData(true);
</script>

<template>
  <Page title="IM账号管理">
    <Card>
      <div class="toolbar">
        <Space wrap>
          <AccountInput
            v-model:value="query.userId"
            placeholder="用户ID"
            style="width: 240px"
          />
          <Button :loading="loading" type="primary" @click="handleSearch">
            搜索
          </Button>
          <Button @click="openCreate">添加</Button>
        </Space>
      </div>

      <Alert
        message="使用站内注册账号关联后台PC端IM登录授权，登录账号“短id”初始密码“88888888”"
        show-icon
        type="warning"
      />

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 820 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'avatar'">
            <img
              :src="record.userBaseInfo?.userAvatar || 'https://dummyimage.com/40x40/e2e8f0/64748b&text=U'"
              alt=""
              class="avatar"
            >
          </template>
          <template v-else-if="column.key === 'nickname'">
            <Button type="link" @click="openUserDetails(record)">
              {{ record.userBaseInfo?.userNickname || '-' }}
            </Button>
          </template>
          <template v-else-if="column.key === 'account'">
            {{ record.userBaseInfo?.account || '-' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="handleDelete(record)">
                删除
              </Button>
              <Button size="small" type="link" @click="handleResetPassword(record)">
                重置密码
              </Button>
            </Space>
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
    </Card>

    <Modal
      :confirm-loading="saving"
      :open="modalOpen"
      destroy-on-close
      title="添加"
      @cancel="modalOpen = false"
      @ok="submitForm"
    >
      <Form :label-col="{ span: 5 }" :model="form" :wrapper-col="{ span: 18 }">
        <FormItem label="用户ID">
          <Input v-model:value="form.userId" placeholder="请输入用户ID" />
        </FormItem>
        <FormItem label="登录密码">
          <Input
            v-model:value="form.password"
            placeholder="请输入登录密码"
            type="password"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.avatar {
  border-radius: 999px;
  height: 40px;
  object-fit: cover;
  width: 40px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
