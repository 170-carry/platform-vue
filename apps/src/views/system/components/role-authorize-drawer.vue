<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { allMenus, updateRoleMenus } from '#/api/legacy/system';
import type { LegacyMenu } from '#/api/legacy/system';
import { buildMenuTree } from '#/views/system/shared';

import { Button, Drawer, Space, Spin, Tree, message } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  roleId: number | string;
  roleName: string;
  menuIds: Array<number | string>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const loading = ref(false);
const treeLoading = ref(false);
const menusList = ref<LegacyMenu[]>([]);
const checkedKeys = ref<Array<number | string>>([]);
const halfCheckedKeys = ref<Array<number | string>>([]);

const treeData = computed(() => {
  const convert = (list: LegacyMenu[]): Array<Record<string, any>> =>
    list.map((item) => ({
      children: convert(item.children || []),
      key: item.id,
      title: item.menuName,
    }));
  return convert(buildMenuTree(menusList.value));
});

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      return;
    }
    treeLoading.value = true;
    try {
      menusList.value = await allMenus();
      const excludeParentIds: Array<number | string> = [];
      for (const item of menusList.value) {
        if (props.menuIds.some((id) => id === item.id) && item.parentId) {
          excludeParentIds.push(item.parentId);
        }
      }
      checkedKeys.value = props.menuIds.filter(
        (id) => !excludeParentIds.some((parentId) => parentId === id),
      );
      halfCheckedKeys.value = [];
    } finally {
      treeLoading.value = false;
    }
  },
  { immediate: true },
);

function handleCheck(keys: any, event: Record<string, any>) {
  checkedKeys.value = Array.isArray(keys) ? keys : (keys?.checked || []);
  halfCheckedKeys.value = event?.halfCheckedKeys || keys?.halfChecked || [];
}

async function handleSubmit() {
  loading.value = true;
  try {
    await updateRoleMenus({
      id: props.roleId,
      menuIds: [...new Set([...checkedKeys.value, ...halfCheckedKeys.value])],
    });
    message.success('保存成功');
    emit('success');
    emit('close');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="`菜单授权 · ${roleName}`"
    destroy-on-close
    width="420"
    @close="emit('close')"
  >
    <Spin :spinning="treeLoading">
      <div class="auth-tree">
        <Tree
          checkable
          :checked-keys="checkedKeys"
          :tree-data="treeData"
          default-expand-all
          @check="handleCheck"
        />
      </div>
    </Spin>

    <template #footer>
      <Space>
        <Button @click="emit('close')">取消</Button>
        <Button :loading="loading" type="primary" @click="handleSubmit">
          提交
        </Button>
      </Space>
    </template>
  </Drawer>
</template>

<style scoped>
.auth-tree {
  max-height: calc(100vh - 220px);
  overflow: auto;
  padding-right: 8px;
}
</style>
