import { requestClient } from '#/api/request';

export async function listFirstChargeRewards(sysOrigin: string) {
  return requestClient.get<Array<Record<string, any>>>(
    `/sys/product/config/list_candy_group/${sysOrigin}`,
  );
}
