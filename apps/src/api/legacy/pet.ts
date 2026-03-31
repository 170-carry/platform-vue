import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export async function pagePetFeeding(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/pet_pool/feeding/page',
    {
      params,
    },
  );
}

export async function pagePetPool(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/pet_pool/page',
    {
      params,
    },
  );
}

export async function savePet(data: Record<string, any>) {
  return requestClient.post('/pet_pool/add', data);
}

export async function togglePetPoolShelf(
  id: number | string,
  status: boolean,
) {
  return requestClient.get('/pet_pool/off_shelf', {
    params: { id, status },
  });
}

export async function pageUserBeanBalance(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user-bean-balance/page',
    {
      params,
    },
  );
}

export async function pageUserBeanRunningWater(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user-bean-balance/running-water/page',
    {
      params,
    },
  );
}

export async function addOrSubtractBeans(data: Record<string, any>) {
  return requestClient.post('/user-bean-balance/add-or-subtract/beans', data);
}
