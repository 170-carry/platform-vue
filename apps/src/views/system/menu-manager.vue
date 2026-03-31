<script lang="ts" setup>
import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  addMenu,
  allMenus,
  delMenu,
  getMenu,
  getResources,
  updateMenu,
} from '#/api/legacy/system';
import type { LegacyMenu } from '#/api/legacy/system';
import {
  buildMenuTree,
  filterMenuTree,
  formatDate,
  getAllMenuIds,
} from '#/views/system/shared';

import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Radio,
  RadioGroup,
  Row,
  Select,
  SelectOption,
  Space,
  Spin,
  Tag,
  Tree,
  message,
} from 'antdv-next';

defineOptions({ name: 'SystemMenuManager' });

const loading = ref(false);
const resourcesLoading = ref(false);
const saving = ref(false);
const selectedKeys = ref<Array<number | string>>([]);
const expandedKeys = ref<Array<number | string>>([]);
const keyword = ref('');
const menusList = ref<LegacyMenu[]>([]);
const resources = ref<Array<Record<string, any>>>([]);

const mode = ref<'addChild' | 'addRoot' | 'updateNode'>('addRoot');

const form = reactive<Record<string, any>>({
  alias: '',
  icon: '',
  id: '',
  menuName: '',
  menuType: 1,
  parentId: '0',
  path: '',
  resourceIds: [],
  router: '',
  sort: 0,
  status: 0,
});

const treeData = computed(() => {
  const convert = (list: Array<LegacyMenu & { children?: LegacyMenu[] }>): Array<Record<string, any>> =>
    list.map((item) => ({
      children: convert((item.children || []) as Array<LegacyMenu & { children?: LegacyMenu[] }>),
      key: item.id,
      title: item.status === 1 ? `${item.menuName}（禁用）` : item.menuName,
    }));
  return convert(filterMenuTree(buildMenuTree(menusList.value), keyword.value));
});

const selectedNode = computed(() => {
  const selectedId = selectedKeys.value[0];
  return menusList.value.find((item) => item.id === selectedId) || null;
});

const isMenuTypeToMenu = computed(() => Number(form.menuType) === 2);

const eventName = computed(() => {
  if (mode.value === 'addChild') {
    return selectedNode.value
      ? `向“${selectedNode.value.menuName}”添加子节点`
      : '添加子节点';
  }
  if (mode.value === 'updateNode') {
    return selectedNode.value ? `修改“${selectedNode.value.menuName}”节点` : '修改节点';
  }
  return '添加根节点';
});

function resetForm() {
  form.id = '';
  form.menuName = '';
  form.alias = '';
  form.menuType = 1;
  form.icon = '';
  form.parentId = '0';
  form.path = '';
  form.resourceIds = [];
  form.router = '';
  form.status = 0;
  form.sort = 0;
}

async function loadMenus() {
  loading.value = true;
  try {
    menusList.value = await allMenus();
    expandedKeys.value = getAllMenuIds(buildMenuTree(menusList.value));
  } finally {
    loading.value = false;
  }
}

async function loadResources() {
  resourcesLoading.value = true;
  try {
    resources.value = await getResources();
  } finally {
    resourcesLoading.value = false;
  }
}

function selectNode(selected: Array<number | string>) {
  selectedKeys.value = selected;
}

function openAddRoot() {
  mode.value = 'addRoot';
  resetForm();
}

function openAddChild() {
  if (!selectedNode.value) {
    message.warning('请先选择一个菜单节点');
    return;
  }
  mode.value = 'addChild';
  resetForm();
  form.parentId = String(selectedNode.value.id);
}

async function openUpdate() {
  if (!selectedNode.value) {
    message.warning('请先选择一个菜单节点');
    return;
  }
  mode.value = 'updateNode';
  saving.value = true;
  try {
    const detail = await getMenu(selectedNode.value.id);
    resetForm();
    Object.assign(form, detail || {});
    form.resourceIds = detail?.resourceIds || [];
  } finally {
    saving.value = false;
  }
}

function removeSelected() {
  if (!selectedNode.value) {
    message.warning('请先选择一个菜单节点');
    return;
  }
  const currentId = selectedNode.value.id;
  Modal.confirm({
    async onOk() {
      await delMenu(currentId);
      message.success('删除成功');
      selectedKeys.value = [];
      openAddRoot();
      await loadMenus();
    },
    title: '此操作将永久删除，是否继续？',
  });
}

