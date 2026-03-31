import { requestClient } from '#/api/request';

export async function flowLudoGame(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game-ludo/flow', {
    params,
  });
}

export async function dismissLudoGame(roomId: number | string) {
  return requestClient.get('/game-ludo/dismiss', {
    params: { roomId },
  });
}

export async function listRoomPk(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/pk/list-room-pk', {
    params,
  });
}

export async function listTeamPk(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/pk/list-team-pk', {
    params,
  });
}

export async function listTrumpet(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/trumpet/list', {
    params,
  });
}

export async function deleteTrumpet(id: number | string) {
  return requestClient.get(`/game/trumpet/delete/${id}`);
}

export async function pageEggExchangeRecord(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/egg/exchange/page', {
    params,
  });
}

export async function pageEggLotteryRecord(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/game/egg/lottery/record/page',
    {
      params,
    },
  );
}

export async function getEggConfig(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/egg/config', {
    params,
  });
}

export async function updateEggConfig(data: Record<string, any>) {
  return requestClient.post('/game/egg/config', data);
}

export async function resetEggConsumeStockQuantity(id: number | string) {
  return requestClient.get('/game/egg/config/reset-consume-stock', {
    params: { id },
  });
}

export async function getEggExtractRatio(sysOrigin: string) {
  return requestClient.get<number | string>('/game/egg/config/extract-pool', {
    params: { sysOrigin },
  });
}

export async function setEggExtractRatio(sysOrigin: string, ratio: number | string) {
  return requestClient.get('/game/egg/config/set-extract-pool', {
    params: { ratio, sysOrigin },
  });
}

export async function getEggPrizePool(sysOrigin: string) {
  return requestClient.get<number | string>('/game/egg/config/prize-pool', {
    params: { sysOrigin },
  });
}

export async function pageGameLotteryGroup(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lottery/reward/group/page', {
    params,
  });
}

export async function saveOrUpdateGameLotteryGroup(data: Record<string, any>) {
  return requestClient.post('/game/lottery/reward/group/save_or_update', data);
}

export async function offGameLotteryGroup(
  id: number | string,
  offShelf: boolean | number | string,
) {
  return requestClient.get(`/game/lottery/reward/group/off/shelf/${id}/${offShelf}`);
}

export async function pageTableTeenPatti(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/teen-patti/page', {
    params,
  });
}

export async function pageTableUserBetTeenPatti(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/teen-patti/user-bet/page', {
    params,
  });
}

export async function getIncomeAndExpenditureTeenPatti(
  params: Record<string, any>,
) {
  return requestClient.get<Record<string, any>>('/game/teen-patti/total', {
    params,
  });
}

export async function getConfigTeenPatti() {
  return requestClient.get<Record<string, any>>('/game/teen-patti/config');
}

export async function updateConfigTeenPatti(data: Record<string, any>) {
  return requestClient.post('/game/teen-patti/config', data);
}

export async function getBonusAmountBalanceTeenPatti() {
  return requestClient.get<number | string>('/game/teen-patti/bonus-balance');
}

export async function getGameFruitDaysRecord(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/game/fruit/history/pageGameFruitDaysRecord',
    {
      params,
    },
  );
}

export async function pageDaysUserData(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>(
    '/game/fruit/history/pageDaysUserData',
    {
      params,
    },
  );
}

export async function listGameLuckyBox(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game/lucky/box/list', {
    params,
  });
}

export async function getProfitLossAmount(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/lucky/box/profit-loss', {
    params,
  });
}

export async function getPrizePoolAmount(sysOrigin: string) {
  return requestClient.get<number | string>('/game/lucky/box/prize-pool', {
    params: { sysOrigin },
  });
}

export async function getLuckyPrizePoolAmount(sysOrigin: string) {
  return requestClient.get<number | string>(
    '/game/lucky/box/lucky-prize-pool',
    {
      params: { sysOrigin },
    },
  );
}

export async function getLuckyDrawRatio(sysOrigin: string) {
  return requestClient.get<number | string>('/game/lucky/box/lucky-draw-ratio', {
    params: { sysOrigin },
  });
}

export async function setLuckyDrawRatio(
  sysOrigin: string,
  ratio: number | string,
) {
  return requestClient.post('/game/lucky/box/lucky-draw-ratio', undefined, {
    params: { ratio, sysOrigin },
  });
}

export async function getPoolPutRatio(sysOrigin: string) {
  return requestClient.get<number | string>('/game/lucky/box/pool-put-ratio', {
    params: { sysOrigin },
  });
}

export async function setPoolPutRatio(
  sysOrigin: string,
  ratio: number | string,
) {
  return requestClient.post('/game/lucky/box/pool-put-ratio', undefined, {
    params: { ratio, sysOrigin },
  });
}
