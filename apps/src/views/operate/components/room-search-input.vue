<script lang="ts" setup>
import { ref, watch } from 'vue';

import {
  getRoomProfileByRoomId,
  getRoomProfileBySysOriginAccount,
  listRoomProfileByAccount,
} from '#/api/legacy/room';

import {
  Button,
  Image,
  Input,
  Modal,
  Select,
  Tag,
} from 'antdv-next';

type RoomSelectType = 'LONG_ID' | 'SHORT_ID';

const ROOM_ID_TYPE_OPTIONS = [
  { label: '长ID', value: 'LONG_ID' },
  { label: '短ID', value: 'SHORT_ID' },
] satisfies Array<{ label: string; value: RoomSelectType }>;

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    roomId?: string;
    sysOrigin?: string;
  }>(),
  {
    placeholder: '请输入房间ID',
    roomId: '',
    sysOrigin: '',
  },
);

const emit = defineEmits<{
  closeSelectDialog: [];
  fail: [];
  load: [];
  success: [Record<string, any>];
}>();

const loading = ref(false);
const content = ref('');
const selectType = ref<RoomSelectType>('SHORT_ID');
const failMessage = ref('');
const failShow = ref(false);
const matchedRoom = ref<Record<string, any> | null>(null);
const roomProfiles = ref<Array<Record<string, any>>>([]);
const selectDialogOpen = ref(false);

watch(
  () => props.roomId,
  (value) => {
    if (!value) {
      return;
    }
    content.value = value;
    if (String(value).length > 15) {
      selectType.value = 'LONG_ID';
      return;
    }
    selectType.value = 'SHORT_ID';
    void clickSearch();
  },
  { immediate: true },
);

function handleClose() {
  emit('closeSelectDialog');
  selectDialogOpen.value = false;
}

function handleSelected(item: Record<string, any>) {
  matchedRoom.value = item;
  selectDialogOpen.value = false;
  emit('success', item);
}

function emitFail(show = true, message = '') {
  roomProfiles.value = [];
  matchedRoom.value = null;
  failShow.value = show;
  failMessage.value = message;
  emit('fail');
}

function normalizeRoomProfiles(result: any) {
  if (Array.isArray(result)) {
    return result;
  }
  if (!result) {
    return [];
  }
  return [result];
}

async function searchRoom(type: RoomSelectType, id: string) {
  if (type === 'LONG_ID') {
    return normalizeRoomProfiles(await getRoomProfileByRoomId(id));
  }
  if (props.sysOrigin) {
    return normalizeRoomProfiles(
      await getRoomProfileBySysOriginAccount(props.sysOrigin, id),
    );
  }
  return normalizeRoomProfiles(await listRoomProfileByAccount(id));
}

async function clickSearch() {
  emit('load');
  failShow.value = false;
  failMessage.value = '';
  if (!content.value) {
    emitFail(false);
    return;
  }
  if (!/^\d+$/.test(content.value)) {
    emitFail(true, '输入内容必须是正整数!');
    return;
  }
  if (
    matchedRoom.value &&
    String(matchedRoom.value.roomAccount || matchedRoom.value.id || '') ===
      content.value
  ) {
    emit('success', matchedRoom.value);
    return;
  }

  loading.value = true;
  try {
    const list = await searchRoom(selectType.value, content.value);
    if (list.length <= 0) {
      emitFail(true, '没有找到房间信息!');
      return;
    }
    if (list.length === 1) {
      matchedRoom.value = list[0];
      emit('success', list[0]);
      return;
    }
    failShow.value = false;
    roomProfiles.value = list;
    selectDialogOpen.value = true;
  } catch {
    emitFail(true, '请求数据错误!');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="search-room-input">
    <div class="search-control" :class="{ fail: failShow, success: matchedRoom }">
      <Select
        v-model:value="selectType"
        :options="ROOM_ID_TYPE_OPTIONS"
        class="type-select"
        @change="clickSearch"
      />
      <Input
        v-model:value="content"
        :placeholder="placeholder"
        @blur="clickSearch"
        @press-enter="clickSearch"
      />
      <Button :loading="loading" @click="clickSearch">校验</Button>
    </div>

    <div v-if="failShow && failMessage" class="search-tip search-tip--fail">
      {{ failMessage }}
    </div>
    <div v-else-if="matchedRoom" class="search-tip search-tip--success">
      已匹配: {{ matchedRoom.roomName || matchedRoom.id || '-' }}
      <span v-if="matchedRoom.sysOrigin"> / {{ matchedRoom.sysOrigin }}</span>
    </div>

    <Modal
      :open="selectDialogOpen"
      title="房间搜索"
      width="720px"
      @cancel="handleClose"
    >
      <div class="select-room">
        <div
          v-for="item in roomProfiles"
          :key="`${item.id}-${item.sysOrigin}`"
          class="room-item"
        >
          <Image
            :preview="false"
            :src="item.roomCover || 'https://dummyimage.com/40x40/e2e8f0/64748b&text=R'"
            class="room-cover"
          />
          <div class="room-copy">
            <div class="room-title-row">
              <Tag v-if="item.sysOrigin">{{ item.sysOrigin }}</Tag>
              <span class="room-name">{{ item.roomName || '-' }}</span>
            </div>
            <div class="room-meta">房间ID {{ item.id || '-' }}</div>
          </div>
          <Button type="link" @click="handleSelected(item)">选择</Button>
        </div>
      </div>

      <template #footer>
        <Button @click="handleClose">关闭</Button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.search-control {
  display: grid;
  gap: 8px;
  grid-template-columns: 100px minmax(0, 1fr) auto;
}

.search-control.success :deep(.ant-input) {
  border-color: #16a34a;
}

.search-control.fail :deep(.ant-input) {
  border-color: #dc2626;
}

.search-tip {
  font-size: 12px;
  margin-top: 6px;
}

.search-tip--fail {
  color: #dc2626;
}

.search-tip--success {
  color: #16a34a;
}

.room-item {
  align-items: center;
  display: flex;
  gap: 12px;
  padding: 10px 0;
}

.room-item + .room-item {
  border-top: 1px solid #e2e8f0;
}

.room-cover {
  border-radius: 999px;
  height: 40px;
  overflow: hidden;
  width: 40px;
}

.room-copy {
  flex: 1;
  min-width: 0;
}

.room-title-row {
  align-items: center;
  display: flex;
  gap: 8px;
}

.room-name {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-meta {
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}
</style>
