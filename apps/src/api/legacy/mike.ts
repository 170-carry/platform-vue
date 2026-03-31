import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function mikeTypeTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/mike-type/config',
    {
      params,
    },
  );
}

export async function updateMikeType(data: Record<string, any>) {
  return requestClient.put('/sys/mike-type/config', data);
}

export async function deleteMikeType(id: number | string) {
  return requestClient.delete(`/sys/mike-type/config/delete/${id}`);
}

export async function addMikeType(data: Record<string, any>) {
  return requestClient.post('/sys/mike-type/config', data);
}
