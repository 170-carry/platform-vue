<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';

import { listEmojiGroupsBySysOrigin } from '#/api/legacy/app-system';
import { listBadgePictureBySysOrigin } from '#/api/legacy/badge';
import { listGiftBySysOrigin } from '#/api/legacy/gift';
import {
  listNotFamilyBySysOriginType,
  listSysOriginTypeList,
} from '#/api/legacy/props';

import {
  Drawer,
  Empty,
  Input,
  Select,
  Space,
  Spin,
} from 'antdv-next';

defineOptions({ name: 'OperatePropsSourceSelectDrawer' });

type SourceTypeOption = {
  label: string;
  value: string;
};

type SourceItem = {
  amount?: number | string;
  cover?: string;
  id: number | string;
  name: string;
  sourceUrl?: string;
  type: string;
};

const TYPE_OPTIONS: SourceTypeOption[] = [
  { label: '头像框', value: 'AVATAR_FRAME' },
  { label: '座驾', value: 'RIDE' },
  { label: '贵族', value: 'NOBLE_VIP' },
  { label: '主题背景', value: 'THEME' },
  { label: '礼物', value: 'GIFT' },
  { label: '用户徽章', value: 'BADGE' },
  { label: '房间徽章', value: 'ROOM_BADGE' },
  { label: '表情包', value: 'EMOJI' },
  { label: '聊天气泡', value: 'CHAT_BUBBLE' },
  { label: '飘窗', value: 'FLOAT_PICTURE' },
  { label: '碎片', value: 'FRAGMENTS' },
];

const typeSelectOptions = TYPE_OPTIONS.map((item) => ({
  label: item.label,
  value: item.value as any,
}));

const props = withDefaults(
  defineProps<{
    defaultType?: string;
    open: boolean;
    sysOrigin: string;
  }>(),
  {
    defaultType: 'AVATAR_FRAME',
  },
);

const emit = defineEmits<{
  close: [];
  select: [item: SourceItem];
}>();

const loading = ref(false);
const keyword = ref('');
const query = reactive({
  propsType: '',
});

const sourceCache = reactive<
  Record<string, { list: SourceItem[]; loaded: boolean; loading: boolean }>
>({});

function ensureStore(type: string) {
  if (!sourceCache[type]) {
    sourceCache[type] = {
      list: [],
      loaded: false,
      loading: false,
    };
  }
  return sourceCache[type];
}

const currentList = computed(() => {
  const list = sourceCache[query.propsType]?.list || [];
  const target = keyword.value.trim().toLowerCase();
  if (!target) {
    return list;
  }
  return list.filter(
    (item) =>
      String(item.id).toLowerCase().includes(target) ||
      String(item.name || '').toLowerCase().includes(target),
  );
});

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return;
    }
    query.propsType = props.defaultType || 'AVATAR_FRAME';
    keyword.value = '';
    void loadSource(query.propsType);
  },
  { immediate: true },
);

watch(
  () => props.defaultType,
  (value) => {
    if (!props.open || !value) {
      return;
    }
    query.propsType = value;
    void loadSource(value);
  },
);

watch(
  () => props.sysOrigin,
  () => {
    Object.keys(sourceCache).forEach((key) => {
      delete sourceCache[key];
    });
    if (props.open && query.propsType) {
      void loadSource(query.propsType);
    }
  },
);

async function loadSource(type: string) {
  if (!type || !props.sysOrigin) {
    return;
  }
  const store = ensureStore(type);
  if (store.loaded || store.loading) {
    return;
  }
  store.loading = true;
  loading.value = true;
  try {
    if (type === 'GIFT') {
      const result = await listGiftBySysOrigin(props.sysOrigin);
      store.list = (result || []).map((item) => ({
        amount: item.giftCandy,
        cover: item.giftPhoto,
        id: item.id,
        name: item.giftName,
        sourceUrl: item.giftSourceUrl,
        type,
      }));
    } else if (type === 'EMOJI') {
      const result = await listEmojiGroupsBySysOrigin(props.sysOrigin);
      store.list = (result || []).map((item) => ({
        amount: item.amount,
        cover: item.cover,
        id: item.id || '',
        name: item.groupName || '',
        sourceUrl: '',
        type,
      }));
    } else if (type === 'BADGE' || type === 'ROOM_BADGE') {
      const badgeType = type === 'BADGE' ? 'ACTIVITY' : 'ROOM_ACHIEVEMENT';
      const result = await listBadgePictureBySysOrigin(props.sysOrigin, badgeType);
      store.list = (result || []).map((item) => ({
        cover: item.selectUrl,
        id: item.badgeConfigId || '',
        name: item.badgeName || '',
        sourceUrl: item.animationUrl,
        type,
      }));
    } else if (type === 'NOBLE_VIP') {
      const result = await listNotFamilyBySysOriginType(props.sysOrigin, type);
      store.list = (result || []).map((item) => ({
        amount: item.amount,
        cover: item.cover,
        id: item.id || '',
        name: item.name || '',
        sourceUrl: item.sourceUrl,
        type,
      }));
    } else {
      const result = await listSysOriginTypeList(props.sysOrigin, type);
      store.list = (result || []).map((item) => ({
        amount: item.amount,
        cover: item.cover,
        id: item.id || '',
        name: item.name || '',
        sourceUrl: item.sourceUrl,
        type,
      }));
    }
    store.loaded = true;
  } finally {
    store.loading = false;
    loading.value = false;
  }
}

function handleTypeChange(value: string) {
  query.propsType = value;
  keyword.value = '';
  void loadSource(value);
}

function handleSelect(item: SourceItem) {
  emit('select', item);
}
</script>

<template>
  <Drawer
    :open="open"
    destroy-on-close
    title="选择道具"
    width="920"
    @close="emit('close')"
  >
    <Space class="toolbar" wrap>
      <Select
        v-model:value="query.propsType"
        :options="typeSelectOptions"
        option-label-prop="label"
        placeholder="请选择道具类型"
        style="width: 220px"
        @change="handleTypeChange"
      />
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="道具名称 / ID"
        style="width: 280px"
      />
    </Space>

    <Spin :spinning="loading">
      <div v-if="currentList.length > 0" class="source-grid">
        <button
          v-for="item in currentList"
          :key="`${item.type}-${item.id}`"
          class="source-card"
          type="button"
          @click="handleSelect(item)"
        >
          <div class="source-cover-wrap">
            <img
              :src="item.cover || 'https://dummyimage.com/88x88/e2e8f0/64748b&text=+'"
              alt=""
              class="source-cover"
            >
          </div>
          <div class="source-name">{{ item.name || '-' }}</div>
          <div class="source-meta">ID {{ item.id }}</div>
        </button>
      </div>
      <Empty v-else description="暂无可选资源" />
    </Spin>
  </Drawer>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.source-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
}

.source-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  padding: 12px;
  text-align: center;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.source-card:hover {
  border-color: #2563eb;
  box-shadow: 0 12px 24px rgb(37 99 235 / 12%);
  transform: translateY(-2px);
}

.source-cover-wrap {
  align-items: center;
  display: flex;
  height: 88px;
  justify-content: center;
  margin-bottom: 10px;
}

.source-cover {
  border-radius: 16px;
  height: 88px;
  object-fit: cover;
  width: 88px;
}

.source-name {
  font-weight: 600;
  line-height: 1.4;
  min-height: 40px;
  word-break: break-all;
}

.source-meta {
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
  word-break: break-all;
}
</style>
