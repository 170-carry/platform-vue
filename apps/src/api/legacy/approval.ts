import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export interface LegacyMemberOption {
  id: number | string;
  nickname: string;
}

export interface LegacyAccountStatus {
  name?: string;
  value?: string;
}

export interface LegacyFeedbackProcessPayload {
  id: number | string;
  remarks: string;
  userId: number | string;
}

export interface LegacyBatchFeedbackPayload {
  processFeedbacks: Array<{
    approvalRemarks: string;
    approvalStatus: number;
    id: number | string;
    userId: number | string;
  }>;
}

export interface LegacyAccountHandlePayload {
  accountStatusEnum: string;
  beApprovalUserId: number | string;
  days?: number | string;
  description: string;
  descriptionTranslate?: string;
}

export interface LegacyUserBaseInfoPayload {
  age?: number | string;
  bornDay?: number | string;
  bornMonth?: number | string;
  bornYear?: number | string;
  countryCode?: string;
  countryId?: number | string;
  countryName?: string;
  id?: number | string;
  userNickname?: string;
  userSex?: number | string;
}

export async function getUserProfileApprovalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/data/approval/user-profile/page', {
    params,
  });
}

export async function getUserProfileDescApprovalPage(
  params: Record<string, any>,
) {
  return requestClient.get<LegacyPageResult>(
    '/data/approval/user-profile-desc/page',
    {
      params,
    },
  );
}

export async function getRoomApprovalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>(
    '/room/profile-manager/approval/page',
    {
      params,
    },
  );
}

export async function getRoomThemeApprovalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/room/user/theme/page', {
    params,
  });
}

export async function approveRoomTheme(data: Record<string, any>) {
  return requestClient.post('/room/user/theme/approve', data);
}

export async function approveData(data: Record<string, any>) {
  return requestClient.post('/data/approval', data);
}

export async function getPhotoWallApprovalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/user/photo/wall/page/all', {
    params,
  });
}

export async function approvePhotoWallPass(data: Record<string, any>[]) {
  return requestClient.post('/approval/photo/wall/pass', data);
}

export async function approvePhotoWallNotPass(data: Record<string, any>[]) {
  return requestClient.post('/approval/photo/wall/not/pass', data);
}

export async function getFamilyApprovalPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/family/approval/page', {
    params,
  });
}

export async function markFamilyNotPass(data: Record<string, any>) {
  return requestClient.post('/family/approval/not-pass', data);
}

export async function getFeedbackPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/sys/feedback/page', {
    params,
  });
}

export async function processFeedback(data: LegacyFeedbackProcessPayload) {
  return requestClient.get('/sys/feedback/process', {
    params: data,
  });
}

export async function batchProcessFeedback(data: LegacyBatchFeedbackPayload) {
  return requestClient.post('/sys/feedback/batchProcess', data);
}

export async function getReportedPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/sys/reported/user/page', {
    params,
  });
}

export async function approveReportedPass(data: Record<string, any>[]) {
  return requestClient.post('/approval/reported/pass', data);
}

export async function approveReportedNotPass(data: Record<string, any>[]) {
  return requestClient.post('/approval/reported/not/pass', data);
}

export async function getDynamicReportPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/dynamic/report/page', {
    params,
  });
}

export async function pageUserIntegralOriginStream(
  params: Record<string, any>,
) {
  return requestClient.get<LegacyPageResult>(
    '/user/integral/origin/stream/page',
    {
      params,
    },
  );
}

export async function processDynamicReport(data: Record<string, any>) {
  return requestClient.post('/dynamic/report', data);
}

export async function getDynamicContentPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/approval/dynamic/content/page', {
    params,
  });
}

export async function approveDynamicContentPass(data: Array<number | string>) {
  return requestClient.post('/approval/dynamic/content/pass', data);
}

export async function approveDynamicContentNotPass(
  data: Array<number | string>,
) {
  return requestClient.post('/approval/dynamic/content/not/pass', data);
}

export async function getViolationHistoryPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/approval/history/page', {
    params,
  });
}

export async function getUserBankCardPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/user/bank-card/page', {
    params,
  });
}

export async function approveUserBankCardPass(
  data: Array<number | string>,
) {
  return requestClient.post('/user/bank-card/pass', data);
}

export async function approveUserBankCardNotPass(
  data: Array<number | string>,
) {
  return requestClient.post('/user/bank-card/not-pass', data);
}

export async function updateUserBaseInfo(data: LegacyUserBaseInfoPayload) {
  return requestClient.put('/user/base/info', data);
}

export async function getUserBaseInfo(userId: number | string) {
  return requestClient.get<Record<string, any>>(`/user/base/info/${userId}`);
}

export async function getUserPhotoWallAll(userId: number | string) {
  return requestClient.get<string[]>(`/user/photo/wall/all/${userId}`);
}

export async function getUserRegisterInfo(userId: number | string) {
  return requestClient.get<Record<string, any>>(`/user/register/info/${userId}`);
}

export async function getUserAccountStatus(userId: number | string) {
  return requestClient.get<LegacyAccountStatus>(
    `/user/base/info/account/status/${userId}`,
  );
}

export async function getUserStatusLogTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>(
    '/approval/user/account/status/log/page',
    {
      params,
    },
  );
}

export async function handleUserAccount(data: LegacyAccountHandlePayload) {
  return requestClient.post('/user/data/violation/expand/approval/account', data);
}

export async function translateUserLangContent(params: Record<string, any>) {
  return requestClient.get('/translation', {
    params,
  });
}

export async function listMemberOptions() {
  return requestClient.get<LegacyMemberOption[]>('/users/list/combo');
}
