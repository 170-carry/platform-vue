export const INCOME_EXPENSE_OPTIONS = [
  { name: '收入', value: 0 },
  { name: '支出', value: 1 },
];

export const BEAN_OPERATION_TYPE_OPTIONS = [
  { name: '发送', value: 0 },
  { name: '扣除', value: 1 },
];

export const BEAN_ORIGIN_OPTIONS = [
  { name: '发送', value: 'REWARD_COINS' },
  { name: '扣除', value: 'DEDUCT_COINS' },
];

export const CURRENCY_REWARD_REASON_OPTIONS = [
  { name: '奖励', value: 1 },
  { name: '内部', value: 2 },
  { name: '工资', value: 3 },
  { name: '充值', value: 4 },
  { name: '其他', value: 5 },
];

export const CURRENCY_DEDUCT_REASON_OPTIONS = [
  { name: '违规', value: 1 },
  { name: '多发', value: 2 },
  { name: '操作错误', value: 3 },
  { name: '其他', value: 4 },
];

export const PET_UNLOCK_CONDITION_OPTIONS = [
  { name: '财富等级', value: 'WEALTH_LEVEL' },
  { name: '魅力等级', value: 'CHARM_LEVEL' },
  { name: '金币', value: 'GOLD' },
  { name: '钻石', value: 'DIAMOND' },
  { name: '豆子', value: 'BEAN' },
];

export const UNIT_CONDITION_OPTIONS = [
  { name: '>', value: 'GT' },
  { name: '>=', value: 'GE' },
  { name: '=', value: 'EQ' },
  { name: '<', value: 'LT' },
  { name: '<=', value: 'LE' },
];

export const PET_FEED_TYPE_MAP: Record<number, string> = {
  0: '免费',
  1: '正常',
  2: '加速',
};

export const PET_STAGE_DEFINITIONS = [
  { key: 'one', label: '卵化', stage: 'EGGING' },
  { key: 'two', label: '幼年', stage: 'CHILDHOOD' },
  { key: 'three', label: '成年', stage: 'ALDULT' },
  { key: 'four', label: '兑换', stage: 'FINISH' },
];

export function getPetUnlockConditionText(item?: Record<string, any>) {
  const condition =
    PET_UNLOCK_CONDITION_OPTIONS.find(
      (option) => option.value === item?.conditionType,
    )?.name || '?';
  const unit =
    UNIT_CONDITION_OPTIONS.find((option) => option.value === item?.unit)?.name ||
    '?';
  return `${condition} ${unit} ${item?.quantity ?? '?'}`;
}

export function getRewardPrimaryText(item: Record<string, any>) {
  switch (item?.type) {
    case 'GOLD': {
      return '金币';
    }
    case 'DIAMOND': {
      return '钻石';
    }
    case 'GAME_COUPON': {
      return '游戏券';
    }
    case 'ROOM_BADGE': {
      return '房间徽章';
    }
    case 'SPECIAL_ID': {
      return '靓号';
    }
    default: {
      return item?.name || item?.propsName || item?.type || '资源';
    }
  }
}

export function getRewardSecondaryText(item: Record<string, any>) {
  if (item?.type === 'BADGE') {
    return item?.quantity ? `${item.quantity} 天` : '永久';
  }
  if (item?.type === 'ROOM_BADGE') {
    return item?.content || item?.name || '-';
  }
  if (item?.content) {
    return item.content;
  }
  if (item?.quantity || item?.quantity === 0) {
    return `${item.quantity}`;
  }
  return item?.remarks || item?.originName || '-';
}

export function getRewardAccentColor(type?: string) {
  switch (type) {
    case 'GOLD': {
      return '#f59e0b';
    }
    case 'DIAMOND': {
      return '#38bdf8';
    }
    case 'GAME_COUPON': {
      return '#fb7185';
    }
    case 'ROOM_BADGE': {
      return '#6366f1';
    }
    case 'SPECIAL_ID': {
      return '#22c55e';
    }
    default: {
      return '#64748b';
    }
  }
}
