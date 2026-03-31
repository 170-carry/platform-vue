import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 11,
      title: '系统管理',
    },
    name: 'SystemManager',
    path: '/sys/manager',
    children: [
      {
        name: 'SystemRegionConfig',
        path: 'region/config',
        component: () => import('#/views/system/region-config.vue'),
        meta: { title: '区域配置' },
      },
      {
        name: 'SystemUserManager',
        path: 'user',
        component: () => import('#/views/system/user-manager.vue'),
        meta: { title: '用户管理' },
      },
      {
        name: 'SystemRoleManager',
        path: 'roles',
        component: () => import('#/views/system/role-manager.vue'),
        meta: { title: '角色管理' },
      },
      {
        name: 'SystemMenusManager',
        path: 'menus',
        component: () => import('#/views/system/menu-manager.vue'),
        meta: { title: '菜单管理' },
      },
      {
        name: 'SystemResourceManager',
        path: 'resource',
        component: () => import('#/views/system/resource-manager.vue'),
        meta: { title: '资源管理' },
      },
    ],
  },
];

export default routes;
