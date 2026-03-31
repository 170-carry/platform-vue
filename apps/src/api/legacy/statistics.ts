import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function getPropsSaleSinge(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/count/operation/active-index/props-sale-singe',
    {
      params,
    },
  );
}

export async function getPropsSale(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/count/operation/active-index/props-sale',
    {
      params,
    },
  );
}

export async function pageQualityUsers(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/statistics/quality/users/page',
    {
      params,
    },
  );
}

export async function pageMonthlyQualityUsers(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/statistics/quality/users/page/monthly',
    {
      params,
    },
  );
}

export async function pageQualityUsersDetails(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/statistics/quality/users/details/page',
    {
      params,
    },
  );
}

export async function qualityUserRemarkSave(data: Record<string, any>) {
  return requestClient.post('/statistics/quality/users/add-or-update', data);
}

export async function getThisMonthRechargeByUserId(userId: number | string) {
  return requestClient.get<Record<string, any>>(
    '/statistics/quality/users/this-month/recharge',
    {
      params: { userId },
    },
  );
}
