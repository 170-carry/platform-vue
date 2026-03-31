import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

export async function getGameCouponRunningWaterDetailsTable(
  params: Record<string, any>,
) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/game/coupon/income/expenditure/details/page',
    {
      params,
    },
  );
}

export async function originList() {
  return requestClient.get<Array<Record<string, any>>>(
    '/user/game/coupon/income/expenditure/origin/list',
  );
}
