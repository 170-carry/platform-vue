import { requestClient } from '#/api/request';

export async function getRoomProfileByRoomId(roomId: number | string) {
  return requestClient.get<Record<string, any>>('/room-profile-manager', {
    params: { roomId },
  });
}

export async function getRoomProfileBySysOriginAccount(
  sysOrigin: string,
  account: number | string,
) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/account/by-account',
    {
      params: { account, sysOrigin },
    },
  );
}

export async function listRoomProfileByAccount(account: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/account/list/by-account',
    {
      params: { account },
    },
  );
}

export async function onlineRoom(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/online',
    {
      params,
    },
  );
}

export async function flowMember(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/online/member',
    {
      params,
    },
  );
}

export async function contributionBalanceTable(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/room/contribution/balance/page', {
    params,
  });
}

export async function roomTimeContributionBalanceTable(
  params: Record<string, any>,
) {
  return requestClient.get<Record<string, any>>(
    '/room/contribution/balance/time/page',
    {
      params,
    },
  );
}

export async function pofileTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/room/profile-manager/flow', {
    params,
  });
}

export async function updateProfile(data: Record<string, any>) {
  return requestClient.post('/room/profile-manager/update-profile', data);
}

export async function getRoomUserInfo(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/room/member/page', {
    params,
  });
}

export async function changeRole(data: Record<string, any>) {
  return requestClient.post('/room/member/change/role', data);
}

export async function listRecentVisitors(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/visitors',
    {
      params,
    },
  );
}

export async function flowGameRedPacket(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/game-red-packet/flow', {
    params,
  });
}

export async function removeOrPullBlackRoomUser(data: Record<string, any>) {
  return requestClient.post('/room/profile-manager/blacklist/remove-or-pull', data);
}
