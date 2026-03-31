import dayjs from 'dayjs';

import type { Dayjs } from 'dayjs';

import { getAccessImgUrl } from '#/api/legacy/oss';

export const USER_BANK_WATER_EVENTS = [
  { value: 'WITHDRAW', name: '提现' },
  { value: 'TRANSFER', name: '转账' },
  { value: 'TRANSFER_GOLD', name: '转账金币' },
  { value: 'RECEIVE_TRANSFER', name: '接收转账' },
  { value: 'SYSTEM_SETTLEMENT_WAGES_AGENT', name: '结算代理工资' },
  { value: 'SYSTEM_SETTLEMENT_WAGES_MEMBER', name: '结算主播工资' },
  { value: 'EXCHANGE_GOLD_COINS', name: '兑换金币' },
  { value: 'BILL_EXCHANGE_GOLD_COINS', name: '账单兑换金币' },
  { value: 'SALARY_EXCHANGE_GOLD_COINS', name: '工资兑换金币' },
  { value: 'SYSTEM_SETTLEMENT_WAGES', name: '结算成员工资' },
  { value: 'SEND_SALARY', name: '后台导入' },
  { value: 'SYSTEM_DEDUCT', name: '系统扣除' },
  { value: 'SYSTEM_COMPENSATE', name: '系统补偿' },
  { value: 'CREATE_ACCOUNT', name: '创建银行账户' },
  { value: 'SYSTEM_AUTOMATIC_DEDUCT_SALARY', name: 'AUTO-扣除主播' },
  { value: 'SYSTEM_AUTOMATIC_DEDUCT_SALARY_AGENT', name: 'AUTO-扣除代理' },
  {
    value: 'SYSTEM_AUTOMATIC_DEDUCT_SALARY_AGENT_MEMBER',
    name: 'AUTO-扣除代理代收',
  },
  { value: 'SYSTEM_AUTOMATIC_SETTLEMENT_WAGES', name: 'AUTO-主播结算' },
  { value: 'SYSTEM_AUTOMATIC_SETTLEMENT_WAGES_AGENT', name: 'AUTO-代理结算' },
  { value: 'SYSTEM_AUTOMATIC_SETTLEMENT_WAGES_MEMBER', name: 'AUTO-代理代收' },
] as const;

export const BANK_ACCEPT_METHOD_OPTIONS = [
  { label: '自己', value: 'ONESELF' },
  { label: '代理', value: 'AGENT' },
  { label: 'BD', value: 'BD' },
  { label: '其他', value: 'OTHER' },
] as const;

export const WITHDRAW_APPROVAL_STATUS_OPTIONS = [
  { label: '用户提交', value: 'SUBMIT' },
  { label: '通过', value: 'PASS' },
  { label: '驳回', value: 'NOT_PASS' },
] as const;

export const BANK_EXCHANGE_ACCEPT_OPTIONS = [
  { label: '自己', value: 'GOLD' },
  { label: '货运代理账户', value: 'FREIGHT' },
] as const;

export const VIDEO_ORIGIN_OPTIONS = [
  { value: 'CLUB', name: 'Club聊天' },
  { value: 'VIDEO_ACTIVE_CALL', name: '视频电话' },
  { value: 'VIDEO_MATCH_ALL', name: '匹配所有' },
  { value: 'VIDEO_CONDITION_FEMALE', name: '匹配女生' },
  { value: 'VIDEO_CONDITION_GODDESS', name: '匹配女神' },
  { value: 'CHAT_CONSUME_CANDY', name: '文本聊天' },
  { value: 'GIFT', name: '赠送礼物' },
  { value: 'SHORT_VIDEO_WATCH_AD_SETTLE_ACCOUNTS', name: '短视频广告结算' },
] as const;

