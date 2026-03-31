<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  deleteGameConfig,
  pageGameConfig,
  regionConfigTable,
  saveOrUpdateGameConfig,
} from '#/api/legacy/system';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { formatDate, getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Form,
  FormItem,
  Image,
  Input,
  InputNumber,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Table,
  message,
} from 'antdv-next';

import {
  GAME_CATEGORY_OPTIONS,
  GAME_CLIENT_ORIGIN_OPTIONS,
  GAME_MODE_OPTIONS,
  GAME_ORIGIN_OPTIONS,
} from './constants';

defineOptions({ name: 'OperateGameConfig' });

function createForm() {
  return {
    amounts: '',
    category: '',
    clientOrigin: '',
    cover: '',
    fullScreen: undefined as any,
    gameCode: '',
    gameId: '',
    gameMode: undefined as any,
    gameOrigin: 'BAISHUN',
    height: '',
    id: '',
    name: '',
    regionList: [] as Array<number | string>,
    self: false,
    selfGameCode: '',
    showcase: undefined as any,
    sort: 0,
    sysOrigin: '',
    width: '',
  };
}

const router = useRouter();
const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const regions = ref<Array<Record<string, any>>>([]);
const modalOpen = ref(false);
const saving = ref(false);
const uploadLoading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const query = reactive<Record<string, any>>({
  cursor: 1,
  gameOrigin: 'BAISHUN',
  limit: 20,
  showcase: true,
  sysOrigin: '',
});

const form = reactive(createForm());

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '系统', width: 100 },
  { dataIndex: 'cover', key: 'cover', title: '封面', width: 90 },
  { dataIndex: 'name', key: 'name', title: '名称', width: 160 },
  { dataIndex: 'gameCode', key: 'gameCode', title: '游戏编号', width: 120 },
  { dataIndex: 'amounts', key: 'amounts', title: '金额', width: 180 },
  { dataIndex: 'clientOrigin', key: 'clientOrigin', title: '客户端', width: 120 },
  { dataIndex: 'fullScreen', key: 'fullScreen', title: '是否全屏', width: 110 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 100 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 200 },
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
  () => query.sysOrigin,
  async (value) => {
    if (!value) {
      return;
    }
    regions.value = await regionConfigTable({ sysOrigin: value });
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pageGameConfig({ ...query });
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

function resetForm() {
  Object.assign(form, createForm(), {
    gameOrigin: query.gameOrigin || 'BAISHUN',
    sysOrigin: query.sysOrigin,
  });
}

function openCreate() {
  resetForm();
  modalOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  Object.assign(form, createForm(), {
    ...record,
    category: record.category || '',
    clientOrigin: record.clientOrigin || '',
    cover: record.cover || '',
    fullScreen: record.fullScreen,
    gameMode: record.gameMode,
    gameOrigin: record.gameOrigin || query.gameOrigin,
    id: String(record.id || ''),
    regionList:
      record.regionList ||
      record.regions?.map((item: Record<string, any>) => item.id) ||
      [],
    self: record.self === true,
    selfGameCode: record.selfGameCode || '',
    showcase: record.showcase,
    sort: Number(record.sort || 0),
    sysOrigin: record.sysOrigin || query.sysOrigin,
  });
  modalOpen.value = true;
}

async function submitForm() {
  if (!form.cover) {
    message.warning('请上传封面');
    return;
  }
  if (!form.sysOrigin || !form.gameOrigin || !form.clientOrigin) {
    message.warning('请补全系统、游戏源和客户端');
    return;
  }
  if (!form.gameId || !form.category || !form.name || !form.gameCode) {
    message.warning('请补全游戏基础信息');
    return;
  }
  if (form.showcase === undefined || form.showcase === null) {
    message.warning('请选择状态');
    return;
  }
  saving.value = true;
  try {
    await saveOrUpdateGameConfig({ ...form });
    message.success('保存成功');
    modalOpen.value = false;
    resetForm();
    await loadData(true);
  } finally {
    saving.value = false;
  }
}

function handleDelete(record: Record<string, any>) {
  Modal.confirm({
    title: '确认删除吗？',
    async onOk() {
      await deleteGameConfig(record.id, record.sysOrigin);
      message.success('删除成功');
      await loadData(true);
    },
  });
}

function openUpload() {
  fileInput.value?.click();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  uploadLoading.value = true;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.other);
    form.cover = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    uploadLoading.value = false;
    target.value = '';
  }
}

function openFruitConfig() {
  router.push('/operate/manager/game/fruit/task-config');
}

