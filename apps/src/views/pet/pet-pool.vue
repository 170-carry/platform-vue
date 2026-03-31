<script lang="ts" setup>
import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { pagePetPool, togglePetPoolShelf } from '#/api/legacy/pet';
import SysOriginLabel from '#/components/sys-origin-label.vue';
import RewardConfigList from '#/views/pet/components/reward-config-list.vue';
import PetStageGallery from '#/views/pet/components/pet-stage-gallery.vue';
import {
  getPetUnlockConditionText,
} from '#/views/pet/shared';
import {
  PRODUCT_SHOWCASE_OPTIONS,
  formatDate,
  getAllowedSysOrigins,
} from '#/views/system/shared';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Pagination,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antdv-next';

import PetPoolFormDrawer from './components/pet-pool-form-drawer.vue';

defineOptions({ name: 'PetPool' });

const accessStore = useAccessStore();
const sysOriginOptions = getAllowedSysOrigins(accessStore.accessCodes || []);

const loading = ref(false);
const total = ref(0);
const list = ref<Array<Record<string, any>>>([]);
const formOpen = ref(false);
const activeRow = ref<Record<string, any> | null>(null);
const shelfOptions = PRODUCT_SHOWCASE_OPTIONS.map((item) => ({
  label: item.name,
  value: String(item.value),
}));

const query = reactive({
  cursor: 1,
  id: '',
  limit: 20,
  shelf: String(true),
  sysOrigin: sysOriginOptions[0]?.value ?? 'LIKEI',
});

const columns = [
  { dataIndex: 'sysOrigin', key: 'sysOrigin', title: '平台', width: 100 },
  { dataIndex: 'stages', key: 'stages', title: '阶段图', width: 420 },
  { dataIndex: 'unlock', key: 'unlock', title: '解锁条件', width: 240 },
  { dataIndex: 'rewards', key: 'rewards', title: '养成奖励', width: 320 },
  { dataIndex: 'level', key: 'level', title: '序号', width: 80 },
  { dataIndex: 'shelf', key: 'shelf', title: '上/下架', width: 120 },
  { dataIndex: 'time', key: 'time', title: '时间', width: 220 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100, fixed: 'right' as const },
];

function getRowKey(record: Record<string, any>) {
  return String(record.petPool?.id || record.id || '');
}

