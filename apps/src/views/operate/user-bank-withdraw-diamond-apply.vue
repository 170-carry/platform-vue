<script lang="ts" setup>
import WithdrawApplyListBase from './withdraw-apply-list-base.vue';

defineOptions({ name: 'OperateUserBankWithdrawDiamondApply' });
</script>

<template>
  <WithdrawApplyListBase
    amount-type="SALARY_DIAMOND"
    export-permission-code="withdraw-diamond-apply:table:export"
    title="用户银行卡提现钻石申请"
  />
</template>
