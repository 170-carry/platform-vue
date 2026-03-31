import dayjs from 'dayjs';

export interface OptionItem {
  name: string;
  value: number | string;
}

export const PROPS_TYPES: OptionItem[] = [
  { value: 'AVATAR_FRAME', name: '头像框' },
  { value: 'RIDE', name: '座驾' },
  { value: 'NOBLE_VIP', name: '贵族' },
  { value: 'THEME', name: '主题' },
  { value: 'LAYOUT', name: '装扮' },
  { value: 'CHAT_BUBBLE', name: '聊天气泡' },
  { value: 'FLOAT_PICTURE', name: '飘窗' },
  { value: 'FRAGMENTS', name: '碎片' },
  { value: 'DATA_CARD', name: '资料卡' },
  { value: 'SPECIAL_ID', name: '靓号' },
  { value: 'CUSTOMIZE', name: '自定义(只读)' },
];

export const PROPS_TICKET_TYPES: OptionItem[] = [
  { value: 'AVATAR_FRAME', name: '头像框' },
  { value: 'RIDE', name: '座驾' },
  { value: 'NOBLE_VIP', name: '贵族' },
];

export const PROPS_STORE_TYPES: OptionItem[] = [
  { value: 'AVATAR_FRAME', name: '头像框' },
  { value: 'RIDE', name: '座驾' },
  { value: 'NOBLE_VIP', name: '贵族' },
  { value: 'THEME', name: '主题' },
  { value: 'LAYOUT', name: '装扮' },
  { value: 'FLOAT_PICTURE', name: '飘窗' },
  { value: 'CHAT_BUBBLE', name: '聊天气泡' },
  { value: 'DATA_CARD', name: '资料卡' },
];

export const PROPS_CURRENCY_TYPES: OptionItem[] = [
  { value: 'GOLD', name: '金币' },
  { value: 'DIAMOND', name: '钻石' },
  { value: 'FREE', name: '免费' },
];

export const PROPS_VALID_DAYS: OptionItem[] = [
  { value: 1, name: '1' },
  { value: 7, name: '7' },
  { value: 15, name: '15' },
  { value: 30, name: '30' },
];

export const NOBLE_VIP_OPTIONS: OptionItem[] = [
  { value: 'VISCOUNT', name: '子爵' },
  { value: 'EARL', name: '伯爵' },
  { value: 'MARQUIS', name: '侯爵' },
  { value: 'DUKE', name: '公爵' },
  { value: 'KING', name: '国王' },
  { value: 'EMPEROR', name: '皇帝' },
];

export const BADGE_TYPE_OPTIONS: OptionItem[] = [
  { value: 'ACHIEVEMENT', name: '用户-成就徽章' },
  { value: 'ADMINISTRATOR', name: '用户-管理员' },
  { value: 'ACTIVITY', name: '用户-活动徽章' },
  { value: 'HONOR_ADMIN', name: '荣誉-管理员' },
  { value: 'HONOR_ACTIVITY', name: '荣誉-活动' },
];

export const SPECIAL_ID_TYPES: OptionItem[] = [
  { value: 'ABCDEF', name: 'ABCDEF' },
  { value: 'ABBBBB', name: 'ABBBBB' },
  { value: 'ABBBBA', name: 'ABBBBA' },
  { value: 'ABBBBC', name: 'ABBBBC' },
  { value: 'AAABBB', name: 'AAABBB' },
  { value: 'ABBABB', name: 'ABBABB' },
  { value: 'AABAAB', name: 'AABAAB' },
  { value: 'ABCABC', name: 'ABCABC' },
  { value: 'ABABAB', name: 'ABABAB' },
  { value: 'AABBCC', name: 'AABBCC' },
  { value: 'ABAABA', name: 'ABAABA' },
];

export const PROPS_SOURCE_GROUP_ADD_TYPES = [
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
  'PROP_COUPON',
  'HONOR_ACTIVITY',
] as const;

export const PROPS_SOURCE_GROUP_TYPE_MAP: Record<
  string,
  { name: string; value: string }
> = {
  AVATAR_FRAME: { value: 'PROPS', name: '头像框' },
  RIDE: { value: 'PROPS', name: '座驾' },
  NOBLE_VIP: { value: 'PROPS', name: '贵族' },
  THEME: { value: 'PROPS', name: '房间背景主题' },
  GIFT: { value: 'GIFT', name: '礼物' },
  SPECIAL_ID: { value: 'SPECIAL_ID', name: '靓号' },
  GOLD: { value: 'GOLD', name: '金币' },
  DIAMOND: { value: 'DIAMOND', name: '钻石' },
  GAME_COUPON: { value: 'GAME_COUPON', name: '游戏券' },
  BADGE: { value: 'BADGE', name: '用户-徽章' },
  ROOM_BADGE: { value: 'BADGE', name: '房间-徽章' },
  EMOJI: { value: 'EMOJI', name: '用户-表情包' },
  CHAT_BUBBLE: { value: 'PROPS', name: '聊天气泡' },
  FLOAT_PICTURE: { value: 'PROPS', name: '飘窗' },
  CUSTOMIZE: { value: 'CUSTOMIZE', name: '自定义(只读)' },
  FRAGMENTS: { value: 'FRAGMENTS', name: '碎片' },
  DATA_CARD: { value: 'PROPS', name: '资料卡' },
  PROP_COUPON: { value: 'PROP_COUPON', name: '道具券' },
  HONOR_ACTIVITY: { value: 'BADGE', name: '荣誉-活动' },
};

