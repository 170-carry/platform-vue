<script lang="ts" setup>
import BankExchangeGoldListBase from './bank-exchange-gold-list-base.vue';

defineOptions({ name: 'OperateUserBankDiamondWithdrawGoldApply' });
</script>

<template>
  <BankExchangeGoldListBase
    amount-type="SALARY_DIAMOND"
    title="用户银行卡钻石兑换金币申请"
  />
</template>
