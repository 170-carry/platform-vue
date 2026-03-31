import { requestClient } from '#/api/request';

export async function pageLuckyBoxGameRecord(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/page/record', {
    params,
  });
}

export async function countLuckyBoxGame(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/count', {
    params,
  });
}

export async function getLuckyBoxFortuneConfig(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/lucky-box/fortune-config', {
    params,
  });
}

export async function addLuckyBoxFortuneConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/fortune-config', data);
}

export async function getBountyConfigTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/bounty-config', {
    params,
  });
}

export async function addOrUpdateBountyConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/bounty-config', data);
}

export async function deleteBountyConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-box/bounty-config/${id}`);
}

export async function getBountyDetialsConfigTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/game/lucky-box/bounty-details-config',
    {
      params,
    },
  );
}

export async function addOrUpdateBountyDetialsConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/bounty-details-config', data);
}

export async function deleteBountyDetailsConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-box/bounty-details-config/${id}`);
}

export async function getAwardConfig(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/award-config', {
    params,
  });
}

export async function addGameLuckyBoxAwardConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/award-config', data);
}

export async function deleteAwardConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-box/award-config/${id}`);
}

export async function getGameLuckyBoxAwardDetailsConfig(
  params: Record<string, any>,
) {
  return requestClient.get<Record<string, any>>(
    '/game/lucky-box/award-details-config',
    {
      params,
    },
  );
}

export async function addGameLuckyBoxAwardDetailsConfig(
  data: Record<string, any>,
) {
  return requestClient.post('/game/lucky-box/award-details-config', data);
}

export async function deleteAwardDetailsConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-box/award-details-config/${id}`);
}

export async function getStandardConfig(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/standard-config', {
    params,
  });
}

export async function addStandardConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/standard-config', data);
}

export async function switchStatus(
  id: number | string,
  status: boolean | number | string,
) {
  return requestClient.post(`/game/lucky-box/switch_status/${id}/${status}`);
}

export async function deleteStandardConfig(id: number | string) {
  return requestClient.delete(`/game/lucky-box/standard-config/${id}`);
}

export async function getGameLuckyBoxGiftConfig(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky-box/gift-config', {
    params,
  });
}

export async function addOrUpdateGiftConfig(data: Record<string, any>) {
  return requestClient.post('/game/lucky-box/gift-config', data);
}

export async function mapLuckyBoxGiftMap(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/lucky-box/map/gift', {
    params,
  });
}

export async function getGameLuckyBoxStandardDetailsConfig(
  params: Record<string, any>,
) {
  return requestClient.get<Record<string, any>>(
    '/game/lucky-box/standard-details-config',
    {
      params,
    },
  );
}

export async function addGameLuckyBoxStandardDetailsConfig(
  data: Record<string, any>,
) {
  return requestClient.post('/game/lucky-box/standard-details-config', data);
}
