export const TEAM_APPROVAL_REASONS = [
  { value: 'MEMBER_JOIN', name: '成员加入' },
  { value: 'MEMBER_QUIT', name: '成员主动退出' },
  { value: 'MEMBER_OWN_REMOVE', name: '代理主动删除成员' },
  { value: 'MEMBER_ADMIN_REMOVE', name: '管理员主动删除成员' },
  { value: 'MEMBER_APPLY_TIME_OUT', name: '长时间未处理申请消息，自动退出' },
  { value: 'REMOVE_MEMBER_NOT_ACTIVE', name: '移除不活跃成员' },
  { value: 'SYSTEM_MEMBER_REMOVE', name: '系统检测自动移除' },
  { value: 'SWITCH_TEAM_OWN', name: '更换团长' },
  { value: 'SWITCH_TEAM_REMOVE', name: '切换团队移除' },
] as const;

export const TEAM_MEMBER_ROLE_OPTIONS = [
  { value: 'OWN', name: '代理' },
  { value: 'ADMIN', name: '管理员' },
  { value: 'MEMBER', name: '成员' },
] as const;

export const TEAM_STATUS_OPTIONS = [
  { value: 'AVAILABLE', name: '正常' },
  { value: 'CLOSE', name: '关闭' },
] as const;

export const TEAM_CONTACT_TYPE_OPTIONS = [
  { value: 'FACEBOOK', name: 'Facebook' },
  { value: 'TWITTER', name: 'Twitter' },
  { value: 'EMAIL', name: 'Email' },
  { value: 'MOBLIE', name: 'Mobile' },
  { value: 'OTHER', name: 'Other' },
] as const;

export const TEAM_APPLICATION_PROCESS_STATUS_OPTIONS = [
  { value: 'WAIT', name: '待处理' },
  { value: 'AGREE', name: '同意' },
  { value: 'REJECT', name: '拒绝' },
] as const;

export const TEAM_REASON_OPTIONS = [
  { value: 'JOIN', name: '加入' },
  { value: 'QUIT', name: '退出' },
] as const;

export const BD_APPROVAL_REASONS = [
  { value: 'SYSTEM_DELETE_BD', name: '系统删除bd' },
  { value: 'SYSTEM_ADD_BD', name: '系统添加bd' },
  { value: 'SYSTEM_DELETE_BD_MEMBER', name: '系统删除bd' },
  { value: 'SYSTEM_DELETE_BD_LEAD', name: '系统删除bd lead' },
  { value: 'SYSTEM_ADD_BD_LEAD', name: '系统添加bd lead' },
  {
    value: 'SYSTEM_DELETE_BD_AND_DELETE_MEMBER',
    name: '系统删除bd，同时删除bd名下成员',
  },
  { value: 'SYSTEM_BD_LEAD_ADD_BD', name: '系统使用bd lead添加BD' },
  { value: 'ACCEPT_BD_INVITE', name: '接受成为BD邀请' },
] as const;

export const TEAM_BILL_STATUS_MAP: Record<
  string,
  { help: string; name: string; tag: string }
> = {
  UNPAID: { help: '当前进行中的', name: '未出账', tag: 'info' },
  PAY_OUT: { help: '本期账单已结束， 等待结算', name: '已出账', tag: '' },
  SETTLED: { help: '账单进行了核实,并支付成功的', name: '已结算', tag: 'success' },
  HANG_UP: { help: '存在争议的/银行卡信息不正确等待核实', name: '挂起', tag: 'warning' },
};

export const TEAM_BILL_STATUS_OPTIONS = [
  { value: 'UNPAID', name: '未出账', tag: 'info', help: '当前进行中的' },
  { value: 'PAY_OUT', name: '已出账', tag: '', help: '本期账单已结束， 等待结算' },
  { value: 'SETTLED', name: '已结算', tag: 'success', help: '账单进行了核实,并支付成功的' },
  { value: 'HANG_UP', name: '挂起', tag: 'warning', help: '存在争议的/银行卡信息不正确等待核实' },
] as const;

export function buildReasonLabelMap(
  list: Array<{ name: string; value: string }> = [],
) {
  return list.reduce<Record<string, string>>((result, item) => {
    result[item.value] = item.name;
    return result;
  }, {});
}