export const PROPS_ORIGIN_OPTIONS = [
  { value: 'CP_REWARD', name: 'CP奖励' },
  { value: 'CUMULATIVE_RECHARGE_REWARDS', name: '累计充值奖励' },
  { value: 'CUMULATIVE_RECHARGE', name: '累计充值' },
  { value: 'WEEK_STAR', name: '周星' },
  { value: 'ROOM_REWARD', name: '房间奖励' },
  { value: 'GAME_BURST_CRYSTAL', name: '爆水晶游戏' },
  { value: 'FIRST_CHARGE_REWARD', name: '首次充值' },
  { value: 'FAMILY_AWARD_RECEIVE', name: '家族每周宝箱奖励领取' },
  { value: 'WEEK_CP_GIFT', name: '每周CP相互赠送礼物榜单 ' },
  { value: 'ROOM_PK', name: '房间PK奖励' },
  { value: 'WEEK_USER_CONSUME', name: 'King国王王后' },
  { value: 'PET_REWARD', name: '宠物奖励' },
  { value: 'PET_TURNTABLE_LOTTERY', name: '宠物转盘抽奖' },
  { value: 'EGG', name: '砸金蛋' },
  { value: 'POKER', name: '扑克游戏' },
  { value: 'GAME_KING_AWARD', name: '游戏王奖励' },
  { value: 'WEEK_KING', name: '每周国王' },
  { value: 'WEEK_QUEEN', name: '每周王后' },
  { value: 'DAILY_REGISTER', name: '每日签到' },
  { value: 'LUCKY_GIFT_REWARD', name: '幸运礼物抽奖' },
  { value: 'INVITE_USER_REWARDS', name: '邀请用户奖励' },
  { value: 'WEEKLY_GAME_TASKS', name: '每周游戏任务奖励' },
  { value: 'ACTIVITY_FRIENDSHIP_CARD_REWARDS', name: '每周最佳特殊关系奖励' },
  { value: 'ACTIVITY_REWARD', name: '活动奖励' },
  { value: 'SVIP_REWARD', name: 'SVIP奖励' },
  { value: 'USE_VOUCHER_SPECIAL_ID', name: '使用兑换券获得靓号' },
  { value: 'PURCHASING_GOLD_PROPS', name: '金币购买-道具-自己用' },
  { value: 'PURCHASING_GOLD_PROPS_GIVEAWAY', name: '金币购买-道具-赠送' },
  { value: 'PURCHASING_DIAMOND_PROPS', name: '钻石购买-道具-自己用' },
  { value: 'PURCHASING_DIAMOND_PROPS_GIVEAWAY', name: '钻石购买-道具-赠送' },
  { value: 'PURCHASE_GOLDS_NOBLE_VIP', name: '金币购买VIP-购买' },
  { value: 'PURCHASE_DIAMOND_NOBLE_VIP', name: '钻石购买VIP' },
  { value: 'PURCHASE_GOLD_NOBLE_VIP_GIVEAWAY', name: '金币购买VIP-赠送' },
  { value: 'OFFICIAL_GIFT', name: '官方-赠送' },
  { value: 'PURCHASE_DIAMOND_NOBLE_VIP_GIVEAWAY', name: '钻石购买VIP-赠送' },
  { value: 'PURCHASING_PACK', name: '购买礼包' },
  { value: 'SIGN_IN', name: '签到获得' },
  { value: 'USE_PROPS_VOUCHER', name: '使用道具兑换券' },
  { value: 'CHECK_IN_REWARDS', name: '签到赠送' },
  { value: 'PURCHASING_THEME', name: '购买主题-钻石' },
  { value: 'PURCHASING_GOLD_THEME', name: '购买主题-金币' },
  { value: 'PURCHASING_FREE_THEME', name: '购买主题-免费' },
  { value: 'SHIPPING_AGENT', name: '货运代理' },
  { value: 'REGISTER_REWARDS', name: '注册奖励' },
  { value: 'BUY_OR_GIVE', name: '自己购买或朋友赠送' },
  { value: 'ACTIVE_AGENT_ANCHOR_COUNT_REWARD', name: '代理的主播数量满足奖励' },
  {
    value: 'ACTIVE_AGENT_MONTH_TARGET_REWARD',
    name: '代理名下主播累计月积分奖励',
  },
  { value: 'ACTIVE_ANCHOR_MONTH_TARGET_REWARD', name: '主播月积分奖励' },
  { value: 'ACTIVE_ANCHOR_DAY_TARGET_REWARD', name: '主播日积分奖励' },
] as const;

export const RECHARGE_TYPE_DES_MAP: Record<string, string> = {
  AIRWALLEX: 'Airwallex',
  APPLE: 'Apple',
  GOOGLE: 'Google',
  HUAWEI: 'HuaWei',
  PAY_PA: 'Paypal',
  PAYER_MAX: 'PayerMax',
  SALARY_EXCHANGE: '工资兑换',
  SHIPPING_AGENT: '货运代理',
  STRIPE: 'Stripe',
};

export type DayjsRange = [Dayjs, Dayjs];

const PROPS_TYPE_FORMAT: Record<
  string,
  { field: string; forever?: boolean; prefix: string; suffix: string }
