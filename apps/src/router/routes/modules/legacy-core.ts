import type { RouteRecordRaw } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'LegacyLogin',
    redirect: LOGIN_PATH,
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      ignoreAccess: true,
      title: '登录',
    },
  },
  {
    path: '/401',
    name: 'LegacyForbidden',
    component: () => import('#/views/_core/fallback/forbidden.vue'),
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      ignoreAccess: true,
      title: '401',
    },
  },
  {
    path: '/404',
    name: 'LegacyNotFound',
    component: () => import('#/views/_core/fallback/not-found.vue'),
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      ignoreAccess: true,
      title: '404',
    },
  },
  {
    path: '/common/user/deatils/:id',
    name: 'LegacyUserDetails',
    component: () => import('#/views/legacy/common/user-details.vue'),
    meta: {
      hideInMenu: true,
      keepAlive: true,
      title: '用户详情',
    },
  },
];

export default routes;
