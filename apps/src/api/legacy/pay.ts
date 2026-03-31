import { requestClient } from '#/api/request';
import type { LegacyPageResult } from '#/api/legacy/system';

export async function listPayOpenCountry() {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys-pay-open-country/list',
  );
}

export async function pagePayOpenCounty(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-pay-open-country/page',
    {
      params,
    },
  );
}

export async function addPayOpenCountyBatch(data: Array<Record<string, any>>) {
  return requestClient.post('/sys-pay-open-country/add-batch', data);
}

export async function delPayOpenCountyBatch(data: Array<number | string>) {
  return requestClient.post('/sys-pay-open-country/del-batch', data);
}

export async function updatePayOpenCountryExchangeRate(
  id: number | string,
  rate: number | string,
) {
  return requestClient.post('/sys-pay-open-country/update-exchange-rate', undefined, {
    params: { id, rate },
  } as Record<string, any>);
}

export async function updatePayOpenCountryCurrent(
  id: number | string,
  currency: string,
) {
  return requestClient.post('/sys-pay-open-country/update-currency', undefined, {
    params: { currency, id },
  } as Record<string, any>);
}

export async function updatePayOpenCountrySort(
  id: number | string,
  sort: number | string,
) {
  return requestClient.post('/sys-pay-open-country/update-sort', undefined, {
    params: { id, sort },
  } as Record<string, any>);
}

export async function updatePayOpenCountyShelf(
  id: number | string,
  shelf: boolean,
) {
  return requestClient.get('/sys-pay-open-country/shelf', {
    params: { id, shelf },
  });
}

export async function pagePayChannel(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-pay-channel/page',
    {
      params,
    },
  );
}

export async function listPayChannel(params?: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/sys-pay-channel/list', {
    params,
  });
}

export async function addPayChannel(data: Record<string, any>) {
  return requestClient.post('/sys-pay-channel/add', data);
}

export async function updatePayChannel(data: Record<string, any>) {
  return requestClient.post('/sys-pay-channel/update', data);
}

export async function pagePayFactory(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-pay-factory/page',
    {
      params,
    },
  );
}

export async function listPayFactory(params?: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/sys-pay-factory/list', {
    params,
  });
}

export async function addPayFactory(data: Record<string, any>) {
  return requestClient.post('/sys-pay-factory/add', data);
}

export async function updatePayFactory(data: Record<string, any>) {
  return requestClient.post('/sys-pay-factory/update', data);
}

export async function addPayFactoryAssociatedChannels(
  data: Array<Record<string, any>>,
) {
  return requestClient.post('/sys-pay-channel-factory/add-batch', data);
}

export async function delPayFactoryAssociatedChannels(data: Record<string, any>) {
  return requestClient.post('/sys-pay-channel-factory/del-batch', data);
}

export async function listFactoryAssociatedChannels(factoryCode: string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys-pay-channel-factory/channels',
    {
      params: { factoryCode },
    },
  );
}

export async function listCountrytSupportAmountChannels(
  payCountryId: number | string,
  amountUsd: number | string,
) {
  return requestClient.get<Record<string, any>>(
    '/sys-pay-channel-factory/support-amount',
    {
      params: { amountUsd, payCountryId },
    },
  );
}

export async function listPayApplication() {
  return requestClient.get<Array<Record<string, any>>>('/sys-pay-application/list');
}

export async function addPayApplication(data: Record<string, any>) {
  return requestClient.post('/sys-pay-application/add', data);
}

export async function updatePayApplication(data: Record<string, any>) {
  return requestClient.post('/sys-pay-application/update', data);
}

export async function listPayCountryChannel(payCountryId: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys-pay-channel-factory/country',
    {
      params: { payCountryId },
    },
  );
}

export async function addBatchCountyAssociateChannel(data: Record<string, any>) {
  return requestClient.post('/sys-pay-country-channel/add-batch', data);
}

export async function delBatchPayCountryChannel(data: Record<string, any>) {
  return requestClient.post('/sys-pay-country-channel/del-batch', data);
}

export async function addOrUpdateCountyChannelDetails(
  data: Record<string, any>,
) {
  return requestClient.post('/sys-pay-country-channel/add-or-update-details', data);
}

export async function pagePayCommodity(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-pay-commodity/page',
    {
      params,
    },
  );
}

export async function addOrUpdatePayCommodity(data: Record<string, any>) {
  return requestClient.post('/sys-pay-commodity/add-or-update', data);
}

export async function switchShelfCommodity(
  id: number | string,
  shelf: boolean,
) {
  return requestClient.post('/sys-pay-commodity/switch-shelf', undefined, {
    params: { id, shelf },
  } as Record<string, any>);
}
