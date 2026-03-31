import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:chart-column',
      order: 12,
      title: '统计管理',
    },
    name: 'StatisticsManager',
    path: '/statistics/manager',
    redirect: '/statistics/manager/datav',
    children: [
      {
        name: 'StatisticsDatav',
        path: 'datav',
        component: () => import('#/views/statistics/datav.vue'),
        meta: { title: '数据大屏' },
      },
    ],
  },
];

export default routes;
