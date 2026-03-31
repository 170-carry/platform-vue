<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  addLuckyGiftProbabilityInfoConfig,
  gameLuckyGiftProbabilityInfoConfig,
} from '#/api/legacy/game-lucky-gift';

import {
  Alert,
  Button,
  Card,
  Drawer,
  Input,
  Space,
  message,
} from 'antdv-next';

defineOptions({ name: 'LuckyGiftProbabilityDrawer' });

const props = defineProps<{
  open: boolean;
  standardInfo: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();

const loading = ref(false);
const configList = ref<Array<Record<string, any>>>([]);

function createDefaultConfig() {
  return [1, 7, 77, 177, 777].map((giftQuantity, index) => ({
    comboIncrements: '',
    formInfo: {
      probabilityDetailsConfigList: [] as Array<Record<string, any>>,
      tmpConfigList: [] as Array<Record<string, any>>,
    },
    giftGiveTotal: '',
    giftQuantity,
    id: '',
    signTotal: '',
    sort: index,
    standardId: props.standardInfo?.id || '',
    sumProbability: 0,
    sysOrigin: props.standardInfo?.sysOrigin || '',
  }));
}

function recalcProbability(item: Record<string, any>) {
  item.sumProbability = (item.formInfo?.probabilityDetailsConfigList || []).reduce(
    (sum: number, detail: Record<string, any>) =>
      sum + Number(detail.probability || 0),
    0,
  );
}

async function loadData() {
  if (!props.open || !props.standardInfo?.id) {
    return;
  }
  loading.value = true;
  try {
    const result = await gameLuckyGiftProbabilityInfoConfig({
      standardId: props.standardInfo.id,
      sysOrigin: props.standardInfo.sysOrigin,
    });
    const nextList = createDefaultConfig();
    (result || []).forEach((item: Record<string, any>) => {
      const index = nextList.findIndex(
        (config) => Number(config.giftQuantity) === Number(item.giftQuantity),
      );
      if (index < 0) {
        return;
      }
      nextList[index] = {
        comboIncrements: item.comboIncrements ?? '',
        formInfo: {
          probabilityDetailsConfigList: (
            item.gameLuckyGiftProbabilityDetails || []
          ).map((detail: Record<string, any>) => ({ ...detail })),
          tmpConfigList: [],
        },
        giftGiveTotal: item.giftGiveTotal ?? '',
        giftQuantity: item.giftQuantity,
        id: item.id ?? '',
        signTotal: item.signTotal ?? '',
        sort: item.sort ?? nextList[index]?.sort ?? 0,
        standardId: item.standardId ?? props.standardInfo?.id ?? '',
        sumProbability: 0,
        sysOrigin: item.sysOrigin ?? props.standardInfo?.sysOrigin ?? '',
      };
      recalcProbability(nextList[index]);
    });
    configList.value = nextList;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.standardInfo?.id, props.standardInfo?.sysOrigin],
  () => {
    configList.value = createDefaultConfig();
    void loadData();
  },
  { immediate: true },
);

function appendDetail(item: Record<string, any>) {
  item.formInfo.tmpConfigList = [
    {
      multiple: '',
      probability: '',
      quantity: '',
    },
  ];
}

function removeDraft(item: Record<string, any>) {
  item.formInfo.tmpConfigList = [];
}

function pushDetail(item: Record<string, any>, draft: Record<string, any>) {
  if (!draft.multiple || !draft.probability) {
    message.warning('倍数和概率不能为空');
    return;
  }
  item.formInfo.probabilityDetailsConfigList.push({
    multiple: Number(draft.multiple),
    probability: Number(draft.probability),
    quantity: Number(draft.quantity || 0),
  });
  item.formInfo.tmpConfigList = [];
  recalcProbability(item);
}

function removeDetail(item: Record<string, any>, index: number) {
  item.formInfo.probabilityDetailsConfigList.splice(index, 1);
  recalcProbability(item);
}

async function saveItem(item: Record<string, any>) {
  if (Number(item.comboIncrements) < 0) {
    message.error('用户亏钱连击次数不能小于0');
    return;
  }
  if (Number(item.giftGiveTotal) < 0) {
    message.error('累计送礼次数不能小于0');
    return;
  }
  if (Number(item.signTotal) <= 0) {
    message.error('总签数必须大于0');
    return;
  }
  if ((item.formInfo.probabilityDetailsConfigList || []).length === 0) {
    message.error('请先配置概率明细');
    return;
  }
  recalcProbability(item);
  if (Number(item.sumProbability) !== 10000) {
    message.error('概率总和必须等于10000');
    return;
  }
  const signTotal = Number(item.signTotal || 0);
  const detailSigns = item.formInfo.probabilityDetailsConfigList.reduce(
    (sum: number, detail: Record<string, any>) =>
      sum + Math.floor((Number(detail.probability || 0) / 10000) * signTotal),
    0,
  );
  if (detailSigns !== signTotal) {
    message.error(`明细签数(${detailSigns})必须等于总签数(${signTotal})`);
    return;
  }

  loading.value = true;
  try {
    await addLuckyGiftProbabilityInfoConfig({
      gameLuckyGiftProbability: {
        comboIncrements: Number(item.comboIncrements || 0),
        giftGiveTotal: Number(item.giftGiveTotal || 0),
        giftQuantity: item.giftQuantity,
        id: item.id || '',
        signTotal,
        sort: item.sort,
        standardId: props.standardInfo?.id,
        sysOrigin: props.standardInfo?.sysOrigin,
      },
      gameLuckyGiftProbabilityDetails:
        item.formInfo.probabilityDetailsConfigList.map((detail: Record<string, any>) => ({
          multiple: Number(detail.multiple || 0),
          probability: Number(detail.probability || 0),
          quantity: Number(detail.quantity || 0),
        })),
    });
    message.success('保存成功');
    await loadData();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="`概率配置(${standardInfo?.remarks || '-'})`"
    destroy-on-close
    placement="right"
    width="calc(100vw - 64px)"
    @close="emit('close')"
  >
    <div class="config-grid">
      <Card
        v-for="item in configList"
        :key="item.giftQuantity"
        class="config-card"
        :loading="loading"
        :title="`数量：${item.giftQuantity}`"
      >
        <template #extra>
          <Button size="small" type="link" @click="saveItem(item)">保存</Button>
        </template>

        <Alert
          v-if="item.sumProbability < 10000"
          :message="`概率还差 ${10000 - item.sumProbability} 凑满10000`"
          show-icon
          type="warning"
        />
        <Alert
          v-else-if="item.sumProbability === 10000"
          message="概率已拼凑完整"
          show-icon
          type="success"
        />
        <Alert
          v-else
          :message="`概率已超过 ${item.sumProbability - 10000}，请调整`"
          show-icon
          type="error"
        />

        <div class="basic-grid">
          <div class="field">
            <label>用户亏钱连击次数</label>
            <Input v-model:value="item.comboIncrements" />
          </div>
          <div class="field">
            <label>累计送礼次数</label>
            <Input v-model:value="item.giftGiveTotal" />
          </div>
          <div class="field">
            <label>总签数</label>
            <Input v-model:value="item.signTotal" />
          </div>
        </div>

        <div class="section-title">概率明细</div>
        <div class="detail-list">
          <div
            v-for="(detail, index) in item.formInfo.probabilityDetailsConfigList"
            :key="`${item.giftQuantity}-${index}`"
            class="detail-row"
          >
            <div class="detail-index">{{ Number(index) + 1 }}</div>
            <Input v-model:value="detail.multiple" placeholder="倍数" />
            <Input
              v-model:value="detail.probability"
              placeholder="概率"
              @input="recalcProbability(item)"
            />
            <div class="detail-signs">
              签数: {{ Math.floor((Number(detail.probability || 0) / 10000) * Number(item.signTotal || 0)) }}
            </div>
            <Button danger size="small" type="link" @click="removeDetail(item, Number(index))">
              删除
            </Button>
          </div>
        </div>

        <div v-if="item.formInfo.tmpConfigList.length > 0" class="draft-row">
          <template v-for="(draft, index) in item.formInfo.tmpConfigList" :key="index">
            <Input v-model:value="draft.multiple" placeholder="倍数" />
            <Input v-model:value="draft.probability" placeholder="概率" />
            <Input v-model:value="draft.quantity" placeholder="数量(可选)" />
            <Space>
              <Button size="small" @click="removeDraft(item)">取消</Button>
              <Button size="small" type="primary" @click="pushDetail(item, draft)">
                加入
              </Button>
            </Space>
          </template>
        </div>
        <Button
          v-else
          size="small"
          type="dashed"
          @click="appendDetail(item)"
        >
          添加概率详情
        </Button>
      </Card>
    </div>
  </Drawer>
</template>

<style scoped>
.config-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
}

.config-card {
  min-height: 100%;
}

.basic-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin: 16px 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label,
.section-title {
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.section-title {
  margin-bottom: 12px;
}

.detail-list,
.draft-row {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row,
.draft-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: 40px 1fr 1fr 120px auto;
}

.detail-index {
  align-items: center;
  background: #f1f5f9;
  border-radius: 999px;
  display: flex;
  font-weight: 600;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.detail-signs {
  color: #475569;
  font-size: 13px;
}

@media (max-width: 960px) {
  .detail-row,
  .draft-row {
    grid-template-columns: 1fr;
  }
}
</style>
