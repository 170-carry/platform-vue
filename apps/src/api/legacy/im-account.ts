import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function pageSysImAccount(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/im/account/page',
    {
      params,
    },
  );
}

export async function addSysImAccount(data: Record<string, any>) {
  return requestClient.post('/sys/im/account', data);
}

export async function resetSysImAccountPassword(params: Record<string, any>) {
  return requestClient.put('/sys/im/account/reset', undefined, {
    params,
  } as Record<string, any>);
}

export async function delSysImAccountPassword(params: Record<string, any>) {
  return requestClient.delete('/sys/im/account', {
    params,
  });
}
