import { requestClient } from '#/api/request';

export async function badgeTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/sys/badge/config', {
    params,
  });
}

export async function updateBadge(data: Record<string, any>) {
  return requestClient.put('/sys/badge/config', data);
}

export async function deleteBadge(id: number | string) {
  return requestClient.get(`/sys/badge/config/delete/${id}`);
}

export async function addBadge(data: Record<string, any>) {
  return requestClient.post('/sys/badge/config', data);
}

export async function giveBadgeTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/sys/badge/config/getGiveBadgePage',
    {
      params,
    },
  );
}

export async function giveBadge(
  badgeId: number | string,
  userId: number | string,
) {
  return requestClient.get(`/sys/badge/config/give/badge/${badgeId}/${userId}`);
}

export async function retrieveBadge(
  badgeId: number | string,
  userId: number | string,
) {
  return requestClient.get(
    `/sys/badge/config/retrieve/badge/${badgeId}/${userId}`,
  );
}

export async function listBadgeByType(type: string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys/badge/config/list/badge-by-type',
    {
      params: { type },
    },
  );
}

export async function saveOrUpdateBadgePicture(data: Record<string, any>) {
  return requestClient.post('/sys/badge/picture/config/add-or-update', data);
}

export async function listBadgePictureBySysOrigin(
  sysOrigin: string,
  type: string,
) {
  return requestClient.post<Array<Record<string, any>>>(
    '/sys/badge/config/sys-origin',
    undefined,
    {
      params: { sysOrigin, type },
    },
  );
}

export async function listUserNotAchieveBadge(userId: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/user/badge/backpack/not-achieve/${userId}`,
  );
}
