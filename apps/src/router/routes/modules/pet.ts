import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:paw-print',
      order: 16,
      title: '宠物管理',
    },
    name: 'PetManager',
    path: '/pet/manager',
    children: [
      {
        name: 'PetFeeding',
        path: 'feeding',
        component: () => import('#/views/pet/pet-feeding.vue'),
        meta: { title: '宠物喂养记录' },
      },
      {
        name: 'PetBeans',
        path: 'beans',
        component: () => import('#/views/pet/pet-beans.vue'),
        meta: { title: '豆子账户' },
      },
      {
        name: 'PetBeansRunningWater',
        path: 'beans/running-water',
        component: () => import('#/views/pet/pet-beans-running-water.vue'),
        meta: { title: '豆子流水' },
      },
      {
        name: 'PetPool',
        path: 'pool',
        component: () => import('#/views/pet/pet-pool.vue'),
        meta: { title: '宠物池' },
      },
    ],
  },
];

export default routes;
