<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Button, Drawer, Image, Tag, TextArea, message } from 'antdv-next';

import {
  approvalMoneyApply,
  getBankWithdrawMoneyApply,
} from '#/api/legacy/operate';
import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';

import { copyText, normalizeCredentialValue } from '../shared';
import UserProfileLink from './user-profile-link.vue';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  approved: [Record<string, any>];
}>();

const fileInputs = ref<Array<HTMLInputElement | null>>([]);
const uploadingIndex = ref<number | null>(null);
const submitting = ref(false);
const form = reactive({
  approvalStatus: '',
  credential: [] as string[],
  id: '',
  remark: '',
});

const certificates = ref<string[]>(['', '', '', '']);

watch(
  () => props.row,
  (value) => {
    form.id = String(value?.id || '');
    form.approvalStatus = String(value?.latestApprovalStatus || '');
    form.remark = String(value?.remark || '');
    certificates.value = ['', '', '', ''];
    const list = Array.isArray(value?.settlementResult?.credential)
      ? value.settlementResult.credential
      : [];
    list.slice(0, 4).forEach((item: any, index: number) => {
      certificates.value[index] = normalizeCredentialValue(item);
    });
  },
  { immediate: true },
);

function setFileInput(el: any, index: number) {
  fileInputs.value[index] = el as HTMLInputElement | null;
}

function openUpload(index: number) {
  fileInputs.value[index]?.click();
}

async function handleFileChange(index: number, event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) {
    return;
  }
  uploadingIndex.value = index;
  try {
    const result = await simpleUploadFile(file, OSS_FILE_BUCKETS.back);
    certificates.value[index] = getAccessImgUrl(result.name);
    message.success('上传成功');
  } finally {
    uploadingIndex.value = null;
    target.value = '';
  }
}

function clearCertificate(index: number) {
  certificates.value[index] = '';
}

async function handleCopyBankCard() {
  const bankCard = props.row?.settlementResult?.acceptBankCard;
  if (!bankCard) {
    return;
  }
  await copyText(
    `卡号: ${bankCard.cardNo || '?'}, 收款人: ${bankCard.payee || '?'}, 银行: ${bankCard.cardName || '?'}`,
  );
}

async function submit(approvalStatus: string) {
  const credential = certificates.value.filter(Boolean);
  if (approvalStatus === 'PASS' && credential.length <= 0) {
    message.warning('请上传转账凭证, 请稍等!');
    return;
  }
  if (!form.id) {
    return;
  }
  submitting.value = true;
  try {
    await approvalMoneyApply({
      approvalStatus,
      credential,
      id: form.id,
      remark: form.remark,
    });
    const nextRow = await getBankWithdrawMoneyApply(form.id);
    message.success('操作成功');
    emit('approved', nextRow);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="审核提现申请"
    width="760px"
    @close="emit('close')"
  >
    <div class="approval-content">
      <section class="section">
        <div class="section-title">提交人</div>
        <div class="section-card">
          <UserProfileLink :profile="row?.submitUser" />
        </div>
      </section>

      <section v-if="row?.settlementResult?.acceptBankCard" class="section">
        <div class="section-title">银行卡</div>
        <div class="section-card">
          <div class="bank-card-row">
            <Tag>卡号: {{ row?.settlementResult?.acceptBankCard?.cardNo || '-' }}</Tag>
            <Tag>收款人: {{ row?.settlementResult?.acceptBankCard?.payee || '-' }}</Tag>
            <Tag>银行: {{ row?.settlementResult?.acceptBankCard?.cardName || '-' }}</Tag>
            <Button size="small" type="link" @click="handleCopyBankCard">
              复制
            </Button>
          </div>
          <Tag
            v-if="row?.settlementResult?.acceptBankCard?.del"
            color="error"
          >
            该银行卡已被用户删除
          </Tag>
        </div>
      </section>

      <section class="section">
        <div class="section-title">结算</div>
        <div class="section-card">
          <div class="amount-row">提现金额: {{ row?.amount || 0 }}</div>
          <div class="tips">
            <p>* 转账凭证: 结算人员发送美元或其他币种后的记录凭证截图</p>
            <p>* 备注: 本次账单备注, 对外显示</p>
          </div>

          <div class="upload-grid">
            <div
              v-for="(_, index) in 4"
              :key="index"
              class="upload-card"
            >
              <input
                :ref="(el) => setFileInput(el, index)"
                accept="image/*"
                class="upload-input"
                type="file"
                @change="handleFileChange(index, $event)"
              >
              <template v-if="certificates[index]">
                <Image :src="certificates[index]" class="upload-image" />
                <div class="upload-actions">
                  <Button
                    :loading="uploadingIndex === index"
                    size="small"
                    @click="openUpload(index)"
                  >
                    重传
                  </Button>
                  <Button size="small" @click="clearCertificate(index)">
                    删除
                  </Button>
                </div>
              </template>
              <template v-else>
                <Button
                  :loading="uploadingIndex === index"
                  block
                  @click="openUpload(index)"
                >
                  上传凭证 {{ index + 1 }}
                </Button>
              </template>
            </div>
          </div>

          <div class="remark-block">
            <div class="remark-label">对外备注</div>
            <TextArea
              v-model:value="form.remark"
              :maxlength="100"
              :rows="5"
              placeholder="请输入对外备注"
              show-count
            />
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="footer">
        <Button :disabled="submitting" @click="emit('close')">取消</Button>
        <Button :disabled="submitting" :loading="submitting" @click="submit('PASS')">
          通过
        </Button>
        <Button
          :disabled="submitting"
          :loading="submitting"
          type="primary"
          @click="submit('NOT_PASS')"
        >
          驳回
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
.approval-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 600;
}

.section-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
}

.bank-card-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.amount-row {
  color: #2563eb;
  font-size: 16px;
  font-weight: 600;
}

.tips {
  color: #64748b;
  font-size: 12px;
  margin-top: 10px;
}

.tips p {
  margin: 0 0 4px;
}

.upload-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.upload-card {
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  min-height: 180px;
  padding: 12px;
}

.upload-input {
  display: none;
}

.upload-image {
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
}

.upload-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.remark-block {
  margin-top: 16px;
}

.remark-label {
  font-weight: 600;
  margin-bottom: 8px;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
