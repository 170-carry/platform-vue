import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const result = await requestClient.get<{
    id?: number | string;
    loginName?: string;
    nickname?: string;
    token?: string;
  }>('/account/info');

  return {
    avatar: '',
    desc: '',
    homePath: '/workspace',
    realName: result?.nickname ?? result?.loginName ?? '管理员',
    roles: [],
    token: result?.token ?? '',
    userId: String(result?.id ?? ''),
    username: result?.loginName ?? '',
  } satisfies UserInfo;
}
