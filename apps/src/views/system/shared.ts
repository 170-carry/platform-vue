import dayjs from 'dayjs';

import type { LegacyMenu } from '#/api/legacy/system';

export interface SysOriginOption {
  icon?: string;
  label: string;
  permission?: string;
  value: string;
}

export const SYS_ORIGIN_OPTIONS: SysOriginOption[] = [
  {
    icon: 'likei',
    label: 'LIKEI',
    permission: 'query:likei',
    value: 'LIKEI',
  },
];

export const REGION_ASSIST_TYPES = [
  {
    name: '房间贡献活动奖励比例(%)',
    value: 'ROOM_CONTRIBUTION_ACTIVITY_RATIO',
  },
  { name: '接收自己礼物获得金币比例(%)', value: 'GIFT_TO_OWN_GOLD_RATIO' },
  { name: '接收他人礼物获得金币比例(%)', value: 'GIFT_TO_OTHER_GOLD_RATIO' },
  {
    name: '接收自己礼物获得金币比例(%)-普通用户',
    value: 'GIFT_TO_OWN_GOLD_RATIO_NORMAL',
  },
  {
    name: '接收他人礼物获得金币比例(%)-普通用户',
    value: 'GIFT_TO_OTHER_GOLD_RATIO_NORMAL',
  },
  {
    name: '接收他人礼物获得钻石比例(%)',
    value: 'GIFT_TO_OTHER_DIAMOND_RATIO',
  },
  {
    name: '接收他人礼物获得钻石比例(%)-代理',
    value: 'GIFT_TO_OTHER_DIAMOND_RATIO_AGENCY',
  },
  { name: '银行钱包兑换金币比例', value: 'WITHDRAW_PROPORTION_TIPS' },
  { name: '币商兑换金币比例', value: 'COIN_SELLER_WITHDRAW_PROPORTION_TIPS' },
  {
    name: '银行钱包工资钻石兑换金币比例',
    value: 'WITHDRAW_PROPORTION_DIAMOND_TIPS',
  },
  {
    name: '银行钱包工资钻石兑换美金比例',
    value: 'WITHDRAW_PROPORTION_DIAMOND_USD_TIPS',
  },
  { name: '剩余积分兑换$比例', value: 'RESIDUE_TARGET_EXCHANGE_PROPORTION' },
  { name: '钻石起兑最小数量', value: 'MIN_EXCHANGE_DIAMOND' },
  { name: '钻石兑换金币比例(%)', value: 'DIAMOND_EXCHANGE_GOLD' },
  { name: '主播解约费(金币)', value: 'HOST_TERMINATION_FEE' },
  { name: '提现手续费比例(%)', value: 'WITHDRAWAL_COMMISSION_RATIO' },
  { name: '接收礼物获得目标比例(%)', value: 'GIFT_TARGET_RATIO' },
];

export const BANK_CARD_TYPES = [
  { name: 'PayPal', value: 'PAY_PAL' },
  { name: 'Payoneer', value: 'PAYONEER' },
  { name: 'Bank', value: 'BANK' },
  { name: 'GCash', value: 'GCASH' },
  { name: 'Easypaisa', value: 'EASYPAISA' },
  { name: 'JazzCash', value: 'JAZZCASH' },
  { name: 'USDT', value: 'USDT' },
];

export const APPROVAL_TYPE_OPTIONS = [
  { label: '用户昵称', value: 'NICKNAME' },
  { label: '用户头像', value: 'AVATAR' },
  { label: '照片墙', value: 'PHOTO_WALL' },
  { label: 'live图', value: 'LIVE' },
  { label: '短视频', value: 'SHORT_VIDEO' },
  { label: '房间昵称', value: 'ROOM_NICKNAME' },
  { label: '房间头像', value: 'ROOM_AVATAR' },
  { label: '房间通知公告', value: 'ROOM_NOTICE' },
  { label: '个人资料签名', value: 'PROFILE_DESC' },
];

export const REQUEST_METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'DELETE'];

export const RESOURCE_AUTH_TYPE_OPTIONS = [
  { label: '需要登录', value: '1' },
  { label: '无需鉴权', value: '2' },
  { label: '需要鉴权', value: '3' },
];

