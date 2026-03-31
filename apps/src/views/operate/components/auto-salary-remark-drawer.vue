<script lang="ts" setup>
import { Drawer, Empty, Timeline, TimelineItem } from 'antdv-next';

const props = defineProps<{
  open: boolean;
  row: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Drawer
    :open="open"
    title="详情"
    width="640px"
    @close="emit('close')"
  >
    <div class="remark-content">
      <Timeline
        v-if="Array.isArray(row?.remarks) && row.remarks.length > 0"
        reverse
      >
        <TimelineItem
          v-for="(item, index) in row.remarks"
          :key="item.id || index"
          :label="item.createTime || '-'"
        >
          <div class="remark-item">
            {{ item.remark || '-' }}
          </div>
        </TimelineItem>
      </Timeline>
      <Empty v-else description="暂无内部备注" />
    </div>
  </Drawer>
</template>

<style scoped>
.remark-content {
  padding-top: 8px;
}

.remark-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}
</style>
