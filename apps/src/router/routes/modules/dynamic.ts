import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:messages-square',
      order: 14,
      title: '动态管理',
    },
    name: 'DynamicManager',
    path: '/dynamic/manager',
    children: [
      {
        name: 'DynamicTagList',
        path: 'dynamic/tag',
        component: () => import('#/views/dynamic/tag-list.vue'),
        meta: { title: '标签列表' },
      },
      {
        name: 'DynamicPopularConfig',
        path: 'dynamic/popular/config',
        component: () => import('#/views/dynamic/popular-config.vue'),
        meta: { title: '权重配置' },
      },
      {
        name: 'DynamicUserList',
        path: 'user/dynamic/list',
        component: () => import('#/views/dynamic/user-dynamic-list.vue'),
        meta: { title: '用户动态' },
      },
      {
        name: 'DynamicBlacklist',
        path: 'dynamic/blacklist',
        component: () => import('#/views/dynamic/dynamic-blacklist.vue'),
        meta: { title: '黑名单' },
      },
    ],
  },
];

export default routes;