async function handleSubmit() {
  if (!form.menuName?.trim()) {
    message.warning('请输入菜单名称');
    return;
  }
  if (form.menuType === '' || form.menuType === undefined || form.menuType === null) {
    message.warning('请选择菜单类型');
    return;
  }
  if (form.status === '' || form.status === undefined || form.status === null) {
    message.warning('请选择菜单状态');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      alias: form.alias?.trim(),
      icon: form.icon?.trim(),
      id: form.id,
      menuName: form.menuName?.trim(),
      menuType: form.menuType,
      parentId: form.parentId,
      path: form.path?.trim(),
      resourceIds: isMenuTypeToMenu.value ? [...(form.resourceIds || [])] : [],
      router: form.router?.trim(),
      sort: form.sort ?? 0,
      status: form.status,
    };
    if (mode.value === 'updateNode') {
      await updateMenu(payload);
    } else {
      await addMenu(payload);
    }
    message.success('保存成功');
    await loadMenus();
    if (mode.value === 'updateNode') {
      selectedKeys.value = [payload.id];
    } else {
      openAddRoot();
    }
  } finally {
    saving.value = false;
  }
}

loadMenus();
loadResources();
</script>

<template>
  <Page title="菜单管理">
    <Row :gutter="16">
      <Col :span="10">
        <Card title="菜单树">
          <div class="toolbar">
            <Space wrap>
              <Button type="primary" @click="openAddRoot">添加一级菜单</Button>
              <Button @click="loadMenus">刷新菜单</Button>
              <Button @click="expandedKeys = getAllMenuIds(buildMenuTree(menusList))">
                全部展开
              </Button>
              <Button @click="expandedKeys = []">全部收起</Button>
            </Space>
          </div>
          <Alert
            :description="`当前选中节点：${selectedNode?.menuName || '根节点'}`"
            show-icon
            type="info"
          />
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="输入关键字进行过滤"
            style="margin: 16px 0"
          />
          <Spin :spinning="loading">
            <Tree
              :expanded-keys="expandedKeys"
              :selected-keys="selectedKeys"
              :tree-data="treeData"
              block-node
              @expand="(keys: Array<number | string>) => (expandedKeys = keys)"
              @select="selectNode"
            />
          </Spin>
        </Card>
      </Col>
      <Col :span="14">
        <Card title="菜单编辑">
          <div class="toolbar">
            <Space wrap>
              <Button @click="openAddRoot">根节点</Button>
              <Button @click="openAddChild">添加子节点</Button>
              <Button @click="openUpdate">修改节点</Button>
              <Button danger @click="removeSelected">删除节点</Button>
            </Space>
          </div>
          <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 19 }" layout="horizontal">
            <FormItem label="当前事件">
              <Tag color="blue">{{ eventName }}</Tag>
            </FormItem>
            <FormItem label="菜单名称">
              <Input v-model:value="form.menuName" :disabled="saving" placeholder="请输入菜单名称" />
            </FormItem>
            <FormItem label="权限名称">
              <Input v-model:value="form.alias" :disabled="saving" placeholder="请输入权限名称" />
            </FormItem>
            <FormItem label="菜单类型">
              <RadioGroup v-model:value="form.menuType" :disabled="saving">
                <Radio :value="1">目录</Radio>
                <Radio :value="2">菜单</Radio>
                <Radio :value="3">按钮</Radio>
              </RadioGroup>
            </FormItem>
            <FormItem label="菜单图标">
              <Input v-model:value="form.icon" :disabled="saving" placeholder="icon code" />
            </FormItem>
            <FormItem label="菜单状态">
              <RadioGroup v-model:value="form.status" :disabled="saving">
                <Radio :value="0">正常</Radio>
                <Radio :value="1">禁用</Radio>
              </RadioGroup>
            </FormItem>
            <FormItem label="顺序权重">
              <InputNumber v-model:value="form.sort" :disabled="saving" style="width: 100%" />
            </FormItem>
            <FormItem v-if="isMenuTypeToMenu" label="菜单路径">
              <Input v-model:value="form.path" :disabled="saving" placeholder="请输入菜单路径" />
            </FormItem>
            <FormItem label="菜单路由">
              <Input v-model:value="form.router" :disabled="saving" placeholder="请输入菜单路由" />
            </FormItem>
            <FormItem v-if="isMenuTypeToMenu" label="对应资源">
              <Select option-label-prop="children"
                v-model:value="form.resourceIds"
                :disabled="saving"
                :loading="resourcesLoading"
                mode="multiple"
                placeholder="请选择资源"
              >
                <SelectOption
                  v-for="item in resources"
                  :key="item.id"
                  :value="item.id"
                >
                  {{ item.resourceName }}，{{ item.perm }}
                </SelectOption>
              </Select>
            </FormItem>
            <FormItem label="修改时间">
              {{ selectedNode?.updateTime ? formatDate(selectedNode.updateTime) : '-' }}
            </FormItem>
            <FormItem>
              <Button :loading="saving" type="primary" @click="handleSubmit">
                提交
              </Button>
            </FormItem>
          </Form>
        </Card>
      </Col>
    </Row>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}
</style>
