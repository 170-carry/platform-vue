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

export async function listUserCandyTop(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/user/candy/balance/top', {
    params,
  });
}

export async function pageBank(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/user-bank-balance/page', {
    params,
  });
}

export async function exprotBank(params: Record<string, any>) {
  return downloadLegacyExcel(
    '/user-bank-balance/export',
    params,
    'ExportUserBankAccount',
  );
}

export async function confirmImport(form: FormData) {
  return requestClient.post('/user-bank-balance/import', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  } as Record<string, any>);
}

export async function pageRunningWater(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/user-bank-balance/running-water-page',
    {
      params,
    },
  );
}

export async function calculateTotalAmount(params: Record<string, any>) {
  return requestClient.get<number>('/user-bank-balance/calculate/total', {
    params,
  });
}

export async function sendMoney(data: Record<string, any>) {
  return requestClient.post('/user-bank-balance/send-money', data);
}

export async function createBankBalance(data: Record<string, any>) {
  return requestClient.post('/user-bank-balance/create-bank-balance', data);
}

export async function deductMoney(data: Record<string, any>) {
  return requestClient.post('/user-bank-balance/deduct-money', data);
}

export async function transferMoney(data: Record<string, any>) {
  return requestClient.post('/user-bank-balance/transfer-money', data);
}

export async function pageBankWithdrawGoldApply(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/user-bank-balance/withdraw-gold-apply-page',
    {
      params,
    },
  );
}

export async function pageBankWithdrawMoneyApply(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/user-bank-balance/withdraw-money-apply-page',
    {
      params,
    },
  );
}

export async function exportBankWithdrawMoneyApply(params: Record<string, any>) {
  return downloadLegacyExcel(
    '/user-bank-balance/withdraw-money-apply/export',
    params,
    'ExportWithdrawMoneyApply',
  );
}

export async function getBankWithdrawMoneyApply(id: number | string) {
  return requestClient.get<Record<string, any>>(
    '/user-bank-balance/withdraw-money-apply/info',
    {
      params: { id },
    },
  );
}

export async function approvalMoneyApply(data: Record<string, any>) {
  return requestClient.post('/user-bank-balance/approval-money-apply', data);
}

export async function pageSalary(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/team/salary/list',
    {
      params,
    },
  );
}

export async function pageCpApply(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user-cp-apply/page',
    {
      params,
    },
  );
}

export async function purchaseTodayTotal(params: Record<string, any> = {}) {
  return requestClient.get<number>('/order/purchase/history/purchase/today/total', {
    params,
  });
}

export async function purchaseTodayTotalBySysOrigin(sysOrigin: string) {
  return requestClient.get<number>(
    `/order/purchase/history/${sysOrigin}/purchase/today/total`,
  );
}

export async function orderPurchaseHistoryCompensate(data: Record<string, any>) {
  return requestClient.post('/order/purchase/history/compensate', data);
}

export async function compensateCandy(params: Record<string, any>) {
  return requestClient.post('/order/purchase/history/compensate/candy', undefined, {
    params,
  } as Record<string, any>);
}

export async function getOrderAbnormalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/order/abnormal/log/page',
    {
      params,
    },
  );
}

export async function getOrderAbnormalCertificate(id: number | string) {
  return requestClient.get<string>('/order/abnormal/log/certificate', {
    params: { id },
  });
}

export async function updateOrderAbnormalStatus(params: Record<string, any>) {
  return requestClient.put('/order/abnormal/log/status', undefined, {
    params,
  } as Record<string, any>);
}

export async function getClsGoldRunningWater(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/user-wallet/gold/running-water/cls', {
    params,
  });
}

export async function getPurchaseTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/order/purchase/history/page',
    {
      params,
    },
  );
}

export async function listInAppPurchase(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/order/in-app-purchase/details/list',
    {
      params,
    },
  );
}

export async function getInAppPurchase(id: number | string) {
  return requestClient.get<Record<string, any>>(
    '/order/in-app-purchase/details',
    {
      params: { id },
    },
  );
}

export async function getOrderAmount(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/order/in-app-purchase/statistics',
    {
      params,
    },
  );
}
