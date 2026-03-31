import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wrench',
      order: 13,
      title: '工具管理',
    },
    name: 'AppTools',
    path: '/app/tools',
    children: [
      {
        name: 'RequestBlacklist',
        path: 'request-blacklist',
        component: () => import('#/views/tools/request-blacklist.vue'),
        meta: { title: '请求黑名单' },
      },
      {
        name: 'GoldAnalyze',
        path: 'gold-analyze',
        component: () => import('#/views/tools/gold-analyze.vue'),
        meta: { title: '金币分析' },
      },
      {
        name: 'RedisManager',
        path: '/redis',
        component: () => import('#/views/tools/redis-manager.vue'),
        meta: { title: 'Redis缓存管理' },
      },
      {
        name: 'UploadFile',
        path: '/upload/file',
        component: () => import('#/views/tools/upload-file.vue'),
        meta: { title: '文件上传' },
      },
      {
        name: 'SocketTest',
        path: '/socket',
        component: () => import('#/views/tools/socket-test.vue'),
        meta: { title: 'Socket测试' },
      },
    ],
  },
];

export default routes;
