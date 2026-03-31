import { requestClient } from '#/api/request';

export async function getLuckyGiftRuleConfig(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-gift/rule-config', {
    params,
  });
}

export async function addLuckyGiftRuleConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-gift/rule-config', data);
}

export async function standardConfigTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-gift/standard-config', {
    params,
  });
}

export async function addOrUpdateStandardConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-gift/standard-config', data);
}

export async function deleteStandardConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-gift/standard-config/${id}`);
}

export async function mapLuckyGiftStandard(sysOrigin: string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/game/lucky-gift/map/probability',
    {
      params: { sysOrigin },
    },
  );
}

export async function addOrUpdateProbabilityConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-gift/probability-config', data);
}

export async function gameLuckyGiftProbabilityInfoConfig(
  params: Record<string, any>,
) {
  return requestClient.get<Record<string, any>>(
    '/game/lucky-gift/probability-info-config',
    {
      params,
    },
  );
}

export async function addLuckyGiftProbabilityInfoConfig(
  data: Record<string, any>,
) {
  return requestClient.post('/game/lucky-gift/probability-info-config', data);
}

export async function pageLuckyGiftGameRecord(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-gift/page/game/record', {
    params,
  });
}

export async function countLuckyGiftGame(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-gift/count', {
    params,
  });
}
