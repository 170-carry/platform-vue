<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { DateRangePicker } from 'antdv-next';

import {
  listApiOperationLog } from '#/api/legacy/tools';
import InlineFilterField from '#/views/_shared/inline-filter-field.vue';
import InlineFilterToolbar from '#/views/_shared/inline-filter-toolbar.vue';
import { API_REQUEST_LOGS,
  formatDate } from '#/views/system/shared';

import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Table
} from 'antdv-next';

defineOptions({ name: 'AppSystemRequestLog' });

const loading = ref(false);
const list = ref<Array<Record<string, any>>>([]);
const notData = ref(false);
const loadMoreLoading = ref(false);
const detailsOpen = ref(false);
const jsonText = ref('');
const rangeDate = ref<[string, string] | null>(null);

const query = reactive({
  businessCode: API_REQUEST_LOGS[0]?.value ?? '',
  businessContent: '',
  cmdRegex: '',
  endTime: '',
  lastId: '',
  size: 20,
  startTime: '',
});

const columns = [
  { dataIndex: 'cmd', key: 'cmd', title: '日志内容' },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 180 },
  { dataIndex: 'actions', key: 'actions', title: '操作', width: 100 },
];

watch(rangeDate, (value) => {
  query.startTime = value?.[0] || '';
  query.endTime = value?.[1] || '';
});

async function loadData(reset = false) {
  if (reset) {
    list.value = [];
    query.lastId = '';
  }
  loading.value = true;
  try {
    const result = await listApiOperationLog({ ...query });
    const currentList = result || [];
    notData.value = currentList.length <= 0;
    if (currentList.length > 0) {
      list.value = [...list.value, ...currentList];
      query.lastId = String(currentList[currentList.length - 1]?.id || '');
    }
  } finally {
    loading.value = false;
    loadMoreLoading.value = false;
  }
}

function showDetails(record: Record<string, any>) {
  try {
    jsonText.value = JSON.stringify(
      record.cmd ? JSON.parse(record.cmd) : {},
      null,
      2,
    );
  } catch {
    jsonText.value = record.cmd || '{}';
  }
  detailsOpen.value = true;
}

loadData(true);
</script>

<template>
  <Page title="请求日志">
    <Card>
      <InlineFilterToolbar class="toolbar">
        <InlineFilterField label="业务类型" :label-width="84">
          <Select
            v-model:value="query.businessCode"
            option-label-prop="label"
            style="width: 220px"
            @change="loadData(true)"
          
            :options="API_REQUEST_LOGS.map((item) => ({ label: `${item.label}`, value: item.value as any }))"
          />
        </InlineFilterField>
        <InlineFilterField label="业务内容" :label-width="84">
          <Input
            v-model:value="query.businessContent"
            allow-clear
            placeholder="业务内容"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="业务命令匹配" :label-width="108">
          <Input
            v-model:value="query.cmdRegex"
            allow-clear
            placeholder="业务命令匹配"
            style="width: 220px"
          />
        </InlineFilterField>
        <InlineFilterField label="时间范围" :control-width="360">
          <DateRangePicker
            v-model:value="rangeDate"
            show-time
            value-format="x"
          />
        </InlineFilterField>
        <Button :loading="loading" type="primary" @click="loadData(true)">
          搜索
        </Button>
      </InlineFilterToolbar>

      <Table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cmd'">
            <div class="cmd-line">
              <span class="cmd-tag">用户</span>{{ record.requestUserId || '-' }}
              <span class="cmd-tag">内容</span>{{ record.cmd || '-' }}
            </div>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ formatDate(record.createTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="showDetails(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>

      <div v-if="query.lastId" class="load-more">
        <span v-if="notData">已加载全部</span>
        <Button
          v-else
          :loading="loadMoreLoading"
          size="small"
          @click="loadMoreLoading = true; loadData()"
        >
          加载更多
        </Button>
      </div>
    </Card>

    <Modal
      :open="detailsOpen"
      destroy-on-close
      title="命令内容"
      width="720"
      @cancel="detailsOpen = false"
      @ok="detailsOpen = false"
    >
      <pre class="json-box">{{ jsonText }}</pre>
    </Modal>
  </Page>
</template>

<style scoped>
.toolbar {
  margin-bottom: 16px;
}

.cmd-line {
  line-height: 1.8;
  white-space: normal;
}

.cmd-tag {
  background: rgb(37 99 235 / 10%);
  border-radius: 999px;
  color: rgb(37 99 235);
  display: inline-block;
  font-size: 12px;
  margin-right: 8px;
  padding: 0 8px;
}

.load-more {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.json-box {
  background: #0f172a;
  border-radius: 12px;
  color: #e2e8f0;
  margin: 0;
  max-height: 60vh;
  overflow: auto;
  padding: 16px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
