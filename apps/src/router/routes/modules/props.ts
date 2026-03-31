import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:package-2',
      order: 17,
      title: '道具管理',
    },
    name: 'PropsManager',
    path: '/props/manager/props',
    children: [
      {
        name: 'PropsSendTool',
        path: 'send_tool',
        component: () => import('#/views/props/send-tool.vue'),
        meta: { title: '道具赠送' },
      },
      {
        name: 'PropsResourceConfig',
        path: 'config',
        component: () => import('#/views/props/resource-config.vue'),
        meta: { title: '资源配置' },
      },
      {
        name: 'PropsSourceGroup',
        path: 'props_source_group',
        component: () => import('#/views/props/source-group.vue'),
        meta: { title: '道具资源组配置' },
      },
      {
        name: 'PropsActivityRuleConfig',
        path: 'props-activity-rule-config',
        component: () => import('#/views/props/activity-rule-config.vue'),
        meta: { title: '活动道具规则配置' },
      },
      {
        name: 'PropsStore',
        path: 'props_store',
        component: () => import('#/views/props/store.vue'),
        meta: { title: '道具商店' },
      },
    ],
  },
];

export default routes;
