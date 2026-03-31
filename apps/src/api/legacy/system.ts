import { requestClient } from '#/api/request';

export interface LegacyPageResult<T = Record<string, any>> {
  records: T[];
  total: number;
}

export interface LegacyMenu {
  alias?: string;
  children?: LegacyMenu[];
  icon?: string;
  id: number | string;
  menuName: string;
  menuType?: number | string;
  parentId?: number | string;
  path?: string;
  resourceIds?: Array<number | string>;
  router?: string;
  sort?: number | string;
  status?: number | string;
  updateTime?: number | string;
}

export interface LegacyRole {
  id: number | string;
  menuIds?: Array<number | string>;
  remark?: string;
  roleName: string;
  updateTime?: number | string;
}

export interface LegacyUser {
  email?: string;
  id: number | string;
  loginName: string;
  nickname?: string;
  phone?: string;
  roleIds?: Array<number | string>;
  status?: number | string;
  userRoles?: Array<{
    roleId?: number | string;
    roleName?: string;
  }>;
}

export async function pageUsers(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyUser>>('/users', {
    params,
  });
}

export async function switchUserStatus(
  id: number | string,
  status: number | string,
) {
  return requestClient.put('/users/update/status', { id, status });
}

export async function resetUserPassword(id: number | string) {
  return requestClient.put('/users/reset/password', undefined, {
    params: { id },
  });
}

export async function getRoles() {
  return requestClient.get<LegacyRole[]>('/roles/list');
}

export async function addUser(data: Record<string, any>) {
  return requestClient.post('/users', data);
}

export async function updateUser(data: Record<string, any>) {
  return requestClient.put('/users/update', data);
}

export async function pageRoleTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<LegacyRole>>('/roles', {
    params,
  });
}

export async function addRole(data: Record<string, any>) {
  return requestClient.post('/roles', data);
}

export async function updateRole(data: Record<string, any>) {
  return requestClient.put('/roles/update', data);
}

export async function delRole(id: number | string) {
  return requestClient.delete('/roles/remove', {
    params: { id },
  });
}

export async function updateRoleMenus(data: {
  id: number | string;
  menuIds: Array<number | string>;
}) {
  return requestClient.put('/roles/update/menus', data);
}

export async function allMenus() {
  return requestClient.get<LegacyMenu[]>('/menus');
}

export async function addMenu(data: Record<string, any>) {
  return requestClient.post('/menus/create', data);
}

export async function getMenu(id: number | string) {
  return requestClient.get<LegacyMenu>('/menus/get', {
    params: { id },
  });
}

export async function updateMenu(data: Record<string, any>) {
  return requestClient.put('/menus/update', data);
}

export async function delMenu(id: number | string) {
  return requestClient.delete('/menus/remove', {
    params: { id },
  });
}

export async function getResources() {
  return requestClient.get<Array<Record<string, any>>>('/resources/list');
}

export async function pageResources(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>('/resources', {
    params,
  });
}

export async function resetResources() {
  return requestClient.put('/resources');
}

export async function regionConfigTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/region/config/list', {
    params,
  });
}

export async function regionRelationTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/region/relation/page',
    {
      params,
    },
  );
}

export async function updateRegionRelation(data: Record<string, any>) {
  return requestClient.post('/sys/region/relation/update', data);
}

export async function addRegionRelation(data: Record<string, any>) {
  return requestClient.post('/sys/region/relation/add', data);
}

export async function updateRegionConfig(data: Record<string, any>) {
  return requestClient.post('/region/config/update', data);
}

export async function addRegionConfig(data: Record<string, any>) {
  return requestClient.post('/region/config/add', data);
}

export async function resetRegionWithdrawal(regionId: number | string) {
  return requestClient.get('/region/config/reset-withdrawal', {
    params: { regionId },
  });
}

export async function regionAssistConfigTable(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/region/assist/config/list',
    {
      params,
    },
  );
}

export async function updateRegionAssistConfig(data: Record<string, any>) {
  return requestClient.post('/region/assist/config/update', data);
}

export async function addRegionAssistConfig(data: Record<string, any>) {
  return requestClient.post('/region/assist/config/add', data);
}

