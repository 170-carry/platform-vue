import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export interface LegacyRoomDetailsResponse {
  profile?: Record<string, any>;
  userProfile?: Record<string, any>;
}

export interface LegacyVersionItem {
  apkSize?: string;
  appType?: string;
  buildVersion?: number | string;
  channel?: string;
  createTime?: number | string;
  downloadUrl?: string;
  forceUpdate?: boolean;
  id?: number | string;
  patch?: boolean;
  platform?: string;
  review?: boolean;
  sysOrigin?: string;
  updateDescribe?: string;
  version?: string;
}

export interface LegacyVersionDescriptionItem {
  createTime?: number | string;
  id?: number | string;
  language?: string;
  updateDescribe?: string;
  updateWorshipDescribe?: string;
  versionId?: number | string;
}

export interface LegacyEnumConfigItem {
  createTime?: number | string;
  dataType?: string;
  description?: string;
  groupList?: string[];
  groupName?: string;
  id?: number | string;
  inoperable?: boolean;
  name?: string;
  returnApp?: boolean;
  sort?: number | string;
  sysOrigin?: string;
  title?: string;
  updateTime?: number | string;
  val?: string;
}

export interface LegacySpecialIdFlowItem {
  optUserNickname?: string;
  userBaseInfo?: Record<string, any>;
  userSpecialId?: Record<string, any>;
}

export interface LegacySpecialIdLogItem {
  createTime?: number | string;
  eventDesc?: string;
  id?: number | string;
  optUserNickname?: string;
  sysOrigin?: string;
  userBaseInfo?: Record<string, any>;
}

export interface LegacyProductConfigItem {
  createTime?: number | string;
  description?: string;
  id?: number | string;
  obtainCandy?: number | string;
  platform?: string;
  productPackage?: string;
  regionList?: Array<number | string>;
  regionNameStr?: string;
  rewardCandy?: number | string;
  showcase?: boolean;
  sort?: number | string;
  sysOrigin?: string;
  unitPrice?: number | string;
}

export interface LegacyEmojiGroupItem {
  amount?: number | string;
  cover?: string;
  createTime?: number | string;
  groupCode?: string;
  groupName?: string;
  id?: number | string;
  ktvStatus?: number | string;
  shelfStatus?: boolean | number;
  sort?: number | string;
  sysOrigin?: string;
}

export interface LegacyEmojiItem {
  coverUrl?: string;
  createTime?: number | string;
  group?: Record<string, any>;
  groupId?: number | string;
  id?: number | string;
  shelfStatus?: boolean;
  sort?: number | string;
  sourceType?: number | string;
  sourceUrl?: string;
  sysOrigin?: string;
  type?: string;
 }

export async function loginLoggerPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult>('/user/login/logger/page', {
    params,
  });
}

export async function getRoomBlacklist(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/room/profile-manager/blacklist',
    {
      params,
    },
  );
}

export async function getRoomProfileDetailsByRoomId(roomId: number | string) {
  return requestClient.get<LegacyRoomDetailsResponse>(
    '/room/profile-manager/details',
    {
      params: { roomId },
    },
  );
}

export async function getAppVersionTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyVersionItem>>(
    '/sys/version/manage',
    {
      params,
    },
  );
}

export async function addAppVersion(data: Record<string, any>) {
  return requestClient.post('/sys/version/manage', data);
}

export async function updateAppVersion(data: Record<string, any>) {
  return requestClient.post('/sys/version/manage/update', data);
}

export async function delAppVersion(id: number | string) {
  return requestClient.get(`/sys/version/manage/${id}`);
}

export async function addServerBuildVersion(params: Record<string, any>) {
  return requestClient.get('/sys/version/manage/add/build-version', {
    params,
  });
}

export async function getServerBuildVersion(params: Record<string, any>) {
  return requestClient.get<number | string>(
    '/sys/version/manage/get/build-version',
    {
      params,
    },
  );
}

