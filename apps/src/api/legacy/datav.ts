import { requestClient } from '#/api/request';

export async function latestActiveUserCountryCode(params: Record<string, any> = {}) {
  return requestClient.get<Array<Record<string, any>>>(
    '/datav/active/user-country-code',
    {
      params,
    },
  );
}

export async function onlineUserCount(params: Record<string, any> = {}) {
  return requestClient.get<number>('/datav/online/user/count', {
    params,
  });
}

export async function onlineRoomCount(params: Record<string, any> = {}) {
  return requestClient.get<number>('/datav/online/room/count', {
    params,
  });
}