export async function deleteRegionAssistConfig(id: number | string) {
  return requestClient.get(`/region/assist/config/delete/${id}`);
}

export async function getCountryAlls() {
  return requestClient.get<Array<Record<string, any>>>('/sys/country/code');
}

export async function pageSysCountryCode(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/country/code/page',
    {
      params,
    },
  );
}

export async function updateSysCountryCode(data: Record<string, any>) {
  return requestClient.put('/sys/country/code', data);
}

export async function refundAnchorTrackRecordPage(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/refund-anchor-track-record/page',
    {
      params,
    },
  );
}

export async function addOrUpdateSetTopRoom(data: Record<string, any>) {
  return requestClient.post('/sys-set-top/add-or-update', data);
}

export async function removeSetTopRoom(roomId: number | string) {
  return requestClient.get('/sys-set-top/remove', {
    params: { roomId },
  });
}

export async function pageSetTopRoom(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-set-top/page',
    {
      params,
    },
  );
}

export async function addOrUpdateSetHotRoom(data: Record<string, any>) {
  return requestClient.post('/sys-set-hot/add-or-update', data);
}

export async function removeSetHotRoom(roomId: number | string) {
  return requestClient.get('/sys-set-hot/remove', {
    params: { roomId },
  });
}

export async function pageSetHotRoom(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-set-hot/page',
    {
      params,
    },
  );
}

export async function pageGameConfig(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys-game-list-config/page',
    {
      params,
    },
  );
}

export async function saveOrUpdateGameConfig(data: Record<string, any>) {
  return requestClient.post('/sys-game-list-config/save-or-update', data);
}

export async function deleteGameConfig(
  id: number | string,
  sysOrigin: number | string,
) {
  return requestClient.get('/sys-game-list-config/delete', {
    params: { id, sysOrigin },
  });
}

export async function delGameMatchConfig(id: number | string) {
  return requestClient.delete('/sys-game-list-config/match-conf', {
    params: { id },
  });
}

export async function listTemplates(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/activity-conf/template-list',
    {
      params,
    },
  );
}

export async function listTemplateValues() {
  return requestClient.get<Array<Record<string, any>>>(
    '/activity-conf/template-values',
  );
}

export async function addTemplate(data: Record<string, any>) {
  return requestClient.post('/activity-conf/template-add', data);
}

export async function updateTemplate(data: Record<string, any>) {
  return requestClient.post('/activity-conf/template-update', data);
}

export async function updateTemplateName(
  id: number | string,
  name: string,
) {
  return requestClient.post('/activity-conf/template-update-name', { id, name });
}

export async function getTemplateById(id: number | string) {
  return requestClient.get<Record<string, any>>('/activity-conf/template', {
    params: { id },
  });
}

export async function listActivityConf(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>('/activity-conf/conf-list', {
    params,
  });
}

export async function addActivityConf(data: Record<string, any>) {
  return requestClient.post('/activity-conf/conf-add', data);
}

export async function updateActivityConf(data: Record<string, any>) {
  return requestClient.post('/activity-conf/conf-update', data);
}

export async function listActivityRewardRank(activityId: number | string) {
  return requestClient.get<Array<Record<string, any>>>(
    '/activity-conf/rank-reward-preview',
    {
      params: { activityId },
    },
  );
}

export async function listActivityRank(activityId: number | string) {
  return requestClient.get<Array<Record<string, any>>>('/activity-conf/rank', {
    params: { activityId },
  });
}

export async function sendActivityReward(activityId: number | string) {
  return requestClient.get('/activity-conf/send-reward', {
    params: { activityId },
  });
}

export async function getLotteryConf(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/lottery/conf', {
    params,
  });
}

export async function addLotteryConf(data: Record<string, any>) {
  return requestClient.post('/lottery/conf', data);
}

export async function getWeekStarGroupPage(params: Record<string, any>) {
  return requestClient.get<Record<string, any>>('/sys-week-star-group/page', {
    params,
  });
}

export async function addWeekStarGroup(data: Record<string, any>) {
  return requestClient.post('/sys-week-star-group', data);
}