> = {
  AVATAR_FRAME: { field: 'quantity', prefix: '', suffix: 'D' },
  BADGE: { field: 'quantity', forever: true, prefix: '', suffix: 'D' },
  CHAT_BUBBLE: { field: 'quantity', prefix: '', suffix: 'D' },
  DATA_CARD: { field: 'quantity', prefix: '', suffix: 'D' },
  DIAMOND: { field: 'content', prefix: '', suffix: '' },
  EMOJI: { field: 'quantity', prefix: 'x', suffix: '' },
  FLOAT_PICTURE: { field: 'quantity', prefix: '', suffix: 'D' },
  FRAGMENTS: { field: 'quantity', prefix: 'x', suffix: '' },
  GAME_COUPON: { field: 'quantity', prefix: '', suffix: '' },
  GIFT: { field: 'quantity', prefix: 'x', suffix: '' },
  GOLD: { field: 'content', prefix: '', suffix: '' },
  HONOR_ACTIVITY: { field: 'quantity', prefix: '', suffix: 'D' },
  LAYOUT: { field: 'quantity', prefix: 'x', suffix: '' },
  NOBLE_VIP: { field: 'quantity', prefix: '', suffix: 'D' },
  PROP_COUPON: { field: 'quantity', prefix: 'x', suffix: '' },
  RIDE: { field: 'quantity', prefix: '', suffix: 'D' },
  ROOM_BADGE: { field: 'quantity', forever: true, prefix: '', suffix: 'D' },
  SPECIAL_ID: { field: 'content', prefix: '', suffix: '' },
  THEME: { field: 'quantity', prefix: '', suffix: 'D' },
};

export function buildDateRangePresets() {
  const now = dayjs();
  return [
    { label: '最近2小时', value: [now.subtract(2, 'hour'), now] as DayjsRange },
    { label: '最近6小时', value: [now.subtract(6, 'hour'), now] as DayjsRange },
    { label: '最近12小时', value: [now.subtract(12, 'hour'), now] as DayjsRange },
    { label: '最近一天', value: [now.subtract(1, 'day'), now] as DayjsRange },
    { label: '最近一周', value: [now.subtract(7, 'day'), now] as DayjsRange },
    { label: '最近一个月', value: [now.subtract(30, 'day'), now] as DayjsRange },
    { label: '最近三个月', value: [now.subtract(90, 'day'), now] as DayjsRange },
  ];
}

export function getUserProfileId(profile?: Record<string, any> | null) {
  return profile?.id || profile?.userId || '';
}

export function getUserProfileName(profile?: Record<string, any> | null) {
  return profile?.userNickname || profile?.nickname || '-';
}

export function getUserProfileAccount(profile?: Record<string, any> | null) {
  return profile?.actualAccount || profile?.account || profile?.id || '-';
}

export function getUserProfileAvatar(profile?: Record<string, any> | null) {
  return profile?.userAvatar || profile?.avatar || '';
}

export function getUserDisplayText(profile?: Record<string, any> | null) {
  if (!profile) {
    return '-';
  }
  const nickname = getUserProfileName(profile);
  const account = getUserProfileAccount(profile);
  return account ? `${nickname} / ${account}` : nickname;
}

export function getBankWaterEventName(event?: string) {
  return (
    USER_BANK_WATER_EVENTS.find((item) => item.value === event)?.name ||
    event ||
    '-'
  );
}

export function getTransferDescriptionName(event?: string) {
  if (event === 'TRANSFER') {
    return '收款人';
  }
  if (event === 'RECEIVE_TRANSFER') {
    return '付款人';
  }
  return '';
}

export function getApprovalStatusName(status?: string) {
  return (
    WITHDRAW_APPROVAL_STATUS_OPTIONS.find((item) => item.value === status)
      ?.label ||
    status ||
    '-'
  );
}

export function normalizeCredentialValue(item: any) {
  if (!item) {
    return '';
  }
  if (typeof item === 'string') {
    return getAccessImgUrl(item);
  }
  return getAccessImgUrl(item.url || item.resourceUrl || item.key || '');
}

export function formatPropsRewardText(item: Record<string, any>) {
  if (item.detailType === 'CUSTOMIZE' && item.remark) {
    return item.remark;
  }
  const format = PROPS_TYPE_FORMAT[item.detailType] || PROPS_TYPE_FORMAT[item.type];
  if (!format) {
    return item.name || item.type || '?';
  }
  const value = Number(item[format.field] || 0);
  if (format.forever && value <= 0) {
    return '永久';
  }
  return `${format.prefix}${item[format.field] ?? ''}${format.suffix}`;
}

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function getRechargeTypeDes(type?: string) {
  if (!type) {
    return '-';
  }
  return RECHARGE_TYPE_DES_MAP[type] || type;
}
