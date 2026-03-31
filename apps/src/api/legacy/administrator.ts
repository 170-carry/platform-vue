import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function getAdministratorTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/administrator/page',
    {
      params,
    },
  );
}

export async function changeStatusAdministrator(data: Record<string, any>) {
  return requestClient.put('/sys/administrator', data);
}

export async function changeSysAdministratorRoles(
  id: number | string,
  roles: string,
) {
  return requestClient.get(`/sys/administrator/change_roles/${id}/${roles}`);
}

export async function getAdministratorAuthTable() {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys/administrator/auth/resource',
  );
}

export async function deleteAdministratorAuth(id: number | string) {
  return requestClient.get(`/sys/administrator/auth/resource/delete/${id}`);
}

export async function updateAdministratorAuth(data: Record<string, any>) {
  return requestClient.put('/sys/administrator/auth/resource', data);
}

export async function addAdministratorAuth(data: Record<string, any>) {
  return requestClient.post('/sys/administrator/auth/resource', data);
}

export async function getSysAdministratorAuthResourceByUserId(
  userId: number | string,
) {
  return requestClient.get<Array<number | string>>(
    `/sys/administrator/auth/resource/select/${userId}`,
  );
}

export async function deleteAndAddAdministratorAuth(data: Record<string, any>) {
  return requestClient.put('/sys/administrator/auth', data);
}

export async function addAdministrator(data: Record<string, any>) {
  return requestClient.post('/sys/administrator/add', data);
}

export async function deleteAdministrator(id: number | string) {
  return requestClient.get(`/sys/administrator/delete/${id}`);
}
