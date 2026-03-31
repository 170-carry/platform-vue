export type TeamPolicyType = 'MONEY' | 'SALARY_DIAMOND';

export type TeamPolicyRewardDetailType =
  | 'AVATAR_FRAME'
  | 'BADGE'
  | 'CHAT_BUBBLE'
  | 'CUSTOMIZE'
  | 'DATA_CARD'
  | 'DIAMOND'
  | 'EMOJI'
  | 'FLOAT_PICTURE'
  | 'FRAGMENTS'
  | 'GAME_COUPON'
  | 'GIFT'
  | 'GOLD'
  | 'NOBLE_VIP'
  | 'RIDE'
  | 'ROOM_BADGE'
  | 'SPECIAL_ID'
  | 'THEME';

export const TEAM_POLICY_META: Record<
  TeamPolicyType,
  {
    actionTitle: string;
    historyAction: string;
    historyTitle: string;
    memberSalaryLabel: string;
    ownSalaryLabel: string;
    pageTitle: string;
    policyTypeLabel: string;
    showCountryFilter: boolean;
    totalSalaryLabel: string;
  }
> = {
  MONEY: {
    actionTitle: '政策',
    historyAction: '历史政策',
    historyTitle: '历史政策',
    memberSalaryLabel: '主播工资',
    ownSalaryLabel: '代理工资',
    pageTitle: '团队政策',
    policyTypeLabel: '美金政策',
    showCountryFilter: true,
    totalSalaryLabel: '总工资',
  },
  SALARY_DIAMOND: {
    actionTitle: '钻石政策',
    historyAction: '历史钻石政策',
    historyTitle: '历史政策',
    memberSalaryLabel: '主播钻石工资',
    ownSalaryLabel: '代理钻石工资',
    pageTitle: '团队钻石政策',
    policyTypeLabel: '工资钻石政策',
    showCountryFilter: false,
    totalSalaryLabel: '总钻石工资',
  },
};

export const TEAM_POLICY_REWARD_ORDER: TeamPolicyRewardDetailType[] = [
  'AVATAR_FRAME',
  'RIDE',
  'NOBLE_VIP',
  'THEME',
  'GIFT',
  'SPECIAL_ID',
  'GOLD',
  'DIAMOND',
  'GAME_COUPON',
  'BADGE',
  'ROOM_BADGE',
  'EMOJI',
  'CHAT_BUBBLE',
  'FLOAT_PICTURE',
  'CUSTOMIZE',
  'FRAGMENTS',
  'DATA_CARD',
];

export const TEAM_POLICY_BADGE_DAY_OPTIONS = [
  { label: '永久', value: '0' },
  { label: '1天', value: '1' },
  { label: '7天', value: '7' },
  { label: '15天', value: '15' },
  { label: '30天', value: '30' },
];

export const TEAM_POLICY_REWARD_META: Record<
  TeamPolicyRewardDetailType,
  {
    category: string;
    name: string;
    staticCover?: string;
  }
> = {
  AVATAR_FRAME: { category: 'PROPS', name: '头像框' },
  BADGE: { category: 'BADGE', name: '用户徽章' },
  CHAT_BUBBLE: { category: 'PROPS', name: '聊天气泡' },
  CUSTOMIZE: {
    category: 'CUSTOMIZE',
    name: '自定义(只读)',
    staticCover:
      'http://img.sugartimeapp.com/back/manager-4013fd35-930a-4d4a-98dd-8f71d0824de7.png',
  },
  DATA_CARD: { category: 'PROPS', name: '资料卡' },
  DIAMOND: {
    category: 'DIAMOND',
    name: '钻石',
    staticCover: 'http://img.sugartimeapp.com/web/timchat_diamond.png',
  },
  EMOJI: { category: 'EMOJI', name: '表情包' },
  FLOAT_PICTURE: { category: 'PROPS', name: '飘窗' },
  FRAGMENTS: { category: 'FRAGMENTS', name: '碎片' },
  GAME_COUPON: {
    category: 'GAME_COUPON',
    name: '游戏券',
    staticCover: 'http://img.sugartimeapp.com/back/game_coupon.png',
  },
  GIFT: { category: 'GIFT', name: '礼物' },
  GOLD: {
    category: 'GOLD',
    name: '金币',
    staticCover: 'http://img.sugartimeapp.com/web/gold_icon_doller.png',
  },
  NOBLE_VIP: { category: 'PROPS', name: '贵族' },
  RIDE: { category: 'PROPS', name: '座驾' },
  ROOM_BADGE: { category: 'BADGE', name: '房间徽章' },
  SPECIAL_ID: {
    category: 'SPECIAL_ID',
    name: '靓号',
    staticCover: 'http://img.sugartimeapp.com/back/special_id.png',
  },
  THEME: { category: 'PROPS', name: '房间背景主题' },
};

export function createEmptyTeamPolicyRow() {
  return {
    effectiveDay: 0,
    level: 0,
    memberSalary: 0,
    onlineTime: 0,
    ownSalary: 0,
    propsRewards: [] as Array<Record<string, any>>,
    target: 0,
    totalSalary: 0,
  };
}

export function cloneRewards(list?: Array<Record<string, any>>) {
  return Array.isArray(list) ? list.map((item) => ({ ...item })) : [];
}

export function clonePolicies(list?: Array<Record<string, any>>) {
  return Array.isArray(list)
    ? list.map((item) => ({
        ...item,
        propsRewards: cloneRewards(item.propsRewards),
      }))
    : [];
}

export function getTeamPolicyTotalSalary(item?: Record<string, any>) {
  return (
    Number(item?.memberSalary || 0) + Number(item?.ownSalary || 0)
  ).toFixed(2);
}

export function getTeamPolicyRewardTypeName(detailType?: string) {
  if (!detailType) {
    return '奖励';
  }
  return (
    TEAM_POLICY_REWARD_META[detailType as TeamPolicyRewardDetailType]?.name ||
    detailType
  );
}

export function getTeamPolicyRewardSummary(item?: Record<string, any>) {
  if (!item) {
    return '-';
  }
  const detailType = String(item.detailType || item.type || '');
  const displayName =
    item.propsName ||
    item.badgeName ||
    item.name ||
    getTeamPolicyRewardTypeName(detailType);
  if (detailType === 'SPECIAL_ID') {
    return `${displayName} 类型:${item.content || '-'} 数量:${item.quantity || 0}`;
  }
  if (
    detailType === 'GOLD' ||
    detailType === 'DIAMOND' ||
    detailType === 'GAME_COUPON'
  ) {
    return `${displayName} 数量:${item.content || 0}`;
  }
  if (detailType === 'BADGE' || detailType === 'ROOM_BADGE') {
    return `${displayName} 天数:${item.quantity || 0}`;
  }
  if (detailType === 'CUSTOMIZE') {
    return `${displayName} 描述:${item.remark || '-'}`;
  }
  if (detailType === 'GIFT' || detailType === 'FRAGMENTS') {
    return `${displayName} 数量:${item.quantity || 0}`;
  }
  return `${displayName} 天数:${item.quantity || 0}`;
}