export const API_REQUEST_LOGS = [
  { label: '身份变更V1', value: 'ROOM_ROLES_CHANGE_V1' },
  { label: '身份变更V2', value: 'ROOM_ROLES_CHANGE_V2' },
  { label: '身份变更V3', value: 'ROOM_ROLES_CHANGE_V3' },
  { label: '身份变更-发出邀请', value: 'ROOM_ROLES_CHANGE_INVITE' },
  { label: '身份变更-主动加入V1', value: 'INITIATIVE_JOIN' },
  { label: '身份变更-主动退出V1', value: 'INITIATIVE_EXIT' },
  { label: '房间资料变更', value: 'ROOM_PROFILE_UPDATE' },
  { label: '房间设置变更', value: 'ROOM_SETTING_UPDATE' },
  { label: '加入黑名单', value: 'JOIN_BLACKLIST' },
  { label: '检测T麦克风', value: 'CHECK_KILL_MICROPHONE' },
  { label: 'T人日志', value: 'KILL_MICROPHONE_USER' },
];

export const LANGUAGE_OPTIONS = [
  { name: '英语', value: 'en' },
  { name: '阿拉伯语', value: 'ar' },
  { name: '印尼语', value: 'id' },
  { name: '土耳其语', value: 'tr' },
  { name: '俄语', value: 'ru' },
  { name: '葡萄牙语', value: 'pt' },
  { name: '韩语', value: 'ko' },
  { name: '日语', value: 'ja' },
  { name: '印地语', value: 'hi' },
  { name: '法语', value: 'fr' },
  { name: '西班牙语', value: 'es' },
  { name: '德语', value: 'de' },
  { name: '中文', value: 'zh_CN' },
  { name: '繁体', value: 'zh_TW' },
];

export const ENUM_CONFIG_GROUP_NAMES = [
  {
    value: 'VIDEO_MATCH',
    name: '视频匹配',
    children: [
      { value: 'PR', name: '概率%' },
      { value: 'CANDY_OR_INTEGRAL', name: '糖果/积分' },
    ],
  },
  { value: 'AD_CONTROL', name: '广告控制' },
  {
    value: 'OTHER',
    name: '常规参数',
    children: [
      { value: 'SECRET', name: '密钥' },
      { value: 'SWITCH_CONTROL', name: '开关控制' },
      { value: 'CANDY_OR_INTEGRAL', name: '糖果/积分' },
      { value: 'DEFAULT', name: '默认参数' },
    ],
  },
  {
    value: 'TASK',
    name: '任务管理',
    children: [
      { value: 'CLOCK_IN', name: '打卡签到' },
      { value: 'DAILY_TASK', name: '每日任务' },
    ],
  },
  {
    value: 'VOICE',
    name: '语音厅',
    children: [
      { value: 'SWITCH_COUNTR', name: '开关控制' },
      { value: 'VOICE_NUMERICAL_CONTROL', name: '数值控制' },
    ],
  },
];

export const ENUM_CONFIG_OPERATES = [
  { name: '可操作', value: false },
  { name: '不可操作', value: true },
];

export const ENUM_CONFIG_DATA_TYPES = [
  { name: 'int', value: 'int' },
  { name: 'string', value: 'string' },
  { name: 'range', value: 'range' },
  { name: 'bool', value: 'bool' },
  { name: 'double', value: 'double' },
  { name: 'ratio', value: 'ratio' },
];

export const ENUM_CONFIG_DATA_TYPE_EXPRESSION: Record<
  string,
  { msg: string; rex: '' | RegExp }
> = {
  string: {
    msg: 'string类型异常',
    rex: '',
  },
  int: {
    msg: 'int范围0~99999',
    rex: /^\d{1,5}$/,
  },
  range: {
    msg: 'range使用 ~ 分割两侧数值范围0~99999',
    rex: /^\d{1,5}~\d{1,5}$/,
  },
  bool: {
    msg: 'bool可选值 true/false',
    rex: /^(true)|(false)$/,
  },
  double: {
    msg: 'double范围0~99999小数最多两位',
    rex: /^\d{1,5}(\.\d{0,2})?$/,
  },
  ratio: {
    msg: 'ratio范围0~10',
    rex: /^([0-9]|10)$/,
  },
};

