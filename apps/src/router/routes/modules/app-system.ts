import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:logs',
      order: 12,
      title: 'App系统管理',
    },
    name: 'AppSystemManager',
    path: '/app/sys/mamange',
    children: [
      {
        name: 'AppSystemLoginLogger',
        path: 'login/logger',
        component: () => import('#/views/app-system/login-logger.vue'),
        meta: { title: '登陆日志' },
      },
      {
        name: 'AppSystemRoomBlacklist',
        path: 'log/blacklist',
        component: () => import('#/views/app-system/room-blacklist.vue'),
        meta: { title: '房间黑名单' },
      },
      {
        name: 'AppSystemApiRequestLog',
        path: 'log/api-request-log',
        component: () => import('#/views/app-system/request-log.vue'),
        meta: { title: '请求日志' },
      },
      {
        name: 'AppSystemSpecialId',
        path: 'userSpecialId',
        component: () => import('#/views/app-system/special-id-manager.vue'),
        meta: { title: '靓号管理' },
      },
      {
        name: 'AppSystemExternalDoc',
        path: 'external/app_doc_interface',
        component: () => import('#/views/app-system/external-iframe.vue'),
        meta: {
          iframeSrc: 'http://dev.sugartimeapp.com/doc.html',
          title: '文档管理',
        },
      },
      {
        name: 'AppSystemExternalIm',
        path: 'external/im',
        component: () => import('#/views/app-system/external-iframe.vue'),
        meta: {
          iframeSrc: 'http://im.sugartimeapp.com/',
          title: 'IM通讯',
        },
      },
      {
        name: 'AppSystemVersionManager',
        path: 'version',
        component: () => import('#/views/app-system/version-manager.vue'),
        meta: { title: '版本管理' },
      },
      {
        name: 'AppSystemEnumConfigManager',
        path: 'enum/config',
        component: () => import('#/views/app-system/enum-config-manager.vue'),
        meta: { title: '参数配置管理' },
      },
      {
        name: 'AppSystemEnumSetting',
        path: 'enum/setting',
        component: () => import('#/views/app-system/enum-setting.vue'),
        meta: { title: '参数配置' },
      },
      {
        name: 'AppSystemProductConfigV2',
        path: 'config/product/v2',
        component: () => import('#/views/app-system/product-config-v2.vue'),
        meta: { title: '内购产品配置V2' },
      },
      {
        name: 'AppSystemArchiveDevice',
        path: 'archive/device',
        component: () => import('#/views/app-system/archive-device.vue'),
        meta: { title: '封禁设备' },
      },
      {
        name: 'AppSystemEmojiConfig',
        path: 'emoji/config',
        component: () => import('#/views/app-system/emoji-config.vue'),
        meta: { title: '表情管理' },
      },
    ],
  },
];

export default routes;
