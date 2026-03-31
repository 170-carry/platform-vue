<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useWindowSize } from '@vueuse/core';
import { useAccessStore } from '@vben/stores';

import { getAllowedSysOrigins } from '#/views/system/shared';

import LatestPurchaseList from './components/latest-purchase-list.vue';
import OnlineUserCountOrigin from './components/online-user-count-origin.vue';
import PurchaseCount from './components/purchase-count.vue';

defineOptions({ name: 'StatisticsDatav' });

const accessStore = useAccessStore();
const { width } = useWindowSize();

const datavFullscreen = ref<HTMLElement>();
const fullscreen = ref(false);

const mobile = computed(() => width.value < 768);
const accessCodes = computed(() => accessStore.accessCodes || []);
const permissionsSysOriginCode = computed(() => {
  const options = getAllowedSysOrigins(accessCodes.value);
  const finalOptions = options.length > 0 ? options : getAllowedSysOrigins([]);
  return finalOptions.map((item) => String(item.value || ''));
});

function hasPermission(code: string) {
  const codes = accessCodes.value;
  return codes.length === 0 || codes.includes(code);
}

const canQuery = computed(() => hasPermission('datav:query'));
const canPaidPreview = computed(() => hasPermission('datav:paid:preview'));

function syncFullscreenState() {
  fullscreen.value = document.fullscreenElement === datavFullscreen.value;
}

async function screen() {
  const element = datavFullscreen.value;
  if (!element) {
    return;
  }
  if (document.fullscreenElement === element) {
    await document.exitFullscreen();
    return;
  }
  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }
  await element.requestFullscreen();
}

onMounted(() => {
  document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>

<template>
  <div class="app-container-datav">
    <div
      ref="datavFullscreen"
      :class="[
        'office-efficiency-index',
        fullscreen ? 'office-efficiency-index--fullscreen' : '',
      ]"
      @dblclick="screen"
    >
      <div v-if="!mobile" class="office-header">
        <div class="title-info">数据大屏</div>
      </div>
      <div class="analysis-info">实时数据预览</div>

      <div v-if="canQuery" class="office-content">
        <div class="office-content__left">
          <section class="col-info">
            <div class="title">购买用户</div>
            <div class="content">
              <LatestPurchaseList :sys-origin-codes="permissionsSysOriginCode" />
            </div>
          </section>
        </div>

        <div class="office-content__right">
          <section v-if="canPaidPreview" class="col-info">
            <div class="title">今日付费预览</div>
            <div class="content">
              <PurchaseCount />
            </div>
          </section>

          <section class="col-info">
            <div class="title">Likei在线</div>
            <div class="content">
              <OnlineUserCountOrigin origin="LIKEI" />
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-container-datav {
  background-color: #22284a;
  border-radius: 20px;
  min-height: calc(100vh - 120px);
  overflow: hidden;
}

.office-efficiency-index {
  background:
    radial-gradient(circle at top left, rgba(49, 86, 173, 0.35), transparent 40%),
    radial-gradient(circle at top right, rgba(3, 194, 236, 0.12), transparent 36%),
    #22284a;
  color: #fff;
  min-height: inherit;
  padding: 20px;
}

.office-efficiency-index--fullscreen {
  border-radius: 0;
  min-height: 100vh;
  padding: 24px;
}

.office-header {
  background: url('../../assets/datav/office_efficiency_header_bg.png')
    no-repeat center center;
  background-size: 100% 100%;
  padding: 18px 20px 10px;
}

.title-info {
  color: #03c2ec;
  font-family: PingFangSC-Semibold, 'PingFang SC', sans-serif;
  font-size: clamp(26px, 3vw, 36px);
  font-weight: 600;
  line-height: 1.4;
  text-align: center;
}

.analysis-info {
  background-image: linear-gradient(#d8ae22, #dc9546);
  color: transparent;
  font-size: 18px;
  font-weight: 600;
  margin-top: 12px;
  padding: 0 12px;
  -webkit-background-clip: text;
  background-clip: text;
}

.office-content {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(320px, 0.95fr) minmax(0, 2.1fr);
  margin-top: 20px;
}

.office-content__left,
.office-content__right {
  display: grid;
  gap: 20px;
}

.col-info {
  background: rgba(24, 28, 65, 0.96);
  border: 1px solid rgba(86, 114, 195, 0.28);
  border-radius: 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.title {
  color: #03c2ec;
  font-size: clamp(22px, 2vw, 30px);
  font-weight: 600;
  padding: 22px 24px 12px;
}

.content {
  color: #fff;
  padding: 0 24px 24px;
}

@media (max-width: 1200px) {
  .office-content {
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.7fr);
  }
}

@media (max-width: 960px) {
  .app-container-datav {
    border-radius: 16px;
    min-height: calc(100vh - 88px);
  }

  .office-efficiency-index {
    padding: 16px;
  }

  .office-content {
    grid-template-columns: 1fr;
  }

  .title {
    padding: 18px 18px 12px;
  }

  .content {
    padding: 0 18px 18px;
  }
}
</style>
