import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export interface LegacyTeamPolicyItem {
  countryCode?: string;
  createTime?: number | string;
  createUserNickname?: string;
  historyRelease?: boolean;
  id?: number | string;
  policy?: Array<Record<string, any>>;
  policyType?: string;
  region?: number | string;
  release?: boolean;
  title?: string;
}

export async function teamProcessApprovalTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/team/application/process/approval/list',
    {
      params,
    },
  );
}

export async function listMembers() {
  return requestClient.get<Array<Record<string, any>>>('/users/list/combo');
}

export async function listTeamTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/team/list', {
    params,
  });
}

export async function listTeamBillTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/team/bill/list', {
    params,
  });
}

export async function teamPolicyReleases(params: Record<string, any>) {
  return requestClient.get<LegacyTeamPolicyItem>(
    '/team/policy/manager/releases',
    {
      params,
    },
  );
}

export async function teamPolicyHistoryReleases(params: Record<string, any>) {
  return requestClient.get<LegacyTeamPolicyItem[]>(
    '/team/policy/manager/history/releases',
    {
      params,
    },
  );
}

export async function teamPolicyAdd(data: Record<string, any>) {
  return requestClient.post('/team/policy/manager/add', data);
}

export async function deleteTeamPolicy(id: number | string) {
  return requestClient.get(`/team/policy/manager/delete/${id}`);
}

export async function getTeamDetails(teamId: number | string) {
  return requestClient.get<Record<string, any>>('/team/details', {
    params: { teamId },
  });
}

export async function listMemberTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/team/member/list', {
    params,
  });
}

export async function listTeamMemberWork(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/team/member/work', {
    params,
  });
}

export async function addTeamMember(data: Record<string, any>) {
  return requestClient.post('/team/member/add', data);
}

export async function createTeam(data: Record<string, any>) {
  return requestClient.post('/team/create', data);
}

export async function updateTeamProfile(data: Record<string, any>) {
  return requestClient.post('/team/update-profile', data);
}

export async function delTeamBatch(teamIds: Array<number | string>) {
  return requestClient.post('/team/del', teamIds);
}

export async function addTeamRemarks(data: Record<string, any>) {
  return requestClient.post('/team/add-remarks', data);
}

export async function delTeamRemarks(data: Record<string, any>) {
  return requestClient.post('/team/del-remarks', data);
}

export async function addTeamContact(data: Record<string, any>) {
  return requestClient.post('/team/add-contact', data);
}

export async function delTeamContact(data: Record<string, any>) {
  return requestClient.post('/team/del-contact', data);
}

export async function removeTeamMember(data: Record<string, any>) {
  return requestClient.post('/team/member/remove', data);
}

export async function updateMemberRemark(data: Record<string, any>) {
  return requestClient.post('/team/member/update-remark', data);
}

export async function updateMemberTeam(data: Record<string, any>) {
  return requestClient.post('/team/member/team-change', data);
}

export async function checkTarget(params: Record<string, any>) {
  return requestClient.get<number>('/team/check-target', {
    params,
  });
}

export async function resetUnpaidBillMemberTarget(data: Record<string, any>) {
  return requestClient.post('/team/reset-target', data);
}

export async function sendTeamNotice(data: Record<string, any>) {
  return requestClient.post('/team/notice/send', data);
}

export async function listTeamNoticeByTeamId(teamId: number | string) {
  return requestClient.get<Array<Record<string, any>>>(`/team/notice/list/${teamId}`);
}

export async function deleteTeamNoticeById(id: number | string) {
  return requestClient.get(`/team/notice/delete/${id}`);
}

export async function teamProcessTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/team/application/process/list',
    {
      params,
    },
  );
}

export async function excelAnchorBill(
  params: Record<string, any>,
  excelName: string,
) {
  const rawResponse = await requestClient.get('/team/bill/excel', {
    params,
    responseReturn: 'raw',
    responseType: 'blob',
  } as Record<string, any>);

  const data = rawResponse instanceof Blob ? rawResponse : rawResponse?.data;
  const blob = data instanceof Blob ? data : new Blob([data]);
  const href = window.URL.createObjectURL(blob);
  const downloadElement = document.createElement('a');
  downloadElement.href = href;
  downloadElement.download = `${excelName}.xlsx`;
  document.body.append(downloadElement);
  downloadElement.click();
  downloadElement.remove();
  window.URL.revokeObjectURL(href);
}

export async function pageBdLead(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/team/bd/leader/page',
    {
      params,
    },
  );
}

export async function deleteBdLead(id: number | string) {
  return requestClient.get('/team/bd/leader/del', {
    params: { id },
  });
}

export async function addBdLead(data: Record<string, any>) {
  return requestClient.post('/team/bd/leader/add', data);
}

export async function updateBdLead(data: Record<string, any>) {
  return requestClient.post('/team/bd/leader/update', data);
}

export async function leadBindBd(data: Record<string, any>) {
  return requestClient.post('/team/bd/leader/bind/bd', data);
}

export async function teamBindBd(data: Record<string, any>) {
  return requestClient.post('/team/bind/bd', data);
}