export const PLATFORM_ORIGINS = [
  {
    value: 'iOS',
    name: 'iOS',
    channels: [{ name: 'AppStore', value: 'AppStore' }],
  },
  {
    value: 'Android',
    name: 'Android',
    channels: [
      { name: 'Google', value: 'Google' },
      { name: 'Huawei', value: 'Huawei' },
    ],
  },
];

export const PRODUCT_SHOWCASE_OPTIONS = [
  { name: '上架', value: true },
  { name: '下架', value: false },
];

export const PLATFORM_ORIGINS_V2 = [
  { name: 'AppStore', value: 'AppStore' },
  { name: 'Google', value: 'Google' },
  { name: 'Huawei', value: 'Huawei' },
];

export const EMOJI_TYPE_OPTIONS = [
  { name: '会员', value: 'VIP' },
  { name: '正常', value: 'NORMAL' },
];

export const EMOJI_SOURCE_TYPE_OPTIONS = [
  { name: 'svga', value: 1 },
  { name: 'gif', value: 2 },
];

export function getAllowedSysOrigins(accessCodes: string[] = []) {
  if (accessCodes.length === 0) {
    return SYS_ORIGIN_OPTIONS;
  }
  return SYS_ORIGIN_OPTIONS.filter(
    (item) => !item.permission || accessCodes.includes(item.permission),
  );
}

export function formatDate(value: any) {
  if (!value && value !== 0) {
    return '-';
  }
  const date = dayjs(value);
  if (!date.isValid()) {
    return String(value);
  }
  return date.format('YYYY-MM-DD HH:mm:ss');
}

export function buildEnumGroupLabelMap(
  groups: Array<{ children?: any[]; name: string; value: string }> = ENUM_CONFIG_GROUP_NAMES,
  result: Record<string, string> = {},
) {
  groups.forEach((item) => {
    result[item.value] = item.name;
    if (item.children?.length) {
      buildEnumGroupLabelMap(item.children, result);
    }
  });
  return result;
}

export function buildMenuTree(list: LegacyMenu[] = []) {
  const nodeMap = new Map<number | string, LegacyMenu & { children: LegacyMenu[] }>();

  for (const item of list) {
    nodeMap.set(item.id, { ...item, children: [] });
  }

  const roots: Array<LegacyMenu & { children: LegacyMenu[] }> = [];
  for (const item of nodeMap.values()) {
    const parentId = item.parentId;
    if (!parentId || parentId === '0' || !nodeMap.has(parentId)) {
      roots.push(item);
      continue;
    }
    nodeMap.get(parentId)?.children.push(item);
  }

  const sortNodes = (nodes: Array<LegacyMenu & { children: LegacyMenu[] }>) => {
    nodes.sort((left, right) => Number(left.sort || 0) - Number(right.sort || 0));
    nodes.forEach((item) => sortNodes(item.children as Array<LegacyMenu & { children: LegacyMenu[] }>));
    return nodes;
  };

  return sortNodes(roots);
}

export function filterMenuTree(
  nodes: Array<LegacyMenu & { children?: LegacyMenu[] }>,
  keyword: string,
): Array<LegacyMenu & { children?: LegacyMenu[] }> {
  const value = keyword.trim().toLowerCase();
  if (!value) {
    return nodes;
  }
  return nodes
    .map((item) => {
      const children = filterMenuTree(
        (item.children || []) as Array<LegacyMenu & { children?: LegacyMenu[] }>,
        keyword,
      );
      const matched = String(item.menuName || '')
        .toLowerCase()
        .includes(value);
      if (!matched && children.length === 0) {
        return null;
      }
      return {
        ...item,
        children,
      };
    })
    .filter(Boolean) as Array<LegacyMenu & { children?: LegacyMenu[] }>;
}

export function getAllMenuIds(
  nodes: Array<LegacyMenu & { children?: LegacyMenu[] }>,
  result: Array<number | string> = [],
) {
  nodes.forEach((item) => {
    result.push(item.id);
    if (item.children?.length) {
      getAllMenuIds(item.children as Array<LegacyMenu & { children?: LegacyMenu[] }>, result);
    }
  });
  return result;
}
