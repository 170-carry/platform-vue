import { requestClient } from '#/api/request';

export interface LegacyCursorPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export interface LegacyRedisResult {
  data: any;
  ttl: number;
}

export async function requestBlackList() {
  return requestClient.get<string[]>('/request-black-list');
}

export async function addBlackListPhoneModel(phoneModel: string) {
  return requestClient.post('/request-black-list/phone-model', undefined, {
    params: { phoneModel },
  });
}

export async function addBlackListIP(ip: string) {
  return requestClient.post('/request-black-list/ip', undefined, {
    params: { ip },
  });
}

export async function delBlackList(content: string) {
  return requestClient.delete('/request-black-list/del', {
    params: { content },
  });
}

export async function goldAnalyze(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/tools/gold_analyze', {
    params,
  });
}

export async function getAppEnumConfigCache() {
  return requestClient.post<LegacyRedisResult>('/tools/redis/enum/configs');
}

export async function getPlatformProductConfigCache(sysOrigin: string) {
  return requestClient.post<LegacyRedisResult>(
    `/tools/redis/product/configs/${sysOrigin}`,
  );
}

export async function getGiftConfigCache() {
  return requestClient.post<LegacyRedisResult>('/tools/redis/gift/configs');
}

export async function getCheckInDaysCache(userId: number | string) {
  return requestClient.post<LegacyRedisResult>(
    `/tools/redis/${userId}/check_in/days`,
  );
}

export async function listApiOperationLog(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/tools/api-operation-log', {
    params,
  });
}

export async function requestApiSing(data: Record<string, any>) {
  return requestClient.post<string>('/tools/api_sing', data);
}

export async function alisMethod(data: Record<string, any>) {
  return requestClient.post<Array<Record<string, any>>>('/tools/alis_method', data);
}

export async function checkUserSwapUser(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/tools/user-swap-user', {
    params,
  });
}

export async function executeUserSwapUser(params: Record<string, any>) {
  return requestClient.get('/tools/user-swap-user-execute', {
    params,
  });
}

export async function updateUserRoomRegion(params: Record<string, any>) {
  return requestClient.post('/tools/user-room-region-update', undefined, {
    params,
  } as Record<string, any>);
}

export async function executeUserCancelAndRestore(
  params: Record<string, any>,
) {
  return requestClient.post('/tools/user-cancel-and-restore-execute', undefined, {
    params,
  } as Record<string, any>);
}

export async function getAccessTokenByUserId(token: string) {
  return requestClient.get<Record<string, any>>('/tools/token-user', {
    params: { token },
  });
}

export async function getUserToken(userId: number | string) {
  return requestClient.get<Record<string, any>>('/tools/user-token', {
    params: { userId },
  });
}

export async function clearRedisKey(key: string) {
  return requestClient.get('/tools/clean-redis-key', {
    params: { key },
  });
}

export async function archiveDevicePage(params: Record<string, any>) {
  return requestClient.get<LegacyCursorPageResult<Record<string, any>>>(
    '/sys/archive/device/page',
    {
      params,
    },
  );
}

export async function delDevice(deviceNo: number | string) {
  return requestClient.get(`/sys/archive/device/del/${deviceNo}`);
}