void loadData(true);
</script>

<template>
  <Page title="游戏列表">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"
          :options="sysOriginOptions"
        />
        <Select
          option-label-prop="label"
          v-model:value="query.gameOrigin"
          style="width: 140px"
          @change="handleSearch"
        
          :options="GAME_ORIGIN_OPTIONS.map((item) => ({ label: `${item.name}`, value: item.value as any }))"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button type="primary" @click="openCreate">
          新增
        </Button>
        <Button @click="openFruitConfig">
          摩天轮任务配置
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1680 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cover'">
            <Image :src="record.cover" class="cover" />
          </template>
          <template v-else-if="column.key === 'fullScreen'">
            {{ record.fullScreen ? '是' : '否' }}
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button danger size="small" type="link" @click="handleDelete(record)">
                删除
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
      :title="form.id ? '编辑游戏' : '新增游戏'"
      width="720px"
      @cancel="modalOpen = false"
      @ok="submitForm"
    >
      <Form layout="vertical">
        <FormItem label="封面">
          <div class="upload-row">
            <Button :loading="uploadLoading" @click="openUpload">
              上传封面
            </Button>
            <Image v-if="form.cover" :src="form.cover" class="cover" />
          </div>
          <input
            ref="fileInput"
            accept="image/*"
            class="hidden-input"
            type="file"
            @change="handleUpload"
          >
        </FormItem>
        <FormItem label="系统">
          <SysOriginSelect
            v-model:value="form.sysOrigin"
            :options="sysOriginOptions"
          />
        </FormItem>
        <FormItem label="游戏源">
          <Select option-label-prop="label" v-model:value="form.gameOrigin">
            <SelectOption
              v-for="item in GAME_ORIGIN_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="客户端">
          <Select option-label-prop="label" v-model:value="form.clientOrigin">
            <SelectOption
              v-for="item in GAME_CLIENT_ORIGIN_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="是否自研">
          <Select option-label-prop="label" v-model:value="form.self" allow-clear>
            <SelectOption :value="true" label="是">是</SelectOption>
            <SelectOption :value="false" label="否">否</SelectOption>
          </Select>
        </FormItem>
        <FormItem v-if="form.self" label="自研游戏Code">
          <Input v-model:value="form.selfGameCode" placeholder="请输入自研游戏Code" />
        </FormItem>
        <FormItem label="游戏ID">
          <Input v-model:value="form.gameId" placeholder="请输入游戏ID" />
        </FormItem>
        <FormItem label="游戏分类">
          <Select option-label-prop="label" v-model:value="form.category">
            <SelectOption
              v-for="item in GAME_CATEGORY_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="名称">
          <Input v-model:value="form.name" placeholder="请输入名称" />
        </FormItem>
        <FormItem label="编号">
          <Input v-model:value="form.gameCode" placeholder="请输入编号" />
        </FormItem>
        <FormItem label="金额">
          <Input v-model:value="form.amounts" placeholder="金币必须是整数多个逗号隔开" />
        </FormItem>
        <FormItem label="是否全屏">
          <Select option-label-prop="label" v-model:value="form.fullScreen" allow-clear>
            <SelectOption :value="true" label="是">是</SelectOption>
            <SelectOption :value="false" label="否">否</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="游戏模式">
          <Select option-label-prop="label" v-model:value="form.gameMode" allow-clear>
            <SelectOption
              v-for="item in GAME_MODE_OPTIONS"
              :key="item.value"
              :value="item.value"
             :label="`${item.name}`">
              {{ item.name }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="宽">
          <Input v-model:value="form.width" placeholder="宽度" />
        </FormItem>
        <FormItem label="高">
          <Input v-model:value="form.height" placeholder="高度" />
        </FormItem>
        <FormItem label="状态">
          <Select option-label-prop="label" v-model:value="form.showcase" allow-clear>
            <SelectOption :value="false" label="下架">下架</SelectOption>
            <SelectOption :value="true" label="上架">上架</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="form.sort" :max="99999" :min="0" style="width: 100%" />
        </FormItem>
        <FormItem label="区域">
          <Select option-label-prop="label" v-model:value="form.regionList" mode="multiple">
            <SelectOption
              v-for="item in regions"
              :key="item.id"
              :value="item.id"
             :label="`${item.regionName}`">
              {{ item.regionName }}
            </SelectOption>
          </Select>
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.cover {
  border-radius: 8px;
  height: 50px;
  object-fit: cover;
  width: 50px;
}

.upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
