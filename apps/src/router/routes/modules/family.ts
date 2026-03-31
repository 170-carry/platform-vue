import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:house',
      order: 15.5,
      title: '家族管理',
    },
    name: 'FamilyManager',
    path: '/family/manager',
    children: [
      {
        name: 'FamilyConfig',
        path: 'family_config',
        component: () => import('#/views/family/family-config.vue'),
        meta: { title: '家族配置' },
      },
      {
        name: 'FamilyList',
        path: 'family_list',
        component: () => import('#/views/family/family-list.vue'),
        meta: { title: '家族列表' },
      },
    ],
  },
];

export default routes;