export const PROPS_DEL_OPTIONS = [
  { value: false, name: '上架' },
  { value: true, name: '下架' },
];

export const PROPS_SHELF_STATUS_OPTIONS = [
  { value: true, name: '上架' },
  { value: false, name: '下架' },
];

export const PROP_ACTIVITY_TYPES: OptionItem[] = [
  { value: 'THE_BIG_WHEEL', name: '大转盘' },
  { value: 'INDEPENDENCE_DAY_OF_INDIA', name: '印度独立日' },
  { value: 'ACTIVITY_FRIENDSHIP_CARD_REWARDS', name: '好友关系卡榜单活动' },
  { value: 'INVITE_USER_REWARDS', name: '邀请用户数量奖励' },
  { value: 'STAR', name: '周星' },
  { value: 'WEEK_STAR', name: '周星奖励' },
  { value: 'CUMULATIVE_RECHARGE', name: '累积充值' },
  { value: 'CRYSTAL', name: '爆水晶' },
  { value: 'CRYSTAL_TOP', name: '爆水晶突破奖励' },
  { value: 'CRYSTAL_LUCKY_BOX', name: '爆水晶宝箱奖励' },
  { value: 'GAME_EXPLOSION_CRYSTAL', name: '爆水晶奖励' },
  { value: 'ROOM_REWARD', name: '房间奖励' },
  { value: 'CP_REWARD', name: 'CP奖励' },
  { value: 'FIRST_CHARGE_REWARD', name: '首充奖励' },
  { value: 'WEEK_CP_GIFT', name: '每周CP礼物互送榜' },
  { value: 'SVIP_REWARD', name: 'SVIP' },
  { value: 'WEEK_KING', name: '每周国王' },
  { value: 'WEEK_QUEEN', name: '每周皇后' },
  { value: 'ROOM_PK', name: '房间PK' },
  { value: 'GAME_KING', name: '游戏之王' },
  { value: 'DAILY_REGISTER', name: '每天签到' },
  { value: 'LUCKY_GIFT_REWARD', name: '幸运礼物奖励' },
  { value: 'APRIL_ACTIVITY_FRAGMENT', name: '五福碎片' },
  { value: 'CUMULATIVE_RECHARGE_LOTTERY', name: '累计充值抽奖奖品' },
  { value: 'WEEKLY_GAME_TASKS', name: '每周游戏任务' },
  { value: 'ACTIVE_AGENT_ANCHOR_COUNT_REWARD', name: '代理的主播数量满足奖励' },
  {
    value: 'ACTIVE_AGENT_MONTH_TARGET_REWARD',
    name: '代理名下主播累计月积分奖励',
  },
  { value: 'ACTIVE_ANCHOR_MONTH_TARGET_REWARD', name: '主播月积分奖励' },
  { value: 'ACTIVE_ANCHOR_DAY_TARGET_REWARD', name: '主播日积分奖励' },
  { value: 'GAME_KTV_WEEK_RANK_REWARD', name: 'KTV游戏每周榜单奖励' },
  { value: 'AGENT_ACTIVE_WEEK_REWARD', name: '代理活动奖励-周' },
  { value: 'AGENT_ACTIVE_MONTH_REWARD', name: '代理活动奖励-月' },
  { value: 'CONSUMPTION_ACTIVITY', name: '消耗活动' },
  { value: 'ROOM_FAN_VOTES_ACTIVITY', name: '房间粉丝人气票' },
  { value: 'ACTIVITY_COUNTRY_PK', name: '区域国旗PK活动' },
  { value: 'USER_RECHARGE_DRAW', name: '充值活动抽奖' },
  { value: 'USER_RECHARGE_DRAW_REWARD', name: '用户充值抽奖活动奖励' },
  { value: 'NEWCOMER_GIFT_PACKAGE', name: '新人大礼包' },
  { value: 'GAME_KING_BADGE', name: '游戏王徽章奖励' },
  { value: 'GAME_KING_HONOR', name: '游戏王荣誉奖励' },
  { value: 'LUCKY_BOX', name: 'Lucky Box' },
  { value: 'GAME_FRUIT_BOX_REWARD_WIN', name: '摩天轮获胜奖励' },
  { value: 'GAME_FRUIT_BOX_REWARD_TIMES', name: '摩天轮次数奖励' },
];

