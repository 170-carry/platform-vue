import type { LegacyPageResult } from '#/api/legacy/system';

import { requestClient } from '#/api/request';

async function downloadLegacyExcel(
  url: string,
  params: Record<string, any>,
  filename: string,
) {
  const rawResponse = await requestClient.get(url, {
    params,
    responseReturn: 'raw',
    responseType: 'blob',
  } as Record<string, any>);

  const data = rawResponse instanceof Blob ? rawResponse : rawResponse?.data;
  const blob = data instanceof Blob ? data : new Blob([data]);
  const href = window.URL.createObjectURL(blob);
  const downloadElement = document.createElement('a');
  downloadElement.href = href;
  downloadElement.download = `${filename}.xlsx`;
  document.body.append(downloadElement);
  downloadElement.click();
  downloadElement.remove();
  window.URL.revokeObjectURL(href);
}

export async function getUserInviteRewardRecord(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/invite/user/reward/page',
    {
      params,
    },
  );
}

export async function pageUserBaseInfo(data: Record<string, any>) {
  return requestClient.post<LegacyPageResult<Record<string, any>>>(
    '/user/base/info/page',
    data,
  );
}

export async function getUserBaseInfoByAccount(id: number | string) {
  return requestClient.get<Record<string, any>>(`/user/base/info/account/${id}`);
}

export async function getUserBaseInfoBySysOriginAccount(
  sysOrigin: string,
  id: number | string,
) {
  return requestClient.get<Record<string, any>>(
    `/user/base/info/${sysOrigin}/account/${id}`,
  );
}

export async function resetUserAccountPassword(data: Record<string, any>) {
  return requestClient.post('/user/auth/type/account/resetPassword', data);
}

export async function rewardGameCoupon(data: Record<string, any>) {
  return requestClient.post(
    '/user/game/coupon/income/expenditure/reward/coupon',
    undefined,
    {
      params: data,
    } as Record<string, any>,
  );
}

export async function deductGameCoupon(data: Record<string, any>) {
  return requestClient.post(
    '/user/game/coupon/income/expenditure/deduct/coupon',
    undefined,
    {
      params: data,
    } as Record<string, any>,
  );
}

export async function sendGold(data: Record<string, any>) {
  return requestClient.post('/user-wallet/send-gold', data);
}

export async function deductGold(data: Record<string, any>) {
  return requestClient.post('/user-wallet/deduct-gold', data);
}

export async function sendDiamond(data: Record<string, any>) {
  return requestClient.post('/user-wallet/send-diamond', data);
}

export async function deductDiamond(data: Record<string, any>) {
  return requestClient.post('/user-wallet/deduct-diamond', data);
}

export async function getUserVipEquity(userId: number | string) {
  return requestClient.get<Record<string, any>>(
    `/user/base/info/user/vip/equity/${userId}`,
  );
}

export async function getUserIdentity(userId: number | string) {
  return requestClient.get<Record<string, any>>(
    `/user/base/info/${userId}/identity`,
  );
}

export async function pageUserCheckLog(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/check/inLog',
    {
      params,
    },
  );
}

export async function pageUserDiamondRunWater(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/diamond/run/water/page',
    {
      params,
    },
  );
}

export async function pageUserDiamondBalance(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/diamond/balance/page',
    {
      params,
    },
  );
}

export async function pageRewardReceiveRecord(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/activity/reward/receive/record/page',
    {
      params,
    },
  );
}

export async function getUserDeviceTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/latest/mobile/device/page',
    {
      params,
    },
  );
}

export async function userPropsTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/running/water/user/props/page',
    {
      params,
    },
  );
}

export async function userPropsMikeType(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/room-mike-type/page',
    {
      params,
    },
  );
}

export async function userBeautifulNumberApplyTable(
  params: Record<string, any>,
) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/beautiful/number/apply/page',
    {
      params,
    },
  );
}

export async function handleBeautifulNumberApplyState(
  id: number | string,
  state: number | string,
  remark = '',
) {
  return requestClient.get(`/beautiful/number/apply/handle/${id}/${state}`, {
    params: { remark },
  });
}

export async function pageFreight(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/freight/page',
    {
      params,
    },
  );
}

export async function shipFreight(data: Record<string, any>) {
  return requestClient.post('/freight/ship', data);
}

export async function deductionFreight(data: Record<string, any>) {
  return requestClient.post('/freight/deduction', data);
}

export async function pageFreightRunningWater(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/freight/running-water-page',
    {
      params,
    },
  );
}

export async function exportFreightWaters(params: Record<string, any>) {
  return downloadLegacyExcel(
    '/freight/running-water/export',
    params,
    'ExportFreightWaters',
  );
}

export async function pageFreightSellerRunningWater(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/freight/freight-seller-running-water-page',
    {
      params,
    },
  );
}

export async function switchStatusFreight(
  id: number | string,
  status: boolean | string,
) {
  return requestClient.post(`/freight/switch-status/${id}/${status}`);
}

export async function showStatusFreight(
  id: number | string,
  status: boolean | string,
) {
  return requestClient.post(`/freight/show-status/${id}/${status}`);
}

export async function switchStatusDealer(
  id: number | string,
  status: boolean | string,
) {
  return requestClient.post(`/freight/switch-dealer-status/${id}/${status}`);
}

export async function switchStatusSuperDealer(
  id: number | string,
  status: boolean | string,
) {
  return requestClient.post(
    `/freight/switch-superdealer-status/${id}/${status}`,
  );
}

export async function pageFreightSeller(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/freight-seller/page',
    {
      params,
    },
  );
}

export async function updateSellerQuantity(data: Record<string, any>) {
  return requestClient.post('/freight/update-seller-quantity', data);
}

export async function removeFreightSeller(id: number | string) {
  return requestClient.delete(`/freight-seller/delete/${id}`);
}

export async function numberTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user/beautiful/number',
    {
      params,
    },
  );
}

export async function updateNumber(data: Record<string, any>) {
  return requestClient.put('/user/beautiful/number', data);
}

export async function deleteNumber(id: number | string) {
  return requestClient.get(`/user/beautiful/number/delete/${id}`);
}

export async function addNumber(data: Record<string, any>) {
  return requestClient.post('/user/beautiful/number', data);
}