async function loadData(reset = false) {
  if (reset) {
    query.cursor = 1;
  }
  loading.value = true;
  try {
    const result = await pagePetPool({
      ...query,
      shelf: query.shelf === 'true',
    });
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
  activeRow.value = null;
  formOpen.value = true;
}

function openEdit(record: Record<string, any>) {
  activeRow.value = JSON.parse(JSON.stringify(record));
  formOpen.value = true;
}

async function handleShelfStatusChange(record: Record<string, any>, checked: boolean) {
  const previous = record.petPool?.shelf;
  record.petPool.shelf = checked;
  try {
    await togglePetPoolShelf(record.petPool?.id, checked);
  } catch (error) {
    record.petPool.shelf = previous;
    throw error;
  }
}

void loadData(true);
</script>

<template>
  <Page title="宠物池">
    <Card>
      <div class="toolbar">
        <SysOriginSelect
          v-model:value="query.sysOrigin"
          style="width: 140px"
          @change="handleSearch"

          :options="sysOriginOptions"
        ></SysOriginSelect>
        <Select
          v-model:value="query.shelf"
          :options="shelfOptions"
          option-label-prop="label"
          style="width: 140px"
          @change="handleSearch"
        />
        <Button :loading="loading" type="primary" @click="handleSearch">
          搜索
        </Button>
        <Button @click="openCreate">添加</Button>
      </div>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        :row-key="getRowKey"
        :scroll="{ x: 1700 }"
      >
        <template #expandedRowRender="{ record }">
          <div class="expanded-layout">
            <Card :bordered="false" size="small" title="宠物信息">
              <Descriptions :column="2" bordered size="small">
                <DescriptionsItem label="ID">
                  {{ record.petPool?.id || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="编号">
                  {{ record.petPool?.petCode || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="名称">
                  {{ record.petPool?.petName || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="序号">
                  {{ record.petPool?.level || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="上/下架状态">
                  {{ record.petPool?.shelf ? '上架' : '下架' }}
                </DescriptionsItem>
                <DescriptionsItem label="奖励组">
                  {{ record.petPool?.rewardGroupId || '-' }}
                </DescriptionsItem>
              </Descriptions>
            </Card>

            <Card :bordered="false" size="small" title="阶段配置">
              <div class="stage-list">
                <Card
                  v-for="(item, index) in record.petStages || []"
                  :key="`${record.petPool?.id || 'pet'}-stage-${index}`"
                  :bordered="true"
                  size="small"
                >
                  <template #title>
                    {{ Number(index) + 1 }} / {{ item.level || '-' }}
                  </template>
                  <Descriptions :column="2" bordered size="small">
                    <DescriptionsItem label="喂养次数">
                      {{ item.upgradeFeedingNum ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="喂养粮食数">
                      {{ item.foodFeedingNum ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="产生收益">
                      {{ item.revenue ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="收益数量">
                      {{ item.revenueNum ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="收益间隔分钟">
                      {{ item.revenueIntervalMinute ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="喂食间隔分钟">
                      {{ item.feedingIntervalMinute ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="免费喂食次数">
                      {{ item.freeFeedingNum ?? 0 }}
                    </DescriptionsItem>
                    <DescriptionsItem label="喂养加速粮食">
                      {{ item.accelerateFeed ?? 0 }}
                    </DescriptionsItem>
                  </Descriptions>
                </Card>
              </div>
            </Card>

            <Card :bordered="false" size="small" title="解锁条件">
              <Space wrap>
                <Tag
                  v-for="(item, index) in record.petUnlockConditions || []"
                  :key="`${record.petPool?.id || 'pet'}-condition-${index}`"
                  color="processing"
                >
                  {{ getPetUnlockConditionText(item) }}
                </Tag>
              </Space>
            </Card>

            <Card :bordered="false" size="small" title="养成奖励">
              <RewardConfigList :list="record.rewards?.rewardConfigList || []" />
            </Card>
          </div>
        </template>

        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sysOrigin'">
            <SysOriginLabel :value="record.petPool?.sysOrigin" />
          </template>
          <template v-else-if="column.key === 'stages'">
            <PetStageGallery :list="record.petStages || []" />
          </template>
          <template v-else-if="column.key === 'unlock'">
            <div class="unlock-list">
              <Tag
                v-for="(item, index) in record.petUnlockConditions || []"
                :key="`${record.petPool?.id || 'pet'}-unlock-${index}`"
              >
                {{ getPetUnlockConditionText(item) }}
              </Tag>
            </div>
          </template>
          <template v-else-if="column.key === 'rewards'">
            <RewardConfigList :list="record.rewards?.rewardConfigList || []" />
          </template>
          <template v-else-if="column.key === 'level'">
            {{ record.petPool?.level || '-' }}
          </template>
          <template v-else-if="column.key === 'shelf'">
            <Switch
              v-model:checked="record.petPool.shelf"
              @change="(checked: boolean) => handleShelfStatusChange(record, checked)"
            />
          </template>
          <template v-else-if="column.key === 'time'">
            <div>创建: {{ formatDate(record.petPool?.createTime) }}</div>
            <div>修改: {{ formatDate(record.petPool?.updateTime || record.petPool?.createTime) }}</div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openEdit(record)">
              编辑
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
          @showSizeChange="handlePageChange"
        />
      </div>
    </Card>

    <PetPoolFormDrawer
      :open="formOpen"
      :row="activeRow"
      :sys-origin-options="sysOriginOptions"
      @close="formOpen = false"
      @success="loadData(true)"
    />
  </Page>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.expanded-layout {
  display: grid;
  gap: 12px;
}

.stage-list {
  display: grid;
  gap: 12px;
}

.unlock-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