export const PROP_ACTIVITY_TYPE_HELP: Record<string, Record<string, string>> = {
  CRYSTAL: {
    level: '游戏等级',
    mediumIcon: '中号图标',
    milestone: '游戏里程碑',
    smallIcon: '小号图标',
    sourceUrl: '动画资源图',
  },
  CUMULATIVE_RECHARGE: {
    quantity: '累积充值价格里程碑',
  },
  CUMULATIVE_RECHARGE_LOTTERY: {
    quantity: '抽奖要求充值金额(例如: 9.9)',
  },
  ROOM_REWARD: {
    quantity: '房间奖励贡献里程碑',
  },
  STAR: {
    quantity: '赠送周星礼物最低限额',
  },
};

export const ACTIVITY_DATE_TYPE_OPTIONS = [
  { label: '天', value: 'DAY' },
  { label: '月', value: 'MONTH' },
  { label: '年', value: 'YEAR' },
];

export const ACTIVITY_DATE_TYPE_MAP = {
  DAY: {
    defaultDate: dayjs().format('YYYYMMDD'),
    format: 'YYYYMMDD',
    picker: 'date',
  },
  MONTH: {
    defaultDate: dayjs().format('YYYYMM'),
    format: 'YYYYMM',
    picker: 'month',
  },
  YEAR: {
    defaultDate: dayjs().format('YYYY'),
    format: 'YYYY',
    picker: 'year',
  },
} as const;

export function getPropsTypeName(value?: null | string) {
  if (!value) {
    return '-';
  }
  return (
    PROPS_TYPES.find((item) => item.value === value)?.name ||
    PROPS_STORE_TYPES.find((item) => item.value === value)?.name ||
    PROPS_SOURCE_GROUP_TYPE_MAP[value]?.name ||
    value
  );
}

export function getRewardBadgeType(type: string) {
  if (type === 'BADGE') {
    return 'ACTIVITY';
  }
  if (type === 'ROOM_BADGE') {
    return 'ROOM_ACHIEVEMENT';
  }
  if (type === 'HONOR_ACTIVITY') {
    return 'HONOR_ACTIVITY';
  }
  return '';
}

export function isCurrencyRewardType(type?: null | string) {
  return type === 'GOLD' || type === 'DIAMOND';
}

export function isGameCouponType(type?: null | string) {
  return type === 'GAME_COUPON';
}

export function isPropsCouponType(type?: null | string) {
  return type === 'PROP_COUPON';
}

export function isBadgeRewardType(type?: null | string) {
  return type === 'BADGE' || type === 'ROOM_BADGE' || type === 'HONOR_ACTIVITY';
}

export function isPropsSourceType(type?: null | string) {
  return [
    'AVATAR_FRAME',
    'RIDE',
    'NOBLE_VIP',
    'THEME',
    'CHAT_BUBBLE',
    'FLOAT_PICTURE',
    'FRAGMENTS',
    'DATA_CARD',
    'CUSTOMIZE',
  ].includes(String(type || ''));
}

export function formatRewardText(item: Record<string, any>) {
  const detailType = item.detailType || item.type;
  if (detailType === 'CUSTOMIZE' && item.remark) {
    return item.remark;
  }
  if (detailType === 'SPECIAL_ID') {
    return `类型：${item.content || '-'}，数量：${item.quantity || 0}`;
  }
  if (isCurrencyRewardType(detailType) || isGameCouponType(detailType)) {
    return `数量：${item.content || 0}`;
  }
  if (isPropsCouponType(detailType)) {
    return `券数：${item.content || 0}，数量：${item.quantity || 0}`;
  }
  if (isBadgeRewardType(detailType)) {
    const quantity = Number(item.quantity || 0);
    return `${item.badgeName || item.name || item.content || '-'} ${
      quantity <= 0 ? '永久' : `${quantity}天`
    }`;
  }
  if (detailType === 'GIFT' || detailType === 'FRAGMENTS') {
    return `数量：${item.quantity || 0}`;
  }
  const quantity = Number(item.quantity || 0);
  return `天数：${quantity <= 0 ? '永久' : quantity}`;
}

export function createActivityRuleDraft(type = '') {
  switch (type) {
    case 'CRYSTAL': {
      return {
        level: '',
        mediumIcon: '',
        milestone: '',
        smallIcon: '',
        sourceUrl: '',
      };
    }
    case 'FIRST_CHARGE_REWARD': {
      return { productId: '' };
    }
    case 'SVIP_REWARD': {
      return { mark: '', quantity: '' };
    }
    case 'LUCKY_BOX': {
      return [
        { id: 1, opportunityNumber: '', quantity: '' },
        { id: 2, opportunityNumber: '', quantity: '' },
        { id: 3, opportunityNumber: '', quantity: '' },
      ];
    }
    case 'WEEKLY_GAME_TASKS': {
      return { gameConfId: '', target: '' };
    }
    case 'GAME_FRUIT_BOX_REWARD_WIN':
    case 'GAME_FRUIT_BOX_REWARD_TIMES': {
      return { quantity: '', status: true };
    }
    default: {
      return { quantity: '' };
    }
  }
}
