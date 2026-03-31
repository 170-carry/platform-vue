import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export async function dynamicBlacklistPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/dynamic/blacklist/page',
    {
      params,
    },
  );
}

export async function addDynamicBlacklist(data: Record<string, any>) {
  return requestClient.post('/dynamic/blacklist/add', data);
}

export async function deleteDynamicBlacklist(userId: number | string) {
  return requestClient.get(`/dynamic/blacklist/delete/${userId}`);
}

export async function dynamicTagTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/dynamic/tag/page',
    {
      params,
    },
  );
}

export async function saveDynamicTag(data: Record<string, any>) {
  return requestClient.post('/dynamic/tag/add-or-update', data);
}

export async function getDynamicPopularConfig() {
  return requestClient.get<Record<string, any>>('/dynamic/popular/config');
}

export async function saveDynamicPopularConfig(data: Record<string, any>) {
  return requestClient.post('/dynamic/popular/config', data);
}

export async function userDynamicTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/dynamic/page',
    {
      params,
    },
  );
}

export async function deleteUserDynamic(data: Array<number | string>) {
  return requestClient.post('/user/dynamic/delete', data);
}

export async function setUserDynamicTop(data: Record<string, any>) {
  return requestClient.post('/user/dynamic/setUpTop', data);
}

export async function closeUserDynamicTop(dynamicId: number | string) {
  return requestClient.get(`/user/dynamic/closeTop/${dynamicId}`);
}
