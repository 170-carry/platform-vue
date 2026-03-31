import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export async function pageFamilyLevelConfig(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/family/level/config/page',
    {
      params,
    },
  );
}

export async function addOrUpdateFamilyLevelConfig(data: Record<string, any>) {
  return requestClient.post('/family/level/config/add-or-update', data);
}

export async function pageFamilyCreateRule(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/family/create/rule/page',
    {
      params,
    },
  );
}

export async function addOrUpdateFamilyCreateRule(data: Record<string, any>) {
  return requestClient.post('/family/create/rule/add-or-update', data);
}

export async function pageFamilyRewardRule(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/family/reward/rule/page',
    {
      params,
    },
  );
}

export async function addOrUpdateFamilyRewardRule(data: Record<string, any>) {
  return requestClient.post('/family/reward/rule/add-or-update', data);
}

export async function pageFamilyList(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/family/page',
    {
      params,
    },
  );
}

export async function deleteFamily(familyId: number | string) {
  return requestClient.get(`/family/del/${familyId}`);
}

export async function pageFamilyMember(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/family/member/page',
    {
      params,
    },
  );
}

export async function removeFamilyMember(
  familyId: number | string,
  memberId: number | string,
) {
  return requestClient.get(`/family/member/del/${familyId}/${memberId}`);
}