export async function getAppVersionDescriptionTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyVersionDescriptionItem>>(
    '/sys/version/update/description',
    {
      params,
    },
  );
}

export async function addAppVersionDescription(data: Record<string, any>) {
  return requestClient.post('/sys/version/update/description', data);
}

export async function updateAppVersionDescription(data: Record<string, any>) {
  return requestClient.post('/sys/version/update/description/update', data);
}

export async function delAppVersionDescription(id: number | string) {
  return requestClient.get(`/sys/version/update/description/${id}`);
}

export async function getConfigInfo(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyEnumConfigItem>>(
    '/sys/enum/config/page',
    {
      params,
    },
  );
}

export async function addConfigInfo(data: Record<string, any>) {
  return requestClient.post('/sys/enum/config', data);
}

export async function updateConfigInfo(data: Record<string, any>) {
  return requestClient.put('/sys/enum/config', data);
}

export async function delConfig(id: number | string) {
  return requestClient.delete(`/sys/enum/config/${id}`);
}

export async function getEnumConfigByGroup(group: string) {
  return requestClient.get<{ result: LegacyEnumConfigItem[] }>(
    `/sys/enum/config/list/${group}`,
  );
}

export async function updateEnumConfigSort(data: Array<Record<string, any>>) {
  return requestClient.post('/sys/enum/config/sort', data);
}

export async function specialIdFlow(params: Record<string, any>) {
  return requestClient.get<LegacySpecialIdFlowItem[]>('/user-special-id/flow', {
    params,
  });
}

export async function saveOrUpdateSpecialId(data: Record<string, any>) {
  return requestClient.post('/user-special-id/add-or-update', data);
}

export async function updateSpecialIdExpiredTime(data: Record<string, any>) {
  return requestClient.post('/user-special-id/expired-time', data);
}

export async function removeSpecialId(data: Record<string, any>) {
  return requestClient.post('/user-special-id/remove', data);
}

export async function listSpecialIdLatestLog(account: number | string) {
  return requestClient.get<LegacySpecialIdLogItem[]>('/user-special-id/latest-log', {
    params: { account },
  });
}

export async function updateSpecialIdAccount(data: Record<string, any>) {
  return requestClient.post('/user-special-id/update-account', data);
}

export async function pageSpecialIdLogs(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacySpecialIdLogItem>>(
    '/user-special-id/page/latest-log',
    {
      params,
    },
  );
}

export async function listProductConfigs(params: Record<string, any>) {
  return requestClient.get<LegacyProductConfigItem[]>(
    '/sys/product/config/list',
    {
      params,
    },
  );
}

export async function addProductConfig(data: Record<string, any>) {
  return requestClient.post('/sys/product/config', data);
}

export async function updateProductConfig(data: Record<string, any>) {
  return requestClient.put('/sys/product/config', data);
}

export async function pageEmojiConfigs(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyEmojiItem>>('/emoji/config/page', {
    params,
  });
}

export async function addOrUpdateEmojiConfig(data: Record<string, any>) {
  return requestClient.post('/emoji/config/add-or-update', data);
}

export async function offShelfEmojiById(id: number | string) {
  return requestClient.post(`/emoji/config/off-shelf/${id}`);
}

export async function pageEmojiGroupConfigs(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyEmojiGroupItem>>(
    '/emoji/config/group/page',
    {
      params,
    },
  );
}

export async function addOrUpdateEmojiGroup(data: Record<string, any>) {
  return requestClient.post('/emoji/config/group/add-or-update', data);
}

export async function listEmojiGroupsBySysOrigin(sysOrigin: string) {
  return requestClient.get<LegacyEmojiGroupItem[]>(
    '/emoji/config/group/sys-origin-list',
    {
      params: { sysOrigin },
    },
  );
}

export async function switchEmojiGroupShelfStatus(
  id: number | string,
  status: number | string,
) {
  return requestClient.get('/emoji/config/group/shelf-status-switch', {
    params: { id, status },
  });
}
