<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  getDynamicPopularConfig,
  saveDynamicPopularConfig,
} from '#/api/legacy/dynamic';

import {
  Button,
  Card,
  Form,
  FormItem,
  InputNumber,
  Modal,
  message,
} from 'antdv-next';

defineOptions({ name: 'DynamicPopularConfig' });

const loading = ref(false);
const saving = ref(false);

const form = reactive({
  commentScore: undefined as number | undefined,
  dynamicFees: undefined as number | undefined,
  levelLimit: undefined as number | undefined,
  likeScore: undefined as number | undefined,
  quantityLimit: undefined as number | undefined,
});

async function loadData() {
  loading.value = true;
  try {
    const result = await getDynamicPopularConfig();
    form.likeScore = result?.likeScore;
    form.commentScore = result?.commentScore;
    form.levelLimit = result?.levelLimit;
    form.quantityLimit = result?.quantityLimit;
    form.dynamicFees = result?.dynamicFees;
  } finally {
    loading.value = false;
  }
}

function handleSubmit() {
  Modal.confirm({
    title: '是否确定修改配置值?',
    async onOk() {
      saving.value = true;
      try {
        await saveDynamicPopularConfig({ ...form });
        message.success('保存成功');
        await loadData();
      } finally {
        saving.value = false;
      }
    },
  });
}

onMounted(loadData);
</script>

<template>
  <Page title="权重配置">
    <Card :loading="loading">
      <Form layout="vertical">
        <div class="section">
          <div class="section-title">热门动态权重计分设置</div>
          <div class="grid">
            <FormItem label="点赞增加分数">
              <InputNumber v-model:value="form.likeScore" :min="0" style="width: 100%" />
            </FormItem>
            <FormItem label="评论增加分数">
              <InputNumber v-model:value="form.commentScore" :min="0" style="width: 100%" />
            </FormItem>
          </div>
        </div>

        <div class="section">
          <div class="section-title">财富、魅力等级多少级才能发布动态</div>
          <FormItem label="等级限制">
            <InputNumber v-model:value="form.levelLimit" :min="0" style="width: 100%" />
          </FormItem>
        </div>

        <div class="section">
          <div class="section-title">每个用户当天允许发送多少条动态</div>
          <FormItem label="动态数量">
            <InputNumber v-model:value="form.quantityLimit" :min="0" style="width: 100%" />
          </FormItem>
        </div>

        <div class="section">
          <div class="section-title">
            用户当天发送动态数量达到限制后，继续发送每条动态支付多少金币
          </div>
          <FormItem label="金币数">
            <InputNumber v-model:value="form.dynamicFees" :min="0" style="width: 100%" />
          </FormItem>
        </div>

        <Button :loading="saving" type="primary" @click="handleSubmit">
          修改
        </Button>
      </Form>
    </Card>
  </Page>
</template>

<style scoped>
.section + .section {
  margin-top: 20px;
}

.section-title {
  background: rgb(37 99 235 / 6%);
  border-left: 3px solid #2563eb;
  border-radius: 10px;
  color: #1e293b;
  margin-bottom: 16px;
  padding: 12px 14px;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (width <= 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
