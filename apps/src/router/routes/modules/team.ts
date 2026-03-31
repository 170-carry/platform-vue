import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 15,
      title: '团队管理',
    },
    name: 'TeamManager',
    path: '/team',
    children: [
      {
        name: 'TeamPolicy',
        path: 'team-policy',
        component: () => import('#/views/team/team-policy.vue'),
        meta: { title: '团队政策' },
      },
      {
        name: 'TeamDiamondPolicy',
        path: 'team-diamond-policy',
        component: () => import('#/views/team/team-diamond-policy.vue'),
        meta: { title: '团队钻石政策' },
      },
      {
        name: 'TeamList',
        path: 'team-list',
        component: () => import('#/views/team/team-list.vue'),
        meta: { title: '团队列表' },
      },
      {
        name: 'TeamMemberList',
        path: 'team/member',
        component: () => import('#/views/team/member-list.vue'),
        meta: { title: '成员列表' },
      },
      {
        name: 'TeamBillList',
        path: 'team/bill',
        component: () => import('#/views/team/team-bill.vue'),
        meta: { title: '账单列表' },
      },
      {
        name: 'TeamMemberWork',
        path: 'team/member-work',
        component: () => import('#/views/team/member-work.vue'),
        meta: { title: '成员工作' },
      },
      {
        name: 'TeamApplicationProcessList',
        path: 'team/application-process',
        component: () => import('#/views/team/application-process-list.vue'),
        meta: { title: '成员审核日志' },
      },
      {
        name: 'BdLead',
        path: 'team/bd-lead',
        component: () => import('#/views/team/bd-lead.vue'),
        meta: { title: 'BD Lead' },
      },
    ],
  },
];

export default routes;