export async function delWeekStarGroup(id: number | string) {
  return requestClient.delete('/sys-week-star-group', {
    params: { id },
  });
}

export async function pageUserInviteRegister(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/user-invite-register/page',
    {
      params,
    },
  );
}

export async function listCustomerService(
  sysOrigin: string,
  region: number | string,
) {
  return requestClient.get<Array<Record<string, any>>>(
    `/sys/customer-service/list/${sysOrigin}`,
    {
      params: { region },
    },
  );
}

export async function addCustomerService(data: Record<string, any>) {
  return requestClient.post('/sys/customer-service/add', data);
}

export async function updateCustomerService(data: Record<string, any>) {
  return requestClient.post('/sys/customer-service/update', data);
}

export async function deleteCustomerService(id: number | string) {
  return requestClient.get(`/sys/customer-service/delete/${id}`);
}

export async function userFriendshipCardConfigTable(
  params: Record<string, any>,
) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/user/friendship/card/list',
    {
      params,
    },
  );
}

export async function addUserFriendshipCardConfig(data: Record<string, any>) {
  return requestClient.post('/sys/user/friendship/card', data);
}

export async function updateUserFriendshipCardConfig(data: Record<string, any>) {
  return requestClient.put('/sys/user/friendship/card', data);
}

export async function updateSysInviteUserConfig(data: Record<string, any>) {
  return requestClient.post('/sys/invite/user/config', data);
}

export async function querySysInviteUserConfig(sysOrigin: string) {
  return requestClient.get<Record<string, any>>('/sys/invite/user/config', {
    params: { sysOrigin },
  });
}

export async function updateSysUserAdvertisingConfigDTO(
  data: Record<string, any>,
) {
  return requestClient.post('/sys/user/advertising/save', data);
}

export async function querySysUserAdvertisingConfigDTO(sysOrigin: string) {
  return requestClient.get<Record<string, any>>(
    '/sys/user/advertising/config',
    {
      params: { sysOrigin },
    },
  );
}

export async function flowGameMatchConfig(params: Record<string, any>) {
  return requestClient.get<Array<Record<string, any>>>(
    '/sys-game-list-config/match-conf',
    {
      params,
    },
  );
}

export async function pageStartPagePlans(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/start/page/plan/page',
    {
      params,
    },
  );
}

export async function updateStartPagePlan(data: Record<string, any>) {
  return requestClient.put('/sys/start/page/plan', data);
}

export async function addStartPagePlan(data: Record<string, any>) {
  return requestClient.post('/sys/start/page/plan', data);
}

export async function deleteStartPagePlan(id: number | string) {
  return requestClient.post(`/sys/start/page/plan/${id}`);
}

export async function bannerTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/banner/config',
    {
      params,
    },
  );
}

export async function updateBanner(data: Record<string, any>) {
  return requestClient.put('/sys/banner/config', data);
}

export async function addBanner(data: Record<string, any>) {
  return requestClient.post('/sys/banner/config', data);
}

export async function deleteBanner(
  id: number | string,
  sysOrigin: string,
) {
  return requestClient.delete(`/sys/banner/config/${id}/${sysOrigin}`);
}

export async function noticeMessageTable(params: Record<string, any>) {
  return requestClient.get<LegacyPageResult<Record<string, any>>>(
    '/sys/notice/message',
    {
      params,
    },
  );
}

export async function updateNoticeMessage(data: Record<string, any>) {
  return requestClient.put('/sys/notice/message', data);
}

export async function addNoticeMessage(data: Record<string, any>) {
  return requestClient.post('/sys/notice/message', data);
}

export async function deleteNoticeMessage(id: number | string) {
  return requestClient.delete(`/sys/notice/message/${id}`);
}

export async function changeAnnouncementStatus(id: number | string) {
  return requestClient.get(`/sys/notice/message/announcement/${id}`);
}

export async function changeShelfStatus(
  id: number | string,
  offShelf: boolean,
) {
  return requestClient.get(`/sys/notice/message/off/shelf/${id}/${offShelf}`);
}
