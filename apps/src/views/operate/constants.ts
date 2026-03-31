export const ORIGIN_PLATFORM_OPTIONS = [
  { value: 'iOS', name: 'iOS' },
  { value: 'Android', name: 'Android' },
  { value: 'H5', name: 'H5' },
];

export const REGISTER_ORIGIN_OPTIONS = [
  { value: 'MOBILE', name: '手机号码' },
  { value: 'FACEBOOK', name: 'Facebook' },
  { value: 'GOOGLE', name: 'Google' },
  { value: 'APPLE', name: 'Apple' },
  { value: 'SNAPCHAT', name: 'Snapchat' },
];

export const GENDER_OPTIONS = [
  { value: 0, name: '女' },
  { value: 1, name: '男' },
];

export const USER_TYPE_OPTIONS = [
  { value: 0, name: '真实' },
  { value: 3, name: '视频马甲' },
];

export const CANDY_PURCHASING_TYPE_OPTIONS = [
  { value: 0, name: '收入' },
  { value: 1, name: '支出' },
];

export const FREIGHT_BALANCE_ORIGIN_OPTIONS = [
  { value: 'SHIPMENT', name: '出货' },
  { value: 'PURCHASE', name: '进货' },
  { value: 'DEDUCTION', name: '扣除' },
];

export const FREIGHT_RECHARGE_TYPE_OPTIONS = [
  { value: 'CLIPSPAY-进货', name: 'CLIPSPAY-进货' },
  { value: 'Payoneer-进货', name: 'Payoneer-进货' },
  { value: 'Paypal-进货', name: 'Paypal-进货' },
  { value: '工资-进货', name: '工资-进货' },
  { value: '银行卡兑换', name: '银行卡兑换' },
  { value: 'USDT-进货', name: 'USDT-进货' },
  { value: '金币补偿', name: '金币补偿' },
];

export const GAME_ORIGIN_OPTIONS = [
  { value: 'BAISHUN', name: 'Baishun' },
  { value: 'LINGXIAN', name: 'LingXian' },
  { value: 'HOTGAME', name: 'HOTGAME' },
  { value: 'YOMI', name: 'YOMI' },
];

export const GAME_CLIENT_ORIGIN_OPTIONS = [
  { value: 'ANDROID', name: '安卓' },
  { value: 'IOS', name: '苹果' },
  { value: 'COMMON', name: '通用' },
];

export const GAME_CATEGORY_OPTIONS = [
  { value: 'FISH_CLASS', name: 'Fish Class' },
  { value: 'SLOTS_CLASS', name: 'Slots Class' },
  { value: 'GREEDY_CLASS', name: 'Greedy Class' },
  { value: 'RACE_SERIES', name: 'Race Series' },
  { value: 'OTHER', name: 'Others' },
  { value: 'HIDDEN', name: 'hidden' },
  { value: 'CASUAL', name: 'Casual' },
];

export const GAME_MODE_OPTIONS = [{ value: 'CHAT_ROOM', name: '语聊房' }];

export const ROOM_EVENT_OPTIONS = [
  { value: 'AVAILABLE', name: '正常' },
  { value: 'CLOSE', name: '关闭' },
  { value: 'WAITING_CONFIRMED', name: '等待确定' },
  { value: 'ID_CHANGE', name: 'ID变更' },
];

export const ROOM_ROLE_OPTIONS = [
  { value: 'HOMEOWNER', name: '房主' },
  { value: 'ADMIN', name: '管理员' },
  { value: 'MEMBER', name: '成员' },
];

export const ROOM_USER_EVENT_OPTIONS = [
  { value: 'SYS_PULL_BLACK_ROOM_USER', name: '拉黑用户' },
  { value: 'SYS_REMOVE_ROOM_PULL_BLACK_USER', name: '将用户移出房间黑名单' },
  { value: 'SYS_REMOVE_ROOM_USER', name: '踢出房间' },
];

