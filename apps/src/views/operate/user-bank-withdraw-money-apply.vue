<script lang="ts" setup>
import WithdrawApplyListBase from './withdraw-apply-list-base.vue';

defineOptions({ name: 'OperateUserBankWithdrawMoneyApply' });
</script>

<template>
  <WithdrawApplyListBase
    export-permission-code="withdraw-money-apply:table:export"
    title="用户银行卡提现现金申请"
  />
</template>
