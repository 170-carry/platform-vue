import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

type LegacyMenu = {
  alias?: string;
  childrens?: LegacyMenu[];
  icon?: string;
  menuName?: string;
  menuType?: number;
  path?: string;
  router?: string;
};

function normalizeRouteName(path: string) {
  return path
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/[^a-zA-Z0-9]/g, ''))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function convertMenuNodes(menus: LegacyMenu[]): RouteRecordStringComponent[] {
  return menus.flatMap((item) => {
    if (item.menuType === 3) {
      return [];
    }

    if (item.menuType === 1 && item.menuName === 'dashboard') {
      return [];
    }

    if (item.menuType === 1) {
      const route = item.router || '/';
      return [
        {
          children: convertMenuNodes(item.childrens || []),
          component: 'BasicLayout',
          meta: {
            icon: item.icon,
            title: item.menuName || '',
          },
          name: item.alias || normalizeRouteName(route),
          path: route,
        },
      ];
    }

    if (item.menuType === 2 && item.path) {
      return [
        {
          children: convertMenuNodes(item.childrens || []),
          component: `/${item.path}.vue`,
          meta: {
            icon: item.icon,
            title: item.menuName || '',
          },
          name:
            item.alias ||
            normalizeRouteName(item.router || item.path || item.menuName || ''),
          path: item.router || '',
        },
      ];
    }

    return [];
  });
}

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const result = await requestClient.get<LegacyMenu[]>('/account/menus');
  return convertMenuNodes(result || []);
}