export const LOTTERY_GAME_TYPE_OPTIONS = [
  { value: 'EGG', name: '砸金蛋' },
];

export const GIFT_CONFIG_TAB_OPTIONS = [
  { value: 'ORDINARY', name: '普通礼物' },
  { value: 'NATIONAL_FLAG', name: '国旗礼物' },
  { value: 'CP', name: 'CP礼物' },
  { value: 'FAMILY', name: '家族礼物' },
  { value: 'EXCLUSIVE', name: '专属礼物' },
  { value: 'ARISTOCRACY', name: '贵族礼物' },
  { value: 'LUCKY_GIFT', name: '幸运礼物' },
  { value: 'ACTIVITY', name: '活动礼物' },
  { value: 'MAGIC', name: '魔法礼物' },
  { value: 'CUSTOMIZED', name: '定制礼物' },
];

export const GIFT_SPECIAL_OPTIONS = [
  { value: 'ANIMATION', name: '动画' },
  { value: 'MUSIC', name: '音乐' },
  { value: 'NOTICE', name: '全局通报' },
  { value: 'SVIP_GIFT', name: 'SVIP礼物' },
  { value: 'STAR', name: '周星礼物' },
  { value: 'GLOBAL_GIFT', name: '全局广播礼物' },
];

export const SPECIAL_ID_TYPE_OPTIONS = [
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

export const BADGE_GROUP_OPTIONS = [
  {
    label: '用户',
    options: [
      { label: '成就', value: 'ACHIEVEMENT' },
      { label: '管理员', value: 'ADMINISTRATOR' },
      { label: '活动', value: 'ACTIVITY' },
    ],
  },
  {
    label: '荣誉',
    options: [
      { label: '管理员', value: 'HONOR_ADMIN' },
      { label: '活动', value: 'HONOR_ACTIVITY' },
    ],
  },
];

export const ORDER_RECEIPT_TYPE_OPTIONS = [
  { name: '付款', value: 'PAYMENT' },
  { name: '收款', value: 'RECEIPT' },
];

export const ORDER_STATUS_OPTIONS = [
  { name: '创建付款', value: 'CREATE' },
  { name: '支付成功', value: 'SUCCESS' },
  { name: '支付失败', value: 'FAIL' },
  { name: '取消支付', value: 'CANCEL' },
  { name: '交易被挂起', value: 'HANG' },
  { name: '退款', value: 'REFUND' },
];

export const ORDER_STATUS_TAG_MAP: Record<
  string,
  { label: string; tagType: string }
> = {
  CANCEL: { label: '取消支付', tagType: 'default' },
  CREATE: { label: '创建付款', tagType: 'default' },
  FAIL: { label: '支付失败', tagType: 'error' },
  HANG: { label: '交易被挂起', tagType: 'warning' },
  REFUND: { label: '退款', tagType: 'error' },
  SUCCESS: { label: '支付成功', tagType: 'success' },
};

export const BEAUTIFUL_NUMBER_STATUS_OPTIONS = [
  { label: '可售卖', value: 1 },
  { label: '不可售卖', value: 0 },
  { label: '已售出', value: 2 },
];

export const BEAUTIFUL_NUMBER_GROUP_OPTIONS = [
  {
    children: [{ label: 'UniqueIDs', value: 'UNIQUE_ID' }],
    label: 'Top',
    value: 'TOP',
  },
  {
    children: [{ label: 'UniqueIDs', value: 'UNIQUE_ID' }],
    label: 'Five-Digit',
    value: 'FIVE',
  },
  {
    children: [
      { label: 'AABB', value: 'AABB' },
      { label: 'ABAB', value: 'ABAB' },
      { label: 'ABABAB', value: 'ABABAB' },
      { label: 'ABCABC', value: 'ABCABC' },
      { label: 'ABCCBA', value: 'ABCCBA' },
      { label: 'AABBCC', value: 'AABBCC' },
      { label: 'AAABBB', value: 'AAABBB' },
    ],
    label: 'Pairs',
    value: 'PAIRS',
  },
  {
    children: [
      { label: 'AABB', value: 'AABB' },
      { label: 'ABAB', value: 'ABAB' },
      { label: 'ABABAB', value: 'ABABAB' },
      { label: 'ABCABC', value: 'ABCABC' },
      { label: 'ABCCBA', value: 'ABCCBA' },
      { label: 'AABBCC', value: 'AABBCC' },
      { label: 'AAABBB', value: 'AAABBB' },
    ],
    label: 'Repeationg',
    value: 'REPEATIONG',
  },
  {
    children: [
      { label: 'ABCD', value: 'ABCD' },
      { label: 'ABCDE', value: 'ABCDE' },
      { label: 'ABCDEF', value: 'ABCDEF' },
      { label: 'ABCDEFG', value: 'ABCDEFG' },
    ],
    label: 'Consecutive',
    value: 'CONSECUTIVE',
  },
];

export const CURRENCY_ORIGIN_OPTIONS = [
  { value: 'ROOM_SEND_TRUMPET', name: '发送喇叭' },
  { value: 'USER_REFUND', name: '用户退款' },
  { value: 'ACTIVITY_FRIENDSHIP_CARD_REWARDS', name: '每周特殊关系卡片奖励' },
  { value: 'WEEKLY_GAME_TASKS', name: '每周游戏任务奖励' },
  { value: 'SEND_DYNAMIC_PAY_GOLD', name: '超限制发动态支付金币' },
  { value: 'BUY_EMOJI', name: '购买表情包' },
  { value: 'BET_TEEN_PATTI', name: '炸金花' },
  { value: 'TEEN_PATTI', name: '炸金花游戏 ' },
  { value: 'USD_GAME_REFUND_DRAW', name: 'sud游戏退款平局' },
  { value: 'USD_GAME_REFUND', name: 'sud游戏退款' },
  { value: 'USD_GAME_WIN', name: 'sud游戏获胜奖励' },
  { value: 'USER_FRIENDSHIP_CARD_REFUND', name: '用户特殊关系卡退款' },
  { value: 'USER_FRIENDSHIP_CARD_GIVE_AWAY', name: '赠送用户特殊关系卡' },
  { value: 'LUCKY_GIFT_GOLD_REWARD', name: '幸运礼物金币奖励' },
  { value: 'INVITE_USER_REWARDS', name: '邀请用户奖励' },
  { value: 'GAME_LUDO_REFUND', name: 'LUDO游戏退款' },
  { value: 'LOTTERY_NUMBER_BET', name: '幸运彩票押注' },
  { value: 'CUMULATIVE_RECHARGE_LOTTERY', name: '累计充值抽奖' },
  { value: 'LUCKY_GIFT_REWARD', name: '幸运礼物抽奖' },
  { value: 'DAILY_REGISTER', name: '每日签到抽奖' },
  { value: 'GAME_KING_AWARD', name: '游戏王奖励' },
  { value: 'WEEK_QUEEN', name: '每周王后' },
  { value: 'WEEK_KING', name: '每周国王' },
  { value: 'DOUBLE_LAYER_BARBECUE', name: '烧烤机游戏' },
  { value: 'DOUBLE_LAYER_FRUIT', name: '水果机游戏' },
  { value: 'EGG', name: '砸金蛋' },
  { value: 'PET_TURNTABLE_LOTTERY', name: '宠物转盘抽奖' },
  { value: 'PET_REWARD', name: '宠物奖励' },
  { value: 'ACTIVATE_PET', name: '激活宠物' },
  { value: 'FEEDING_PETS_HELP_OTHERS', name: '帮助他人喂养' },
  { value: 'FEEDING_PETS', name: '喂养宠物' },
  { value: 'ROOM_PK', name: '房间PK奖励' },
  { value: 'WEEK_CP_GIFT', name: 'cp礼物互赠消耗' },
  { value: 'PURCHASING_LAYOUT_GIVEAWAY', name: '赠送道具主题-金币' },
  { value: 'PURCHASING_THEME_GIVEAWAY', name: '购买主题-赠送' },
  { value: 'PURCHASING_THEME', name: '购买主题-金币' },
  { value: 'OPEN_VIP', name: '开通VIP' },
  { value: 'BUILD_HOUSE', name: '盖房子消费' },
  { value: 'DIAMOND_EXCHANGE_GOLD', name: '钻石兑换金币' },
  { value: 'FIRST_CHARGE_REWARD', name: '首次充值' },
  { value: 'FAMILY_AWARD_RECEIVE', name: '家族每周宝箱奖励领取' },
  { value: 'GOLD_CREATE_FAMILY', name: '使用金币创建家族' },
  { value: 'USER_FIRST_RECHARGE_REWARD', name: '用户首次充值奖励' },
  { value: 'ACCEPT_GIFT', name: '接收礼物' },
  { value: 'RECEIVE_RED_PACKET_REFUND', name: '红包退款' },
  { value: 'RECEIVE_RED_PACKET', name: '领取红包奖励' },
  { value: 'SEND_RED_PACKET', name: '发送红包' },
  { value: 'RECEIVE_USER_RED_PACKET_REFUND', name: '红包用户个人退款' },
  { value: 'RECEIVE_USER_RED_PACKET', name: '领取用户个人红包奖励' },
  { value: 'SEND_USER_RED_PACKET', name: '发送用户个人红包' },
  {
    value: 'INVITED_USER_FIRST_RECHARGE_REWARD',
    name: '邀请的用户首次充值奖励',
  },
  { value: 'INVITED_NEW_USER_REWARD', name: '邀请用户注册奖励' },
  { value: 'FRIENDS_GIVE_GOLD_COINS', name: '朋友赠送金币' },
  { value: 'BUY_GOLD', name: '购买金币' },
  { value: 'GIFT_PACK', name: '礼包' },
  { value: 'GAME_RAKE', name: '游戏抽成' },
  { value: 'GAME_WINNING', name: '游戏胜利' },
  { value: 'GAME_BACK', name: '游戏退还' },
  { value: 'SEVEN_CHECK_IN', name: '签到获取奖励' },
  { value: 'ROOM_REWARD_EXTRACT', name: '房间奖励提取' },
  { value: 'WEB_BUY', name: 'WEB端购买' },
  { value: 'WEEK_STAR', name: '周星' },
  { value: 'ROOM_REWARD', name: '房间奖励' },
  { value: 'CUMULATIVE_RECHARGE_REWARDS', name: '累计充值奖励' },
  { value: 'GAME_BURST_CRYSTAL', name: '爆水晶游戏' },
  { value: 'SHIPPING_AGENT', name: '货运代理' },
  { value: 'CP_REWARD', name: 'CP奖励' },
  { value: 'DAILY_TASK', name: '每日任务' },
  { value: 'LUDO_REFUND', name: 'LUDO退款' },
  { value: 'LUDO_VICTORY', name: 'LUDO胜利' },
  { value: 'LUCKY_BOX_GAME', name: 'Lucky Box & 幸运抽奖' },
  { value: 'CP_BUILD', name: 'CP组建' },
  { value: 'PURCHASE_STEALTH_BROWSE_PROPS', name: '购买隐身浏览道具' },
  { value: 'PURCHASE_ROOM_LOCK', name: '购买房间锁' },
  { value: 'GIVE_AWAY_GOLD_LAYOUT', name: '赠送装扮-金币' },
  { value: 'PURCHASING_CAR_GIVEAWAY', name: '赠送车辆-金币' },
  { value: 'PURCHASING_CHAT_BUBBLE_GIVEAWAY', name: '赠送聊天气泡-金币' },
  { value: 'PURCHASING_AVATAR_FRAME_GIVEAWAY', name: '赠送头像框-金币' },
  { value: 'PURCHASING_LAYOUT', name: '购买装扮-金币' },
  { value: 'PURCHASING_CAR', name: '购买车辆-金币' },
  { value: 'PURCHASING_CHAT_BUBBLE', name: '购买聊天气泡-金币' },
  { value: 'PURCHASING_AVATAR_FRAME', name: '购买头像框-金币' },
  { value: 'PURCHASE_NOBLE_VIP_GIVEAWAY', name: '赠送贵族VIP-金币' },
  { value: 'PURCHASE_NOBLE_VIP', name: '购买贵族vip-金币' },
  { value: 'PURCHASE_GOLD_SPECIAL_ID_GIVEAWAY', name: '赠送靓号-金币' },
  { value: 'PURCHASE_GOLD_SPECIAL_ID', name: '购买靓号-金币' },
  { value: 'LUDO_GAME', name: 'LUDO游戏' },
  { value: 'TURNTABLE_GAME', name: '转盘游戏' },
  { value: 'GAME_BARBECUE', name: '烧烤游戏' },
  { value: 'GAME_SLOT_MACHINE', name: '水果游戏' },
  { value: 'JOIN_ROOM', name: '加入房间' },
  { value: 'CUSTOM_ROOM_THEME', name: '自定义主题' },
  { value: 'GIVE_GIFT', name: '赠送礼物' },
  { value: 'ACTIVITY_REWARD', name: '活动奖励' },
  { value: 'APP', name: '后台管理发送-APP' },
  { value: 'HKYS_GAME', name: 'Hkys第三方游戏' },
  { value: 'ROOM_CONTRIBUTION_REWARD', name: '房间贡献活动奖励' },
  { value: 'REWARD_COINS', name: '后台发送金币' },
  { value: 'DEDUCT_COINS', name: '后台扣除金币' },
  { value: 'WAGES', name: '工资' },
  { value: 'ACTIVE_AGENT_ANCHOR_COUNT_REWARD', name: '代理的主播数量满足奖励' },
  {
    value: 'ACTIVE_AGENT_MONTH_TARGET_REWARD',
    name: '代理名下主播累计月积分奖励',
  },
  { value: 'ACTIVE_ANCHOR_MONTH_TARGET_REWARD', name: '主播月积分奖励' },
  { value: 'ACTIVE_ANCHOR_DAY_TARGET_REWARD', name: '主播日积分奖励' },
  { value: 'GAME_FRUIT_BET', name: '幸运摩天轮下注-自研' },
  { value: 'GAME_FRUIT_AWARD', name: '幸运摩天轮奖励-自研' },
  { value: 'GAME_KTV_WEEK_RANK_REWARD', name: 'KTV游戏每周榜单奖励' },
  { value: 'AGENT_ACTIVE_WEEK_REWARD', name: '代理活动奖励-周' },
  { value: 'AGENT_ACTIVE_MONTH_REWARD', name: '代理活动奖励-月' },
  { value: 'CONSUMPTION_ACTIVITY', name: '消耗活动' },
  { value: 'ROOM_FAN_VOTES_ACTIVITY', name: '房间粉丝人气票' },
  { value: 'TARGET_EXCHANGE_GOLD', name: '目标兑换金币' },
  { value: 'HOST_TERMINATION_FEE', name: '主播申请解约' },
  { value: 'HOST_TERMINATION_FEE_RETURN', name: '主播取消申请解约' },
  { value: 'PURCHASING_RED_PACKET', name: '购买红包封面' },
  { value: 'PURCHASING_RED_PACKET_GIVEAWAY', name: '赠送红包封面' },
  { value: 'BLESSINGS_GIFT', name: 'CP空间祝福' },
  { value: 'SEND_FAMILY_GROUP_RED_PACKET', name: '发送家族群聊红包' },
  { value: 'RECEIVE_FAMILY_GROUP_RED_PACKET', name: '领取家族群聊红包' },
  { value: 'RECEIVE_FAMILY_GROUP_RED_PACKET_REFUND', name: '家族群聊红包退款' },
];
