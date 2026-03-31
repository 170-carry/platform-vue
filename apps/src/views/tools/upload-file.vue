<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  OSS_FILE_BUCKETS,
  getAccessImgUrl,
  randomFilename,
  simpleUploadFile,
} from '#/api/legacy/oss';

import { Button, Card, Empty, Space, Spin, Switch, message } from 'antdv-next';

defineOptions({ name: 'ToolsUploadFile' });

interface UploadResultItem {
  loading: boolean;
  name: string;
  showSourceName: boolean;
  sourceName: string;
  status: number;
  url: string;
}

const fileInputRef = ref<HTMLInputElement | null>(null);
const startCustomFilename = ref(true);
const dragging = ref(false);
const fileList = ref<UploadResultItem[]>([]);

const apkMaxSize = 100;
const otherMaxSize = 5;
const accept = 'image/*,.svga,.svg,.apk';

function getFileDir(fileName?: string) {
  const name = String(fileName || '').toLowerCase();
  if (!name) {
    return OSS_FILE_BUCKETS.back;
  }
  if (name.endsWith('.svga')) {
    return OSS_FILE_BUCKETS.svgaCover;
  }
  if (name.endsWith('.apk')) {
    return OSS_FILE_BUCKETS.apk;
  }
  return OSS_FILE_BUCKETS.back;
}

function validOverflowM(fileSize: number, targetSize: number) {
  return fileSize / 1024 / 1024 < targetSize;
}

function beforeUpload(file: File) {
  const maxSize = file.name.toLowerCase().endsWith('.apk')
    ? apkMaxSize
    : otherMaxSize;
  const fileSizeM = validOverflowM(file.size, maxSize);
  if (!fileSizeM) {
    message.error(`${file.name} 超出 ${maxSize}MB`);
    return false;
  }
  return true;
}

async function copyText(text?: string) {
  const value = String(text || '');
  if (!value) {
    message.warning('暂无可复制内容');
    return;
  }
  try {
    await navigator.clipboard.writeText(value);
    message.success('复制成功');
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.left = '-9999px';
    textarea.style.position = 'fixed';
    document.body.append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    message.success('复制成功');
  }
}

function openFileDialog() {
  fileInputRef.value?.click();
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files ? [...target.files] : [];
  processFiles(files);
  target.value = '';
}

function handleDrop(event: DragEvent) {
  dragging.value = false;
  const files = event.dataTransfer?.files ? [...event.dataTransfer.files] : [];
  processFiles(files);
}

function processFiles(files: File[]) {
  files.forEach((file) => {
    if (!beforeUpload(file)) {
      return;
    }
    void uploadFile(file);
  });
}

async function uploadFile(file: File) {
  const dir = getFileDir(file.name);
  const customFilename = startCustomFilename.value
    ? file.name
    : randomFilename(file.name);
  const item: UploadResultItem = {
    loading: true,
    name: `${dir}/${customFilename}`,
    showSourceName: !startCustomFilename.value,
    sourceName: file.name,
    status: 200,
    url: '',
  };
  fileList.value.push(item);

  try {
    const result = await simpleUploadFile(file, dir, customFilename);
    item.status = result.res?.status || 200;
    item.name = result.name || item.name;
    item.url = getAccessImgUrl(result.name || item.name);
  } catch (error) {
    console.error(error);
    item.status = 500;
  } finally {
    item.loading = false;
  }
}
</script>

<template>
  <Page title="文件上传">
    <Card>
      <div class="toolbar">
        <Space align="center" size="middle">
          <span class="switch-label">文件命名</span>
          <Switch
            v-model:checked="startCustomFilename"
            checked-children="原文件名"
            un-checked-children="系统创建"
          />
        </Space>
      </div>

      <input
        ref="fileInputRef"
        :accept="accept"
        class="hidden-input"
        multiple
        type="file"
        @change="handleFileChange"
      />

      <div
        class="dropzone"
        :class="{ 'dropzone-active': dragging }"
        @click="openFileDialog"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="dropzone-icon">+</div>
        <div class="dropzone-title">将文件拖到此处，或点击上传</div>
        <div class="dropzone-tip">
          只支持 img、svga、svg、apk，apk 不可超过 {{ apkMaxSize }}M，其他文件不可超过
          {{ otherMaxSize }}M
        </div>
        <Button type="primary">选择文件</Button>
      </div>

      <div class="result-list">
        <Empty v-if="fileList.length === 0" description="暂无上传记录" />
        <div v-for="(item, index) in fileList" :key="`${item.name}-${index}`" class="result-item">
          <div class="result-main">
            <div class="result-name">{{ item.name }}</div>
            <div v-if="item.showSourceName" class="result-source">{{ item.sourceName }}</div>
          </div>
          <div class="result-actions">
            <Spin v-if="item.loading" size="small" />
            <template v-else>
              <span v-if="item.status === 200" class="status-success">成功</span>
              <span v-else class="status-failed">失败</span>
              <Button size="small" type="link" @click="copyText(item.url)">复制链接</Button>
              <a v-if="item.url" :href="item.url" class="result-link" rel="noreferrer" target="_blank">
                查看文件
              </a>
            </template>
          </div>
        </div>
      </div>
    </Card>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.switch-label {
  color: #475569;
  font-size: 14px;
}

.hidden-input {
  display: none;
}

.dropzone {
  align-items: center;
  background:
    linear-gradient(180deg, rgb(37 99 235 / 4%), rgb(37 99 235 / 1%)),
    #f8fbff;
  border: 1px dashed rgb(59 130 246 / 35%);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-height: 260px;
  padding: 32px 24px;
  text-align: center;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.dropzone:hover,
.dropzone-active {
  border-color: rgb(37 99 235 / 55%);
  box-shadow: 0 16px 40px rgb(37 99 235 / 10%);
  transform: translateY(-2px);
}

.dropzone-icon {
  align-items: center;
  background: rgb(37 99 235 / 10%);
  border-radius: 999px;
  color: #2563eb;
  display: flex;
  font-size: 28px;
  font-weight: 500;
  height: 64px;
  justify-content: center;
  width: 64px;
}

.dropzone-title {
  color: #0f172a;
  font-size: 18px;
  font-weight: 600;
}

.dropzone-tip {
  color: #64748b;
  line-height: 1.7;
  max-width: 620px;
}

.result-list {
  margin-top: 20px;
}

.result-item {
  align-items: center;
  background: #fff;
  border: 1px solid rgb(148 163 184 / 18%);
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 16px 18px;
}

.result-main {
  min-width: 0;
}

.result-name {
  color: #0f172a;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.result-source {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 6px;
}

.result-actions {
  align-items: center;
  display: flex;
  flex-shrink: 0;
  gap: 8px;
}

.status-success {
  color: #16a34a;
  font-size: 13px;
  font-weight: 500;
}

.status-failed {
  color: #dc2626;
  font-size: 13px;
  font-weight: 500;
}

.result-link {
  color: #1677ff;
  font-size: 14px;
}

@media (width <= 768px) {
  .result-item {
    align-items: flex-start;
    flex-direction: column;
  }

  .result-actions {
    flex-wrap: wrap;
  }
}
</style>
