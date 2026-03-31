export const PAY_CHANNEL_GROUP_OPTIONS = [
  { value: 'UPI', name: 'UPI' },
  { value: 'ELECTRONIC_WALLET', name: '电子钱包' },
  { value: 'BANK_CARD', name: '银行卡' },
  { value: 'BANK_CARD_TRANSFER', name: '银行卡转账' },
  { value: 'OFFLINE_NONBANK_OUTLETS', name: '线下非银网点' },
  { value: 'CARRIER_BILLING', name: '运营商计费' },
  { value: 'ONLINE_BANKING', name: '网上银行' },
  { value: 'QUICK_PAYMENT', name: '快捷支付' },
  { value: 'DELAYED_PAYMENT', name: '延迟支付' },
  { value: 'E_WALLET', name: 'E-wallet' },
  { value: 'UNSECURED_PAYMENT', name: '无密支付' },
  { value: 'CONVENIENCE_STORE', name: '便利店' },
  { value: 'POINT_CARD_PAYMENT', name: '点卡支付' },
  { value: 'SUPER_BUSINESS_BARCODE', name: '超商条码' },
  { value: 'MOBILE_OR_PHONE_PAYMENT', name: '行动/电话小额付' },
  { value: 'PHYSICAL_ATM', name: '实体ATM' },
  { value: 'ATM_ONLINE', name: 'ATM线上' },
  { value: 'ATM_OFFLINE', name: 'ATM线下' },
  { value: 'WEB_ATM', name: 'Web ATM' },
  { value: 'BANK_VIRTUAL_ACCOUNT', name: '银行虚拟账号' },
  { value: 'BANK_COUNTERS', name: '银行柜台' },
  { value: 'ININAL', name: '预付费卡' },
  { value: 'PAPARA', name: 'Papara' },
];

export const PAY_CHANNEL_GROUP_NAME_MAP = PAY_CHANNEL_GROUP_OPTIONS.reduce<
  Record<string, string>
>((result, item) => {
  result[item.value] = item.name;
  return result;
}, {});

export const WEB_PRODUCT_TYPE_OPTIONS = [
  { value: 'GOLD', name: '金币' },
  { value: 'FREIGHT_GOLD', name: '货运金币' },
  { value: 'FREIGHT_GOLD_SUPER', name: '超级货运' },
];

export function normalizeBooleanLabel(value: boolean) {
  return value ? '上架' : '下架';
}
