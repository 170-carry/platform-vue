import { requestClient } from '#/api/request';

export async function listGiftBySysOrigin(sysOrigin: string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/sys/gift/config/sys-origin/${sysOrigin}`,
  );
}

export async function listGiftGiveAwayRunningWater(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/running-water-log/gift-give', {
    params,
  });
}

export async function listUserRoomGiftGiveAwayRunningWater(
  params: Record<string, any>,
) {
  return requestClient.get<Array<Record<string, any>>>(
    '/running-water-log/gift-give-room',
    {
      params,
    },
  );
}

export async function giftTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/sys/gift/config', {
    params,
  });
}

export async function updateGift(data: Record<string, any>) {
  return requestClient.put('/sys/gift/config', data);
}

export async function addGift(data: Record<string, any>) {
  return requestClient.post('/sys/gift/config', data);
}

export async function switchDelStatus(
  id: number | string,
  status: boolean | number | string,
) {
  return requestClient.get(`/sys/gift/config/switch/${id}/${status}`);
}

export async function countGiftAmount(params: Record<string, any>) {
  return requestClient.get<number>('/running-water-log/total-count', {
    params,
  });
}

export async function countGiftAcceptQuantity(params: Record<string, any>) {
  return requestClient.get<number>('/running-water-log/accept-gift-quantity', {
    params,
  });
}

export async function listByTab(sysOrigin: string, giftTab: string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/sys/gift/config/listByTab/${sysOrigin}/${giftTab}`,
  );
}

export async function getPairCpGiveGiftId(sysOrigin: string) {
  return requestClient.get<number | string>(
    `/sys/gift/config/pair/cp/give/gift/${sysOrigin}`,
  );
}

export async function pushPairCpGiveGiftId(
  giftId: number | string,
  sysOrigin: string,
) {
  return requestClient.get(
    `/sys/gift/config/pair/cp/give/gift/${giftId}/${sysOrigin}`,
  );
}
