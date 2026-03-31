import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export async function pagePropsSource(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/props/source/record/page',
    {
      params,
    },
  );
}

export async function addPropsSource(data: Record<string, any>) {
  return requestClient.post('/props/source/record/add', data);
}

export async function updatePropsSource(data: Record<string, any>) {
  return requestClient.post('/props/source/record/update', data);
}

export async function offShelfPropsSource(
  id: number | string,
  offShelf: boolean,
) {
  return requestClient.get('/props/source/record/off/shelf', {
    params: { id, offShelf },
  });
}

export async function listSysOriginTypeList(sysOrigin: string, type: string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/props/source/record/sys-origin/type/list',
    {
      params: { sysOrigin, type },
    },
  );
}

export async function listNotFamilyBySysOriginType(
  sysOrigin: string,
  type: string,
) {
  return requestClient.get<Array<Record<string, any>>>(
    '/props/source/record/sys-origin/type/list/exclude-family',
    {
      params: { sysOrigin, type },
    },
  );
}

export async function pagePropsActivityRewardGroup(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/props/activity/reward/group/page',
    {
      params,
    },
  );
}

export async function getByGroupId(id: number | string) {
  return requestClient.get<Record<string, any>>(`/props/activity/reward/group/${id}`);
}

export async function saveOrUpdatePropsActivityRewardGroup(
  data: Record<string, any>,
) {
  return requestClient.post('/props/activity/reward/group/save-or-update', data);
}

export async function offPropsActivityRewardGroup(
  id: number | string,
  offShelf: boolean,
) {
  return requestClient.get(`/props/activity/reward/group/off/shelf/${id}/${offShelf}`);
}

export async function pagePropsActivityRuleConfig(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/props/activity/rule/config/page',
    {
      params,
    },
  );
}

export async function savePropsActivityRuleConfig(data: Record<string, any>) {
  return requestClient.post('/props/activity/rule/config/save-or-update', data);
}

export async function delPropsActivityRuleConfig(id: number | string) {
  return requestClient.get(`/props/activity/rule/config/del/${id}`);
}

export async function getGroupActivityList() {
  return requestClient.get<Array<Record<string, any>>>(
    '/props/activity/reward/group/get/activity/list',
  );
}

export async function sendPropsGiveUser(data: Record<string, any>) {
  return requestClient.post<string | null>('/props/give/send', data);
}

export async function sendPropsTicketGiveUser(data: Record<string, any>) {
  return requestClient.post<string | null>('/props/give/grant-coupon', data);
}

export async function pagePropsStore(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/props/store/page',
    {
      params,
    },
  );
}

export async function addOrUpdatePropsStore(data: Record<string, any>) {
  return requestClient.post('/props/store/add-or-update', data);
}
