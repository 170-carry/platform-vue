import { requestClient } from '#/api/request';

export async function getGameFruitBountyConfigTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/fruit/bounty-config', {
    params,
  });
}

export async function addOrUpdateGameFruitBountyConfig(data: Record<string, any>) {
  return requestClient.post('/game/fruit/bounty-config', data);
}

export async function deleteGameFruitBountyConfig(id: number | string) {
  return requestClient.delete(`/game/fruit/bounty-config/${id}`);
}

export async function getGameFruitTaskConfig(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/game/fruit/task-config', {
    params,
  });
}

export async function addGameFruitTaskConfig(data: Record<string, any>) {
  return requestClient.post('/game/fruit/task-config', data);
}

export async function deleteGameFruitTaskConfig(id: number | string) {
  return requestClient.delete(`/game/fruit/task-config/${id}`);
}

export async function getGameFruitImages(sysOrigin: string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/game/fruit/images/${sysOrigin}`,
  );
}
