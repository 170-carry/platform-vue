<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { pagePropsActivityRewardGroup } from '#/api/legacy/props';
import { PRODUCT_SHOWCASE_OPTIONS } from '#/views/system/shared';

import {
  Button,
  Card,
  Drawer,
  Input,
  Pagination,
  Select,
  SelectOption,
  Tag,
} from 'antdv-next';

import RewardConfigList from './reward-config-list.vue';

const props = defineProps<{
  open: boolean;
  sysOrigin: string;
}>();

const emit = defineEmits<{
  close: [];
  select: [Record<string, any>];
}>();

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);

const query = reactive({
  cursor: 1,
  id: '',
  limit: 20,
  name: '',
  shelfStatus: true as boolean | undefined,
  sysOrigin: '',
});

watch(
  () => ({ open: props.open, sysOrigin: props.sysOrigin }),
  ({ open, sysOrigin }) => {
    if (!open || !sysOrigin) {
      return;
    }
    query.sysOrigin = sysOrigin;
    void loadData(true);
  },
  { immediate: true },
);

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePropsActivityRewardGroup({ ...query });
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

function selectRecord(record: Record<string, any>) {
  emit('select', record);
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="关联资源组"
    width="960"
    @close="emit('close')"
  >
    <div class="selector-layout">
      <div class="selector-toolbar">
        <Select option-label-prop="label"
          v-model:value="query.shelfStatus"
          allow-clear
          placeholder="上/下架"
          style="width: 140px"
          @change="handleSearch"
        >
          <SelectOption
            v-for="item in PRODUCT_SHOWCASE_OPTIONS"
            :key="String(item.value)"
            :label="item.name"
            :value="item.value"
          >
            {{ item.name }}
          </SelectOption>
        </Select>
        <Input
          v-model:value="query.id"
          allow-clear
          placeholder="ID"
          style="width: 160px"
          @press-enter="handleSearch"
        />
        <Input
          v-model:value="query.name"
          allow-clear
          placeholder="类型名称"
          style="width: 220px"
          @press-enter="handleSearch"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
      </div>

      <div class="selector-list">
        <Card
          v-for="record in list"
          :key="record.id"
          :bordered="false"
          class="selector-card"
        >
          <div class="selector-card__header">
            <div>
              <div class="selector-card__title">
                {{ record.name || `资源组 ${record.id}` }}
              </div>
              <div class="selector-card__sub">
                ID {{ record.id || '-' }}
                <Tag :color="record.shelfStatus ? 'success' : 'error'">
                  {{ record.shelfStatus ? '上架' : '下架' }}
                </Tag>
              </div>
            </div>
            <Button size="small" type="primary" @click="selectRecord(record)">
              确认选择
            </Button>
          </div>

          <RewardConfigList :list="record.rewardConfigList || []" />
        </Card>
      </div>

      <div class="pagination">
        <Pagination
          :current="query.cursor"
          :page-size="query.limit"
          :total="total"
          show-size-changer
          @change="handlePageChange"
          @showSizeChange="handlePageChange"
        />
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
.selector-layout {
  display: grid;
  gap: 16px;
}

.selector-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.selector-list {
  display: grid;
  gap: 12px;
}

.selector-card {
  border-radius: 20px;
}

.selector-card__header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.selector-card__title {
  color: #0f172a;
  font-size: 15px;
  font-weight: 600;
}

.selector-card__sub {
  align-items: center;
  color: #64748b;
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>
