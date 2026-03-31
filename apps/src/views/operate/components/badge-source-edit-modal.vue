<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { useAccessStore } from '@vben/stores';

import {
  saveOrUpdateBadgePicture,
} from '#/api/legacy/badge';
import {
  getAccessImgUrl,
  simpleUploadFile,
} from '#/api/legacy/oss';
import { getAllowedSysOrigins } from '#/views/system/shared';

import {
  Button,
  Card,
  Drawer,
  Image,
  Space,
  Spin,
  message,
} from 'antdv-next';

defineOptions({ name: 'OperateBadgeSourceEditModal' });

type UploadField = 'animationUrl' | 'notSelectUrl' | 'selectUrl';

const props = defineProps<{
  open: boolean;
  row?: null | Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  success: [];
}>();

const accessStore = useAccessStore();
const sysOriginOptions = computed(() => {
  const options = getAllowedSysOrigins(accessStore.accessCodes || []);
  return options.length > 0 ? options : getAllowedSysOrigins([]);
});

const list = ref<Array<Record<string, any>>>([]);
const uploading = ref(false);
const imageInputRef = ref<HTMLInputElement | null>(null);
const sourceInputRef = ref<HTMLInputElement | null>(null);
const uploadTarget = ref<{ field: UploadField; index: number } | null>(null);

function buildRows(row?: Record<string, any> | null) {
  const pictureMap = new Map<string, Record<string, any>>();
  (row?.badgePictures || []).forEach((item: Record<string, any>) => {
    pictureMap.set(String(item.sysOrigin || ''), item);
  });
  return sysOriginOptions.value.map((item) => {
    const current = pictureMap.get(String(item.value)) || {};
    return {
      animationUrl: current.animationUrl || '',
      badgeConfigId: row?.id || '',
      notSelectUrl: current.notSelectUrl || '',
      selectUrl: current.selectUrl || '',
      sysOrigin: String(item.value),
    };
  });
}

watch(
  () => [props.open, props.row, sysOriginOptions.value.length],
  ([open]) => {
    if (!open) {
      return;
    }
    list.value = buildRows(props.row || null);
  },
  { immediate: true, deep: true },
);

function openUpload(index: number, field: UploadField) {
  uploadTarget.value = { field, index };
  if (field === 'animationUrl') {
    sourceInputRef.value?.click();
    return;
  }
  imageInputRef.value?.click();
}

async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file || !uploadTarget.value) {
    return;
  }
  const row = list.value[uploadTarget.value.index];
  if (!row?.badgeConfigId) {
    message.warning('请先保存徽章规则');
    return;
  }
  uploading.value = true;
  try {
    const result = await simpleUploadFile(file, 'other');
    const value =
      uploadTarget.value.field === 'animationUrl'
        ? getAccessImgUrl(result.name)
        : getAccessImgUrl(result.name);
    await saveOrUpdateBadgePicture({
      badgeConfigId: row.badgeConfigId,
      sysOrigin: row.sysOrigin,
      [uploadTarget.value.field]: value,
    });
    row[uploadTarget.value.field] = value;
    message.success('保存成功');
    emit('success');
  } finally {
    uploading.value = false;
  }
}

async function handleRemove(row: Record<string, any>, field: UploadField) {
  if (!row.badgeConfigId) {
    return;
  }
  uploading.value = true;
  try {
    await saveOrUpdateBadgePicture({
      badgeConfigId: row.badgeConfigId,
      sysOrigin: row.sysOrigin,
      [field]: '',
    });
    row[field] = '';
    message.success('已清空');
    emit('success');
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="编辑徽章资源"
    width="1080"
    @close="emit('close')"
  >
    <Spin :spinning="uploading">
      <div class="grid">
        <Card
          v-for="item in list"
          :key="item.sysOrigin"
          size="small"
          :title="`${item.sysOrigin} 徽章资源`"
        >
          <div class="row">
            <div class="field">
              <div class="field__label">选中图</div>
              <Image
                v-if="item.selectUrl"
                :src="item.selectUrl"
                class="preview"
              />
              <div v-else class="preview preview--empty">未上传</div>
              <Space>
                <Button size="small" @click="openUpload(list.indexOf(item), 'selectUrl')">
                  上传
                </Button>
                <Button
                  v-if="item.selectUrl"
                  danger
                  size="small"
                  @click="handleRemove(item, 'selectUrl')"
                >
                  清空
                </Button>
              </Space>
            </div>

            <div class="field">
              <div class="field__label">未选中图</div>
              <Image
                v-if="item.notSelectUrl"
                :src="item.notSelectUrl"
                class="preview"
              />
              <div v-else class="preview preview--empty">未上传</div>
              <Space>
                <Button size="small" @click="openUpload(list.indexOf(item), 'notSelectUrl')">
                  上传
                </Button>
                <Button
                  v-if="item.notSelectUrl"
                  danger
                  size="small"
                  @click="handleRemove(item, 'notSelectUrl')"
                >
                  清空
                </Button>
              </Space>
            </div>

            <div class="field">
              <div class="field__label">动画资源</div>
              <div class="source-name">
                {{ item.animationUrl || '未上传' }}
              </div>
              <Space>
                <Button size="small" @click="openUpload(list.indexOf(item), 'animationUrl')">
                  上传
                </Button>
                <Button
                  v-if="item.animationUrl"
                  danger
                  size="small"
                  @click="handleRemove(item, 'animationUrl')"
                >
                  清空
                </Button>
              </Space>
            </div>
          </div>
        </Card>
      </div>
    </Spin>

    <input
      ref="imageInputRef"
      accept="image/*"
      hidden
      type="file"
      @change="handleUpload"
    >
    <input
      ref="sourceInputRef"
      accept=".svga,.pag,.mp4"
      hidden
      type="file"
      @change="handleUpload"
    >
  </Drawer>
</template>

<style scoped>
.grid {
  display: grid;
  gap: 16px;
}

.row {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field {
  display: grid;
  gap: 10px;
}

.field__label {
  color: #475569;
  font-size: 13px;
}

.preview {
  border-radius: 12px;
  height: 120px;
  object-fit: cover;
  width: 120px;
}

.preview--empty {
  align-items: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  color: #94a3b8;
  display: flex;
  justify-content: center;
}

.source-name {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #475569;
  min-height: 60px;
  padding: 12px;
  word-break: break-all;
}

@media (max-width: 900px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
